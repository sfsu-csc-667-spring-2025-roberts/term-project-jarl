// src/server/socket/games.ts
import { Socket } from 'socket.io';
import db from '../db/connection';

/**
 * Set up game socket handlers
 * @param socket Socket instance
 * @param userId User ID
 */
export function setupGamesHandlers(socket: Socket, userId: number): void {
  console.log(`Setting up games handlers for user ${userId}`);

  // Handle creating a new game
  socket.on('create_game', async (data: {
    name: string;
    maxPlayers: number;
    minBuyIn: number;
    private: boolean;
  }) => {
    try {
      console.log(`Create game request:`, data);

      // Validate game data
      if (!data.name || !data.maxPlayers || !data.minBuyIn) {
        socket.emit('game_error', {
          message: 'Invalid game data'
        });
        return;
      }

      // Create game in database
      const gameResult = await db.one(
        `INSERT INTO games (name, max_players, min_buy_in, private, created_by, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id`,
        [data.name, data.maxPlayers, data.minBuyIn, data.private, userId, 'waiting']
      );

      const gameId = gameResult.id;

      // Add creator as the first player at seat 1
      await db.none(
        `INSERT INTO game_players (game_id, user_id, seat, stack, status, joined_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [gameId, userId, 1, data.minBuyIn, 'active']
      );

      // Join socket room for this game
      socket.join(`game:${gameId}`);

      // Emit game created event
      socket.emit('game_created', {
        id: gameId,
        name: data.name,
        max_players: data.maxPlayers,
        min_buy_in: data.minBuyIn,
        private: data.private,
        created_by: userId,
        status: 'waiting',
        created_at: new Date().toISOString()
      });

      // Broadcast new game to lobby
      socket.broadcast.emit('new_game', {
        id: gameId,
        name: data.name,
        max_players: data.maxPlayers,
        min_buy_in: data.minBuyIn,
        private: data.private,
        created_by: userId,
        status: 'waiting',
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating game:', error);
      socket.emit('game_error', {
        message: 'Failed to create game'
      });
    }
  });

  // Handle joining a game
  socket.on('join_game', async (data: { gameId: number; buyIn?: number }) => {
    try {
      console.log(`User ${userId} is trying to join game ${data.gameId}`);

      // Check if game exists and is joinable
      const game = await db.oneOrNone(
        `SELECT * FROM games WHERE id = $1 AND status IN ('waiting', 'active')`,
        [data.gameId]
      );

      if (!game) {
        socket.emit('game_error', {
          message: 'Game not found or not joinable'
        });
        return;
      }

      // Check if user is already in the game
      const existingPlayer = await db.oneOrNone(
        `SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2`,
        [data.gameId, userId]
      );

      if (existingPlayer) {
        // User is rejoining an existing game
        socket.join(`game:${data.gameId}`);
        socket.emit('game_joined', {
          game_id: data.gameId,
          seat: existingPlayer.seat,
          stack: existingPlayer.stack,
          status: existingPlayer.status
        });
        console.log(`User ${userId} rejoined game ${data.gameId}`);
        return;
      }

      // Find an available seat
      const takenSeats = await db.manyOrNone(
        `SELECT seat FROM game_players WHERE game_id = $1`,
        [data.gameId]
      );

      const seatNumbers = takenSeats.map(seat => seat.seat);
      let nextSeat = 1;
      while (seatNumbers.includes(nextSeat) && nextSeat <= game.max_players) {
        nextSeat++;
      }

      if (nextSeat > game.max_players) {
        socket.emit('game_error', {
          message: 'Game is full'
        });
        return;
      }

      // Use provided buy-in or minimum buy-in
      const buyIn = data.buyIn || game.min_buy_in;

      // Check if user has enough balance
      const user = await db.oneOrNone(
        `SELECT balance FROM users WHERE id = $1`,
        [userId]
      );

      if (!user || user.balance < buyIn) {
        socket.emit('game_error', {
          message: 'Insufficient funds'
        });
        return;
      }

      // Add player to game
      await db.tx(async t => {
        // Update user balance
        await t.none(
          `UPDATE users SET balance = balance - $1 WHERE id = $2`,
          [buyIn, userId]
        );

        // Add player to game
        await t.none(
          `INSERT INTO game_players (game_id, user_id, seat, stack, status, joined_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [data.gameId, userId, nextSeat, buyIn, 'active']
        );
      });

      // Join socket room for this game
      socket.join(`game:${data.gameId}`);

      // Emit game joined event
      socket.emit('game_joined', {
        game_id: data.gameId,
        seat: nextSeat,
        stack: buyIn,
        status: 'active'
      });

      // Get user info
      const userInfo = await db.one(
        `SELECT username FROM users WHERE id = $1`,
        [userId]
      );

      // Broadcast new player to other players in the game
      socket.to(`game:${data.gameId}`).emit('player_joined', {
        user_id: userId,
        username: userInfo.username,
        seat: nextSeat,
        stack: buyIn,
        status: 'active'
      });

      console.log(`Added user ${userId} to game ${data.gameId} at seat ${nextSeat}`);
    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('game_error', {
        message: 'Failed to join game'
      });
    }
  });

  // Handle leaving a game
  socket.on('leave_game', async (gameId: number) => {
    try {
      console.log(`User ${userId} is trying to leave game ${gameId}`);

      // Check if user is in the game
      const player = await db.oneOrNone(
        `SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2`,
        [gameId, userId]
      );

      if (!player) {
        // Instead of throwing error, handle gracefully
        console.log(`User ${userId} tried to leave game ${gameId} but is not in it`);
        socket.emit('game_error', {
          message: 'You are not in this game'
        });
        
        // Still allow client to update its state
        socket.emit('game_left', {
          game_id: gameId,
          forced: true
        });
        
        return;
      }

      // Remove player from game and return funds
      await db.tx(async t => {
        // Return stack to user balance
        await t.none(
          `UPDATE users SET balance = balance + $1 WHERE id = $2`,
          [player.stack, userId]
        );

        // Remove player from game
        await t.none(
          `DELETE FROM game_players WHERE game_id = $1 AND user_id = $2`,
          [gameId, userId]
        );

        // Check if game is now empty
        const remainingPlayers = await t.oneOrNone(
          `SELECT COUNT(*) as count FROM game_players WHERE game_id = $1`,
          [gameId]
        );

        if (remainingPlayers.count === '0') {
          // Delete the game if no players remain
          await t.none(
            `UPDATE games SET status = 'closed' WHERE id = $1`,
            [gameId]
          );
        }
      });

      // Leave socket room
      socket.leave(`game:${gameId}`);

      // Emit leave game event
      socket.emit('game_left', {
        game_id: gameId,
        forced: false
      });

      // Broadcast player left event to other players
      socket.to(`game:${gameId}`).emit('player_left', {
        user_id: userId,
        game_id: gameId
      });

      console.log(`User ${userId} left game ${gameId}`);
    } catch (error) {
      console.error('Error leaving game:', error);
      socket.emit('game_error', {
        message: 'Failed to leave game'
      });
      
      // Even in case of error, let client update its state
      socket.emit('game_left', {
        game_id: gameId,
        forced: true,
        error: true
      });
    }
  });

  // Helper method to clean up user's game sessions on disconnect
  socket.on('disconnect', async () => {
    try {
      // Find all games the user is in
      const games = await db.manyOrNone(
        `SELECT game_id, stack FROM game_players WHERE user_id = $1`,
        [userId]
      );

      if (games.length === 0) {
        return;
      }

      // Process each game
      await db.tx(async t => {
        for (const game of games) {
          // Return stack to user balance
          await t.none(
            `UPDATE users SET balance = balance + $1 WHERE id = $2`,
            [game.stack, userId]
          );

          // Remove player from game
          await t.none(
            `DELETE FROM game_players WHERE game_id = $1 AND user_id = $2`,
            [game.game_id, userId]
          );

          // Check if game is now empty
          const remainingPlayers = await t.oneOrNone(
            `SELECT COUNT(*) as count FROM game_players WHERE game_id = $1`,
            [game.game_id]
          );

          if (remainingPlayers.count === '0') {
            // Delete the game if no players remain
            await t.none(
              `UPDATE games SET status = 'closed' WHERE id = $1`,
              [game.game_id]
            );
          }

          // Broadcast player left event to other players
          socket.to(`game:${game.game_id}`).emit('player_left', {
            user_id: userId,
            game_id: game.game_id,
            reason: 'disconnected'
          });
        }
      });

      console.log(`Cleaned up ${games.length} game sessions for disconnected user ${userId}`);
    } catch (error) {
      console.error(`Error cleaning up game sessions for user ${userId}:`, error);
    }
  });
}