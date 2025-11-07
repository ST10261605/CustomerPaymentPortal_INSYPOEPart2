import crypto from 'crypto';
import User from '../models/User.js';
import { logSecurityEvent } from './securityService.js';

// In-memory store for reset tokens (use Redis in production)
const resetTokens = new Map();

export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const requestPasswordReset = async (emailOrAccountNumber) => {
  try {
    const user = await User.findOne({
      $or: [
        { email: emailOrAccountNumber },
        { accountNumber: emailOrAccountNumber }
      ]
    });
    
    if (!user) {
      // Don't reveal whether user exists
      return { success: true };
    }
    
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Store token with user ID and expiry
    resetTokens.set(token, {
      userId: user._id,
      expiresAt,
      used: false
    });
    
    // In production, send email with reset link
    const resetLink = `${process.env.CLIENT_ORIGIN}/reset-password?token=${token}`;
    
    logSecurityEvent({
      type: 'PASSWORD_RESET_REQUESTED',
      userId: user._id,
      accountNumber: user.accountNumber,
      token,
      expiresAt
    });
    
    // Simulate email sending
    console.log(`Password reset link for ${user.accountNumber}: ${resetLink}`);
    
    return { success: true };
  } catch (error) {
    console.error('Password reset request error:', error);
    return { success: false, error: 'Failed to process reset request' };
  }
};

export const verifyResetToken = (token) => {
  const tokenData = resetTokens.get(token);
  
  if (!tokenData) {
    return { valid: false, error: 'Invalid or expired token' };
  }
  
  if (tokenData.used) {
    return { valid: false, error: 'Token already used' };
  }
  
  if (tokenData.expiresAt < new Date()) {
    resetTokens.delete(token);
    return { valid: false, error: 'Token expired' };
  }
  
  return { valid: true, userId: tokenData.userId };
};

export const resetPassword = async (token, newPassword) => {
  try {
    const tokenVerification = verifyResetToken(token);
    
    if (!tokenVerification.valid) {
      return { success: false, error: tokenVerification.error };
    }
    
    const { userId } = tokenVerification;
    const user = await User.findById(userId);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Update password
    const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Clear lockout status
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    
    await user.save();
    
    // Mark token as used
    const tokenData = resetTokens.get(token);
    tokenData.used = true;
    resetTokens.set(token, tokenData);
    
    // Clean up old tokens periodically
    cleanupExpiredTokens();
    
    logSecurityEvent({
      type: 'PASSWORD_RESET_SUCCESS',
      userId: user._id,
      accountNumber: user.accountNumber
    });
    
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: 'Failed to reset password' };
  }
};

const cleanupExpiredTokens = () => {
  for (const [token, data] of resetTokens.entries()) {
    if (data.expiresAt < new Date()) {
      resetTokens.delete(token);
    }
  }
};