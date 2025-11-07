import express from "express";
import { registerUser, loginUser, registerAdmin, registerEmployee,requestPasswordResetController,resetPasswordController,verifyResetTokenController  } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { csrfProtection } from "../middleware/csrfMiddleware.js";
import { loginRateLimiter, accountLockout } from "../middleware/bruteForceProtection.js";

const router = express.Router();

router.post("/login", accountLockout,loginRateLimiter, loginUser);

// Password reset routes
router.post("/request-reset", requestPasswordResetController);
router.post("/verify-reset-token", verifyResetTokenController);
router.post("/reset-password", resetPasswordController);


// Apply CSRF protection to all routes except GET
router.use(csrfProtection);

// Customer registration
router.post("/register", registerUser);

// Admin temporary addition
router.post("/register-admin", registerAdmin);

// Admin can register employees
router.post("/register-employee", authMiddleware, requireRole(["Admin"]), registerEmployee);

export default router;