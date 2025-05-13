"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const connection_1 = __importDefault(require("../db/connection"));
const router = express_1.default.Router();
router.post("/add", auth_1.isAuthenticated, async (req, res) => {
    try {
        console.log("Received add funds request:", req.body);
        const { amount, payment_method } = req.body;
        const userId = req.session.user.id;
        if (!amount || !payment_method) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }
        console.log(`Processing payment of ${numAmount} using ${payment_method} for user ${userId}`);
        await connection_1.default.none(`
      UPDATE users 
      SET balance = COALESCE(balance, 0) + $1 
      WHERE id = $2
    `, [numAmount, userId]);
        await connection_1.default.none(`
      INSERT INTO fund_transactions (user_id, amount, transaction_type, status, payment_method, created_at)
      VALUES ($1, $2, 'deposit', 'completed', $3, NOW())
    `, [userId, numAmount, payment_method]);
        return res.json({ success: true, message: "Funds added successfully" });
    }
    catch (error) {
        console.error("Error adding funds:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
router.post("/withdraw", auth_1.isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = await connection_1.default.oneOrNone(`
      SELECT balance FROM users WHERE id = $1
    `, [userId]);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (!user.balance || user.balance <= 0) {
            return res.status(400).json({ success: false, message: "No funds available to withdraw" });
        }
        const withdrawAmount = parseFloat(user.balance);
        await connection_1.default.none(`
      UPDATE users 
      SET balance = 0 
      WHERE id = $1
    `, [userId]);
        await connection_1.default.none(`
      INSERT INTO fund_transactions (user_id, amount, transaction_type, status, created_at)
      VALUES ($1, $2, 'withdrawal', 'completed', NOW())
    `, [userId, withdrawAmount]);
        return res.json({
            success: true,
            message: `Successfully withdrew $${withdrawAmount.toFixed(2)}`,
            withdrawn_amount: withdrawAmount
        });
    }
    catch (error) {
        console.error("Error withdrawing funds:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
router.get("/balance", auth_1.isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const user = await connection_1.default.oneOrNone(`
      SELECT balance FROM users WHERE id = $1
    `, [userId]);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.json({
            success: true,
            balance: user.balance || 0
        });
    }
    catch (error) {
        console.error("Error fetching balance:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
router.get("/transactions", auth_1.isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const transactions = await connection_1.default.any(`
      SELECT id, amount, transaction_type, status, payment_method, created_at
      FROM fund_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);
        return res.json({
            success: true,
            transactions
        });
    }
    catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=funds.js.map