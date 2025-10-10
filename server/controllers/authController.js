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

    // Generate tokens 
    const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    // Secure cookie for refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken, user: { id: user._id, fullName: user.fullName } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};