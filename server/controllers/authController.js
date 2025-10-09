import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import { validateRegistration } from "../utils/validation.js";
dotenv.config();

export const registerUser = async (req, res) => {
  const { fullName, idNumber, accountNumber, password } = req.body;

  // Run validation
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

export const loginUser = async (req, res) => {
  const { accountNumber, password } = req.body;
  try {
    const user = await User.findOne({ accountNumber });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

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