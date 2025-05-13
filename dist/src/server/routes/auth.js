"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const nodemailer_1 = __importDefault(require("nodemailer"));
const user_1 = __importDefault(require("../db/models/user"));
const connection_1 = __importDefault(require("../db/connection"));
const validation_1 = require("../utils/validation");
const router = express_1.default.Router();
const userModel = new user_1.default(connection_1.default);
const transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "2525"),
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});
router.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;
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
        const existingUser = await userModel.findByEmail(email);
        if (existingUser) {
            return res
                .status(409)
                .json({ error: "User with this email already exists" });
        }
        const user = await userModel.create(username, email, password);
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
});
router.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "Email and password are required" });
        }
        const user = await userModel.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
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
});
router.post("/signout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Error signing out" });
        }
        res.clearCookie("poker.sid");
        return res.status(200).json({ message: "Signed out successfully" });
    });
});
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }
        const user = await userModel.findByEmail(email);
        if (!user) {
            return res.status(200).json({
                message: "If your email exists in our system, you will receive a password reset link",
            });
        }
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + 3600000);
        await userModel.createPasswordResetToken(email, token, expiresAt);
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
        await transporter.sendMail(mailOptions);
        return res.status(200).json({
            message: "If your email exists in our system, you will receive a password reset link",
        });
    }
    catch (error) {
        console.error("Error requesting password reset:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
router.post("/reset-password", async (req, res) => {
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
        const tokenRecord = await userModel.findPasswordResetToken(token);
        if (!tokenRecord) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }
        const user = await userModel.findByEmail(tokenRecord.email);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        await userModel.updatePassword(user.id, password);
        await userModel.deletePasswordResetToken(token);
        return res.status(200).json({ message: "Password reset successfully" });
    }
    catch (error) {
        console.error("Error resetting password:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/me", async (req, res) => {
    try {
        const session = req.session;
        const userId = session.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
        const user = await userModel.findById(userIdNum);
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
});
exports.default = router;
//# sourceMappingURL=auth.js.map