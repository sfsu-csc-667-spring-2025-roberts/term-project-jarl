import express, { Request, Response } from "express";
import User from "../db/models/user";
import db from "../db/connection";
import { Game, Friends } from "../db";
import { Server } from "socket.io";

const router = express.Router();
const userModel = new User(db);
const friendsModel = new Friends(db);

// Function to get lobby messages
const getLobbyMessages = async () => {
  try {
    const messages = await db.any(
      `SELECT m.content, m.author, m.created_at, u.user_id as sender_id, u.username
       FROM messages m
       FULL JOIN users u ON m.author = u.user_id
       WHERE m."isLobby" = true
       ORDER BY m.created_at ASC`,
    );
    // Format messages to match the frontend expectation
    return messages.map((msg) => ({
      message: msg.content,
      sender: msg.username, // or msg.sender_id if you want to use user_id
      timestamp: new Date(msg.created_at).getTime(),
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

      user.friends = await friendsModel.getFriends(req.session.userId);
      user.requests = await friendsModel.getFriendRequests(req.session.userId);

      const io = req.app.get<Server>("io");
      const allGames = await Game.getAllGames();
      io.on("connection", (socket) => {
        socket.emit("game:getGames", {
          allGames,
        });
      });
      const funds = await userModel.getFunds(user.user_id);

      lobbyMessages = await getLobbyMessages();

      res.render("root", {
        title: "Poker Game",
        user,
        friends: user ? user.friends : [],
        requests: user ? user.requests : [],
        lobbyMessages: lobbyMessages, // Pass messages to template
        funds: funds ? funds.funds : 0,
      });
    }

    if (!user) {
      return res.redirect("/signin");
    }
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

router.post("/addFunds", async (req: Request, res: Response) => {
  const { fundsAmount } = req.body;
  // @ts-ignore
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ message: "You have to login first!" });
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await userModel.addFunds(userId, fundsAmount);
    const funds = await userModel.getFunds(userId);

    res
      .status(200)
      .json({ message: "Funds added successfully", funds: funds.funds });
  } catch (error) {
    console.error("Error adding funds:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
