// src/server/routes/friends.ts
import db from "../db/connection";
import express from "express";
import { Request, Response } from "express";

const router = express.Router();

const SEND_SQL = `INSERT INTO "userFriends" (user_id, friend_id, status) VALUES ($1, $2, 'pending')`;
const APPROVE_SQL = `UPDATE "userFriends" SET status = 'accepted' WHERE user_id = $1 AND friend_id = $2`;
const DELETE_SQL = `DELETE FROM "userFriends" WHERE (user_id = $1 AND friend_id = $2)`;
const ACCEPT_SQL = `INSERT INTO "userFriends" (user_id, friend_id, status) VALUES ($1, $2, 'accepted') ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted'`;

router.post("/send", async (req: Request, res: Response) => {
  // Type assertion for session
  const session = req.session as any;
  const userId = session.userId;
  const { friendId } = req.body;

  if (!userId || !friendId) {
    return res.status(400).json({ error: "User ID and Friend ID are required" });
  }

  if (userId.toString() === friendId) {
    return res.status(400).json({ error: "You cannot send a friend request to yourself" });
  }

  try {
    // Check if a friend request already exists
    const existingRequest = await db.any(
      `SELECT * FROM "userFriends" WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [userId, friendId],
    );

    if (existingRequest.length > 0) {
      return res.status(400).json({
        error: "Friend request already exists or you are already friends",
      });
    }

    // Insert the friend request
    await db.none(SEND_SQL, [userId, friendId]);
    return res.status(200).json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reject", async (req: Request, res: Response) => {
  console.log("Received request to reject friend request:");
  // Type assertion for session
  const session = req.session as any;
  const userId = session.userId;
  const { friendId } = req.body;

  if (!userId || !friendId) {
    return res.status(400).json({ error: "User ID and Friend ID are required" });
  }

  try {
    await db.none(DELETE_SQL, [userId, Number(friendId)]);
    await db.none(DELETE_SQL, [Number(friendId), userId]);
    return res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/accept", async (req: Request, res: Response) => {
  console.log("Received request to accept friend request");
  // Type assertion for session
  const session = req.session as any;
  const userId = session.userId;
  const { friendId } = req.body;

  if (!userId || !friendId) {
    return res.status(400).json({ error: "User ID and Friend ID are required" });
  }

  try {
    await db.none(ACCEPT_SQL, [userId, Number(friendId)]);
    await db.none(APPROVE_SQL, [Number(friendId), userId]);
    return res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/remove", async (req: Request, res: Response) => {
  // Type assertion for session
  const session = req.session as any;
  const userId = session.userId;
  const { friendId } = req.body;

  if (!userId || !friendId) {
    return res.status(400).json({ error: "User ID and Friend ID are required" });
  }

  try {
    await db.none(DELETE_SQL, [userId, Number(friendId)]);
    await db.none(DELETE_SQL, [Number(friendId), userId]);
    return res.status(200).json({ message: "Friend removed" });
  } catch (error) {
    console.error("Error removing friend:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;