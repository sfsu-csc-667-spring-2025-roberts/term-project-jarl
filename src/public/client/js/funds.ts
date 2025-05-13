// src/public/client/js/funds.ts

export default class Funds {
  private socket: any;

  constructor(socket: any) {
    this.socket = socket;
  }

  public init() {
    console.log('Initializing funds functionality...');
    
    // Add funds form
    const addFundsForm = document.getElementById('add-funds-form');
    if (addFundsForm) {
      addFundsForm.addEventListener('submit', this.handleAddFunds.bind(this));
    }
    
    // Withdraw funds form
    const withdrawFundsForm = document.getElementById('withdraw-funds-form');
    if (withdrawFundsForm) {
      withdrawFundsForm.addEventListener('submit', this.handleWithdrawFunds.bind(this));
    }
    
    // Load initial balance
    this.fetchAndDisplayBalance();
  }

  private async handleAddFunds(event: Event) {
    event.preventDefault();
    
    const formElement = event.target as HTMLFormElement;
    const amountInput = document.getElementById('amount') as HTMLInputElement;
    const paymentMethodInput = document.getElementById('payment-method') as HTMLSelectElement;
    
    const amount = amountInput.value;
    const paymentMethod = paymentMethodInput.value;
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      this.showError('Please enter a valid amount');
      return;
    }
    
    try {
      console.log('Adding funds:', { amount, payment_method: paymentMethod });
      
      const response = await fetch('/funds/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          payment_method: paymentMethod
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Add funds response not OK:', response.status, JSON.stringify(errorData));
        throw new Error(`Server returned ${response.status}: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update balance display
        this.updateBalanceDisplay(data.balance);
        
        // Show success message
        this.showSuccess(`Successfully added $${parseFloat(amount).toFixed(2)} to your account`);
        
        // Hide modal
        this.closeModal('add-funds-modal');
        
        // Reset form
        formElement.reset();
      } else {
        this.showError(data.message || 'Failed to add funds');
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      this.showError('Failed to add funds. Please try again later.');
    }
  }

  private async handleWithdrawFunds(event: Event) {
    event.preventDefault();
    
    const formElement = event.target as HTMLFormElement;
    const amountInput = document.getElementById('withdraw-amount') as HTMLInputElement;
    
    const amount = amountInput?.value;
    
    try {
      const response = await fetch('/funds/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount ? parseFloat(amount) : null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server returned ${response.status}: ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update balance display
        this.updateBalanceDisplay(data.balance);
        
        // Show success message
        this.showSuccess(`Successfully withdrew $${parseFloat(data.amount).toFixed(2)} from your account`);
        
        // Hide modal
        this.closeModal('withdraw-funds-modal');
        
        // Reset form
        formElement.reset();
      } else {
        this.showError(data.message || 'Failed to withdraw funds');
      }
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      this.showError('Failed to withdraw funds. Please try again later.');
    }
  }

  // Fetch and display user's balance
  public async fetchAndDisplayBalance() {
    try {
      const response = await fetch('/funds/balance');
      
      if (!response.ok) {
        console.error('Failed to fetch balance:', response.status);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        this.updateBalanceDisplay(data.balance);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  }

  // Update balance display throughout the page
  private updateBalanceDisplay(balance: number) {
    const balanceElements = document.querySelectorAll('.user-balance');
    const formattedBalance = parseFloat(balance.toString()).toFixed(2);
    
    balanceElements.forEach(element => {
      element.textContent = `$${formattedBalance}`;
    });
  }

  // Show error message
  private showError(message: string) {
    const errorElement = document.getElementById('funds-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      
      // Hide after 5 seconds
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 5000);
    } else {
      alert(`Error: ${message}`);
    }
  }

  // Show success message
  private showSuccess(message: string) {
    const successElement = document.getElementById('funds-success');
    if (successElement) {
      successElement.textContent = message;
      successElement.style.display = 'block';
      
      // Hide after 5 seconds
      setTimeout(() => {
        successElement.style.display = 'none';
      }, 5000);
    } else {
      alert(`Success: ${message}`);
    }
  }

  // Close modal
  private closeModal(modalId: string) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
    }
  }
}