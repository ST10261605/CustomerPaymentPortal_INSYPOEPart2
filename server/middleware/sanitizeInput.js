import validator from "validator";

const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Trim and escape HTML characters
        req.body[key] = validator.escape(validator.trim(req.body[key]));
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = validator.escape(validator.trim(req.query[key]));
      }
    });
  }
  
  next();
};

export default sanitizeInput;