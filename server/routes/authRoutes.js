import express from "express";
import { registerUser, loginUser, registerAdmin, registerEmployee } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// customer registration
router.post("/auth/register", registerUser);

// Admin temporary addition
router.post("/auth/register-admin", registerAdmin);

// Admin can register employees
router.post("/auth/register-employee", authMiddleware, requireRole(["Admin"]), registerEmployee);

// login 
router.post("/auth/login", loginUser);

export default router;
