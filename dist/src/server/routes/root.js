"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connection_1 = __importDefault(require("../db/connection"));
const user_1 = __importDefault(require("../db/models/user"));
const router = express_1.default.Router();
const userModel = new user_1.default(connection_1.default);
const userFriends = async (userId) => {
    const friends = await connection_1.default.any(`SELECT friend_id, status FROM "userFriends" WHERE user_id = $1`, [userId]);
    return friends;
};
const friendRequests = async (userId) => {
    const requests = await connection_1.default.any(`SELECT user_id, status FROM "userFriends" WHERE friend_id = $1 AND status = 'pending'`, [userId]);
    return requests;
};
router.get("/", async (req, res) => {
    try {
        let user = null;
        const session = req.session;
        if (session && session.userId) {
            const userId = typeof session.userId === 'string'
                ? parseInt(session.userId, 10)
                : session.userId;
            user = await userModel.findById(userId);
            if (!user) {
                return res.redirect("/signin");
            }
            const friends = await userFriends(userId);
            user.friends = friends;
            const requests = await friendRequests(userId);
            user.requests = requests;
        }
        res.render("root", {
            title: "Poker Game",
            user,
            friends: user ? user.friends : [],
            requests: user ? user.requests : [],
        });
    }
    catch (error) {
        console.error("Home page error:", error);
        res.render("root", {
            title: "Poker Game",
            error: "An error occurred",
        });
    }
});
router.get("/signin", (req, res) => {
    console.log("Signin route accessed");
    const session = req.session;
    if (session && session.userId) {
        return res.redirect("/");
    }
    res.render("signin", { title: "Sign In" });
});
router.get("/signup", (req, res) => {
    console.log("Signup route accessed");
    const session = req.session;
    if (session && session.userId) {
        return res.redirect("/");
    }
    res.render("signup", { title: "Sign Up" });
});
router.get("/forgot-password", (req, res) => {
    console.log("Forgot password route accessed");
    const session = req.session;
    if (session && session.userId) {
        return res.redirect("/");
    }
    res.render("forgot-password", { title: "Forgot Password" });
});
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
exports.default = router;
//# sourceMappingURL=root.js.map