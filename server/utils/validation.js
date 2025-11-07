import validator from "validator";

// utils/validation.js
export const validateRegistration = (userData) => {
  const { fullName, idNumber, accountNumber, password } = userData;
  const errors = [];

  // STRICT full name validation - ONLY letters and spaces
  if (!fullName || fullName.trim() === '') {
    errors.push("Full name is required.");
  } else if (!/^[a-zA-Z\s]{2,50}$/.test(fullName)) {
    errors.push("Full name may only contain letters and spaces (2-50 characters). No numbers, symbols, or HTML allowed.");
  }

  // ID number validation
  if (!idNumber || !/^\d{13}$/.test(idNumber)) {
    errors.push("ID number must be exactly 13 digits.");
  }

  // Account number validation
  if (!accountNumber || !/^\d{8,12}$/.test(accountNumber)) {
    errors.push("Account number must be 8-12 digits.");
  }

  // Password validation
  const passwordErrors = validatePasswordStrength(password);
  errors.push(...passwordErrors);

  console.log('🔍 VALIDATION: Errors found:', errors);
  return errors;
};

export const validateLogin = (loginData) => {
  const { accountNumber, password } = loginData;
  const errors = [];

  if (!/^\d{8,12}$/.test(accountNumber)) {
    errors.push("Account number must be 8–12 digits.");
  }

  if (validator.isEmpty(password)) {
    errors.push("Password cannot be empty.");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }

  return errors;
};

export const validatePasswordStrength = (password) => {
  const errors = [];
  
  // Default to requiring all strength features if not specified in env
  const requireUppercase = process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false';
  const requireLowercase = process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false'; 
  const requireNumbers = process.env.PASSWORD_REQUIRE_NUMBERS !== 'false';
  const requireSymbols = process.env.PASSWORD_REQUIRE_SYMBOLS !== 'false';
  const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH) || 8;
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (requireUppercase && !/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (requireLowercase && !/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (requireNumbers && !/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (requireSymbols && !/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return errors;
};
