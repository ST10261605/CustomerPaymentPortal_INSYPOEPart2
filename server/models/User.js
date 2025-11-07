import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  idNumber: { type: String, required: true, unique: true },
  accountNumber: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["Customer", "Admin", "Employee"], default: "Customer" }, // different roles the user could be, default being customer
  
  passwordResetTokens: [{
    token: String,
    expiresAt: Date,
    used: Boolean
  }],

  lastLogin: { type: Date },
  loginHistory: [{
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
    success: Boolean
  }],

   // Audit fields
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // Lockout mechanism fields
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  lastFailedLogin: { type: Date, default: null },
  
}, { timestamps: true });

// Update updatedAt on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

userSchema.pre('save', function(next) {
  // Sanitize inputs before saving
  if (this.fullName) {
    this.fullName = this.fullName.replace(/[<>]/g, '');
  }
  next();
});
mongoose.set('maxTimeMS', 5000); // 5 second timeout

export default mongoose.model("User", userSchema);