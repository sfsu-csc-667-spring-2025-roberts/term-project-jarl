// src/server/routes/root.ts
import express from "express";
import { Request, Response } from "express";
import db from "../db/connection";
import UserModel from "../db/models/user";
import GameModel from "../db/models/game";
import friendsModel from "../db/models/friends";

const router = express.Router();
const userModel = new UserModel(db);
const gameModel = new GameModel(db);

// Home page
router.get("/", async (req: Request, res: Response) => {
  try {
    let user = null;
    // Use type assertion for req.session
    const session = req.session as any;

    if (session && session.userId) {
      // Convert userId to number if it's a string
      const userId =
        typeof session.userId === "string"
          ? parseInt(session.userId, 10)
          : session.userId;

      user = await userModel.findById(userId);

      if (!user) {
        return res.redirect("/signin");
      }

      // Fetch friends and friend requests
      const friendsDB = new friendsModel(db);

      const friends = await friendsDB.getFriends(userId);
      user.friends = friends;
      const requests = await friendsDB.getFriendRequests(userId);
      user.requests = requests;
    }

    res.render("root", {
      title: "Poker Game",
      user,
      friends: user ? user.friends : [],
      requests: user ? user.requests : [],
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
router.get("/signin", (req: Request, res: Response) => {
  console.log("Signin route accessed");
  // Use type assertion for req.session
  const session = req.session as any;

  if (session && session.userId) {
    return res.redirect("/");
  }
  res.render("signin", { title: "Sign In" });
});

// Sign up page
router.get("/signup", (req: Request, res: Response) => {
  console.log("Signup route accessed");
  // Use type assertion for req.session
  const session = req.session as any;

  if (session && session.userId) {
    return res.redirect("/");
  }
  res.render("signup", { title: "Sign Up" });
});

// Forgot password page
router.get("/forgot-password", (req: Request, res: Response) => {
  console.log("Forgot password route accessed");
  // Use type assertion for req.session
  const session = req.session as any;

  if (session && session.userId) {
    return res.redirect("/");
  }
  res.render("forgot-password", { title: "Forgot Password" });
});

// Reset password page
router.get("/reset-password", (req: Request, res: Response) => {
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
