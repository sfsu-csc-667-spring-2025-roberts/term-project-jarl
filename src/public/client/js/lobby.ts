// src/public/client/js/lobby.ts

// Bootstrap types
interface BootstrapModal {
  show(): void;
  hide(): void;
  toggle(): void;
  dispose(): void;
}

interface BootstrapStatic {
  Modal: {
    new(element: Element, options?: any): BootstrapModal;
    getInstance(element: Element): BootstrapModal | null;
  };
}

declare const bootstrap: BootstrapStatic;

class Lobby {
  private socket: any;
  private initialized = false;
  private processingRequest = false;
  private modals: {[key: string]: BootstrapModal} = {};

  constructor(socket: any) {
    this.socket = socket;
  }

  init() {
    if (this.initialized) {
      console.log('Lobby already initialized');
      return;
    }

    console.log('Initializing lobby functionality...');
    this.initialized = true;

    // Initialize modals first
    this.initializeModals();
    this.setupButtons();
    this.setupForms();
    this.setupSocketListeners();
  }

  private initializeModals() {
    try {
      // Initialize Bootstrap modals
      const modalIds = ['create-game-modal', 'add-funds-modal', 'join-game-modal'];
      
      modalIds.forEach(modalId => {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
          console.log(`Initializing modal: ${modalId}`);
          // Destroy existing modal if any
          const existingModal = bootstrap.Modal.getInstance(modalElement);
          if (existingModal) {
            existingModal.dispose();
          }
          
          // Create new modal
          this.modals[modalId] = new bootstrap.Modal(modalElement, {
            backdrop: 'static'
          });
          
          // Add event listeners for form reset when modal is hidden
          modalElement.addEventListener('hidden.bs.modal', () => {
            const form = modalElement.querySelector('form');
            if (form) {
              form.reset();
            }
          });
        } else {
          console.warn(`Modal element not found: ${modalId}`);
        }
      });
    } catch (error) {
      console.error('Error initializing modals:', error);
    }
  }

  private setupButtons() {
    // Create Game Button
    this.addClickHandler('create-game-btn', (e) => {
      e.preventDefault();
      this.showModal('create-game-modal');
    });
    
    // Create Game Modal Button
    this.addClickHandler('create-game-modal-btn', (e) => {
      e.preventDefault();
      this.showModal('create-game-modal');
    });
    
    // Add Funds Button
    this.addClickHandler('add-funds-btn', (e) => {
      e.preventDefault();
      this.showModal('add-funds-modal');
    });
    
    // Join Game Modal Button
    this.addClickHandler('join-game-modal-btn', (e) => {
      e.preventDefault();
      this.showModal('join-game-modal');
    });
    
    // Cash Out Button
    this.addClickHandler('cash-out-btn', async (e) => {
      e.preventDefault();
      
      if (this.processingRequest) return;
      this.processingRequest = true;
      
      try {
        await this.handleCashOut();
      } finally {
        this.processingRequest = false;
      }
    });
    
    // Quick Join Buttons with event delegation
    document.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      
      if (target.classList.contains('join-btn') && !target.hasAttribute('disabled')) {
        e.preventDefault();
        
        const gameId = target.dataset.id;
        if (!gameId || this.processingRequest) return;
        
        this.processingRequest = true;
        const originalText = target.textContent;
        
        try {
          target.textContent = 'Joining...';
          target.setAttribute('disabled', 'true');
          
          await this.joinGame(parseInt(gameId));
        } catch (error) {
          console.error('Error joining game:', error);
          alert('Error joining game. Please try again.');
          target.textContent = originalText;
          target.removeAttribute('disabled');
        } finally {
          this.processingRequest = false;
        }
      }
    });
  }

  private setupForms() {
    // Create Game Form
    this.setupForm('create-game-form', async (formData) => {
      if (this.processingRequest) return;
      this.processingRequest = true;
      
      try {
        const data = {
          name: formData.get('game-name') as string,
          maxPlayers: parseInt(formData.get('max-players') as string),
          minBuyIn: formData.get('min-buy-in') ? parseInt(formData.get('min-buy-in') as string) : undefined,
          private: formData.get('private-game') === 'on'
        };
        
        if (!data.name || isNaN(data.maxPlayers)) {
          alert('Please fill in all required fields');
          return;
        }
        
        // Log data being sent
        console.log('Creating game with data:', data);
        
        const response = await fetch('/games/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        // Check if response is OK
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Create game response not OK:', response.status, errorText);
          throw new Error(`Server returned ${response.status}: ${errorText}`);
        }
        
        // Parse JSON response
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error('Invalid response format');
        }
        
        const result = await response.json();
        console.log('Create game response:', result);
        
        if (result.success) {
          this.hideModal('create-game-modal');
          // Navigate immediately
          window.location.href = `/games/${result.game_id}`;
        } else {
          alert(result.message || 'Failed to create game');
        }
      } catch (error) {
        console.error('Error creating game:', error);
        alert('Error creating game. Please try again.');
      } finally {
        this.processingRequest = false;
      }
    });
    
    // Add Funds Form
    this.setupForm('add-funds-form', async (formData) => {
      if (this.processingRequest) return;
      this.processingRequest = true;
      
      try {
        const amount = parseFloat(formData.get('amount') as string);
        const paymentMethod = formData.get('payment-method') as string;
        
        if (isNaN(amount) || amount < 10) {
          alert('Please enter a valid amount (minimum $10)');
          return;
        }
        
        console.log('Adding funds:', { amount, paymentMethod });
        
        const response = await fetch('/funds/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            amount: amount,
            payment_method: paymentMethod
          })
        });
        
        // Check response
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Add funds response not OK:', response.status, errorText);
          throw new Error(`Server returned ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Add funds response:', result);
        
        if (result.success) {
          this.hideModal('add-funds-modal');
          alert(`Funds added successfully! New balance: $${result.balance}`);
          window.location.reload();
        } else {
          alert(result.message || 'Failed to add funds');
        }
      } catch (error) {
        console.error('Error adding funds:', error);
        alert('Error processing payment. Please try again.');
      } finally {
        this.processingRequest = false;
      }
    });
    
    // Join Game Form
    this.setupForm('join-game-form', async (formData) => {
      if (this.processingRequest) return;
      this.processingRequest = true;
      
      try {
        const gameId = formData.get('game-id') as string;
        
        if (!gameId || isNaN(parseInt(gameId))) {
          alert('Please enter a valid game ID');
          return;
        }
        
        this.hideModal('join-game-modal');
        await this.joinGame(parseInt(gameId));
      } catch (error) {
        console.error('Error joining game:', error);
        alert('Error joining game. Please try again.');
      } finally {
        this.processingRequest = false;
      }
    });
  }

  private setupSocketListeners() {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    // Listen for game updates
    this.socket.on('game_update', (data: any) => {
      console.log('Game update received:', data);
      this.refreshGamesList();
    });
    
    // Listen for errors
    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  private refreshGamesList() {
    // Reload the page to refresh the games list
    window.location.reload();
  }

  private joinGame(gameId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Socket not connected'));
        return;
      }
      
      console.log('Joining game:', gameId);
      
      // Set a timeout for the socket response
      const timeout = setTimeout(() => {
        reject(new Error('Join game timeout'));
      }, 5000);
      
      this.socket.emit('join_game', gameId, (response: any) => {
        clearTimeout(timeout);
        console.log('Join game response:', response);
        
        if (response?.success) {
          window.location.href = `/games/${gameId}`;
          resolve();
        } else {
          alert(response?.error || 'Failed to join game');
          reject(new Error(response?.error || 'Failed to join game'));
        }
      });
    });
  }

  private async handleCashOut() {
    if (!confirm('Are you sure you want to cash out all your funds?')) {
      return;
    }
    
    try {
      const response = await fetch('/funds/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cash out response not OK:', response.status, errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Cash out response:', result);
      
      if (result.success) {
        alert(`Cash out successful! Amount: $${result.amount}`);
        window.location.reload();
      } else {
        alert(result.message || 'Cash out failed');
      }
    } catch (error) {
      console.error('Error during cash out:', error);
      alert('Error processing cash out. Please try again.');
    }
  }

  private addClickHandler(elementId: string, handler: (e: MouseEvent) => void) {
    const element = document.getElementById(elementId);
    if (element) {
      // Remove existing event listeners
      const newElement = element.cloneNode(true) as HTMLElement;
      if (element.parentNode) {
        element.parentNode.replaceChild(newElement, element);
      }
      
      // Add single event listener
      const newRef = document.getElementById(elementId);
      if (newRef) {
        newRef.addEventListener('click', handler, { once: false });
      }
    }
  }

  private setupForm(formId: string, handler: (formData: FormData) => Promise<void>) {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (form) {
      // Remove existing event listeners
      const newForm = form.cloneNode(true) as HTMLFormElement;
      if (form.parentNode) {
        form.parentNode.replaceChild(newForm, form);
      }
      
      // Add single event listener
      const newFormRef = document.getElementById(formId) as HTMLFormElement;
      if (newFormRef) {
        newFormRef.addEventListener('submit', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const formData = new FormData(newFormRef);
          await handler(formData);
        });
      }
    }
  }

  private showModal(modalId: string) {
    console.log('Showing modal:', modalId);
    
    if (this.modals[modalId]) {
      try {
        this.modals[modalId].show();
      } catch (error) {
        console.error(`Error showing modal ${modalId}:`, error);
        alert('Error showing modal. Please try again.');
      }
    } else {
      console.warn(`Modal ${modalId} not initialized`);
      // Try to initialize it on-demand
      const modalElement = document.getElementById(modalId);
      if (modalElement && typeof bootstrap !== 'undefined') {
        this.modals[modalId] = new bootstrap.Modal(modalElement);
        this.modals[modalId].show();
      } else {
        console.error(`Modal ${modalId} element not found or Bootstrap not loaded`);
      }
    }
  }

  private hideModal(modalId: string) {
    console.log('Hiding modal:', modalId);
    
    if (this.modals[modalId]) {
      try {
        this.modals[modalId].hide();
      } catch (error) {
        console.error(`Error hiding modal ${modalId}:`, error);
      }
    } else {
      console.warn(`Modal ${modalId} not initialized`);
    }
  }
}

export default Lobby;