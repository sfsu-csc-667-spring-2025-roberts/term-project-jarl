import express, { Request, Response } from "express";
import User from "../db/models/user";
import db from "../db/connection";
import { Game, Friends } from "../db";
import { Server } from "socket.io";

const router = express.Router();
const userModel = new User(db);
const friendsModel = new Friends(db);

// Home page
router.get("/", async (req: Request, res: Response) => {
  try {
    let user = null;
    if (req.session.userId) {
      user = await userModel.findById(req.session.userId);

      if (!user) {
        return res.redirect("/signin");
      }

      user.friends = await friendsModel.getFriends(req.session.userId);
      user.requests = await friendsModel.getFriendRequests(req.session.userId);
    }

    const io = req.app.get<Server>("io");
    const allGames = await Game.getAllGames();
    io.on("connection", (socket) => {
      socket.emit("game:getGames", {
        allGames,
      });
    });

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
