import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";
import Payment from "../models/Payment.js";
import dotenv from "dotenv";

dotenv.config();

// Register employee (admin only or initial seeding)
export const registerEmployee = async (req, res) => {
  try {
    const { fullName, employeeId, department, email, password, role } = req.body;

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) return res.status(400).json({ error: "Employee already exists" });

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newEmployee = new Employee({ fullName, employeeId, department, email, passwordHash, role });
    await newEmployee.save();

    res.status(201).json({ message: "Employee registered successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Employee login
export const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    const employee = await Employee.findOne({ email });
    if (!employee) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, employee.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const accessToken = jwt.sign(
      { employeeId: employee._id, role: employee.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ accessToken, employee: { id: employee._id, name: employee.fullName, role: employee.role } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

//Get all pending or verified payments
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ status: { $in: ["pending", "verified"] } }).populate("customerId", "fullName accountNumber");
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

//Verify a payment
export const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    if (payment.status !== "pending")
      return res.status(400).json({ error: "Payment already verified or submitted" });

    payment.status = "verified";
    await payment.save();

    res.json({ message: "Payment verified successfully", payment });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify payment" });
  }
};

//Submit payment to SWIFT
export const submitToSwift = async (req, res) => {
  try {
    const { id, swiftCode } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    if (payment.status !== "verified")
      return res.status(400).json({ error: "Only verified payments can be submitted" });

    payment.status = "submitted";
    payment.swiftCode = swiftCode || "AUTO-GEN-" + Math.floor(Math.random() * 1000000);
    await payment.save();

    res.json({ message: "Payment successfully submitted to SWIFT", payment });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit payment" });
  }
};