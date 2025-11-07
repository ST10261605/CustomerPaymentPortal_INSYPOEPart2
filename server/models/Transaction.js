// models/Transaction.js
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  // User who made the payment
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: "USD"
  },
  recipientName: {
    type: String,
    required: true
  },
  recipientAccount: {
    type: String,
    required: true
  },
  swiftCode: {
    type: String,
    required: true
  },
  description: String,
  provider: {
    type: String,
    default: "SWIFT"
  },
  status: {
    type: String,
    enum: ["pending", "verified", "submitted_to_swift", "completed", "failed"],
    default: "pending"
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  verifiedAt: Date,
  submittedToSwiftAt: Date,
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { 
  timestamps: true 
});

export default mongoose.model("Transaction", transactionSchema);