// routes/paymentRoutes.js
import express from "express";
import Payment from "../models/Payment.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { body, validationResult } from 'express-validator';


const router = express.Router();


// SWIFT/BIC Code validationd
const swiftRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const accountNumberRegex = /^[A-Z0-9]{8,20}$/; // Adjust based on your requirements
const currencyRegex = /^[A-Z]{3}$/; // ISO 4217 currency codes

// Validation middleware for payment creation
const validatePayment = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0')
    .custom((value) => {
      // Check for reasonable maximum amount (adjust as needed)
      if (value > 1000000) {
        throw new Error('Amount exceeds maximum allowed limit');
      }
      return true;
    }),

  body('currency')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code')
    .matches(currencyRegex)
    .withMessage('Invalid currency format. Use ISO 4217 codes (e.g., USD, EUR)')
    .isUppercase()
    .withMessage('Currency code must be uppercase'),

  body('provider')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Provider must be between 2 and 50 characters')
    .escape(),

  body('recipientAccount')
    .matches(accountNumberRegex)
    .withMessage('Invalid account number format')
    .trim(),

  body('swiftCode')
    .matches(swiftRegex)
    .withMessage('Invalid SWIFT code format. Example: ABSAZAJJ or ABSAZAJJXXX')
    .isUppercase()
    .withMessage('SWIFT code must be uppercase')
    .trim()
];

// Validation middleware for optional query parameters
const validatePaymentQuery = [
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer')
];

// Create a new payment with validation
router.post("/", 
  authMiddleware, 
  validatePayment,
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          msg: "Validation failed",
          errors: errors.array()
        });
      }

      const { amount, currency, provider, recipientAccount, swiftCode } = req.body;

      // Create and save payment linked to logged-in user
      const payment = new Payment({
        userId: req.user.id,
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        provider: provider.trim(),
        recipientAccount: recipientAccount.trim(),
        swiftCode: swiftCode.toUpperCase().trim(),
      });

      await payment.save();

      res.status(201).json({
        msg: "Payment created successfully",
        transactionId: payment._id,
        payment: {
          id: payment._id,
          amount: payment.amount,
          currency: payment.currency,
          provider: payment.provider,
          recipientAccount: payment.recipientAccount,
          swiftCode: payment.swiftCode,
          status: payment.status,
          createdAt: payment.createdAt
        }
      });
    } catch (err) {
      console.error(err);
      
      // Handle duplicate key errors or other MongoDB errors
      if (err.code === 11000) {
        return res.status(400).json({ 
          msg: "Duplicate payment detected" 
        });
      }
      
      if (err.name === 'ValidationError') {
        return res.status(400).json({ 
          msg: "Data validation failed", 
          errors: Object.values(err.errors).map(e => e.message) 
        });
      }
      
      res.status(500).json({ msg: "Server error" });
    }
  }
);


// Get all payments for the logged-in user with query validation
router.get("/", 
  authMiddleware, 
  validatePaymentQuery,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          msg: "Invalid query parameters",
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { limit = 10, page = 1, status } = req.query;
      
      // Build query
      const query = { userId };
      if (status) {
        query.status = status;
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);
      
      const total = await Payment.countDocuments(query);
      
      res.json({ 
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Failed to fetch payments" });
    }
  }
);

// Get single payment by ID with validation
router.get("/:id", 
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Basic ID validation
      if (!id || id.length !== 24) {
        return res.status(400).json({ msg: "Invalid payment ID format" });
      }

      const payment = await Payment.findOne({ 
        _id: id, 
        userId: req.user.id 
      });

      if (!payment) {
        return res.status(404).json({ msg: "Payment not found" });
      }

      res.json({ payment });
    } catch (error) {
      console.error(error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({ msg: "Invalid payment ID" });
      }
      
      res.status(500).json({ msg: "Failed to fetch payment" });
    }
  }
);

// ✅ TEMP: Add test payments (for development only) with validation
router.post("/seed", 
  [
    body('payments').optional().isArray().withMessage('Payments must be an array'),
    body('clearExisting').optional().isBoolean().withMessage('clearExisting must be a boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          msg: "Validation failed",
          errors: errors.array()
        });
      }

      const { payments: customPayments, clearExisting = false } = req.body;

      // Use provided payments or default sample
      const samplePayments = customPayments || [
        {
          customerId: "68fe169b9bbef056b6265734",
          amount: 2500,
          currency: "USD",
          provider: "PayPal",
          swiftCode: "ABCDUS33",
          recipientAccount: "1234567890",
          status: "completed"
        },
        {
          customerId: "68e97640ba869f3173c8cafd",
          amount: 1000,
          currency: "EUR",
          provider: "Wise",
          swiftCode: "EFGHDEFF",
          recipientAccount: "0987654321",
          status: "pending"
        }
      ];

      // Validate each payment in the array
      for (const payment of samplePayments) {
        if (!payment.customerId || payment.customerId.length !== 24) {
          return res.status(400).json({ 
            error: "Invalid customerId in sample payments" 
          });
        }
        
        if (!swiftRegex.test(payment.swiftCode)) {
          return res.status(400).json({ 
            error: `Invalid SWIFT code: ${payment.swiftCode}` 
          });
        }
      }

      // Clear existing payments if requested
      if (clearExisting) {
        await Payment.deleteMany({});
      }

      const result = await Payment.insertMany(samplePayments);
      res.json({ 
        message: "Sample payments seeded", 
        count: result.length,
        result 
      });
    } catch (err) {
      console.error(err);
      
      if (err.name === 'ValidationError') {
        return res.status(400).json({ 
          error: "Data validation failed for sample payments" 
        });
      }
      
      res.status(500).json({ error: "Failed to seed payments" });
    }
  }
);
export default router;
