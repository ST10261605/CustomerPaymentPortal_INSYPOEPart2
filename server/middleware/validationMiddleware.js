import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      errors: errors.array().map(err => err.msg) 
    });
  }
  next();
};

// Payment validation
export const validatePayment = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('recipientAccount')
    .isLength({ min: 8, max: 12 })
    .withMessage('Recipient account must be 8-12 digits')
    .isNumeric()
    .withMessage('Recipient account must contain only numbers'),
  body('description')
    .trim()
    .escape()
    .isLength({ max: 255 })
    .withMessage('Description must not exceed 255 characters'),
  handleValidationErrors
];

// Employee validation
export const validateEmployee = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('department')
    .trim()
    .escape()
    .isLength({ max: 50 })
    .withMessage('Department must not exceed 50 characters'),
  handleValidationErrors
];