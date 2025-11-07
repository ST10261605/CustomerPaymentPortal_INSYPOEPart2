import express from "express";
import { authMiddleware, authorizeRole } from "../middleware/authMiddleware.js";
import {
  registerEmployee,
  loginEmployee,
  getAllPayments,
  verifyPayment,
  submitToSwift
} from "../controllers/employeeAuthController.js";

const router = express.Router();

// Auth routes for employees
router.post("/register", registerEmployee); // optional
router.post("/login", loginEmployee); 

//Employee protected routes
router.get("/transactions", authMiddleware, authorizeRole("employee"), getAllPayments);
router.post("/verify/:id", authMiddleware, authorizeRole("employee"), verifyPayment);
router.post("/submit-swift", authMiddleware, authorizeRole("employee"), submitToSwift);

export default router;
