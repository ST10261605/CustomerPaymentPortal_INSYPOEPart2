// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    console.log("Auth Header:", authHeader);
    
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    console.log("Token received:", token.substring(0, 20) + "...");

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("Decoded token:", decoded);

    // Verify user still exists and get fresh data
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      console.log("User not found for ID:", decoded.userId);
      return res.status(401).json({ error: "User not found" });
    }

    console.log("User found:", { id: user._id, role: user.role });
    
    req.user = {
      userId: user._id,
      role: user.role
    };
    
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired" });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    res.status(401).json({ error: "Token is not valid" });
  }
};