"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = exports.validateEmail = void 0;
// src/server/utils/validation.ts
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const validatePassword = (password) => {
  // At least 8 characters, with at least one uppercase, one lowercase, and one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};
exports.validatePassword = validatePassword;
