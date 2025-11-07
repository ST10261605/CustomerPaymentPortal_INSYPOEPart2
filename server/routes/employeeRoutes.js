// routes/employeeRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js"; // Fixed import

const router = express.Router();

// Use requireRole instead of authorizeRole
router.get("/dashboard", authMiddleware, requireRole(["Employee", "Admin"]), (req, res) => {
  res.json({ message: "Employee dashboard" });
});

export default router;