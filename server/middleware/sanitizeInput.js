// middleware/sanitizeInput.js
import xss from "xss";
export default function sanitizeInput(req, res, next) {
  try {
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (typeof obj[key] === "string") {
            // Clean string inputs with XSS protection
            obj[key] = xss(obj[key].trim());
          } else if (typeof obj[key] === "object" && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      }
    };

    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }

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