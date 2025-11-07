// middleware/sanitizeInput.js
import xss from "xss";

/**
 * Sanitize all incoming request data to prevent XSS attacks.
 */
export default function sanitizeInput(req, res, next) {
  try {
    // Helper function to clean objects recursively
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (typeof obj[key] === "string") {
            // Clean string inputs with XSS protection
            obj[key] = xss(obj[key].trim());
          } else if (typeof obj[key] === "object" && obj[key] !== null) {
            // Recurse nested objects
            sanitizeObject(obj[key]);
          }
        }
      }
    };

    // Sanitize request body (this is safe to modify)
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }

    // Create sanitized copies for query and params (optional - only if needed in your routes)
    if (req.query && typeof req.query === 'object') {
      req.sanitizedQuery = { ...req.query };
      sanitizeObject(req.sanitizedQuery);
    }

    if (req.params && typeof req.params === 'object') {
      req.sanitizedParams = { ...req.params };
      sanitizeObject(req.sanitizedParams);
    }

    next();
  } catch (err) {
    console.error("Sanitization error:", err);
    next(err);
  }
}