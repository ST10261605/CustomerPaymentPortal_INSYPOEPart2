// services/securityService.js
import fs from 'fs';

// Enhanced security event logging
export function logSecurityEvent(event) {
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} | SECURITY | ${JSON.stringify(event)}\n`;
  
  try {
    fs.appendFileSync("security.log", logLine);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
    }
  } catch (error) {
    console.error('Failed to write security log:', error);
  }
}

export function logLockoutEvent({ userId, accountNumber, ip, attempts, lockedUntil }) {
  logSecurityEvent({
    type: 'ACCOUNT_LOCKOUT',
    userId,
    accountNumber,
    ip,
    failedAttempts: attempts,
    lockedUntil,
    timestamp: new Date().toISOString()
  });
}
// Log admin actions
export function logAdminAction({ adminId, action, target, details }) {
  logSecurityEvent({
    type: 'ADMIN_ACTION',
    adminId,
    action,
    target,
    details,
    timestamp: new Date().toISOString()
  });
}

// Specialized logging functions
export function logFailedLoginAttempt({ accountNumber, ip, userAgent, attemptCount }) {
  logSecurityEvent({
    type: 'FAILED_LOGIN_ATTEMPT',
    accountNumber,
    ip,
    userAgent,
    attemptCount,
    timestamp: new Date().toISOString()
  });
}

export function logSuspiciousActivity({ type, userId, ip, userAgent, details }) {
  logSecurityEvent({
    type: 'SUSPICIOUS_ACTIVITY',
    activityType: type,
    userId,
    ip,
    userAgent,
    details,
    timestamp: new Date().toISOString()
  });
}

export function logPasswordResetAttempt({ accountNumber, ip, success }) {
  logSecurityEvent({
    type: 'PASSWORD_RESET_ATTEMPT',
    accountNumber, 
    ip,
    success,
    timestamp: new Date().toISOString()
  });
}