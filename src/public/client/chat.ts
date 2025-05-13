// Set up chat functionality
document.addEventListener('DOMContentLoaded', () => {
    console.log('Chat script loaded');
    
    // Get socket from window
    const socket = (window as any).gameSocket;
    
    if (!socket) {
      console.log('Socket not initialized yet, chat functionality will be limited');
      return;
    }
    
    // Find chat elements
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const chatMessages = document.getElementById('chat-messages');
    
    // Set up chat if elements exist
    if (chatForm && chatInput && chatMessages) {
      console.log('Found chat elements, setting up chat');
      
      // Handle form submission
      chatForm.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        console.log('Sending message:', message);
        
        // Clear input
        chatInput.value = '';
        
        // Send message through socket
        socket.emit('chat_message', {
          message: message,
          game_id: 'global' // Use 'global' for global chat
        });
        
        // Add message to UI (optimistic update)
        // Get the current username from the page if possible
        const username = document.querySelector('.dropdown-name')?.textContent || 'You';
        
        addMessageToChat({
          user_id: socket.auth.user_id,
          username: 'You', // Show as "You" for the current user
          message: message,
          timestamp: new Date(),
          isSelf: true
        });
      });
      
      // Listen for incoming messages
      socket.on('chat_message', (data: any) => {
        console.log('Received chat message:', data);
        
        // Skip messages from the current user (already shown)
        if (data.user_id === socket.auth.user_id) return;
        
        // Add message to UI
        addMessageToChat({
          user_id: data.user_id,
          username: data.username,
          message: data.message,
          timestamp: data.timestamp,
          isSelf: false
        });
      });
    } else {
      console.log('Chat elements not found, skipping chat setup');
    }
  });
  
  // Function to add a message to the chat UI
  interface ChatMessageData {
    user_id: number;
    username: string;
    message: string;
    timestamp: Date;
    isSelf: boolean;
  }
  
  function addMessageToChat(data: ChatMessageData) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${data.isSelf ? 'self' : ''}`;
    
    // Format time
    const time = new Date(data.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Set message content
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
    
    // Add to chat container
    chatMessages.appendChild(messageEl);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  export {};