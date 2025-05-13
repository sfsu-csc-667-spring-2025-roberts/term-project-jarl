// src/server/routes/chat.ts
import express from 'express';
import { ChatMessage } from '../types/express-session';
import { isAuthenticated } from '../middleware/auth';
import db from '../db/connection';

const router = express.Router();

// Get global chat messages
router.get('/global', isAuthenticated, async (req, res) => {
  try {
    const messages = await db.any(`
      SELECT 
        cm.id, 
        cm.sender_id, 
        u.username as sender_username, 
        cm.game_id, 
        cm.message, 
        cm.created_at
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.game_id = 'global'
      ORDER BY cm.created_at DESC
      LIMIT 50
    `);
    
    // Reverse to show oldest first
    messages.reverse();
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get game chat messages
router.get('/game/:gameId', isAuthenticated, async (req, res) => {
  try {
    const gameId = req.params.gameId;
    
    // Validate if user is in the game
    const isInGame = await db.oneOrNone(`
      SELECT 1 FROM game_players 
      WHERE game_id = $1 AND user_id = $2
    `, [gameId, req.session.user.id]);
    
    if (!isInGame) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this game chat'
      });
    }
    
    const messages = await db.any(`
      SELECT 
        cm.id, 
        cm.sender_id, 
        u.username as sender_username, 
        cm.game_id, 
        cm.message, 
        cm.created_at
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.game_id = $1
      ORDER BY cm.created_at DESC
      LIMIT 50
    `, [gameId]);
    
    // Reverse to show oldest first
    messages.reverse();
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching game chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;