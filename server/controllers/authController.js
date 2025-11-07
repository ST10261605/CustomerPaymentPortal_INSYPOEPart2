import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import { validateRegistration } from "../utils/validation.js";
import NodeCache from "node-cache";
import fs from "fs";
import crypto from 'crypto';
import { requestPasswordReset, verifyResetToken, resetPassword } from '../services/passwordResetService.js';
import { validatePasswordStrength } from '../utils/validation.js';
import { logSecurityEvent, logFailedLoginAttempt } from '../services/securityService.js';

dotenv.config();

const loginAttempts = new NodeCache({ stdTTL: 900 }); // 15-minute cache for failed logins

// Enhanced function to log authentication events with error handling
function logAuthEvent({ userId, ip, userAgent, success, reason = '', event = 'login' }) {
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} | event=${event} | userId=${userId || "unknown"} | ip=${ip} | agent="${userAgent}" | success=${success}${reason ? ` | reason=${reason}` : ''}\n`;
  
  try {
    fs.appendFileSync("auth.log", logLine);
    // log to console for debugging
    console.log(logLine);
  } catch (error) {
    console.error('Failed to write auth log:', error);
  }
}

// Register user
export const registerUser = async (req, res) => {
  const { fullName, idNumber, accountNumber, password } = req.body;
  const ip = req.ip;
  const userAgent = req.get("user-agent");

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
      logAuthEvent({
        userId: null,
        ip,
        userAgent,
        success: false,
        reason: 'DUPLICATE_ACCOUNT',
        event: 'register'
      });
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

    // Log successful registration
    logAuthEvent({
      userId: newUser._id,
      ip,
      userAgent,
      success: true,
      event: 'register'
    });

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    // Log registration error
    logAuthEvent({
      userId: null,
      ip,
      userAgent,
      success: false,
      reason: err.message,
      event: 'register'
    });
    
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
      logAuthEvent({
        userId: user._id,
        ip,
        userAgent,
        success: false,
        reason: 'ACCOUNT_LOCKED'
      });
      return res.status(423).json({ 
        error: "Account temporarily locked",
        message: "Too many failed login attempts. Please try again later." 
      });
    }

    if (!user) {
      logAuthEvent({
        userId: null,
        ip,
        userAgent,
        success: false,
        reason: 'USER_NOT_FOUND'
      });
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
        
        // Log account lockout using logAuthEvent
        logAuthEvent({
          userId: user._id,
          ip,
          userAgent,
          success: false,
          reason: 'ACCOUNT_LOCKED',
          attempts: user.failedLoginAttempts
        });
      } else {
        // Log failed attempt
        logAuthEvent({
          userId: user._id,
          ip,
          userAgent,
          success: false,
          reason: 'INVALID_PASSWORD',
          attempts: user.failedLoginAttempts
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

    // Log successful login using consistent logAuthEvent
    logAuthEvent({
      userId: user._id,
      ip,
      userAgent,
      success: true
    });

    // log to security service if needed
    logSecurityEvent({
      type: 'LOGIN_SUCCESS',
      userId: user._id,
      accountNumber,
      ip,
      userAgent
    });

    // Generate tokens with role included
    const accessToken = jwt.sign(
      { 
        userId: user._id, 
        role: user.role  // add role to the token
      }, 
      process.env.ACCESS_TOKEN_SECRET, 
      { expiresIn: "1h" } // Increased to 1 hour for admin sessions
    );
    
    const refreshToken = jwt.sign(
      { 
        userId: user._id,
        role: user.role  // Add role to refresh token as well
      }, 
      process.env.REFRESH_TOKEN_SECRET, 
      { expiresIn: "7d" }
    );

    const sessionId = crypto.randomBytes(16).toString('hex');

    // Store session info
    if (req.sessionStore) {
      req.sessionStore.set(sessionId, {
        userId: user._id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date()
      });
    } else {
      console.log('Session store not available');
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
      },
      sessionId 
    });

  } catch (err) {
    // Log login error
    logAuthEvent({
      userId: null,
      ip,
      userAgent,
      success: false,
      reason: err.message
    });
    
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
  const ip = req.ip;
  const userAgent = req.get("user-agent");

  try {
    const existingAdmin = await User.findOne({ role: "Admin" });
    if (existingAdmin) {
      logAuthEvent({
        userId: null,
        ip,
        userAgent,
        success: false,
        reason: 'ADMIN_EXISTS',
        event: 'register_admin'
      });
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
    
    logAuthEvent({
      userId: admin._id,
      ip,
      userAgent,
      success: true,
      event: 'register_admin'
    });
    
    res.status(201).json({ message: "Admin registered successfully!" });
  } catch (err) {
    logAuthEvent({
      userId: null,
      ip,
      userAgent,
      success: false,
      reason: err.message,
      event: 'register_admin'
    });
    res.status(500).json({ error: "Server error" });
  }
};

// Register Employee (Admin only) 
export const registerEmployee = async (req, res) => {
  const { fullName, idNumber, accountNumber, password } = req.body;
  const requester = req.user; // comes from JWT middleware
  const ip = req.ip;
  const userAgent = req.get("user-agent");

  console.log("Register Employee Request:", {
    body: req.body,
    requester: requester
  });

  try {
    // Check if requester is authenticated and is an Admin
    if (!requester || !requester.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify admin status via database -- extra layer of security
    const admin = await User.findById(requester.userId);
    if (!admin || admin.role !== "Admin") {
      logAuthEvent({
        userId: requester.userId,
        ip,
        userAgent,
        success: false,
        reason: 'UNAUTHORIZED_EMPLOYEE_REGISTRATION',
        event: 'register_employee'
      });
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    // Check if employee already exists
    const existingUser = await User.findOne({ accountNumber });
    if (existingUser) {
      logAuthEvent({
        userId: null,
        ip,
        userAgent,
        success: false,
        reason: 'EMPLOYEE_EXISTS',
        event: 'register_employee'
      });
      return res.status(400).json({ error: "Employee already exists" });
    }

    // Create new employee
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
    
    console.log("Employee registered successfully by admin:", requester.userId);
    
    logAuthEvent({
      userId: employee._id,
      ip,
      userAgent,
      success: true,
      event: 'register_employee'
    });
    
    res.status(201).json({ message: "Employee registered successfully!" });
    
  } catch (err) {
    console.error("Register Employee Error:", err);
    logAuthEvent({
      userId: null,
      ip,
      userAgent,
      success: false,
      reason: err.message,
      event: 'register_employee'
    });
    res.status(500).json({ error: "Server error: " + err.message });
  }
};

// Password reset endpoints
export const requestPasswordResetController = async (req, res) => {
  const { accountNumber } = req.body;
  const ip = req.ip;
  const userAgent = req.get("user-agent");
  
  if (!accountNumber) {
    return res.status(400).json({ error: "Account number is required" });
  }
  
  const result = await requestPasswordReset(accountNumber);
  
  if (result.success) {
    logAuthEvent({
      userId: result.userId,
      ip,
      userAgent,
      success: true,
      event: 'password_reset_request'
    });
    res.json({ 
      message: "If an account exists with this number, a reset link has been sent." 
    });
  } else {
    logAuthEvent({
      userId: null,
      ip,
      userAgent,
      success: false,
      reason: result.error,
      event: 'password_reset_request'
    });
    res.status(400).json({ error: result.error });
  }
};

export const resetPasswordController = async (req, res) => {
  const { token, newPassword } = req.body;
  const ip = req.ip;
  const userAgent = req.get("user-agent");
  
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
    logAuthEvent({
      userId: result.userId,
      ip,
      userAgent,
      success: true,
      event: 'password_reset'
    });
    res.json({ message: "Password reset successfully" });
  } else {
    logAuthEvent({
      userId: null,
      ip,
      userAgent,
      success: false,
      reason: result.error,
      event: 'password_reset'
    });
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