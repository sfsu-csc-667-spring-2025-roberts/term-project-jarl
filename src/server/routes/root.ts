import express, { Request, Response } from "express";
import User from "../db/models/user";
import db from "../db/connection";
import { Game } from "../db";
import { Server } from "socket.io";

const router = express.Router();
const userModel = new User(db);

const userFriends = async (userId: number) => {
  const friends = await db.any(
    `SELECT friend_id, status FROM "userFriends" WHERE user_id = $1`,
    [userId],
  );
  return friends;
};

const friendRequests = async (userId: number) => {
  const requests = await db.any(
    `SELECT user_id, status FROM "userFriends" WHERE friend_id = $1 AND status = 'pending'`,
    [userId],
  );
  return requests;
};

// Function to get lobby messages
const getLobbyMessages = async () => {
  try {
    const messages = await db.any(
      `SELECT m.content, m.author, m.created_at, u.user_id as sender_id
       FROM messages m
       JOIN users u ON m.author = u.user_id
       WHERE m."isLobby" = true
       ORDER BY m.created_at ASC`,
    );
    
    // Format messages to match the frontend expectation
    return messages.map(msg => ({
      message: msg.content,
      sender: msg.author, // or msg.sender_id if you want to use user_id
      timestamp: new Date(msg.created_at).getTime()
    }));
  } catch (error) {
    console.error("Error fetching lobby messages:", error);
    return [];
  }
};

// Home page
router.get("/", async (req: Request, res: Response) => {
  try {
    let user = null;
    let lobbyMessages = [];
    
    if (req.session.userId) {
      user = await userModel.findById(req.session.userId);

      if (!user) {
        return res.redirect("/signin");
      }

      const friends = await userFriends(req.session.userId);
      user.friends = friends;
      const requests = await friendRequests(req.session.userId);
      user.requests = requests;

      const io = req.app.get<Server>("io");
      const allGames = await Game.getAllGames();
      io.on("connection", (socket) => {
        socket.emit("game:getGames", {
          allGames,
        });
      });
    }

    // Fetch lobby messages regardless of user authentication
    lobbyMessages = await getLobbyMessages();

    res.render("root", {
      title: "Poker Game",
      user,
      friends: user ? user.friends : [],
      requests: user ? user.requests : [],
      lobbyMessages: lobbyMessages, // Pass messages to template
    });
  } catch (error) {
    console.error("Home page error:", error);
    res.render("root", {
      title: "Poker Game",
      error: "An error occurred",
      lobbyMessages: [], // Empty array on error
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
