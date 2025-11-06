import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  idNumber: { type: String, required: true, unique: true },
  accountNumber: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["Customer", "Admin", "Employee"], default: "Customer" }, // different roles the user could be, default being customer
}, { timestamps: true });

export default mongoose.model("User", userSchema);
