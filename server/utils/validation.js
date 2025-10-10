import validator from "validator";

export const validateRegistration = (userData) => {
  const { fullName, idNumber, accountNumber, password } = userData;

  const errors = [];

  // Full name (letters and spaces only)
  if (!/^[a-zA-Z\s]+$/.test(fullName)) {
    errors.push("Full name may only contain letters and spaces.");
  }

  // South African ID number format (13 digits)
  if (!/^\d{13}$/.test(idNumber)) {
    errors.push("Invalid ID number format.");
  }

  // Account number (8–12 digits)
  if (!/^\d{8,12}$/.test(accountNumber)) {
    errors.push("Invalid account number format.");
  }

  // Password strength
  if (
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    errors.push("Password must be at least 8 chars with uppercase, lowercase, number, and symbol.");
  }

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