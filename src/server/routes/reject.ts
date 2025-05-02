import db from "../db/connection";
import express from "express";

const router = express.Router();

const REJECT_SQL = `DELETE FROM "userFriends" WHERE user_id = $1 AND friend_id = $2`;

// @ts-ignore
router.post("/", async (req, res) => {
  console.log("Received request to reject friend request:");
  const userId = req.session.userId;
  const { friendId } = req.body;

  if (!userId || !friendId) {
    return res
      .status(400)
      .json({ error: "User ID and Friend ID are required" });
  }

  try {
    await db.query(REJECT_SQL, [userId, Number(friendId)]);
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
