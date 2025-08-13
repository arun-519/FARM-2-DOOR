const farmerDashboard = {
  menuItems: [
    { id: 'dashboard', label: '📊 Dashboard', active: true },
    { id: 'my-products', label: '🌱 My Products' },
    { id: 'orders', label: '📦 Orders' },
    { id: 'analytics', label: '📈 Analytics' },
    { id: 'profile', label: '👤 Profile' }
  ],

  init() {
    this.renderMenu();
    this.showDashboard();
  },

  renderMenu() {
    const sidebar = document.querySelector('.sidebar-content');
    sidebar.innerHTML = this.menuItems.map(item => `
      <button class="menu-item ${item.active ? 'active' : ''}" data-section="${item.id}">
        ${item.label}
      </button>
    `).join('');

    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
        e.target.classList.add('active');
        
        const section = e.target.dataset.section;
        switch(section) {
          case 'dashboard': this.showDashboard(); break;
          case 'my-products': this.showMyProducts(); break;
          case 'orders': this.showOrders(); break;
          case 'analytics': this.showAnalytics(); break;
          case 'profile': this.showProfile(); break;
        }
      });
    });
  },

  showDashboard() {
    const data = getData();
    const farmerId = auth.getCurrentUser().id;
    const myProducts = data.products.filter(p => p.farmerId === farmerId);
    const myOrders = data.orders.filter(o => o.farmerId === farmerId);
    
    const totalRevenue = myOrders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = myOrders.filter(o => o.status === 'pending').length;
    
    const content = `
      <div class="section-header">
        <h2 class="section-title">Farmer Dashboard</h2>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${myProducts.length}</div>
          <div class="stat-label">Products Listed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${myOrders.length}</div>
          <div class="stat-label">Total Orders</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${pendingOrders}</div>
          <div class="stat-label">Pending Orders</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatCurrency(totalRevenue)}</div>
          <div class="stat-label">Total Revenue</div>
        </div>
      </div>
      
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent Orders</h3>
          </div>
          <div class="card-content">
            ${myOrders.slice(-5).map(order => `
              <div class="order-item">
                <div>
                  <strong>Order #${order.id}</strong>
                  <small style="color: var(--text-secondary); display: block;">
                    ${order.userName} • ${formatDate(order.orderDate)}
                  </small>
                </div>
                <div style="text-align: right;">
                  <div>${formatCurrency(order.total)}</div>
                  <span class="badge badge-${order.status === 'delivered' ? 'success' : order.status === 'processing' ? 'warning' : 'primary'}">
                    ${order.status}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Low Stock Alert</h3>
          </div>
          <div class="card-content">
            ${myProducts.filter(p => p.stock < 10).map(product => `
              <div class="order-item">
                <div>
                  <strong>${product.name}</strong>
                  <small style="color: var(--text-secondary); display: block;">
                    Only ${product.stock} ${product.unit} remaining
                  </small>
                </div>
                <span class="badge badge-warning">Low Stock</span>
              </div>
            `).join('') || '<p style="color: var(--text-secondary);">All products have sufficient stock</p>'}
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('dashboard-content').innerHTML = content;
  },

  showMyProducts() {
    const data = getData();
    const farmerId = auth.getCurrentUser().id;
    const myProducts = data.products.filter(p => p.farmerId === farmerId);
    
    const content = `
      <div class="section-header">
        <h2 class="section-title">My Products</h2>
        <button class="btn-primary" onclick="farmerDashboard.showAddProductForm()">Add New Product</button>
      </div>
      
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${myProducts.map(product => `
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 1rem;">
                    <span style="font-size: 2rem;">${product.image}</span>
                    <div>
                      <strong>${product.name}</strong>
                      <small style="display: block; color: var(--text-secondary);">${product.description}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge badge-primary">${product.category}</span>
                  ${product.isOrganic ? '<span class="badge badge-success">Organic</span>' : ''}
                </td>
                <td><strong>${formatCurrency(product.price)}</strong><br><small>${product.unit}</small></td>
                <td>
                  <span class="${product.stock < 10 ? 'badge badge-warning' : ''}">${product.stock}</span>
                </td>
                <td>
                  <span class="badge badge-${product.stock > 0 ? 'success' : 'danger'}">
                    ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-secondary btn-sm" onclick="farmerDashboard.editProduct(${product.id})">Edit</button>
                    <button class="btn-danger btn-sm" onclick="farmerDashboard.deleteProduct(${product.id})">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    document.getElementById('dashboard-content').innerHTML = content;
  },

  showAddProductForm() {
    const content = `
      <div class="section-header">
        <h2 class="section-title">Add New Product</h2>
        <button class="btn-secondary" onclick="farmerDashboard.showMyProducts()">Back to Products</button>
      </div>
      
      <div class="card">
        <form id="add-product-form">
          <div class="form-row">
            <div class="form-group">
              <label for="product-name">Product Name</label>
              <input type="text" id="product-name" required>
            </div>
            <div class="form-group">
              <label for="product-category">Category</label>
              <select id="product-category" required>
                <option value="">Select Category</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="dairy">Dairy</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="product-description">Description</label>
            <textarea id="product-description" rows="3" required></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="product-price">Price</label>
              <input type="number" id="product-price" step="0.01" required>
            </div>
            <div class="form-group">
              <label for="product-unit">Unit</label>
              <select id="product-unit" required>
                <option value="per lb">per lb</option>
                <option value="per dozen">per dozen</option>
                <option value="per head">per head</option>
                <option value="per bag">per bag</option>
                <option value="each">each</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="product-stock">Initial Stock</label>
              <input type="number" id="product-stock" required>
            </div>
            <div class="form-group">
              <label for="product-image">Emoji Icon</label>
              <input type="text" id="product-image" placeholder="🍅" maxlength="2">
            </div>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="product-organic"> Organic Product
            </label>
          </div>
          <button type="submit" class="btn-primary">Add Product</button>
        </form>
      </div>
    `;
    
    document.getElementById('dashboard-content').innerHTML = content;
    
    document.getElementById('add-product-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddProduct();
    });
  },

  handleAddProduct() {
    const data = getData();
    const farmer = auth.getCurrentUser();
    
    const newProduct = {
      id: Math.max(...data.products.map(p => p.id), 0) + 1,
      name: document.getElementById('product-name').value,
      description: document.getElementById('product-description').value,
      price: parseFloat(document.getElementById('product-price').value),
      unit: document.getElementById('product-unit').value,
      category: document.getElementById('product-category').value,
      farmerId: farmer.id,
      farmerName: farmer.farmName || farmer.name,
      stock: parseInt(document.getElementById('product-stock').value),
      image: document.getElementById('product-image').value || '🌱',
      isOrganic: document.getElementById('product-organic').checked,
      harvestDate: new Date().toISOString().split('T')[0]
    };
    
    data.products.push(newProduct);
    saveData(data);
    
    showNotification('Product added successfully');
    this.showMyProducts();
  },

  showOrders() {
    const data = getData();
    const farmerId = auth.getCurrentUser().id;
    const myOrders = data.orders.filter(o => o.farmerId === farmerId);
    
    const content = `
      <div class="section-header">
        <h2 class="section-title">Orders</h2>
      </div>
      
      ${myOrders.map(order => `
        <div class="order-card">
          <div class="order-header">
            <div>
              <div class="order-id">Order #${order.id}</div>
              <div class="order-date">From ${order.userName} • ${formatDate(order.orderDate)}</div>
            </div>
            <div>
              <span class="badge badge-${order.status === 'delivered' ? 'success' : order.status === 'processing' ? 'warning' : 'primary'}">
                ${order.status.toUpperCase()}
              </span>
              <div style="margin-top: 0.5rem;">
                <select onchange="farmerDashboard.updateOrderStatus(${order.id}, this.value)" style="padding: 0.25rem; border-radius: 4px; border: 1px solid var(--border-color);">
                  <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                  <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                </select>
              </div>
            </div>
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
      `).join('')}
    `;
    
    document.getElementById('dashboard-content').innerHTML = content;
  },

  updateOrderStatus(orderId, status) {
    const data = getData();
    const order = data.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      saveData(data);
      showNotification(`Order #${orderId} status updated to ${status}`);
      this.showOrders();
    }
  },

  showAnalytics() {
    const data = getData();
    const farmerId = auth.getCurrentUser().id;
    const myOrders = data.orders.filter(o => o.farmerId === farmerId);
    const myProducts = data.products.filter(p => p.farmerId === farmerId);
    
    const totalRevenue = myOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = myOrders.length > 0 ? totalRevenue / myOrders.length : 0;
    
    // Calculate monthly sales
    const monthlySales = myOrders.reduce((acc, order) => {
      const month = new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short' });
      acc[month] = (acc[month] || 0) + order.total;
      return acc;
    }, {});
    
    const content = `
      <div class="section-header">
        <h2 class="section-title">Analytics</h2>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${formatCurrency(totalRevenue)}</div>
          <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${myOrders.length}</div>
          <div class="stat-label">Total Orders</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatCurrency(averageOrderValue)}</div>
          <div class="stat-label">Average Order</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${myProducts.reduce((sum, p) => sum + p.stock, 0)}</div>
          <div class="stat-label">Total Inventory</div>
        </div>
      </div>
      
      <div class="grid-2">
        <div class="chart-container">
          <h3 class="chart-title">Monthly Sales</h3>
          <div class="chart-placeholder">
            <div>
              ${Object.entries(monthlySales).map(([month, sales]) => `
                <div style="margin: 0.5rem 0;">${month}: ${formatCurrency(sales)}</div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="chart-container">
          <h3 class="chart-title">Top Products</h3>
          <div class="chart-placeholder">
            <div>
              ${myProducts.slice(0, 5).map(product => `
                <div style="margin: 0.5rem 0;">${product.name}: ${product.stock} in stock</div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('dashboard-content').innerHTML = content;
  },

  showProfile() {
    const user = auth.getCurrentUser();
    
    const content = `
      <div class="section-header">
        <h2 class="section-title">Farm Profile</h2>
      </div>
      
      <div class="card">
        <form id="farmer-profile-form">
          <div class="form-row">
            <div class="form-group">
              <label for="farmer-name">Full Name</label>
              <input type="text" id="farmer-name" value="${user.name}" required>
            </div>
            <div class="form-group">
              <label for="farm-name">Farm Name</label>
              <input type="text" id="farm-name" value="${user.farmName || ''}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="farmer-email">Email</label>
              <input type="email" id="farmer-email" value="${user.email}" required>
            </div>
            <div class="form-group">
              <label for="farmer-phone">Phone</label>
              <input type="tel" id="farmer-phone" value="${user.phone || ''}">
            </div>
          </div>
          <div class="form-group">
            <label for="farm-location">Farm Location</label>
            <input type="text" id="farm-location" value="${user.location || ''}">
          </div>
          <div class="form-group">
            <label for="farm-description">Farm Description</label>
            <textarea id="farm-description" rows="4" placeholder="Tell customers about your farm...">${user.description || ''}</textarea>
          </div>
          <button type="submit" class="btn-primary">Update Profile</button>
        </form>
      </div>
    `;
    
    document.getElementById('dashboard-content').innerHTML = content;
    
    document.getElementById('farmer-profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      showNotification('Profile updated successfully');
    });
  },

  editProduct(productId) {
    // Implementation for editing products
    showNotification('Edit product feature coming soon!');
  },

  deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
      const data = getData();
      data.products = data.products.filter(p => p.id !== productId);
      saveData(data);
      showNotification('Product deleted successfully');
      this.showMyProducts();
    }
  }
};