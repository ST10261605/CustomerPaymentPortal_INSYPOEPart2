import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import { validateRegistration } from "../utils/validation.js";
import NodeCache from "node-cache";
import fs from "fs";

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
    // Return array of error messages
    return res.status(400).json({ errors });
  }

  try {
    const existingUser = await User.findOne({ accountNumber });
    if (existingUser) return res.status(400).json({ error: "Account already exists" });

    const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({ fullName, idNumber, accountNumber, passwordHash });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Login user
export const loginUser = async (req, res) => {
  const { accountNumber, password } = req.body;
  const ip = req.ip;
  const userAgent = req.get("user-agent");

  const key = `${ip}:${accountNumber}`;
  const attempts = loginAttempts.get(key) || 0;

  if (attempts >= 5) {
    logAuthEvent({ userId: null, ip, userAgent, success: false });
    return res.status(429).json({ error: "Too many login attempts. Try again later." });
  }

  try {
    const user = await User.findOne({ accountNumber });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    // Success: clear failed attempts and log success
    loginAttempts.del(key);
    logAuthEvent({ userId: user._id, ip, userAgent, success: true });

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

    // Secure cookie for refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
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

  console.log("Register Employee Request:", {
    body: req.body,
    requester: requester
  });

  try {
    // Check if requester is authenticated and is an Admin
    if (!requester || !requester.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    //verify admin status via database -- extra layer of security
    const admin = await User.findById(requester.userId);
    if (!admin) {
      return res.status(404).json({ error: "Admin user not found" });
    }
    if (admin.role !== "Admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    // Check if employee already exists
    const existingUser = await User.findOne({ accountNumber });
    if (existingUser) {
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
    res.status(201).json({ message: "Employee registered successfully!" });
    
  } catch (err) {
    console.error("Register Employee Error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
};
