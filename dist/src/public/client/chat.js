"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
document.addEventListener('DOMContentLoaded', () => {
    console.log('Chat script loaded');
    const socket = window.gameSocket;
    if (!socket) {
        console.log('Socket not initialized yet, chat functionality will be limited');
        return;
    }
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    if (chatForm && chatInput && chatMessages) {
        console.log('Found chat elements, setting up chat');
        chatForm.addEventListener('submit', (e) => {
            var _a;
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message)
                return;
            console.log('Sending message:', message);
            chatInput.value = '';
            socket.emit('chat_message', {
                message: message,
                game_id: 'global'
            });
            const username = ((_a = document.querySelector('.dropdown-name')) === null || _a === void 0 ? void 0 : _a.textContent) || 'You';
            addMessageToChat({
                user_id: socket.auth.user_id,
                username: 'You',
                message: message,
                timestamp: new Date(),
                isSelf: true
            });
        });
        socket.on('chat_message', (data) => {
            console.log('Received chat message:', data);
            if (data.user_id === socket.auth.user_id)
                return;
            addMessageToChat({
                user_id: data.user_id,
                username: data.username,
                message: data.message,
                timestamp: data.timestamp,
                isSelf: false
            });
        });
    }
    else {
        console.log('Chat elements not found, skipping chat setup');
    }
});
function addMessageToChat(data) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages)
        return;
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${data.isSelf ? 'self' : ''}`;
    const time = new Date(data.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    messageEl.innerHTML = `
      <div class="message-avatar">${data.username.charAt(0).toUpperCase()}</div>
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
}
//# sourceMappingURL=chat.js.map