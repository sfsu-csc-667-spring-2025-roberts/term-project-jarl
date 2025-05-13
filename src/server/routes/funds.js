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
Object.defineProperty(exports, "__esModule", { value: true });

// Fix express import - use require instead of import
const express = require("express");
const auth_1 = require("../middleware/auth");
const connection_1 = require("../db/connection");

const router = express.Router();

// Get balance
router.get('/balance', auth_1.isAuthenticated, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.session.user.id;
            const result = yield connection_1.default.oneOrNone('SELECT balance FROM users WHERE id = $1', [userId]);
            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            res.json({
                success: true,
                balance: result.balance || 0
            });
        }
        catch (error) {
            console.error('Error fetching balance:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching balance'
            });
        }
    });
});

// Add funds
router.post('/add', auth_1.isAuthenticated, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { amount, payment_method } = req.body;
            const userId = req.session.user.id;
            // Validate input
            if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid amount'
                });
            }
            console.log('Received add funds request:', req.body);
            console.log('Processing payment of', amount, 'using', payment_method, 'for user', userId);
            // Start a transaction
            yield connection_1.default.tx((t) => __awaiter(this, void 0, void 0, function* () {
                // Update user balance
                yield t.none(`
        UPDATE users 
        SET balance = COALESCE(balance, 0) + $1 
        WHERE id = $2
        `, [amount, userId]);
                // Record the transaction using 'type' column (not 'transaction_type')
                yield t.none(`
        INSERT INTO fund_transactions (user_id, amount, type, status, payment_method, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        `, [userId, amount, 'deposit', 'completed', payment_method]);
            }));
            // Get updated balance
            const result = yield connection_1.default.one('SELECT balance FROM users WHERE id = $1', [userId]);
            res.json({
                success: true,
                message: 'Funds added successfully',
                balance: result.balance
            });
        }
        catch (error) {
            console.error('Error adding funds:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    });
});

// Withdraw funds
router.post('/withdraw', auth_1.isAuthenticated, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { amount } = req.body || { amount: null };
            const userId = req.session.user.id;
            // Get current balance
            const user = yield connection_1.default.oneOrNone('SELECT balance FROM users WHERE id = $1', [userId]);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            // If no amount specified, withdraw all
            const withdrawAmount = amount || user.balance;
            // Validate input
            if (isNaN(parseFloat(withdrawAmount)) || parseFloat(withdrawAmount) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid amount'
                });
            }
            // Check if user has enough funds
            if (parseFloat(withdrawAmount) > parseFloat(user.balance)) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient funds'
                });
            }
            // Start a transaction
            yield connection_1.default.tx((t) => __awaiter(this, void 0, void 0, function* () {
                // Update user balance
                yield t.none(`
        UPDATE users 
        SET balance = balance - $1 
        WHERE id = $2
        `, [withdrawAmount, userId]);
                // Record the transaction using 'type' column (not 'transaction_type')
                yield t.none(`
        INSERT INTO fund_transactions (user_id, amount, type, status, payment_method, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        `, [userId, withdrawAmount, 'withdrawal', 'completed', 'account']);
            }));
            // Get updated balance
            const result = yield connection_1.default.one('SELECT balance FROM users WHERE id = $1', [userId]);
            res.json({
                success: true,
                message: 'Funds withdrawn successfully',
                amount: withdrawAmount,
                balance: result.balance
            });
        }
        catch (error) {
            console.error('Error withdrawing funds:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    });
});

// Get transaction history
router.get('/transactions', auth_1.isAuthenticated, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.session.user.id;
            const transactions = yield connection_1.default.any(`
      SELECT id, amount, type, status, payment_method, created_at
      FROM fund_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
      `, [userId]);
            res.json({
                success: true,
                transactions
            });
        }
        catch (error) {
            console.error('Error fetching transactions:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    });
});

exports.default = router;