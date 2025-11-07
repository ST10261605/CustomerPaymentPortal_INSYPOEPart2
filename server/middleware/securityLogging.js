// middleware/securityLogging.js
import fs from 'fs';

// Enhanced security event logging
export function logSecurityEvent(event) {
  const logLine = `${new Date().toISOString()} | SECURITY | ${JSON.stringify(event)}\n`;
  
  try {
    fs.appendFileSync("security.log", logLine);
  } catch (error) {
    console.error('Failed to write security log:', error);
  }
}

// Specialized logging for repeated login attempts
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

// Log password reset attempts
export function logPasswordResetAttempt({ accountNumber, ip, success }) {
  logSecurityEvent({
    type: 'PASSWORD_RESET_ATTEMPT',
    accountNumber, 
    ip,
    success,
    timestamp: new Date().toISOString()
  });
}

// Log suspicious activities
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