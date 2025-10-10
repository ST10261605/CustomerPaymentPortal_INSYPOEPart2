// routes/paymentRoutes.js
import express from "express";
import Payment from "../models/Payment.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// SWIFT/BIC Code validationd
const swiftRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

// Create a new payment 
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { amount, currency, provider, recipientAccount, swiftCode } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: "Invalid amount" });
    }

    if (!swiftRegex.test(swiftCode)) {
      return res
        .status(400)
        .json({ msg: "Invalid SWIFT code format. Example: ABSAZAJJ or ABSAZAJJXXX" });
    }

    // Create and save payment linked to logged-in user
    const payment = new Payment({
      userId: req.user.id, // use id from JWT
      amount,
      currency,
      provider,
      recipientAccount,
      swiftCode,
    });

    await payment.save();

    res.status(201).json({
      msg: "Payment created successfully",
      transactionId: payment._id,
      payment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get all payments for the logged-in user d
router.get("/payments", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // identify who is making the request
    const payments = await Payment.find({ userId }).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Failed to fetch payments" });
  }
});

export default router;
