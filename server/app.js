import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import sanitizeInput from "./middleware/sanitizeInput.js";
import noSqlSanitize from "./middleware/noSqlSanitize.js"; 
import cookieParser from "cookie-parser";
import hpp from "hpp";
import { auditLogger, authAuditLogger } from './middleware/auditLogger.js';
import securityHeaders from "./middleware/securityHeaders.js";
import csurf from 'csurf';
import ExpressBrute from 'express-brute';



// Import Routes
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();
const app = express();
const sessionStore = new Map(); 

// Trust proxy
app.set('trust proxy', 1);

// Configure CSRF protection
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// CSRF error handler
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  
  console.log('CSRF Token violation:', {
    ip: req.ip,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent')
  });

  res.status(403).json({
    error: 'Invalid CSRF token',
    message: 'Form tampered with or session expired'
  });
};

// CORS configuration 
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || ['https://localhost:3000', 'https://localhost:5173'],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token"]
}));

app.use((req, res, next) => {
  if (res.headersSent) {
    return next();
  }
  next();
});

// Use Helmet with custom configuration
app.use(helmet({
  contentSecurityPolicy: false, // Disable default CSP since we set our own
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
// Body parsing with limits
app.use(express.json({ 
  limit: '10kb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser
app.use(cookieParser());

app.use(securityHeaders);

// Basic security headers 
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.removeHeader('X-Powered-By');
  next();
});

// Helmet with CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.CLIENT_ORIGIN],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"]
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" }
  })
);

// Data sanitization 
app.use(noSqlSanitize); // Custom NoSQL injection protection
app.use(hpp()); // HTTP Parameter Pollution protection
app.use(sanitizeInput); // XSS protection

// Audit logging for all requests
app.use(auditLogger);

// CSRF Protection Middleware (AFTER session/cookie setup, BEFORE routes)
app.use(csrfProtection);

// Brute force protection setup
const store = new ExpressBrute.MemoryStore();
const bruteforce = new ExpressBrute(store, {
  freeRetries: 5,
  minWait: 5 * 60 * 1000, // 5 minutes
  maxWait: 60 * 60 * 1000, // 1 hour
  failCallback: (req, res, next, nextValidRequestDate) => {
    // Use your existing security logging
    logSecurityEvent({
      type: 'BRUTE_FORCE_BLOCKED',
      ip: req.ip,
      endpoint: req.path,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({ 
      error: "Too many attempts", 
      retryAfter: nextValidRequestDate,
      message: "Too many login attempts. Please try again later."
    });
  }
});

// CSRF token endpoint (must be after csrfProtection)
app.get("/api/csrf-token", (req, res) => {
  res.json({ 
    csrfToken: req.csrfToken(),
    message: 'CSRF token generated successfully'
  });
});

// Apply brute force protection (uncomment if you have these)
// app.use('/api/auth/login', loginBruteForce.prevent);
// app.use('/api/auth/register', apiBruteForce.prevent);
// app.use('/api/', apiBruteForce.prevent);

// Account lockout check (uncomment if you have this)
// app.use('/api/auth/login', accountLockout);

// Auth audit logging
app.use('/api/auth', authAuditLogger);

// HTTPS redirect (for production)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
  });
}

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error", err));

// Routes (these will be CSRF protected)
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes); 
app.use("/api/employee", employeeRoutes);
app.use("/api/admin", adminRoutes); 
app.use('/api/login', bruteforce.prevent);

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// CSRF Error Handler (AFTER routes)
app.use(csrfErrorHandler);

// General Error handling middleware (should be last)
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  
  if (error.message.includes('Sanitization error')) {
    return res.status(400).json({ 
      error: "Invalid input detected",
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
  
  res.status(500).json({ 
    error: "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

export default app;