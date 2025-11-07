import { logSecurityEvent, logFailedLoginAttempt, logSuspiciousActivity } from '../services/securityService.js';

export const auditLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.json to capture response data
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Log the request details
    const auditLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous',
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent')
    };

    // Log sensitive operations
    if (req.path.includes('/payment') && req.method === 'POST') {
      logSecurityEvent({
        type: 'PAYMENT_ATTEMPT',
        ...auditLog,
        amount: req.body.amount,
        recipient: req.body.recipientAccount
      });
    }
    
    // Log to security service
    logSecurityEvent({
      type: 'API_REQUEST',
      ...auditLog
    });
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Specialized middleware for authentication events
export const authAuditLogger = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  res.send = function(body) {
    if (req.path.includes('/login') || req.path.includes('/register')) {
      const success = res.statusCode < 400;
      
      logSecurityEvent({
        type: 'AUTHENTICATION_ATTEMPT',
        endpoint: req.path,
        accountNumber: req.body?.accountNumber,
        ip: req.ip,
        success,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      });
    }
    return originalSend.call(this, body);
  };
  
  res.json = function(body) {
    if (req.path.includes('/login') || req.path.includes('/register')) {
      const success = res.statusCode < 400;
      
      logSecurityEvent({
        type: 'AUTHENTICATION_ATTEMPT',
        endpoint: req.path,
        accountNumber: req.body?.accountNumber,
        ip: req.ip,
        success,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      });
    }
    return originalJson.call(this, body);
  };
  
  next();
};