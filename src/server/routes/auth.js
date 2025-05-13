"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server/routes/auth.ts
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const nodemailer_1 = __importDefault(require("nodemailer"));
const user_1 = __importDefault(require("../db/models/user"));
const connection_1 = __importDefault(require("../db/connection"));
const validation_1 = require("../utils/validation");
const router = express_1.default.Router();
const userModel = new user_1.default(connection_1.default);
// Configure nodemailer with Mailtrap
const transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "2525"),
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});
// Sign up route
router.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        // Validate inputs
        if (!username || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }
        if (!(0, validation_1.validateEmail)(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }
        if (!(0, validation_1.validatePassword)(password)) {
            return res.status(400).json({
                error: "Password must be at least 8 characters long with at least one uppercase letter, one lowercase letter, and one number",
            });
        }
        // Check if user already exists
        const existingUser = yield userModel.findByEmail(email);
        if (existingUser) {
            return res
                .status(409)
                .json({ error: "User with this email already exists" });
        }
        // Create user
        const user = yield userModel.create(username, email, password);
        // Set user in session (using type assertion)
        req.session.userId = user.id;
        return res.status(201).json({
            message: "User created successfully",
            user: { id: user.id, username: user.username, email: user.email },
        });
    }
    catch (error) {
        console.error("Error signing up:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
// Sign in route
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Validate inputs
        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "Email and password are required" });
        }
        // Find user
        const user = yield userModel.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        // Compare passwords - use password_hash field instead of password
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        // Set user in session (using type assertion)
        req.session.user = user;
        req.session.userId = user.id;
        req.session.save((err) => {
            if (err) {
                console.error("Error saving session:", err);
                return res.status(500).json({ error: "Internal server error" });
            }
        });
        return res.status(200).json({
            message: "Signed in successfully",
            user: { id: user.id, username: user.username, email: user.email },
        });
    }
    catch (error) {
        console.error("Error signing in:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
// Sign out route
router.post("/signout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Error signing out" });
        }
        res.clearCookie("poker.sid");
        return res.status(200).json({ message: "Signed out successfully" });
    });
});
// Forgot password route
router.post("/forgot-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }
        // Find user by email
        const user = yield userModel.findByEmail(email);
        if (!user) {
            // For security reasons, don't reveal that email doesn't exist
            return res.status(200).json({
                message: "If your email exists in our system, you will receive a password reset link",
            });
        }
        // Generate token
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + 3600000); // Token expires in 1 hour
        // Save token to database
        yield userModel.createPasswordResetToken(email, token, expiresAt);
        // Send email with reset link
        const resetUrl = `${process.env.SITE_URL}/reset-password?token=${token}`;
        const mailOptions = {
            from: process.env.EMAIL_FROM || "noreply@pokergame.com",
            to: email,
            subject: "Password Reset",
            html: `
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
        };
        yield transporter.sendMail(mailOptions);
        return res.status(200).json({
            message: "If your email exists in our system, you will receive a password reset link",
        });
    }
    catch (error) {
        console.error("Error requesting password reset:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
// Reset password route
router.post("/reset-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res
                .status(400)
                .json({ error: "Token and password are required" });
        }
        if (!(0, validation_1.validatePassword)(password)) {
            return res.status(400).json({
                error: "Password must be at least 8 characters long with at least one uppercase letter, one lowercase letter, and one number",
            });
        }
        // Find valid token
        const tokenRecord = yield userModel.findPasswordResetToken(token);
        if (!tokenRecord) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }
        // Find user by email
        const user = yield userModel.findByEmail(tokenRecord.email);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Update password
        yield userModel.updatePassword(user.id, password);
        // Delete token
        yield userModel.deletePasswordResetToken(token);
        return res.status(200).json({ message: "Password reset successfully" });
    }
    catch (error) {
        console.error("Error resetting password:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
// Get current user route
router.get("/me", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Type assertion for session
        const session = req.session;
        const userId = session.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        // Convert userId to number if it's a string
        const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
        const user = yield userModel.findById(userIdNum);
        if (!user) {
            req.session.destroy(() => { });
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json({ user });
    }
    catch (error) {
        console.error("Error getting current user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
exports.default = router;
