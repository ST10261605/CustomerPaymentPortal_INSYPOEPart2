// controllers/paymentController.js
import Transaction from "../models/Transaction.js";

// Create a new payment
export const createPayment = async (req, res) => {
  try {
    const {
      amount,
      currency,
      recipientName,
      recipientAccount,
      swiftCode,
      description,
      provider
    } = req.body;

    // Create new transaction
    const transaction = new Transaction({
      userId: req.user.userId, // Associate with logged-in user
      amount,
      currency,
      recipientName,
      recipientAccount,
      swiftCode,
      description,
      provider,
      status: "pending" // All new payments start as pending
    });

    await transaction.save();

    res.status(201).json({
      message: "Payment created successfully",
      payment: {
        id: transaction._id,
        amount: transaction.amount,
        currency: transaction.currency,
        recipientName: transaction.recipientName,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });

  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: "Server error creating payment" });
  }
};

// Get user's own payments
export const getUserPayments = async (req, res) => {
  try {
    const payments = await Transaction.find({ 
      userId: req.user.userId 
    }).sort({ createdAt: -1 });

    res.json({ payments });
  } catch (error) {
    console.error("Error fetching user payments:", error);
    res.status(500).json({ error: "Server error fetching payments" });
  }
};