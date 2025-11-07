// routes/adminRoutes.js
import express from "express";
import { authMiddleware, authorizeRole } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import { logSecurityEvent } from "../services/securityService.js";

const router = express.Router();

// Get locked accounts (Admin only)
router.get("/locked-accounts", 
  authMiddleware, 
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const lockedUsers = await User.find({
        lockedUntil: { $gt: new Date() }
      }).select("fullName accountNumber idNumber lockedUntil failedLoginAttempts lastFailedLogin");

      res.json({ lockedUsers });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch locked accounts" });
    }
  }
);

// Unlock specific account (Admin only)
router.post("/unlock-account/:userId", 
  authMiddleware, 
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Store previous state for logging
      const wasLocked = !!user.lockedUntil;
      const previousAttempts = user.failedLoginAttempts;

      // Unlock the account
      user.lockedUntil = null;
      user.failedLoginAttempts = 0;
      user.lastFailedLogin = null;

      await user.save();

      // Log the admin unlock action
      logSecurityEvent({
        event: "ADMIN_ACCOUNT_UNLOCK",
        adminId: req.user.id,
        targetUserId: userId,
        wasLocked,
        previousAttempts,
        unlockedAt: new Date()
      });

      res.json({ 
        message: "Account unlocked successfully",
        user: {
          id: user._id,
          fullName: user.fullName,
          accountNumber: user.accountNumber
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to unlock account" });
    }
  }
);

// Force unlock by account number (Admin only)
router.post("/unlock-by-account", 
  authMiddleware, 
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { accountNumber } = req.body;
      
      const user = await User.findOne({ accountNumber });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const wasLocked = !!user.lockedUntil;
      const previousAttempts = user.failedLoginAttempts;

      user.lockedUntil = null;
      user.failedLoginAttempts = 0;
      user.lastFailedLogin = null;

      await user.save();

      logSecurityEvent({
        event: "ADMIN_ACCOUNT_UNLOCK_BY_ACCOUNT",
        adminId: req.user.id,
        targetAccountNumber: accountNumber,
        wasLocked,
        previousAttempts,
        unlockedAt: new Date()
      });

      res.json({ 
        message: "Account unlocked successfully",
        accountNumber,
        wasLocked
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to unlock account" });
    }
  }
);

export default router;