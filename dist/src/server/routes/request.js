"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connection_1 = __importDefault(require("../db/connection"));
const router = express_1.default.Router();
const SEND_SQL = `INSERT INTO "userFriends" (user_id, friend_id, status) VALUES ($1, $2, 'pending')`;
router.post("/", async (req, res) => {
    console.log("Received request to send friend request:");
    const session = req.session;
    const userId = session.userId;
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
        const existingRequest = await connection_1.default.any(`SELECT * FROM "userFriends" WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`, [userId, friendId]);
        if (existingRequest.length > 0) {
            return res
                .status(400)
                .json({
                error: "Friend request already exists or you are already friends",
            });
        }
        await connection_1.default.none(SEND_SQL, [userId, friendId]);
        res.status(200).json({ message: "Friend request sent" });
    }
    catch (error) {
        console.error("Error sending friend request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=request.js.map