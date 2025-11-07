import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { logSecurityEvent } from "../services/securityService.js";

dotenv.config();

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
     req.user = {
      id: decoded.userId || decoded.employeeId || decoded.id || null,
      role: decoded.role || null,
      jti: decoded.jti || null // optional token id for rotation/revocation
    };
    next();
  } catch (err) {
    logSecurityEvent({ event: "INVALID_TOKEN", ip: req.ip, err: err.message });
    res.status(401).json({ msg: "Token is not valid" });
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

