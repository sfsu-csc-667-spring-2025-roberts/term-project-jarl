// src/server/routes/root.ts
import express from "express";
import User from "../db/models/user";
import db from "../db/connection";

const router = express.Router();
const userModel = new User(db);

const userFriends = async (userId: number) => {
  const friends = await db.any(
    `SELECT friend_id, status FROM "userFriends" WHERE user_id = $1`,
    [userId],
  );
  return friends;
};

// Home page
router.get("/", async (req, res) => {
  try {
    let user = null;
    if (req.session.userId) {
      user = await userModel.findById(req.session.userId);

      if (!user) {
        return res.redirect("/signin");
      }

      const friends = await userFriends(req.session.userId);
      user.friends = friends;
    }

    res.render("root", {
      title: "Poker Game",
      user,
      friends: user ? user.friends : [],
    });
  } catch (error) {
    console.error("Home page error:", error);
    res.render("root", {
      title: "Poker Game",
      error: "An error occurred",
    });
  }
});

// Sign in page
router.get("/signin", (req, res) => {
  console.log("Signin route accessed");
  if (req.session.userId) {
    return res.redirect("/");
  }
  res.render("signin", { title: "Sign In" });
});

// Sign up page
router.get("/signup", (req, res) => {
  console.log("Signup route accessed");
  if (req.session.userId) {
    return res.redirect("/");
  }
  res.render("signup", { title: "Sign Up" });
});

// Forgot password page
router.get("/forgot-password", (req, res) => {
  console.log("Forgot password route accessed");
  if (req.session.userId) {
    return res.redirect("/");
  }
  res.render("forgot-password", { title: "Forgot Password" });
});

// Reset password page
router.get("/reset-password", (req, res) => {
  console.log("Reset password route accessed");
  const { token } = req.query;

  if (!token) {
    return res.redirect("/forgot-password");
  }

  res.render("reset-password", {
    title: "Reset Password",
    token,
  });
});

export default router;
