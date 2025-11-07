import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { logSecurityEvent } from '../services/securityService.js';

// Login-specific rate limiter
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many login attempts',
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  handler: (req, res, next) => { // ✅ Added 'next' parameter
    logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      ip: req.ip,
      accountNumber: req.body.accountNumber,
      endpoint: req.path
    });
    
    return res.status(429).json({
      error: 'Too many login attempts',
      message: 'Too many login attempts. Please try again in 15 minutes.'
    });
  },
  skip: (req) => req.method === 'OPTIONS', // ✅ Skip OPTIONS requests
  standardHeaders: true,
  legacyHeaders: false,
});

// Account lockout middleware
export const accountLockout = async (req, res, next) => {
  // Fix the path check - when used in router, path is relative
  if (req.path === '/login' && req.method === 'POST') {
    const { accountNumber } = req.body;
    
    if (accountNumber) {
      try {
        const user = await User.findOne({ accountNumber });
        
        if (user && user.lockedUntil && user.lockedUntil > new Date()) {
          const lockoutTime = Math.ceil((user.lockedUntil - new Date()) / 1000 / 60);
          
          logSecurityEvent({
            type: 'ACCOUNT_LOCKOUT_BLOCKED',
            userId: user._id,
            accountNumber,
            ip: req.ip,
            lockedUntil: user.lockedUntil
          });
          
          return res.status(423).json({
            error: "Account temporarily locked",
            message: `Too many failed login attempts. Account locked for ${lockoutTime} more minutes.`,
            lockedUntil: user.lockedUntil
          });
        }
      } catch (error) {
        console.error('Account lockout check error:', error);
        // Don't block the request if there's a DB error
      }
    }
  }
  
  next();
};
// Payment rate limiter
export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payments per hour
  message: {
    error: 'Payment limit exceeded',
    message: 'Too many payment attempts. Please try again later.'
  },
  standardHeaders: true
});