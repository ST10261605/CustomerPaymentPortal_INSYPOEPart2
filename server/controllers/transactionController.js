// controllers/transactionController.js
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

// Get pending transactions for employee verification
export const getPendingTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ 
      status: "pending",
      verified: false 
    })
    .populate("userId", "fullName accountNumber") // Populate user info
    .sort({ createdAt: -1 });

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: "Server error fetching pending transactions" });
  }
};

// Verify a transaction
export const verifyTransaction = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Check if user is authenticated
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
  
      const employee = await User.findById(req.user.userId);
  
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
  
      const transaction = await Transaction.findByIdAndUpdate(
        id,
        { 
          verified: true,
          verifiedBy: employee._id,
          verifiedAt: new Date(),
          status: "verified"
        },
        { new: true }
      ).populate("userId", "fullName accountNumber");
  
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
  
      res.json({ message: "Transaction verified successfully", transaction });
    } catch (error) {
      res.status(500).json({ error: "Server error verifying transaction: " + error.message });
    }
  };

// Unverify a transaction
export const unverifyTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByIdAndUpdate(
      id,
      { 
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        status: "pending"
      },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ message: "Transaction unverified", transaction });
  } catch (error) {
    res.status(500).json({ error: "Server error unverifying transaction" });
  }
};

// Submit verified transactions to SWIFT
export const submitToSwift = async (req, res) => {
  try {
    const { transactionIds } = req.body;
    const employee = await User.findById(req.user.userId);

    // Update all transactions to submitted status
    const result = await Transaction.updateMany(
      { _id: { $in: transactionIds }, verified: true },
      { 
        status: "submitted_to_swift",
        submittedToSwiftAt: new Date(),
        submittedBy: employee._id
      }
    );

    res.json({ 
      message: `${result.modifiedCount} transactions submitted to SWIFT successfully`,
      submittedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: "Server error submitting to SWIFT" });
  }
};