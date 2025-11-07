// routes/paymentRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createPayment, getUserPayments } from "../controllers/paymentController.js";

const router = express.Router();

// Customer payment routes
router.post("/payments", authMiddleware, createPayment);
router.get("/payments", authMiddleware, getUserPayments);

export default router;