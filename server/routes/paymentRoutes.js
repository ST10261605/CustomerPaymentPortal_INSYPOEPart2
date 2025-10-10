import express from "express";
import Payment from "../models/Payment.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

//SWIFT/BIC Code validation
const swiftRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { amount, currency, provider, recipientAccount, swiftCode } = req.body;

    // --- Basic Input Validation ---
    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: "Invalid amount" });
    }

    if (!swiftRegex.test(swiftCode)) {
      return res.status(400).json({ msg: "Invalid SWIFT code format. Example: ABSAZAJJ or ABSAZAJJXXX" });
    }

    // --- Create new payment ---
    const payment = new Payment({
      userId: req.user.id, // assuming JWT sets req.user.id
      amount,
      currency,
      provider,
      recipientAccount,
      swiftCode
    });

    await payment.save();
    res.status(201).json({ msg: "Payment created successfully", payment });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;