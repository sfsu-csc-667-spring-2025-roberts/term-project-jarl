// src/server/routes/lobby.ts
import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import db from '../db/connection';
import 'express-session';

const router = express.Router();

// GET lobby page
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Redirect to sign-in if not authenticated
    if (!req.session.user || !req.session.user.id) {
      return res.redirect('/auth/signin');
    }

    // Get active games
    const games = await db.any(`
      SELECT * FROM games WHERE current_players < max_players
      ORDER BY created_at DESC
    `);

    // Get friends (if you implement this feature later)
    // For now, providing an empty array to prevent template errors
    const friends = [];

    // You may implement actual friends functionality like this:
    // const friends = await db.any(`
    //   SELECT u.id, u.username, 
    //     CASE WHEN u.last_login > NOW() - INTERVAL '15 minutes' THEN true ELSE false END as online,
    //     g.id as current_game
    //   FROM users u
    //   JOIN user_friends uf ON u.id = uf.friend_id
    //   LEFT JOIN game_players gp ON u.id = gp.user_id
    //   LEFT JOIN games g ON gp.game_id = g.id AND g.state = 'ACTIVE'
    //   WHERE uf.user_id = $1 AND uf.status = 'accepted'
    //   ORDER BY online DESC, u.username ASC
    // `, [req.session.user.id]);

    res.render('lobby', {
      user: req.session.user,
      games,
      friends // Pass empty friends array to prevent template error
    });
  } catch (error) {
    console.error('Error getting lobby data:', error);
    res.status(500).render('error', { message: 'Server error' });
  }
});

export default router;