import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  idNumber: { type: String, required: true, unique: true },
  accountNumber: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: "customer" },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
