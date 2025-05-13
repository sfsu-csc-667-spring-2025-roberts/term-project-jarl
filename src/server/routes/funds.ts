// src/server/routes/funds.ts
import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import db from '../db/connection';

const router = express.Router();

// Get balance
router.get('/balance', isAuthenticated, async (req, res) => {
  try {
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const userId = req.session.user.id;
    
    const result = await db.oneOrNone(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );
    
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
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching balance'
    });
  }
});

// Add funds
router.post('/add', isAuthenticated, async (req, res) => {
  try {
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { amount, payment_method } = req.body;
    const userId = req.session.user.id;
    
    // Validate input
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    if (!payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }
    
    console.log('Received add funds request:', req.body);
    console.log('Processing payment of', amount, 'using', payment_method, 'for user', userId);
    
    // Start a transaction
    await db.tx(async t => {
      // Update user balance
      await t.none(
        `
        UPDATE users 
        SET balance = COALESCE(balance, 0) + $1 
        WHERE id = $2
        `,
        [amount, userId]
      );
      
      // Record the transaction
      await t.none(
        `
        INSERT INTO fund_transactions (user_id, amount, type, status, payment_method, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        `,
        [userId, amount, 'deposit', 'completed', payment_method]
      );
    });
    
    // Get updated balance
    const result = await db.one(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Funds added successfully',
      balance: result.balance
    });
  } catch (error) {
    console.error('Error adding funds:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Withdraw funds
router.post('/withdraw', isAuthenticated, async (req, res) => {
  try {
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { amount } = req.body || { amount: null };
    const userId = req.session.user.id;
    
    // Get current balance
    const user = await db.oneOrNone(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );
    
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
    await db.tx(async t => {
      // Update user balance
      await t.none(
        `
        UPDATE users 
        SET balance = balance - $1 
        WHERE id = $2
        `,
        [withdrawAmount, userId]
      );
      
      // Record the transaction
      await t.none(
        `
        INSERT INTO fund_transactions (user_id, amount, type, status, payment_method, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        `,
        [userId, withdrawAmount, 'withdrawal', 'completed', 'account']
      );
    });
    
    // Get updated balance
    const result = await db.one(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Funds withdrawn successfully',
      amount: withdrawAmount,
      balance: result.balance
    });
  } catch (error) {
    console.error('Error withdrawing funds:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get transaction history
router.get('/transactions', isAuthenticated, async (req, res) => {
  try {
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const userId = req.session.user.id;
    
    const transactions = await db.any(
      `
      SELECT id, amount, type, status, payment_method, created_at
      FROM fund_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [userId]
    );
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;