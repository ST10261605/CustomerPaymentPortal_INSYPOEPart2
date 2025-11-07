import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import { validateRegistration } from "../utils/validation.js";
import NodeCache from "node-cache";
import fs from "fs";
import crypto from 'crypto';
import { requestPasswordReset,verifyResetToken,resetPassword } from '../services/passwordResetService.js';
import { validatePasswordStrength } from '../utils/validation.js';
import { logSecurityEvent, logFailedLoginAttempt } from '../services/securityService.js';

dotenv.config();

const loginAttempts = new NodeCache({ stdTTL: 900 }); // 15-minute cache for failed logins

// Simple function to log authentication events
function logAuthEvent({ userId, ip, userAgent, success }) {
  const logLine = `${new Date().toISOString()} | userId=${userId || "unknown"} | ip=${ip} | agent="${userAgent}" | success=${success}\n`;
  fs.appendFileSync("auth.log", logLine);
}

// Register user
export const registerUser = async (req, res) => {
  const { fullName, idNumber, accountNumber, password } = req.body;

  // Validation
  const errors = validateRegistration({ fullName, idNumber, accountNumber, password });
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const existingUser = await User.findOne({ 
      $or: [
        { accountNumber },
        { idNumber }
      ] 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: "Account number or ID number already exists" });
    }

    const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({ 
      fullName: fullName.trim(), 
      idNumber, 
      accountNumber, 
      passwordHash 
    });
    
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    
    // More specific error handling
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Validation error: " + err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ error: "Account number or ID number already exists" });
    }
    if (err.name === 'MongoNetworkError') {
      return res.status(500).json({ error: "Database connection error" });
    }
    
    res.status(500).json({ error: "Server error during registration" });
  }
};

// Login user
export const loginUser = async (req, res) => {
  const { accountNumber, password } = req.body;
  const ip = req.ip;
  const userAgent = req.get("user-agent");

  try {
    const user = await User.findOne({ accountNumber });
    
    // Check if account is locked
    if (user && user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({ 
        error: "Account temporarily locked",
        message: "Too many failed login attempts. Please try again later." 
      });
    }

    if (!user) {
      logFailedLoginAttempt({ accountNumber, ip, userAgent, attemptCount: 1 });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    
    if (!valid) {
      // Increment failed attempts
      user.failedLoginAttempts += 1;
      user.lastFailedLogin = new Date();
      
      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        logLockoutEvent({
          userId: user._id,
          accountNumber,
          ip,
          attempts: user.failedLoginAttempts,
          lockedUntil: user.lockedUntil
        });
      }
      
      await user.save();
      
      logFailedLoginAttempt({ 
        accountNumber, 
        ip, 
        userAgent, 
        attemptCount: user.failedLoginAttempts 
      });
      
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Successful login - reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date();
    
    // Add to login history
    user.loginHistory.push({
      ip,
      userAgent,
      success: true,
      timestamp: new Date()
    });
    
    // Keep only last 10 login records
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(-10);
    }
    
    await user.save();

    // Log successful login
    logSecurityEvent({
      type: 'LOGIN_SUCCESS',
      userId: user._id,
      accountNumber,
      ip,
      userAgent
    });

    // Generate tokens
    const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    const sessionId = crypto.randomBytes(16).toString('hex');

    // Store session info (use Redis in production)
    // Make sure you have sessionStore configured in your app
    if (req.sessionStore) {
      req.sessionStore.set(sessionId, {
        userId: user._id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date()
      });
    } else {
      console.warn('sessionStore not available - sessions will not be persisted');
    }

    // Secure cookie for refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ 
      accessToken, 
      user: { 
        id: user._id, 
        fullName: user.fullName, 
        role: user.role 
      } 
    });
  } catch (err) {
    logSecurityEvent({
      type: 'LOGIN_ERROR',
      accountNumber,
      ip,
      error: err.message
    });
    res.status(500).json({ error: "Server error" });
  }
};

// register Admin (temporary setup)
export const registerAdmin = async (req, res) => {
  const { fullName, idNumber, accountNumber, password } = req.body;

  try {
    const existingAdmin = await User.findOne({ role: "Admin" });
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = new User({
      fullName,
      idNumber,
      accountNumber,
      passwordHash,
      role: "Admin"
    });

    await admin.save();
    res.status(201).json({ message: "Admin registered successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Register Employee (Admin only)
export const registerEmployee = async (req, res) => {
  const { fullName, idNumber, accountNumber, password } = req.body;
  const requester = req.user; // comes from JWT middleware

  try {
    const admin = await User.findById(requester.userId);
    if (!admin || admin.role !== "Admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const existingUser = await User.findOne({ accountNumber });
    if (existingUser) return res.status(400).json({ error: "Employee already exists" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const employee = new User({
      fullName,
      idNumber,
      accountNumber,
      passwordHash,
      role: "Employee"
    });

    await employee.save();
    res.status(201).json({ message: "Employee registered successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Password reset endpoints
export const requestPasswordResetController = async (req, res) => {
  const { accountNumber } = req.body;
  
  if (!accountNumber) {
    return res.status(400).json({ error: "Account number is required" });
  }
  
  const result = await requestPasswordReset(accountNumber);
  
  if (result.success) {
    res.json({ 
      message: "If an account exists with this number, a reset link has been sent." 
    });
  } else {
    res.status(400).json({ error: result.error });
  }
};

export const resetPasswordController = async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password are required" });
  }
  
  // Validate password strength
  const passwordErrors = validatePasswordStrength(newPassword);
  if (passwordErrors.length > 0) {
    return res.status(400).json({ errors: passwordErrors });
  }
  
  const result = await resetPassword(token, newPassword);
  
  if (result.success) {
    res.json({ message: "Password reset successfully" });
  } else {
    res.status(400).json({ error: result.error });
  }
};

export const verifyResetTokenController = async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }
  
  const result = verifyResetToken(token);
  
  if (result.valid) {
    res.json({ valid: true });
  } else {
    res.status(400).json({ valid: false, error: result.error });
  }
};
