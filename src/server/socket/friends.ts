// src/server/socket/friends.ts
import { Socket } from 'socket.io';
import db from '../db/connection';

/**
 * Set up friends socket handlers
 * @param socket Socket instance
 * @param userId User ID
 */
export function setupFriendsHandlers(socket: Socket, userId: number): void {
  console.log(`Setting up friends handlers for user ${userId}`);

  // Handle friend request
  socket.on('friend_request', async (targetUserId: number) => {
    try {
      if (targetUserId === userId) {
        socket.emit('friend_error', {
          message: 'You cannot add yourself as a friend'
        });
        return;
      }

      // Check if target user exists
      const targetUser = await db.oneOrNone(
        'SELECT id, username FROM users WHERE id = $1',
        [targetUserId]
      );

      if (!targetUser) {
        socket.emit('friend_error', {
          message: 'User not found'
        });
        return;
      }

      // Check if friend request already exists
      const existingRequest = await db.oneOrNone(
        `SELECT * FROM user_friends 
         WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
        [userId, targetUserId]
      );

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          if (existingRequest.user_id === userId) {
            socket.emit('friend_error', {
              message: 'Friend request already sent'
            });
          } else {
            socket.emit('friend_error', {
              message: 'This user has already sent you a friend request'
            });
          }
        } else if (existingRequest.status === 'accepted') {
          socket.emit('friend_error', {
            message: 'You are already friends with this user'
          });
        }
        return;
      }

      // Create friend request
      await db.none(
        `INSERT INTO user_friends (user_id, friend_id, status, created_at)
         VALUES ($1, $2, 'pending', NOW())`,
        [userId, targetUserId]
      );

      // Get sender's username
      const sender = await db.one(
        'SELECT username FROM users WHERE id = $1',
        [userId]
      );

      socket.emit('friend_request_sent', {
        friend_id: targetUserId,
        username: targetUser.username
      });

      // Notify target user if they are online
      // This requires maintaining a list of online users and their socket IDs
      // For simplicity, we'll emit to all clients and let the client filter
      socket.broadcast.emit('friend_request_received', {
        user_id: userId,
        username: sender.username,
        target_user_id: targetUserId
      });

    } catch (error) {
      console.error('Error sending friend request:', error);
      socket.emit('friend_error', {
        message: 'Failed to send friend request'
      });
    }
  });

  // Handle accepting friend request
  socket.on('accept_friend_request', async (friendUserId: number) => {
    try {
      // Check if friend request exists
      const friendRequest = await db.oneOrNone(
        `SELECT * FROM user_friends 
         WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'`,
        [friendUserId, userId]
      );

      if (!friendRequest) {
        socket.emit('friend_error', {
          message: 'Friend request not found'
        });
        return;
      }

      // Accept friend request
      await db.none(
        `UPDATE user_friends 
         SET status = 'accepted', updated_at = NOW()
         WHERE user_id = $1 AND friend_id = $2`,
        [friendUserId, userId]
      );

      // Get usernames
      const users = await db.manyOrNone(
        'SELECT id, username FROM users WHERE id IN ($1, $2)',
        [userId, friendUserId]
      );

      const friendUsername = users.find(u => u.id === friendUserId)?.username || 'Unknown User';
      const myUsername = users.find(u => u.id === userId)?.username || 'Unknown User';

      socket.emit('friend_request_accepted', {
        user_id: friendUserId,
        username: friendUsername
      });

      // Notify the other user if they are online
      socket.broadcast.emit('friend_request_accepted_notification', {
        user_id: userId,
        username: myUsername,
        target_user_id: friendUserId
      });

    } catch (error) {
      console.error('Error accepting friend request:', error);
      socket.emit('friend_error', {
        message: 'Failed to accept friend request'
      });
    }
  });

  // Handle rejecting friend request
  socket.on('reject_friend_request', async (friendUserId: number) => {
    try {
      // Delete friend request
      await db.none(
        `DELETE FROM user_friends 
         WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'`,
        [friendUserId, userId]
      );

      socket.emit('friend_request_rejected', {
        user_id: friendUserId
      });

    } catch (error) {
      console.error('Error rejecting friend request:', error);
      socket.emit('friend_error', {
        message: 'Failed to reject friend request'
      });
    }
  });

  // Handle removing friend
  socket.on('remove_friend', async (friendUserId: number) => {
    try {
      // Delete friendship
      await db.none(
        `DELETE FROM user_friends 
         WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
        [userId, friendUserId]
      );

      socket.emit('friend_removed', {
        user_id: friendUserId
      });

      // Notify the other user if they are online
      socket.broadcast.emit('friend_removed_notification', {
        user_id: userId,
        target_user_id: friendUserId
      });

    } catch (error) {
      console.error('Error removing friend:', error);
      socket.emit('friend_error', {
        message: 'Failed to remove friend'
      });
    }
  });

  // Handle getting friend list
  socket.on('get_friends', async () => {
    try {
      const friends = await db.manyOrNone(
        `SELECT u.id, u.username, uf.status, uf.created_at
         FROM user_friends uf
         JOIN users u ON (uf.user_id = u.id OR uf.friend_id = u.id)
         WHERE (uf.user_id = $1 OR uf.friend_id = $1) 
         AND u.id != $1
         ORDER BY uf.status, u.username`,
        [userId]
      );

      socket.emit('friends_list', {
        friends
      });

    } catch (error) {
      console.error('Error getting friends list:', error);
      socket.emit('friend_error', {
        message: 'Failed to get friends list'
      });
    }
  });
}