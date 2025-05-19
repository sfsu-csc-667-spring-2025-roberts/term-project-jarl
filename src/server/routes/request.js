"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connection_1 = __importDefault(require("../db/connection"));
const router = express_1.default.Router();
const SEND_SQL = `INSERT INTO "userFriends" (user_id, friend_id, status) VALUES ($1, $2, 'pending')`;
// send request to add a friend
// @ts-ignore
router.post("/", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
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
      const existingRequest = yield connection_1.default.query(
        `SELECT * FROM "userFriends" WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
        [userId, friendId],
      );
      if (existingRequest.length > 0) {
        return res.status(400).json({
          error: "Friend request already exists or you are already friends",
        });
      }
      // Insert the friend request
      yield connection_1.default.query(SEND_SQL, [userId, friendId]);
      res.status(200).json({ message: "Friend request sent" });
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }),
);
exports.default = router;
