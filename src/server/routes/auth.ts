// src/server/routes/auth.ts
import express from "express";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import User from "../db/models/user";
import db from "../db/connection";
import { validateEmail, validatePassword } from "../utils/validation";

const router = express.Router();
const userModel = new User(db);

// Configure nodemailer with Mailtrap
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "2525"),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Sign up route
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Validate inputs
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters long with at least one uppercase letter, one lowercase letter, and one number",
      });
    }

    // Check if user already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    // Create user
    const user = await userModel.create(username, email, password);

    // Set user in session (using type assertion)
    (req.session as any).userId = user.user_id;

    return res.status(201).json({
      message: "User created successfully",
      user: { id: user.user_id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("Error signing up:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Sign in route
router.post("/signin", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Set user in session (using type assertion)
    (req.session as any).user = user;
    (req.session as any).userId = user.user_id;

    req.session.save((err) => {
      if (err) {
        console.error("Error saving session:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    });

    return res.status(200).json({
      message: "Signed in successfully",
      user: { id: user.user_id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("Error signing in:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Sign out route
router.post("/signout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Error signing out" });
    }
    res.clearCookie("poker.sid");
    return res.status(200).json({ message: "Signed out successfully" });
  });
});

// Forgot password route
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user by email
    const user = await userModel.findByEmail(email);
    if (!user) {
      // For security reasons, don't reveal that email doesn't exist
      return res.status(200).json({
        message:
          "If your email exists in our system, you will receive a password reset link",
      });
    }

    // Generate token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // Token expires in 1 hour

    // Save token to database
    await userModel.createPasswordResetToken(email, token, expiresAt);

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

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message:
        "If your email exists in our system, you will receive a password reset link",
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Reset password route
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters long with at least one uppercase letter, one lowercase letter, and one number",
      });
    }

    // Find valid token
    const tokenRecord = await userModel.findPasswordResetToken(token);
    if (!tokenRecord) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Find user by email
    const user = await userModel.findByEmail(tokenRecord.email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update password
    await userModel.updatePassword(user.user_id, password);

    // Delete token
    await userModel.deletePasswordResetToken(token);

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user route
router.get("/me", async (req: Request, res: Response) => {
  try {
    // Type assertion for session
    const session = req.session as any;
    const userId = session.userId;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Convert userId to number if it's a string
    const userIdNum =
      typeof userId === "string" ? parseInt(userId, 10) : userId;

    const user = await userModel.findById(userIdNum);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error getting current user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
