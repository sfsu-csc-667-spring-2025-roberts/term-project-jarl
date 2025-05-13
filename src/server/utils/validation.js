"use strict";
// src/server/utils/validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = exports.validatePassword = exports.validateEmail = void 0;
/**
 * Validates an email address
 * @param email The email to validate
 * @returns True if the email is valid, false otherwise
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
/**
 * Validates a password to ensure it meets security requirements
 * @param password The password to validate
 * @returns True if the password is valid, false otherwise
 */
const validatePassword = (password) => {
    // Password must be at least 8 characters long with at least:
    // - one uppercase letter
    // - one lowercase letter
    // - one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
};
exports.validatePassword = validatePassword;
/**
 * Sanitizes input to prevent XSS attacks
 * @param input The input to sanitize
 * @returns The sanitized input
 */
const sanitizeInput = (input) => {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};
exports.sanitizeInput = sanitizeInput;
