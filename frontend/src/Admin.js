import React, { useState, useEffect } from 'react';
import './Admin.css';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0
  });

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchUsers(),
        fetchPayments()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/products`);
      const data = await response.json();
      setProducts(data.products || []);
      setStats(prev => ({ ...prev, totalProducts: data.products?.length || 0 }));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setStats(prev => ({ 
          ...prev, 
          totalOrders: data.orders?.length || 0,
          totalRevenue: data.orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setStats(prev => ({ ...prev, totalUsers: data.users?.length || 0 }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/payments`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const Dashboard = () => (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Fresh Cuts Market - Admin Dashboard</h1>
        <p>Welcome to your e-commerce management center</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.totalProducts}</h3>
            <p>Total Products</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🛍️</div>
          <div className="stat-content">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>RWF {stats.totalRevenue.toLocaleString()}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-grid">
          <div className="activity-section">
            <h3>Recent Orders</h3>
            <div className="activity-list">
              {orders.slice(0, 5).map(order => (
                <div key={order._id} className="activity-item">
                  <span className="activity-title">Order #{order.order_id?.substring(0, 8)}</span>
                  <span className="activity-amount">RWF {order.total_amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-section">
            <h3>Recent Payments</h3>
            <div className="activity-list">
              {payments.slice(0, 5).map(payment => (
                <div key={payment._id} className="activity-item">
                  <span className="activity-title">{payment.payment_method} - RWF {payment.amount?.toLocaleString()}</span>
                  <span className={`activity-status ${payment.status}`}>{payment.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ProductManagement = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      price: '',
      category: '',
      image_url: '',
      stock: '',
      weight: '',
      unit: ''
    });

    const categories = [
      'fresh_meat',
      'processed_meat',
      'dairy',
      'supermarket',
      'beverages',
      'snacks'
    ];

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const url = editingProduct 
          ? `${backendUrl}/api/admin/products/${editingProduct._id}`
          : `${backendUrl}/api/products`;
        
        const method = editingProduct ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            weight: parseFloat(formData.weight)
          })
        });

        if (response.ok) {
          alert(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
          setShowAddModal(false);
          setEditingProduct(null);
          setFormData({
            name: '', description: '', price: '', category: '',
            image_url: '', stock: '', weight: '', unit: ''
          });
          fetchProducts();
        }
      } catch (error) {
        alert('Error saving product');
      }
    };

    const handleEdit = (product) => {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        image_url: product.image_url || '',
        stock: product.stock.toString(),
        weight: product.weight?.toString() || '',
        unit: product.unit
      });
      setShowAddModal(true);
    };

    const handleDelete = async (productId) => {
      if (window.confirm('Are you sure you want to delete this product?')) {
        try {
          const response = await fetch(`${backendUrl}/api/admin/products/${productId}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            alert('Product deleted successfully!');
            fetchProducts();
          }
        } catch (error) {
          alert('Error deleting product');
        }
      }
    };

    return (
      <div className="product-management">
        <div className="management-header">
          <h2>Product Management</h2>
          <button 
            className="add-btn"
            onClick={() => setShowAddModal(true)}
          >
            Add New Product
          </button>
        </div>

        <div className="products-grid">
          {products.map(product => (
            <div key={product._id} className="product-card">
              <img src={product.image_url} alt={product.name} />
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-category">{product.category}</p>
                <p className="product-price">RWF {product.price.toLocaleString()}</p>
                <p className="product-stock">Stock: {product.stock}</p>
                <div className="product-actions">
                  <button onClick={() => handleEdit(product)}>Edit</button>
                  <button onClick={() => handleDelete(product._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <button onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                  setFormData({
                    name: '', description: '', price: '', category: '',
                    image_url: '', stock: '', weight: '', unit: ''
                  });
                }}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="product-form">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price (RWF)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Weight</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const OrderManagement = () => (
    <div className="order-management">
      <h2>Order Management</h2>
      <div className="orders-table">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>User</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment Method</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td>{order.order_id?.substring(0, 8)}...</td>
                <td>{order.user_id?.substring(0, 8)}...</td>
                <td>RWF {order.total_amount?.toLocaleString()}</td>
                <td>
                  <span className={`status ${order.status}`}>
                    {order.status}
                  </span>
                </td>
                <td>{order.payment_method}</td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="view-btn">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const UserManagement = () => (
    <div className="user-management">
      <h2>User Management</h2>
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user._id?.substring(0, 8)}...</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone || 'N/A'}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="view-btn">View Profile</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const PaymentManagement = () => (
    <div className="payment-management">
      <h2>Payment Management</h2>
      <div className="payments-table">
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment._id}>
                <td>{payment._id?.substring(0, 12)}...</td>
                <td>RWF {payment.amount?.toLocaleString()}</td>
                <td>{payment.payment_method}</td>
                <td>
                  <span className={`status ${payment.status}`}>
                    {payment.status}
                  </span>
                </td>
                <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="view-btn">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <ProductManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'users':
        return <UserManagement />;
      case 'payments':
        return <PaymentManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <h2>🥩 Admin Panel</h2>
        </div>
        <nav className="admin-nav">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            📦 Products
          </button>
          <button 
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            🛍️ Orders
          </button>
          <button 
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
          <button 
            className={activeTab === 'payments' ? 'active' : ''}
            onClick={() => setActiveTab('payments')}
          >
            💳 Payments
          </button>
        </nav>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default Admin;