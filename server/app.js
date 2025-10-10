import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();
const app = express();

// Content Security Policy (CSP)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", process.env.CLIENT_ORIGIN],
      styleSrc: ["'self'", "'unsafe-inline'", process.env.CLIENT_ORIGIN],
      imgSrc: ["'self'", "data:", process.env.CLIENT_ORIGIN],
      connectSrc: ["'self'", process.env.CLIENT_ORIGIN],
      fontSrc: ["'self'", "https:", "data:"],
      frameAncestors: ["'none'"], // prevent clickjacking
      upgradeInsecureRequests: [], // enforce HTTPS resources
    },
  })
);

// Rate Limiting for API requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// API Rate limiting
app.use("/api", apiLimiter);

// Middlewares
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error",err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes); 

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

export default app;
