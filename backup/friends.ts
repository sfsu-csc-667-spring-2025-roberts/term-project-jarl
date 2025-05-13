// src/public/client/js/friends.ts

import { getSocket } from '../socket/index';

// Initialize socket when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get user ID from the body data attribute
  const userId = document.body.dataset.userId || '0';
  
  // Initialize socket connection
  const socket: any = getSocket();
  
  // Socket connection event handlers
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });
  
  socket.on('disconnect', (reason: string) => {
    console.log('Socket disconnected:', reason);
  });
  
  // Friend request functionality
  const addFriendForm = document.getElementById('add-friend-form') as HTMLFormElement;
  if (addFriendForm) {
    addFriendForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target as HTMLFormElement);
      const username = formData.get('username') as string;
      
      if (!username) {
        alert('Please enter a username');
        return;
      }
      
      try {
        const response = await fetch('/friends/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username })
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('Friend request sent!');
          (e.target as HTMLFormElement).reset();
        } else {
          alert(result.message || 'Failed to send friend request');
        }
      } catch (error) {
        console.error('Error sending friend request:', error);
        alert('Error sending friend request. Please try again.');
      }
    });
  }
  
  // Accept friend request
  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    
    if (target.classList.contains('accept-friend-btn')) {
      e.preventDefault();
      const friendId = target.dataset.friendId;
      
      if (!friendId) return;
      
      try {
        const response = await fetch('/friends/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ friendId: parseInt(friendId) })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Remove the request from pending list
          const requestElement = target.closest('.friend-request');
          if (requestElement) {
            requestElement.remove();
          }
          // Reload to update friends list
          window.location.reload();
        } else {
          alert(result.message || 'Failed to accept friend request');
        }
      } catch (error) {
        console.error('Error accepting friend request:', error);
        alert('Error accepting friend request. Please try again.');
      }
    }
    
    // Reject friend request
    if (target.classList.contains('reject-friend-btn')) {
      e.preventDefault();
      const friendId = target.dataset.friendId;
      
      if (!friendId) return;
      
      try {
        const response = await fetch('/friends/reject', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ friendId: parseInt(friendId) })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Remove the request from pending list
          const requestElement = target.closest('.friend-request');
          if (requestElement) {
            requestElement.remove();
          }
        } else {
          alert(result.message || 'Failed to reject friend request');
        }
      } catch (error) {
        console.error('Error rejecting friend request:', error);
        alert('Error rejecting friend request. Please try again.');
      }
    }
    
    // Remove friend
    if (target.classList.contains('remove-friend-btn')) {
      e.preventDefault();
      
      if (!confirm('Are you sure you want to remove this friend?')) {
        return;
      }
      
      const friendId = target.dataset.friendId;
      
      if (!friendId) return;
      
      try {
        const response = await fetch('/friends/remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ friendId: parseInt(friendId) })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Remove the friend from the list
          const friendElement = target.closest('.friend-item');
          if (friendElement) {
            friendElement.remove();
          }
        } else {
          alert(result.message || 'Failed to remove friend');
        }
      } catch (error) {
        console.error('Error removing friend:', error);
        alert('Error removing friend. Please try again.');
      }
    }
  });
  
  // Listen for friend-related socket events
  socket.on('friend_request_received', (data: any) => {
    console.log('Friend request received:', data);
    // Update UI to show new friend request
    const pendingRequestsContainer = document.querySelector('.pending-requests');
    if (pendingRequestsContainer) {
      const requestElement = document.createElement('div');
      requestElement.className = 'friend-request mb-2 p-2 border rounded';
      requestElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <span>${data.username} wants to be your friend</span>
          <div>
            <button class="btn btn-sm btn-success accept-friend-btn me-2" 
                    data-friend-id="${data.friend_id}">
              Accept
            </button>
            <button class="btn btn-sm btn-danger reject-friend-btn" 
                    data-friend-id="${data.friend_id}">
              Reject
            </button>
          </div>
        </div>
      `;
      pendingRequestsContainer.appendChild(requestElement);
    }
  });
  
  socket.on('friend_request_accepted', (data: any) => {
    console.log('Friend request accepted:', data);
    // Update UI to show accepted friend
    // Reload the page or add the friend to the friends list
    window.location.reload();
  });
  
  socket.on('friend_removed', (data: any) => {
    console.log('Friend removed:', data);
    // Remove friend from the list
    const friendElement = document.querySelector(`[data-friend-id="${data.friend_id}"]`);
    if (friendElement) {
      friendElement.closest('.friend-item')?.remove();
    }
  });
  
  socket.on('friend_online', (data: any) => {
    console.log('Friend came online:', data);
    // Update friend status to online
    const friendElement = document.querySelector(`[data-friend-id="${data.friend_id}"]`);
    if (friendElement) {
      const statusIndicator = friendElement.querySelector('.status-indicator');
      if (statusIndicator) {
        statusIndicator.classList.remove('bg-secondary');
        statusIndicator.classList.add('bg-success');
      }
      const statusText = friendElement.querySelector('.friend-status');
      if (statusText) {
        statusText.textContent = 'Online';
      }
    }
  });
  
  socket.on('friend_offline', (data: any) => {
    console.log('Friend went offline:', data);
    // Update friend status to offline
    const friendElement = document.querySelector(`[data-friend-id="${data.friend_id}"]`);
    if (friendElement) {
      const statusIndicator = friendElement.querySelector('.status-indicator');
      if (statusIndicator) {
        statusIndicator.classList.remove('bg-success');
        statusIndicator.classList.add('bg-secondary');
      }
      const statusText = friendElement.querySelector('.friend-status');
      if (statusText) {
        statusText.textContent = 'Offline';
      }
    }
  });
});