"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server/routes/friends.ts
const connection_1 = __importDefault(require("../db/connection"));
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const SEND_SQL = `INSERT INTO "userFriends" (user_id, friend_id, status) VALUES ($1, $2, 'pending')`;
const APPROVE_SQL = `UPDATE "userFriends" SET status = 'accepted' WHERE user_id = $1 AND friend_id = $2`;
const DELETE_SQL = `DELETE FROM "userFriends" WHERE (user_id = $1 AND friend_id = $2)`;
const ACCEPT_SQL = `INSERT INTO "userFriends" (user_id, friend_id, status) VALUES ($1, $2, 'accepted') ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted'`;
router.post("/send", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Type assertion for session
    const session = req.session;
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
        const existingRequest = yield connection_1.default.any(`SELECT * FROM "userFriends" WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`, [userId, friendId]);
        if (existingRequest.length > 0) {
            return res.status(400).json({
                error: "Friend request already exists or you are already friends",
            });
        }
        // Insert the friend request
        yield connection_1.default.none(SEND_SQL, [userId, friendId]);
        return res.status(200).json({ message: "Friend request sent" });
    }
    catch (error) {
        console.error("Error sending friend request:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
router.post("/reject", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Received request to reject friend request:");
    // Type assertion for session
    const session = req.session;
    const userId = session.userId;
    const { friendId } = req.body;
    if (!userId || !friendId) {
        return res.status(400).json({ error: "User ID and Friend ID are required" });
    }
    try {
        yield connection_1.default.none(DELETE_SQL, [userId, Number(friendId)]);
        yield connection_1.default.none(DELETE_SQL, [Number(friendId), userId]);
        return res.status(200).json({ message: "Friend request rejected" });
    }
    catch (error) {
        console.error("Error rejecting friend request:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
router.post("/accept", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Received request to accept friend request");
    // Type assertion for session
    const session = req.session;
    const userId = session.userId;
    const { friendId } = req.body;
    if (!userId || !friendId) {
        return res.status(400).json({ error: "User ID and Friend ID are required" });
    }
    try {
        yield connection_1.default.none(ACCEPT_SQL, [userId, Number(friendId)]);
        yield connection_1.default.none(APPROVE_SQL, [Number(friendId), userId]);
        return res.status(200).json({ message: "Friend request accepted" });
    }
    catch (error) {
        console.error("Error accepting friend request:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
router.post("/remove", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Type assertion for session
    const session = req.session;
    const userId = session.userId;
    const { friendId } = req.body;
    if (!userId || !friendId) {
        return res.status(400).json({ error: "User ID and Friend ID are required" });
    }
    try {
        yield connection_1.default.none(DELETE_SQL, [userId, Number(friendId)]);
        yield connection_1.default.none(DELETE_SQL, [Number(friendId), userId]);
        return res.status(200).json({ message: "Friend removed" });
    }
    catch (error) {
        console.error("Error removing friend:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
exports.default = router;
