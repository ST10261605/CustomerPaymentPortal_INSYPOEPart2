import User from '../models/User.js';
import { logLockoutEvent } from '../services/securityService.js';

export const accountLockout = async (req, res, next) => {
  if (req.path.includes('/login') && req.method === 'POST') {
    const { accountNumber } = req.body;
    const ip = req.ip;
    
    if (accountNumber) {
      try {
        const user = await User.findOne({ accountNumber });
        
        if (user && user.lockedUntil && user.lockedUntil > new Date()) {
          const lockoutTime = Math.ceil((user.lockedUntil - new Date()) / 1000 / 60);
          
          logLockoutEvent({
            userId: user._id,
            accountNumber,
            ip,
            attempts: user.failedLoginAttempts,
            lockedUntil: user.lockedUntil
          });
          
          return res.status(423).json({
            error: "Account temporarily locked",
            message: `Too many failed login attempts. Account locked for ${lockoutTime} minutes.`,
            lockedUntil: user.lockedUntil
          });
        }
      } catch (error) {
        console.error('Account lockout check error:', error);
      }
    }
  }
  
  next();
};