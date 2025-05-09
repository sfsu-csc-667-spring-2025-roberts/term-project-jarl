// src/server/routes/friends.ts
import db from "../db/connection";
import express from "express";
import { Request, Response } from "express";
import friendsModel from "../db/models/friends";

const router = express.Router();

router.post("/send", async (req: Request, res: Response) => {
  // Type assertion for session
  const session = req.session as any;
  const userId = session.userId;
  let { friendId } = req.body;

  if (!userId || !friendId) {
    return res.status(400).json({ error: "User ID and Friend ID are required" });
  }

  if (userId.toString() === friendId) {
    return res.status(400).json({ error: "You cannot send a friend request to yourself" });
  }

  try {
    const friends = new friendsModel(db);

    if (!isNaN(Number(friendId))) {
      friendId = Number(friendId);

      const existingRequest = await friends.existingRequests(userId, friendId);

      if (existingRequest.length > 0) {
        return res.status(400).json({
          error: "Friend request already exists or you are already friends",
        });
      }
    }

    // Insert the friend request
    await friends.sendFriendRequest(userId, friendId);
    return res.status(200).json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reject", async (req: Request, res: Response) => {
  const session = req.session as any;
  const userId = session.userId;
  const { friendId } = req.body;

  if (!userId || !friendId) {
    return res.status(400).json({ error: "User ID and Friend ID are required" });
  }

  try {
    const friends = new friendsModel(db);

    const existingRequest = await friends.existingRequests(userId, Number(friendId));
    if (existingRequest.length === 0) { 
      return res.status(400).json({ error: "No friend request found" });
    }
    
    await friends.deleteFriendRequest(userId, Number(friendId));
    await friends.deleteFriendRequest(Number(friendId), userId);

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
    const friends = new friendsModel(db);

    const existingRequest = await friends.existingRequests(userId, Number(friendId));
    if (existingRequest.length === 0) { 
      return res.status(400).json({ error: "No friend request found" });
    }

    if (existingRequest[0].status === "accepted") {
      return res.status(400).json({ error: "Friend request already accepted" });
    }

    await friends.acceptFriendRequest(userId, Number(friendId));
    await friends.approveFriendRequest(Number(friendId), userId);

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
    const friends = new friendsModel(db);

    const existingRequest = await friends.existingRequests(userId, Number(friendId));
    if (existingRequest.length === 0) { 
      return res.status(400).json({ error: "No friend request found" });
    }

    await friends.deleteFriendRequest(userId, Number(friendId));
    await friends.deleteFriendRequest(Number(friendId), userId);

    return res.status(200).json({ message: "Friend removed" });
  } catch (error) {
    console.error("Error removing friend:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;