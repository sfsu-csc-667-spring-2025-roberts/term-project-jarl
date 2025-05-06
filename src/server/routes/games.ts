// src/server/routes/games.ts
import express from "express";
import { Request, Response } from "express";
import db from "../db/connection";
import GameModel from "../db/models/game";
import { isAuthenticated } from "../middleware/auth";

const router = express.Router();
const gameModel = new GameModel(db);

// Get all active games
router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const games = await gameModel.getActiveGames();
    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Create a new game
router.post('/create', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { name, minPlayers, maxPlayers, password } = req.body;
    // Type assertion for session
    const session = req.session as any;
    const userId = session.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!name) {
      return res.status(400).json({ error: 'Game name is required' });
    }
    
    // Create the game
    const game = await gameModel.create(
      name,
      parseInt(minPlayers || '2', 10),
      parseInt(maxPlayers || '6', 10),
      password
    );
    
    // Convert userId to number if it's a string
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Join the creator to the game as host
    await gameModel.joinGame(game.game_id, userIdNum, true);
    
    // Notify clients via socket if needed
    const io = req.app.get('io');
    if (io) {
      io.emit('game:created', {
        gameId: game.game_id,
        name: game.name,
        minPlayers: game.min_players,
        maxPlayers: game.max_players,
        hasPassword: !!game.password,
        createdBy: userId
      });
    }
    
    res.status(201).json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Start a game
router.post('/:gameId/start', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    // Type assertion for session
    const session = req.session as any;
    const userId = session.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }
    
    // Convert userId to number if it's a string
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Check if the game exists and if the user is the host
    const game = await gameModel.findById(parseInt(gameId, 10));
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Check if the player is in the game and is host
    const players = await gameModel.getGamePlayers(parseInt(gameId, 10));
    const player = players.find((p: any) => p.user_id === userIdNum);
    
    if (!player) {
      return res.status(403).json({ error: 'You are not in this game' });
    }
    
    if (!player.is_host) {
      return res.status(403).json({ error: 'Only the host can start the game' });
    }
    
    // Check if enough players
    if (players.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 players to start the game' });
    }
    
    // Update the game state
    await db.none(`
      UPDATE games 
      SET is_started = true, 
          round = 'pre-flop', 
          current_turn = $1,
          start_time = CURRENT_TIMESTAMP
      WHERE game_id = $2
    `, [players[0].user_id, parseInt(gameId, 10)]);
    
    // Emit socket event to notify all players
    const io = req.app.get('io');
    if (io) {
      io.to(`game-${gameId}`).emit('game:started', {
        gameId,
        startedBy: userId
      });
    }
    
    res.json({ success: true, message: 'Game started successfully' });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Join a game
router.post('/:gameId/join', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { password } = req.body;
    // Type assertion for session
    const session = req.session as any;
    const userId = session.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }
    
    const gameIdNum = parseInt(gameId, 10);
    // Convert userId to number if it's a string
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Attempt to join the game
    const playerCount = await gameModel.conditionalJoin(gameIdNum, userIdNum, password || '');
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`game-${gameId}`).emit('player:joined', {
        gameId,
        playerId: userId,
        playerCount
      });
    }
    
    res.json({ success: true, playerCount });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Failed to join game. Check if the game is full, already started, or if you need a password.' });
  }
});

// Leave a game
router.post('/:gameId/leave', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    // Type assertion for session
    const session = req.session as any;
    const userId = session.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }
    
    const gameIdNum = parseInt(gameId, 10);
    // Convert userId to number if it's a string
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Check if the game exists
    const game = await gameModel.findById(gameIdNum);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Check if the game has started
    if (game.is_started) {
      return res.status(400).json({ error: 'Cannot leave a game that has already started' });
    }
    
    // Check if the player is in the game
    const players = await gameModel.getGamePlayers(gameIdNum);
    const player = players.find((p: any) => p.user_id === userIdNum);
    
    if (!player) {
      return res.status(400).json({ error: 'You are not in this game' });
    }
    
    // If the player is the host, delete the game
    if (player.is_host) {
      await db.none('UPDATE games SET is_active = false WHERE game_id = $1', [gameIdNum]);
      
      // Notify all players
      const io = req.app.get('io');
      if (io) {
        io.to(`game-${gameId}`).emit('game:deleted', {
          gameId,
          reason: 'Host left the game'
        });
      }
      
      res.json({ success: true, message: 'Game deleted successfully' });
    } else {
      // Just remove the player
      await db.none('DELETE FROM game_players WHERE game_id = $1 AND user_id = $2', [gameIdNum, userIdNum]);
      
      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(`game-${gameId}`).emit('player:left', {
          gameId,
          playerId: userId
        });
      }
      
      res.json({ success: true, message: 'Left the game successfully' });
    }
  } catch (error) {
    console.error('Error leaving game:', error);
    res.status(500).json({ error: 'Failed to leave game' });
  }
});

// Get a specific game
router.get('/:gameId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }
    
    const gameIdNum = parseInt(gameId, 10);
    
    // Get the game details
    const game = await gameModel.findById(gameIdNum);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Get the players in the game
    const players = await gameModel.getGamePlayers(gameIdNum);
    
    // Add players to the game object
    const gameWithPlayers = {
      ...game,
      players
    };
    
    res.json(gameWithPlayers);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

export default router;