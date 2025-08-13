const userDashboard = {
  menuItems: [
    { id: 'browse-products', label: '🛒 Browse Products', active: true },
    { id: 'my-orders', label: '📦 My Orders' },
    { id: 'profile', label: '👤 Profile' },
    { id: 'cart', label: '🛍️ Cart' }
  ],

  init() {
    this.renderMenu();
    this.showBrowseProducts();
  },

  renderMenu() {
    const sidebar = document.querySelector('.sidebar-content');
    sidebar.innerHTML = this.menuItems.map(item => `
      <button class="menu-item ${item.active ? 'active' : ''}" data-section="${item.id}">
        ${item.label}
      </button>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
        e.target.classList.add('active');
        
        const section = e.target.dataset.section;
        switch(section) {
          case 'browse-products': this.showBrowseProducts(); break;
          case 'my-orders': this.showMyOrders(); break;
          case 'profile': this.showProfile(); break;
          case 'cart': this.showCart(); break;
        }
      });
    });
  },

  showBrowseProducts() {
    const data = getData();
    const products = data.products;
    
    const content = `
      <div class="section-header">
        <h2 class="section-title">Fresh Products</h2>
        <button class="btn-primary" onclick="document.getElementById('cart-modal').classList.add('active')">
          🛍️ Cart (${cart.getItemCount()})
        </button>
      </div>
      
      <div class="search-filters">
        <div class="search-row">
          <div class="search-group">
            <label>Search Products</label>
            <input type="text" id="product-search" placeholder="Search for products...">
          </div>
          <div class="search-group">
            <label>Category</label>
            <select id="category-filter">
              <option value="">All Categories</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="dairy">Dairy</option>
            </select>
          </div>
          <div class="search-group">
            <label>Filter</label>
            <select id="organic-filter">
              <option value="">All Products</option>
              <option value="organic">Organic Only</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="product-grid" id="product-grid">
        ${this.renderProducts(products)}
      </div>
    `;
    
    document.getElementById('dashboard-content').innerHTML = content;
    
    // Add search functionality
    const searchInput = document.getElementById('product-search');
    const categoryFilter = document.getElementById('category-filter');
    const organicFilter = document.getElementById('organic-filter');
    
    const filterProducts = debounce(() => {
      const searchTerm = searchInput.value.toLowerCase();
      const category = categoryFilter.value;
      const organic = organicFilter.value;
      
      let filtered = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            product.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || product.category === category;
        const matchesOrganic = !organic || (organic === 'organic' && product.isOrganic);
        
        return matchesSearch && matchesCategory && matchesOrganic;
      });
      
      document.getElementById('product-grid').innerHTML = this.renderProducts(filtered);
    }, 300);
    
    searchInput.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);
    organicFilter.addEventListener('change', filterProducts);
  },

  renderProducts(products) {
    if (products.length === 0) {
      return '<div class="empty-state"><h3>No products found</h3><p>Try adjusting your search or filters</p></div>';
    }
    
    return products.map(product => `
      <div class="product-card">
        <div class="product-image">${product.image}</div>
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-description">${product.description}</p>
          <div style="margin-bottom: 1rem;">
            <small style="color: var(--text-secondary);">By ${product.farmerName}</small>
            ${product.isOrganic ? '<span class="badge badge-success">Organic</span>' : ''}
          </div>
          <div class="product-footer">
            <div>
              <span class="product-price">${formatCurrency(product.price)}</span>
              <small style="color: var(--text-secondary);"> ${product.unit}</small>
            </div>
            <div class="product-actions">
              <button class="btn-primary btn-sm" onclick="cart.addItem(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  showMyOrders() {
    const data = getData();
    const userOrders = data.orders.filter(order => order.userId === auth.getCurrentUser().id);
    
    const content = `
      <div class="section-header">
        <h2 class="section-title">My Orders</h2>
      </div>
      
      ${userOrders.length === 0 ? 
        '<div class="empty-state"><h3>No orders yet</h3><p>Start shopping to see your orders here</p></div>' :
        userOrders.map(order => `
          <div class="order-card">
            <div class="order-header">
              <div>
                <div class="order-id">Order #${order.id}</div>
                <div class="order-date">Placed on ${formatDate(order.orderDate)}</div>
              </div>
              <span class="badge badge-${order.status === 'delivered' ? 'success' : order.status === 'processing' ? 'warning' : 'primary'}">
                ${order.status.toUpperCase()}
              </span>
            </div>
            <div class="order-items">
              ${order.items.map(item => `
                <div class="order-item">
                  <span>${item.name} (x${item.quantity})</span>
                  <span>${formatCurrency(item.price * item.quantity)}</span>
                </div>
              `).join('')}
            </div>
            <div class="order-total">
              <span>Total: ${formatCurrency(order.total)}</span>
            </div>
            <div style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
              <div>Delivery Address: ${order.deliveryAddress}</div>
              <div>Expected Delivery: ${formatDate(order.deliveryDate)}</div>
            </div>
          </div>
        `).join('')
      }
    `;
    
    document.getElementById('dashboard-content').innerHTML = content;
  },

  showProfile() {
    const user = auth.getCurrentUser();
    
    const content = `
      <div class="section-header">
        <h2 class="section-title">My Profile</h2>
      </div>
      
      <div class="card">
        <form id="profile-form">
          <div class="form-row">
            <div class="form-group">
              <label for="profile-name">Full Name</label>
              <input type="text" id="profile-name" value="${user.name}" required>
            </div>
            <div class="form-group">
              <label for="profile-email">Email</label>
              <input type="email" id="profile-email" value="${user.email}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="profile-phone">Phone</label>
              <input type="tel" id="profile-phone" value="${user.phone || ''}">
            </div>
            <div class="form-group">
              <label for="profile-address">Address</label>
              <input type="text" id="profile-address" value="${user.address || ''}">
            </div>
          </div>
          <button type="submit" class="btn-primary">Update Profile</button>
        </form>
      </div>
    `;
    
    document.getElementById('dashboard-content').innerHTML = content;
    
    document.getElementById('profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      // Profile update logic would go here
      showNotification('Profile updated successfully');
    });
  },

  showCart() {
    const content = `
      <div class="section-header">
        <h2 class="section-title">Shopping Cart</h2>
      </div>
      
      <div class="card">
        <div id="cart-items-dashboard"></div>
        <div class="cart-total" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
          <strong>Total: $<span id="cart-total-dashboard">0.00</span></strong>
        </div>
        <div style="margin-top: 2rem;">
          <button id="checkout-btn-dashboard" class="btn-primary" style="margin-right: 1rem;">Proceed to Checkout</button>
          <button onclick="cart.clear(); this.closest('.card').querySelector('#cart-items-dashboard').innerHTML = '<div class=\\'empty-state\\'>Your cart is empty</div>'; document.getElementById('cart-total-dashboard').textContent = '0.00';" class="btn-secondary">Clear Cart</button>
        </div>
      </div>
    `;
    
    document.getElementById('dashboard-content').innerHTML = content;
    this.updateCartDisplay();
    
    document.getElementById('checkout-btn-dashboard').addEventListener('click', () => {
      if (cart.items.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
      }
      
      // Create order
      const data = getData();
      const newOrder = {
        id: Math.max(...data.orders.map(o => o.id), 1000) + 1,
        userId: auth.getCurrentUser().id,
        userName: auth.getCurrentUser().name,
        farmerId: 2, // For demo, assume all products from same farmer
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
      
      showNotification('Order placed successfully!');
      this.showMyOrders();
    });
  },

  updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items-dashboard');
    const cartTotal = document.getElementById('cart-total-dashboard');
    
    if (!cartItemsContainer || !cartTotal) return;
    
    if (cart.items.length === 0) {
      cartItemsContainer.innerHTML = '<div class="empty-state"><p>Your cart is empty</p></div>';
      cartTotal.textContent = '0.00';
      return;
    }
    
    cartItemsContainer.innerHTML = cart.items.map(item => `
      <div class="cart-item">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>${formatCurrency(item.price)} ${item.unit}</p>
        </div>
        <div class="cart-item-actions">
          <div class="quantity-controls">
            <button class="quantity-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1}); userDashboard.updateCartDisplay()">-</button>
            <span class="quantity-display">${item.quantity}</span>
            <button class="quantity-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1}); userDashboard.updateCartDisplay()">+</button>
          </div>
          <button class="btn-danger btn-sm" onclick="cart.removeItem(${item.id}); userDashboard.updateCartDisplay()">Remove</button>
        </div>
      </div>
    `).join('');
    
    cartTotal.textContent = cart.getTotal().toFixed(2);
  }
};