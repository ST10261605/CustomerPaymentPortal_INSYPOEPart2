// routes/transactionRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
  getPendingTransactions,
  verifyTransaction,
  unverifyTransaction,
  submitToSwift
} from "../controllers/transactionController.js";

const router = express.Router();

// Employee routes for transaction management
router.get("/transactions/pending", authMiddleware, requireRole(["Employee", "Admin"]), getPendingTransactions);
router.patch("/transactions/:id/verify", authMiddleware, requireRole(["Employee", "Admin"]), verifyTransaction);
router.patch("/transactions/:id/unverify", authMiddleware, requireRole(["Employee", "Admin"]), unverifyTransaction);
router.post("/transactions/submit-to-swift", authMiddleware, requireRole(["Employee", "Admin"]), submitToSwift);

export default router;