class FarmToDoorApp {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuthentication();
  }

  setupEventListeners() {
    // Auth form listeners
    this.setupAuthTabs();
    this.setupDemoButtons();
    this.setupAuthForms();
    this.setupLogout();
    this.setupCartModal();
  }

  setupAuthTabs() {
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        document.getElementById(`${tabName}-form`).classList.add('active');
      });
    });
  }

  setupDemoButtons() {
    document.querySelectorAll('.demo-btn').forEach(button => {
      button.addEventListener('click', () => {
        const role = button.dataset.role;
        this.loginWithDemo(role);
      });
    });
  }

  setupAuthForms() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const role = document.getElementById('login-role').value;
      
      const result = auth.login(email, password, role);
      if (result.success) {
        this.showDashboard(result.user);
      } else {
        showNotification(result.message, 'error');
      }
    });

    // Register form
    document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const userData = {
        name: document.getElementById('register-name').value,
        email: document.getElementById('register-email').value,
        password: document.getElementById('register-password').value,
        role: document.getElementById('register-role').value
      };
      
      const result = auth.register(userData);
      if (result.success) {
        showNotification('Registration successful!');
        // Switch to login tab
        document.querySelector('[data-tab="login"]').click();
      } else {
        showNotification(result.message, 'error');
      }
    });
  }

  setupLogout() {
    document.getElementById('logout-btn').addEventListener('click', () => {
      auth.logout();
      this.showAuth();
    });
  }

  setupCartModal() {
    const modal = document.getElementById('cart-modal');
    const closeButtons = modal.querySelectorAll('.modal-close');
    
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        modal.classList.remove('active');
      });
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
    
    // Checkout button
    document.getElementById('checkout-btn').addEventListener('click', () => {
      if (cart.items.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
      }
      
      // Create order logic (same as in user dashboard)
      const data = getData();
      const newOrder = {
        id: Math.max(...data.orders.map(o => o.id), 1000) + 1,
        userId: auth.getCurrentUser().id,
        userName: auth.getCurrentUser().name,
        farmerId: 2,
        farmerName: 'Green Valley Farm',
        status: 'pending',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total: cart.getTotal(),
        items: cart.items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        deliveryAddress: auth.getCurrentUser().address || '123 Main St, City, State'
      };
      
      data.orders.push(newOrder);
      saveData(data);
      cart.clear();
      
      modal.classList.remove('active');
      showNotification('Order placed successfully!');
      
      // If user is on user dashboard, refresh orders
      if (auth.hasRole('user')) {
        userDashboard.showMyOrders();
      }
    });
  }

  loginWithDemo(role) {
    const demoCredentials = {
      user: { email: 'customer@demo.com', password: 'demo123', role: 'user' },
      farmer: { email: 'farmer@demo.com', password: 'demo123', role: 'farmer' },
      admin: { email: 'admin@demo.com', password: 'demo123', role: 'admin' }
    };
    
    const creds = demoCredentials[role];
    const result = auth.login(creds.email, creds.password, creds.role);
    
    if (result.success) {
      this.showDashboard(result.user);
    } else {
      showNotification('Demo login failed', 'error');
    }
  }

  checkAuthentication() {
    if (auth.isAuthenticated()) {
      this.showDashboard(auth.getCurrentUser());
    } else {
      this.showAuth();
    }
  }

  showAuth() {
    document.getElementById('auth-screen').classList.add('active');
    document.getElementById('dashboard-screen').classList.remove('active');
  }

  showDashboard(user) {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('dashboard-screen').classList.add('active');
    
    // Update user name
    document.getElementById('user-name').textContent = user.name;
    
    // Initialize appropriate dashboard
    switch (user.role) {
      case 'user':
        userDashboard.init();
        break;
      case 'farmer':
        farmerDashboard.init();
        break;
      case 'admin':
        adminDashboard.init();
        break;
    }
    
    // Update cart display
    cart.updateCartDisplay();
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FarmToDoorApp();
});