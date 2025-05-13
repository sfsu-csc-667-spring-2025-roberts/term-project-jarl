"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_1 = require("../socket");
document.addEventListener('DOMContentLoaded', () => {
    console.log('Chat module loaded');
    const socket = (0, socket_1.getSocket)();
    if (!socket) {
        console.log('Socket not initialized for chat');
        return;
    }
    const chatForm = document.querySelector('#chat-form');
    const chatInput = document.querySelector('#chat-input');
    const chatMessages = document.querySelector('#chat-messages');
    const userId = document.body.getAttribute('data-user-id');
    const userIdNum = userId ? parseInt(userId) : 0;
    if (chatForm && chatInput && chatMessages) {
        console.log('Chat elements found');
        chatForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const message = chatInput.value.trim();
            if (!message)
                return;
            chatInput.value = '';
            socket.emit('chat_message', {
                message: message,
                game_id: 'global'
            });
            console.log('Message sent:', message);
        });
        socket.on('chat_message', (data) => {
            console.log('Message received:', data);
            if (data.user_id === userIdNum)
                return;
            const initial = data.username.charAt(0).toUpperCase();
            const time = new Date(data.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
            const messageEl = document.createElement('div');
            messageEl.className = 'chat-message';
            messageEl.innerHTML = `
        <div class="message-avatar">${initial}</div>
        <div class="message-content">
          <div class="message-info">
            <span class="message-sender">${data.username}</span>
            <span class="message-time">${time}</span>
          </div>
          <div class="message-text">${data.message}</div>
        </div>
      `;
            chatMessages.appendChild(messageEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }
    else {
        console.log('Chat elements not found');
    }
});
//# sourceMappingURL=index.js.map