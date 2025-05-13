"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/public/client/chat/index.ts
const socket_1 = require("../socket");
document.addEventListener('DOMContentLoaded', () => {
    console.log('Chat module loaded');
    // Get the socket
    const socket = (0, socket_1.getSocket)();
    if (!socket) {
        console.log('Socket not initialized for chat');
        return;
    }
    // Find chat elements
    const chatForm = document.querySelector('#chat-form');
    const chatInput = document.querySelector('#chat-input');
    const chatMessages = document.querySelector('#chat-messages');
    // Get user ID from the page data attribute
    const userId = document.body.getAttribute('data-user-id');
    const userIdNum = userId ? parseInt(userId) : 0;
    // If chat elements exist, set up chat functionality
    if (chatForm && chatInput && chatMessages) {
        console.log('Chat elements found');
        // Handle chat form submission
        chatForm.addEventListener('submit', (event) => {
            event.preventDefault();
            // Get the message
            const message = chatInput.value.trim();
            if (!message)
                return;
            // Clear input
            chatInput.value = '';
            // Send message to server
            socket.emit('chat_message', {
                message: message,
                game_id: 'global'
            });
            console.log('Message sent:', message);
        });
        // Listen for chat messages from server
        socket.on('chat_message', (data) => {
            console.log('Message received:', data);
            // Skip if message is from current user (already displayed)
            if (data.user_id === userIdNum)
                return;
            // Get username initial
            const initial = data.username.charAt(0).toUpperCase();
            // Format timestamp
            const time = new Date(data.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
            // Create message element
            const messageEl = document.createElement('div');
            messageEl.className = 'chat-message';
            // Set innerHTML (customize based on your chat UI)
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
            // Add to chat container
            chatMessages.appendChild(messageEl);
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }
    else {
        console.log('Chat elements not found');
    }
});
