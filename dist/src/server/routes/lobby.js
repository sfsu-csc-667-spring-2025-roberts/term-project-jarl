"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const games_1 = __importDefault(require("../db/games"));
const router = express_1.default.Router();
router.get("/", auth_1.isAuthenticated, async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.id) {
            return res.redirect('/signin');
        }
        const activeGames = await games_1.default.findActiveGames();
        res.render("lobby", {
            games: activeGames,
            user: req.session.user,
            friends: []
        });
    }
    catch (error) {
        console.error("Error loading lobby:", error);
        res.status(500).send("Error loading lobby");
    }
});
exports.default = router;
//# sourceMappingURL=lobby.js.map