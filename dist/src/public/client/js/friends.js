"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
document.addEventListener('DOMContentLoaded', function () {
    const userId = window.utils.getUserId();
    const socket = (0, socket_io_client_1.io)({
        auth: {
            user_id: userId
        }
    });
    const addFriendBtn = document.getElementById('add-friend-btn');
    if (addFriendBtn) {
        addFriendBtn.addEventListener('click', async () => {
            const friendName = prompt('Enter friend\'s username:');
            if (!friendName)
                return;
            try {
                const response = await fetch('/friends/request', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        friend_username: friendName
                    })
                });
                const result = await response.json();
                if (result.success) {
                    window.utils.showNotification('Friend request sent!', 'success');
                }
                else {
                    window.utils.showNotification(result.message || 'Failed to send friend request', 'danger');
                }
            }
            catch (error) {
                console.error('Error sending friend request:', error);
                window.utils.showNotification('Error sending friend request', 'danger');
            }
        });
    }
    document.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.classList.contains('accept-friend-btn')) {
            const requestId = target.dataset.requestId;
            if (!requestId)
                return;
            try {
                const response = await fetch('/friends/respond', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        request_id: requestId,
                        accepted: true
                    })
                });
                const result = await response.json();
                if (result.success) {
                    window.utils.showNotification('Friend request accepted!', 'success');
                    window.location.reload();
                }
                else {
                    window.utils.showNotification(result.message || 'Failed to accept friend request', 'danger');
                }
            }
            catch (error) {
                console.error('Error accepting friend request:', error);
                window.utils.showNotification('Error accepting friend request', 'danger');
            }
        }
        if (target.classList.contains('reject-friend-btn')) {
            const requestId = target.dataset.requestId;
            if (!requestId)
                return;
            try {
                const response = await fetch('/friends/respond', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        request_id: requestId,
                        accepted: false
                    })
                });
                const result = await response.json();
                if (result.success) {
                    window.utils.showNotification('Friend request rejected', 'info');
                    window.location.reload();
                }
                else {
                    window.utils.showNotification(result.message || 'Failed to reject friend request', 'danger');
                }
            }
            catch (error) {
                console.error('Error rejecting friend request:', error);
                window.utils.showNotification('Error rejecting friend request', 'danger');
            }
        }
    });
    socket.on('friend_request_received', (data) => {
        console.log('Friend request received:', data);
        window.utils.showNotification(`Friend request from ${data.sender_name}`, 'info');
        addFriendRequestToUI(data);
    });
    socket.on('friend_request_accepted', (data) => {
        console.log('Friend request accepted:', data);
        window.utils.showNotification(`${data.friend_name} accepted your friend request!`, 'success');
        addFriendToList(data.friend);
    });
    socket.on('friend_online', (data) => {
        console.log('Friend came online:', data);
        updateFriendStatus(data.friend_id, true);
    });
    socket.on('friend_offline', (data) => {
        console.log('Friend went offline:', data);
        updateFriendStatus(data.friend_id, false);
    });
    function addFriendRequestToUI(request) {
        const friendRequestsContainer = document.getElementById('friend-requests');
        if (!friendRequestsContainer)
            return;
        const requestDiv = document.createElement('div');
        requestDiv.className = 'friend-request-item mb-2';
        requestDiv.innerHTML = `
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <strong>${request.sender_name}</strong> wants to be your friend
        </div>
        <div>
          <button class="btn btn-sm btn-success accept-friend-btn me-1" data-request-id="${request.id}">
            Accept
          </button>
          <button class="btn btn-sm btn-danger reject-friend-btn" data-request-id="${request.id}">
            Reject
          </button>
        </div>
      </div>
    `;
        friendRequestsContainer.appendChild(requestDiv);
    }
    function addFriendToList(friend) {
        const friendsList = document.querySelector('.friends-list');
        if (!friendsList)
            return;
        const friendDiv = document.createElement('div');
        friendDiv.className = 'friend-item d-flex align-items-center mb-2 p-2 border-bottom';
        friendDiv.id = `friend-${friend.id}`;
        friendDiv.innerHTML = `
      <div class="friend-avatar ${friend.online ? 'bg-success' : 'bg-secondary'} text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 40px; height: 40px;">
        ${friend.username.charAt(0).toUpperCase()}
      </div>
      <div class="friend-info flex-grow-1">
        <div class="friend-name">${friend.username}</div>
        <small class="friend-status text-muted">
          ${friend.online ? 'Online' : 'Offline'}
        </small>
      </div>
    `;
        friendsList.appendChild(friendDiv);
    }
    function updateFriendStatus(friendId, isOnline) {
        const friendElement = document.getElementById(`friend-${friendId}`);
        if (!friendElement)
            return;
        const avatar = friendElement.querySelector('.friend-avatar');
        const status = friendElement.querySelector('.friend-status');
        if (!avatar || !status)
            return;
        if (isOnline) {
            avatar.classList.remove('bg-secondary');
            avatar.classList.add('bg-success');
            status.textContent = 'Online';
        }
        else {
            avatar.classList.remove('bg-success');
            avatar.classList.add('bg-secondary');
            status.textContent = 'Offline';
        }
    }
});
//# sourceMappingURL=friends.js.map