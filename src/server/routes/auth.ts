// src/server/routes/auth.ts
import express from "express";
import bcrypt from "bcrypt";
import { isNotAuthenticated } from "../middleware/auth";
import db from "../db/connection";


const router = express.Router();

// GET sign-in page
router.get("/signin", isNotAuthenticated, (req, res) => {
  res.render("signin");
});

// POST sign-in
router.post("/signin", isNotAuthenticated, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const user = await db.oneOrNone("SELECT * FROM users WHERE username = $1", [username]);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Set up session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      balance: user.balance
    };

    // Save session and redirect to lobby
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ success: false, message: "Session error" });
      }
      return res.json({ success: true, redirect: "/" });
    });
  } catch (error) {
    console.error("Sign-in error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET sign-up page
router.get("/signup", isNotAuthenticated, (req, res) => {
  res.render("signup");
});

// POST sign-up
router.post("/signup", isNotAuthenticated, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check if username exists
    const existingUser = await db.oneOrNone("SELECT id FROM users WHERE username = $1", [username]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username already exists" });
    }

    // Check if email exists
    const existingEmail = await db.oneOrNone("SELECT id FROM users WHERE email = $1", [email]);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db.one(
      `INSERT INTO users (username, email, password, balance, created_at) 
       VALUES ($1, $2, $3, 1000.00, NOW()) 
       RETURNING id, username, email, balance`,
      [username, email, hashedPassword]
    );

    // Set up session
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      balance: newUser.balance
    };

    // Save session and redirect to lobby
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ success: false, message: "Session error" });
      }
      return res.json({ success: true, redirect: "/" });
    });
  } catch (error) {
    console.error("Sign-up error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET sign-out
router.get("/sign-out", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.status(500).send("Error signing out");
    }
    res.redirect("/signin");
  });
});

export default router;