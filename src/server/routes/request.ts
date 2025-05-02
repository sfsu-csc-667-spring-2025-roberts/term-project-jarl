import express from "express";
import db from "../db/connection";

const router = express.Router();
const SEND_SQL = `INSERT INTO "userFriends" (user_id, friend_id, status) VALUES ($1, $2, 'pending')`;

// send request to add a friend
// @ts-ignore
router.post("/", async (req, res) => {
  console.log("Received request to send friend request:");
  const userId = req.session.userId;
  const { friendId } = req.body;

  if (!userId || !friendId) {
    return res
      .status(400)
      .json({ error: "User ID and Friend ID are required" });
  }

  if (userId.toString() === friendId) {
    return res
      .status(400)
      .json({ error: "You cannot send a friend request to yourself" });
  }

  try {
    // Check if a friend request already exists
    const existingRequest = await db.query(
      `SELECT * FROM "userFriends" WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [userId, friendId],
    );

    if (existingRequest.length > 0) {
      return res
        .status(400)
        .json({
          error: "Friend request already exists or you are already friends",
        });
    }

    // Insert the friend request
    await db.query(SEND_SQL, [userId, friendId]);
    res.status(200).json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
