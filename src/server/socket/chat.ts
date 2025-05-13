// src/server/socket/chat.ts
import { Socket } from 'socket.io';
import db from '../db/connection';

/**
 * Set up chat socket handlers
 * @param socket Socket instance
 * @param userId User ID
 */
export function setupChatHandlers(socket: Socket, userId: number): void {
  console.log(`Setting up chat handlers for user ${userId}`);

  // Join global chat room
  socket.join('global');
  console.log(`User ${userId} joined global chat room`);

  // Handle chat messages
  socket.on('chat_message', async (data: { message: string; game_id: string }) => {
    try {
      if (!data || !data.message || !data.game_id) {
        console.error('Invalid chat message data:', data);
        return;
      }

      console.log(`Chat message from user ${userId}:`, data);

      // Store message in database
      const result = await db.one(
        `INSERT INTO messages (user_id, content, room_id, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id`,
        [userId, data.message, data.game_id]
      );

      console.log(`Message stored with ID ${result.id}`);

      // Get user information
      const user = await db.oneOrNone(
        'SELECT username FROM users WHERE id = $1',
        [userId]
      );

      // Emit message to all users in the room
      socket.to(data.game_id).emit('chat_message', {
        id: result.id,
        user_id: userId,
        username: user ? user.username : 'Unknown User',
        message: data.message,
        room_id: data.game_id,
        timestamp: new Date().toISOString()
      });

      // Also emit to sender for consistency
      socket.emit('chat_message', {
        id: result.id,
        user_id: userId,
        username: user ? user.username : 'Unknown User',
        message: data.message,
        room_id: data.game_id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error handling chat message:', error);
    }
  });

  // Handle joining game-specific chat rooms
  socket.on('join_game_chat', (gameId: string) => {
    socket.join(`game:${gameId}`);
    console.log(`User ${userId} joined chat room for game ${gameId}`);
  });

  // Handle leaving game-specific chat rooms
  socket.on('leave_game_chat', (gameId: string) => {
    socket.leave(`game:${gameId}`);
    console.log(`User ${userId} left chat room for game ${gameId}`);
  });
}