// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // Import User model

export const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // verify user still exists and get fresh data from DB
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = { userId: user._id, role: user.role };
    
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired" });
    }
    
    res.status(401).json({ error: "Token is not valid" });
  }
};
// Role-based authorization
export const authorizeRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied: insufficient role" });
    }
    next();
  };
};

