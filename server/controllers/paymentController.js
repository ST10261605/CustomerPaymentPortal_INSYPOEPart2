// controllers/paymentController.js
import Transaction from "../models/Transaction.js";

// Create a new payment
export const createPayment = async (req, res) => {
  try {

    // Check if req.body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        error: "Request body is missing or empty",
        details: "Make sure you're sending JSON data with proper headers"
      });
    }

    const {
      amount,
      currency,
      recipientName,
      recipientAccount,
      swiftCode,
      description,
      provider
    } = req.body;

    // Validate required fields
    const requiredFields = ['amount', 'currency', 'recipientName', 'recipientAccount', 'swiftCode', 'provider'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Missing required fields",
        missingFields: missingFields,
        requiredFields: requiredFields
      });
    }

    // Validate amount is a positive number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        error: "Amount must be a valid number greater than 0"
      });
    }

    // Create new transaction
    const transaction = new Transaction({
      userId: req.user.userId,
      amount: amountNum,
      currency,
      recipientName: recipientName.trim(),
      recipientAccount: recipientAccount.trim(),
      swiftCode: swiftCode.toUpperCase().trim(),
      description: description?.trim() || `Payment to ${recipientName.trim()}`,
      provider,
      status: "pending"
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
      },
      transactionId: transaction._id
    });

  } catch (error) {
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation error",
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      error: "Server error creating payment",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    res.status(500).json({ error: "Server error fetching payments" });
  }
};