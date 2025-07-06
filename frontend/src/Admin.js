import React, { useState, useEffect } from 'react';
import './Admin.css';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [specialOffers, setSpecialOffers] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
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
        fetchPayments(),
        fetchSpecialOffers(),
        fetchAnalytics()
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

  const fetchSpecialOffers = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/special-offers`);
      if (response.ok) {
        const data = await response.json();
        setSpecialOffers(data.offers || []);
      }
    } catch (error) {
      console.error('Error fetching special offers:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/analytics`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

      <div className="analytics-section">
        <h2>Analytics Overview</h2>
        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Low Stock Alert</h3>
            <p className="alert-text">{analytics.low_stock_products || 0} products need restocking</p>
          </div>
          
          <div className="analytics-card">
            <h3>Pending Orders</h3>
            <p>{analytics.pending_orders || 0} orders awaiting processing</p>
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
    const [editableProducts, setEditableProducts] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      price: '',
      category: '',
      image_url: '',
      stock: '',
      weight: '',
      unit: '',
      min_quantity: '1',
      max_quantity: '',
      price_per_unit: 'per_piece',
      discount_percentage: '0'
    });

    const categories = [
      'fresh_meat',
      'processed_meat',
      'dairy',
      'supermarket',
      'beverages',
      'snacks'
    ];

    const priceUnits = [
      { value: 'per_piece', label: 'Per Piece' },
      { value: 'per_kg', label: 'Per Kilogram' },
      { value: 'per_gram', label: 'Per Gram' }
    ];

    useEffect(() => {
      setEditableProducts(products.map(p => ({ ...p, isEditing: false })));
    }, [products]);

    const handleImageUpload = async (file) => {
      if (!file) return null;
      
      setUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${backendUrl}/api/admin/upload-image`, {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          setUploadingImage(false);
          return data.image_url;
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        setUploadingImage(false);
        alert('Error uploading image: ' + error.message);
        return null;
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      let imageUrl = formData.image_url;
      
      // Upload image if file is selected
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
        if (!imageUrl) return; // Upload failed
      }
      
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
            image_url: imageUrl,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            weight: parseFloat(formData.weight),
            min_quantity: parseFloat(formData.min_quantity),
            max_quantity: formData.max_quantity ? parseFloat(formData.max_quantity) : null,
            discount_percentage: parseFloat(formData.discount_percentage)
          })
        });

        if (response.ok) {
          alert(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
          setShowAddModal(false);
          setEditingProduct(null);
          setImageFile(null);
          resetForm();
          fetchProducts();
        }
      } catch (error) {
        alert('Error saving product');
      }
    };

    const toggleProductEdit = (productId) => {
      setEditableProducts(prev => 
        prev.map(product => 
          product._id === productId 
            ? { ...product, isEditing: !product.isEditing }
            : product
        )
      );
    };

    const updateProductField = (productId, field, value) => {
      setEditableProducts(prev =>
        prev.map(product =>
          product._id === productId
            ? { ...product, [field]: value }
            : product
        )
      );
    };

    const saveEditedProducts = async () => {
      const editedProducts = editableProducts.filter(p => p.isEditing);
      
      if (editedProducts.length === 0) {
        alert('No products selected for editing');
        return;
      }

      try {
        let successCount = 0;
        let errorCount = 0;

        // Update each product individually using PATCH for partial updates
        for (const product of editedProducts) {
          try {
            // Only send fields that have been modified
            const updateData = {};
            if (product.name) updateData.name = product.name;
            if (product.description) updateData.description = product.description;
            if (product.price) updateData.price = parseFloat(product.price);
            if (product.category) updateData.category = product.category;
            if (product.stock !== undefined) updateData.stock = parseInt(product.stock);
            if (product.unit) updateData.unit = product.unit;
            if (product.discount_percentage !== undefined) updateData.discount_percentage = parseFloat(product.discount_percentage);
            if (product.min_quantity) updateData.min_quantity = parseFloat(product.min_quantity);
            if (product.max_quantity) updateData.max_quantity = parseFloat(product.max_quantity);
            if (product.price_per_unit) updateData.price_per_unit = product.price_per_unit;
            if (product.image_url) updateData.image_url = product.image_url;
            if (product.weight) updateData.weight = parseFloat(product.weight);
            if (product.sku) updateData.sku = product.sku;

            const response = await fetch(`${backendUrl}/api/admin/products/${product._id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updateData)
            });

            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        }

        alert(`Bulk update completed! ${successCount} products updated successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}.`);
        
        // Reset editing state and refresh products
        setEditableProducts(prev => prev.map(p => ({ ...p, isEditing: false })));
        fetchProducts();

      } catch (error) {
        alert('Error during bulk update');
      }
    };

    const resetForm = () => {
      setFormData({
        name: '', description: '', price: '', category: '',
        image_url: '', stock: '', weight: '', unit: '',
        min_quantity: '1', max_quantity: '', price_per_unit: 'per_piece',
        discount_percentage: '0'
      });
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
        unit: product.unit,
        min_quantity: product.min_quantity?.toString() || '1',
        max_quantity: product.max_quantity?.toString() || '',
        price_per_unit: product.price_per_unit || 'per_piece',
        discount_percentage: product.discount_percentage?.toString() || '0'
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

    const editingCount = editableProducts.filter(p => p.isEditing).length;

    return (
      <div className="product-management">
        <div className="management-header">
          <h2>📦 Product Management (BEAR-Style Bulk Edit)</h2>
          <div className="management-actions">
            <button 
              className="add-btn"
              onClick={() => setShowAddModal(true)}
            >
              ➕ Add New Product
            </button>
            <button 
              className="bulk-save-btn"
              onClick={saveEditedProducts}
              disabled={editingCount === 0}
            >
              💾 Save Changes ({editingCount})
            </button>
          </div>
        </div>

        <div className="bulk-edit-instructions">
          <p>📝 <strong>How to bulk edit:</strong> Check the products you want to edit, make changes directly in the table, then click "Save Changes"</p>
        </div>

        <div className="table-view">
          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>✏️ Edit</th>
                  <th>🖼️ Image</th>
                  <th>📦 Name</th>
                  <th>📝 Description</th>
                  <th>🏷️ Category</th>
                  <th>💰 Price (RWF)</th>
                  <th>📊 Stock</th>
                  <th>⚖️ Weight</th>
                  <th>📏 Unit</th>
                  <th>📉 Min Qty</th>
                  <th>📈 Max Qty</th>
                  <th>🏷️ Discount %</th>
                  <th>🔖 SKU</th>
                  <th>⭐ Status</th>
                  <th>🔧 Actions</th>
                </tr>
              </thead>
              <tbody>
                {editableProducts.map(product => (
                  <tr key={product._id} className={product.isEditing ? 'editing-row' : ''}>
                    <td>
                      <label className="edit-checkbox-label">
                        <input
                          type="checkbox"
                          checked={product.isEditing}
                          onChange={() => toggleProductEdit(product._id)}
                          className="edit-checkbox"
                        />
                        <span className="edit-indicator">
                          {product.isEditing ? '✏️ Editing' : '📝 Edit'}
                        </span>
                      </label>
                    </td>
                    <td>
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="product-table-image"
                      />
                    </td>
                    <td>
                      {product.isEditing ? (
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => updateProductField(product._id, 'name', e.target.value)}
                          className="table-input"
                          placeholder="Product name..."
                        />
                      ) : (
                        <span className="product-name">{product.name}</span>
                      )}
                    </td>
                    <td>
                      {product.isEditing ? (
                        <textarea
                          value={product.description || ''}
                          onChange={(e) => updateProductField(product._id, 'description', e.target.value)}
                          className="table-input"
                          placeholder="Product description..."
                          rows="2"
                          style={{minHeight: '60px', resize: 'vertical'}}
                        />
                      ) : (
                        <span className="product-description" title={product.description}>
                          {product.description ? 
                            (product.description.length > 50 ? 
                              product.description.substring(0, 50) + '...' : 
                              product.description) : 
                            'No description'}
                        </span>
                      )}
                    </td>
                    <td>
                      {product.isEditing ? (
                        <select
                          value={product.category}
                          onChange={(e) => updateProductField(product._id, 'category', e.target.value)}
                          className="table-select"
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="category-badge">{product.category.replace('_', ' ')}</span>
                      )}
                    </td>
                    <td>
                      {product.isEditing ? (
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) => updateProductField(product._id, 'price', parseFloat(e.target.value) || 0)}
                          className="table-input price-input"
                          placeholder="0.00"
                        />
                      ) : (
                        <span className="price-display">RWF {product.price.toLocaleString()}</span>
                      )}
                    </td>
                    <td>
                      {product.isEditing ? (
                        <input
                          type="number"
                          value={product.stock}
                          onChange={(e) => updateProductField(product._id, 'stock', parseInt(e.target.value) || 0)}
                          className="table-input stock-input"
                          placeholder="0"
                        />
                      ) : (
                        <span className={`stock-display ${product.stock <= 10 ? 'low-stock' : ''}`}>
                          {product.stock}
                        </span>
                      )}
                    </td>
                    <td>
                      {product.isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={product.weight || ''}
                          onChange={(e) => updateProductField(product._id, 'weight', parseFloat(e.target.value) || null)}
                          className="table-input"
                          placeholder="0.00"
                        />
                      ) : (
                        <span className="weight-display">
                          {product.weight ? `${product.weight} kg` : 'N/A'}
                        </span>
                      )}
                    </td>
                    <td>
                      {product.isEditing ? (
                        <input
                          type="text"
                          value={product.unit || ''}
                          onChange={(e) => updateProductField(product._id, 'unit', e.target.value)}
                          className="table-input"
                          placeholder="Unit type..."
                        />
                      ) : (
                        <span className="unit-badge">{product.unit || 'N/A'}</span>
                      )}
                    </td>
                    <td>
                      {product.isEditing ? (
                        <input
                          type="number"
                          step="0.25"
                          value={product.min_quantity || ''}
                          onChange={(e) => updateProductField(product._id, 'min_quantity', parseFloat(e.target.value) || null)}
                          className="table-input"
                          placeholder="1"
                        />
                      ) : (
                        <span className="quantity-display">
                          {product.min_quantity || '1'}
                        </span>
                      )}
                    </td>
                    <td>
                      {product.isEditing ? (
                        <input
                          type="number"
                          step="0.25"
                          value={product.max_quantity || ''}
                          onChange={(e) => updateProductField(product._id, 'max_quantity', parseFloat(e.target.value) || null)}
                          className="table-input"
                          placeholder="No limit"
                        />
                      ) : (
                        <span className="quantity-display">
                          {product.max_quantity || 'No limit'}
                        </span>
                      )}
                    </td>
                    <td>
                      {product.isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={product.discount_percentage}
                          onChange={(e) => updateProductField(product._id, 'discount_percentage', parseFloat(e.target.value) || 0)}
                          className="table-input discount-input"
                          placeholder="0"
                        />
                      ) : (
                        <span className="discount-display">{product.discount_percentage}%</span>
                      )}
                    </td>
                    <td>
                      {product.isEditing ? (
                        <input
                          type="text"
                          value={product.sku || ''}
                          onChange={(e) => updateProductField(product._id, 'sku', e.target.value)}
                          className="table-input"
                          placeholder="SKU..."
                        />
                      ) : (
                        <span className="sku-display">
                          {product.sku || 'No SKU'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${product.is_special_offer ? 'special' : 'normal'}`}>
                        {product.is_special_offer ? '🏷️ Special' : '📦 Normal'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          onClick={() => handleEdit(product)} 
                          className="edit-btn"
                          title="Edit in modal"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(product._id)} 
                          className="delete-btn"
                          title="Delete product"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Product Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal large-modal">
              <div className="modal-header">
                <h3>{editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
                <button onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                  setImageFile(null);
                  resetForm();
                }}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="product-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Product Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
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
                    <label>Unit</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Price Per Unit</label>
                    <select
                      value={formData.price_per_unit}
                      onChange={(e) => setFormData({...formData, price_per_unit: e.target.value})}
                    >
                      {priceUnits.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Min Quantity</label>
                    <input
                      type="number"
                      step="0.25"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData({...formData, min_quantity: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Quantity (Optional)</label>
                    <input
                      type="number"
                      value={formData.max_quantity}
                      onChange={(e) => setFormData({...formData, max_quantity: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Discount Percentage</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({...formData, discount_percentage: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>🖼️ Product Image</label>
                  <div className="image-upload-section">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      className="file-input"
                    />
                    {imageFile && (
                      <div className="image-preview">
                        <img 
                          src={URL.createObjectURL(imageFile)} 
                          alt="Preview" 
                          className="preview-image"
                        />
                        <p>Selected: {imageFile.name}</p>
                      </div>
                    )}
                    {formData.image_url && !imageFile && (
                      <div className="current-image">
                        <img src={formData.image_url} alt="Current" className="preview-image" />
                        <p>Current image</p>
                      </div>
                    )}
                    <p className="help-text">📁 Upload from your computer, phone, or any drive</p>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={uploadingImage}>
                    {uploadingImage ? '⏳ Uploading...' : (editingProduct ? '💾 Update Product' : '➕ Add Product')}
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

  const SpecialOffersManagement = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [offerForm, setOfferForm] = useState({
      title: '',
      description: '',
      discount_percentage: '',
      product_ids: [],
      start_date: '',
      end_date: ''
    });

    const handleCreateOffer = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(`${backendUrl}/api/admin/special-offers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...offerForm,
            discount_percentage: parseFloat(offerForm.discount_percentage),
            start_date: new Date(offerForm.start_date),
            end_date: new Date(offerForm.end_date)
          })
        });

        if (response.ok) {
          alert('Special offer created successfully!');
          setShowCreateModal(false);
          setOfferForm({
            title: '', description: '', discount_percentage: '',
            product_ids: [], start_date: '', end_date: ''
          });
          fetchSpecialOffers();
          fetchProducts(); // Refresh products to show updated discounts
        }
      } catch (error) {
        alert('Error creating special offer');
      }
    };

    const handleDeleteOffer = async (offerId) => {
      if (window.confirm('Are you sure you want to delete this special offer?')) {
        try {
          const response = await fetch(`${backendUrl}/api/admin/special-offers/${offerId}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            alert('Special offer deleted successfully!');
            fetchSpecialOffers();
            fetchProducts(); // Refresh products to show updated prices
          }
        } catch (error) {
          alert('Error deleting special offer');
        }
      }
    };

    return (
      <div className="special-offers-management">
        <div className="management-header">
          <h2>Special Offers & Promotions</h2>
          <button 
            className="add-btn"
            onClick={() => setShowCreateModal(true)}
          >
            Create Special Offer
          </button>
        </div>

        <div className="offers-grid">
          {specialOffers.map(offer => (
            <div key={offer._id} className="offer-card">
              <h3>{offer.title}</h3>
              <p>{offer.description}</p>
              <div className="offer-details">
                <span className="discount">🏷️ {offer.discount_percentage}% OFF</span>
                <span className="products">📦 {offer.product_ids.length} products</span>
                <span className="dates">
                  📅 {new Date(offer.start_date).toLocaleDateString()} - {new Date(offer.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="offer-actions">
                <button 
                  onClick={() => handleDeleteOffer(offer._id)}
                  className="delete-btn"
                >
                  Delete Offer
                </button>
              </div>
            </div>
          ))}
        </div>

        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Create Special Offer</h3>
                <button onClick={() => setShowCreateModal(false)}>×</button>
              </div>
              <form onSubmit={handleCreateOffer} className="offer-form">
                <div className="form-group">
                  <label>Offer Title</label>
                  <input
                    type="text"
                    value={offerForm.title}
                    onChange={(e) => setOfferForm({...offerForm, title: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={offerForm.description}
                    onChange={(e) => setOfferForm({...offerForm, description: e.target.value})}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Discount Percentage</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={offerForm.discount_percentage}
                      onChange={(e) => setOfferForm({...offerForm, discount_percentage: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Select Products</label>
                  <div className="product-selector">
                    {products.map(product => (
                      <label key={product._id} className="product-checkbox">
                        <input
                          type="checkbox"
                          checked={offerForm.product_ids.includes(product._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setOfferForm(prev => ({
                                ...prev,
                                product_ids: [...prev.product_ids, product._id]
                              }));
                            } else {
                              setOfferForm(prev => ({
                                ...prev,
                                product_ids: prev.product_ids.filter(id => id !== product._id)
                              }));
                            }
                          }}
                        />
                        {product.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="datetime-local"
                      value={offerForm.start_date}
                      onChange={(e) => setOfferForm({...offerForm, start_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="datetime-local"
                      value={offerForm.end_date}
                      onChange={(e) => setOfferForm({...offerForm, end_date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    Create Offer
                  </button>
                  <button type="button" onClick={() => setShowCreateModal(false)}>
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
              <th>Customer</th>
              <th>Email</th>
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
                <td>{order.customer_name || 'N/A'}</td>
                <td>{order.customer_email || 'N/A'}</td>
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
              <th>Role</th>
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
                <td>
                  <span className={`role ${user.role || 'customer'}`}>
                    {user.role || 'customer'}
                  </span>
                </td>
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

  const EmailManagement = () => {
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [bulkEmailForm, setBulkEmailForm] = useState({
      subject: '',
      message: '',
      recipient_type: 'all'
    });
    const [customEmailForm, setCustomEmailForm] = useState({
      subject: '',
      message: '',
      recipient_emails: ''
    });

    useEffect(() => {
      fetchEmailCampaigns();
    }, []);

    const fetchEmailCampaigns = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/email-campaigns`);
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data.campaigns || []);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    };

    const handleBulkEmail = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(`${backendUrl}/api/admin/send-bulk-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bulkEmailForm)
        });

        if (response.ok) {
          const data = await response.json();
          alert(`Bulk email sent successfully! ${data.sent_count} emails sent, ${data.failed_count} failed.`);
          setShowBulkModal(false);
          setBulkEmailForm({ subject: '', message: '', recipient_type: 'all' });
          fetchEmailCampaigns();
        } else {
          alert('Error sending bulk email');
        }
      } catch (error) {
        alert('Error sending bulk email');
      }
    };

    const handleCustomEmail = async (e) => {
      e.preventDefault();
      try {
        const emailList = customEmailForm.recipient_emails
          .split(',')
          .map(email => email.trim())
          .filter(email => email);

        const response = await fetch(`${backendUrl}/api/admin/send-custom-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...customEmailForm,
            recipient_emails: emailList
          })
        });

        if (response.ok) {
          const data = await response.json();
          alert(`Custom email sent successfully! ${data.sent_count} emails sent, ${data.failed_count} failed.`);
          setShowCustomModal(false);
          setCustomEmailForm({ subject: '', message: '', recipient_emails: '' });
          fetchEmailCampaigns();
        } else {
          alert('Error sending custom email');
        }
      } catch (error) {
        alert('Error sending custom email');
      }
    };

    return (
      <div className="email-management">
        <div className="management-header">
          <h2>📧 Email Marketing & Communication</h2>
          <div className="email-actions">
            <button 
              className="bulk-email-btn"
              onClick={() => setShowBulkModal(true)}
            >
              📢 Send Bulk Email
            </button>
            <button 
              className="custom-email-btn"
              onClick={() => setShowCustomModal(true)}
            >
              ✉️ Send Custom Email
            </button>
          </div>
        </div>

        <div className="email-stats">
          <div className="stat-card">
            <h3>{users.length}</h3>
            <p>Total Users</p>
          </div>
          <div className="stat-card">
            <h3>{users.filter(u => u.role !== 'admin').length}</h3>
            <p>Customers</p>
          </div>
          <div className="stat-card">
            <h3>{campaigns.length}</h3>
            <p>Email Campaigns</p>
          </div>
        </div>

        <div className="campaigns-history">
          <h3>📈 Email Campaign History</h3>
          <div className="campaigns-table">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Subject</th>
                  <th>Recipients</th>
                  <th>Sent</th>
                  <th>Failed</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(campaign => (
                  <tr key={campaign._id}>
                    <td>
                      <span className={`campaign-type ${campaign.type}`}>
                        {campaign.type === 'bulk' ? '📢 Bulk' : '✉️ Custom'}
                      </span>
                    </td>
                    <td>{campaign.subject}</td>
                    <td>{campaign.total_recipients}</td>
                    <td className="success-count">{campaign.sent_count}</td>
                    <td className="error-count">{campaign.failed_count}</td>
                    <td>{new Date(campaign.sent_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Email Modal */}
        {showBulkModal && (
          <div className="modal-overlay">
            <div className="modal email-modal">
              <div className="modal-header">
                <h3>📢 Send Bulk Email</h3>
                <button onClick={() => setShowBulkModal(false)}>×</button>
              </div>
              <form onSubmit={handleBulkEmail} className="email-form">
                <div className="form-group">
                  <label>📋 Recipient Group</label>
                  <select
                    value={bulkEmailForm.recipient_type}
                    onChange={(e) => setBulkEmailForm({...bulkEmailForm, recipient_type: e.target.value})}
                    required
                  >
                    <option value="all">All Users ({users.length})</option>
                    <option value="customers">Customers Only ({users.filter(u => u.role !== 'admin').length})</option>
                    <option value="admins">Admins Only ({users.filter(u => u.role === 'admin').length})</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>📝 Email Subject</label>
                  <input
                    type="text"
                    value={bulkEmailForm.subject}
                    onChange={(e) => setBulkEmailForm({...bulkEmailForm, subject: e.target.value})}
                    placeholder="Enter email subject..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>💬 Email Message</label>
                  <textarea
                    value={bulkEmailForm.message}
                    onChange={(e) => setBulkEmailForm({...bulkEmailForm, message: e.target.value})}
                    placeholder="Write your message here... (HTML supported)"
                    rows="8"
                    required
                  />
                  <p className="help-text">💡 Tip: You can use HTML formatting in your message</p>
                </div>

                <div className="form-actions">
                  <button type="submit" className="send-btn">
                    📤 Send Bulk Email
                  </button>
                  <button type="button" onClick={() => setShowBulkModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Email Modal */}
        {showCustomModal && (
          <div className="modal-overlay">
            <div className="modal email-modal">
              <div className="modal-header">
                <h3>✉️ Send Custom Email</h3>
                <button onClick={() => setShowCustomModal(false)}>×</button>
              </div>
              <form onSubmit={handleCustomEmail} className="email-form">
                <div className="form-group">
                  <label>👥 Recipient Emails</label>
                  <textarea
                    value={customEmailForm.recipient_emails}
                    onChange={(e) => setCustomEmailForm({...customEmailForm, recipient_emails: e.target.value})}
                    placeholder="Enter email addresses separated by commas...&#10;Example: user1@email.com, user2@email.com"
                    rows="3"
                    required
                  />
                  <p className="help-text">📧 Separate multiple emails with commas</p>
                </div>

                <div className="form-group">
                  <label>📝 Email Subject</label>
                  <input
                    type="text"
                    value={customEmailForm.subject}
                    onChange={(e) => setCustomEmailForm({...customEmailForm, subject: e.target.value})}
                    placeholder="Enter email subject..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>💬 Email Message</label>
                  <textarea
                    value={customEmailForm.message}
                    onChange={(e) => setCustomEmailForm({...customEmailForm, message: e.target.value})}
                    placeholder="Write your personalized message here... (HTML supported)"
                    rows="8"
                    required
                  />
                  <p className="help-text">💡 Tip: You can use HTML formatting in your message</p>
                </div>

                <div className="form-actions">
                  <button type="submit" className="send-btn">
                    📤 Send Custom Email
                  </button>
                  <button type="button" onClick={() => setShowCustomModal(false)}>
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

  const EcommerceCustomization = () => {
    const [settings, setSettings] = useState({
      store_name: "German Butchery",
      store_tagline: "Premium Quality Meats & Fresh Groceries",
      primary_color: "#dc2626",
      secondary_color: "#991b1b",
      currency: "RWF",
      currency_symbol: "RWF",
      tax_rate: 0.0,
      enable_delivery: true,
      enable_pickup: true,
      checkout_fields: {
        require_phone: true,
        require_address: true,
        allow_notes: true
      },
      order_statuses: ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"]
    });
    const [deliveryZones, setDeliveryZones] = useState([]);
    const [showZoneModal, setShowZoneModal] = useState(false);
    const [editingZone, setEditingZone] = useState(null);
    const [zoneForm, setZoneForm] = useState({
      name: '',
      areas: '',
      base_fee: '',
      per_km_rate: '',
      min_order_for_free: ''
    });

    useEffect(() => {
      fetchSettings();
      fetchDeliveryZones();
    }, []);

    const fetchSettings = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/ecommerce-settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    const fetchDeliveryZones = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/delivery-zones`);
        if (response.ok) {
          const data = await response.json();
          setDeliveryZones(data.zones || []);
        }
      } catch (error) {
        console.error('Error fetching delivery zones:', error);
      }
    };

    const handleSettingsUpdate = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/ecommerce-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });

        if (response.ok) {
          alert('Settings updated successfully!');
        }
      } catch (error) {
        alert('Error updating settings');
      }
    };

    const handleZoneSubmit = async (e) => {
      e.preventDefault();
      try {
        const zoneData = {
          ...zoneForm,
          areas: zoneForm.areas.split(',').map(area => area.trim()),
          base_fee: parseFloat(zoneForm.base_fee),
          per_km_rate: parseFloat(zoneForm.per_km_rate),
          min_order_for_free: zoneForm.min_order_for_free ? parseFloat(zoneForm.min_order_for_free) : null
        };

        const url = editingZone 
          ? `${backendUrl}/api/admin/delivery-zones/${editingZone._id}`
          : `${backendUrl}/api/admin/delivery-zones`;
        
        const method = editingZone ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(zoneData)
        });

        if (response.ok) {
          alert(editingZone ? 'Zone updated successfully!' : 'Zone created successfully!');
          setShowZoneModal(false);
          setEditingZone(null);
          setZoneForm({ name: '', areas: '', base_fee: '', per_km_rate: '', min_order_for_free: '' });
          fetchDeliveryZones();
        }
      } catch (error) {
        alert('Error saving zone');
      }
    };

    const handleDeleteZone = async (zoneId) => {
      if (window.confirm('Are you sure you want to delete this delivery zone?')) {
        try {
          const response = await fetch(`${backendUrl}/api/admin/delivery-zones/${zoneId}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            alert('Zone deleted successfully!');
            fetchDeliveryZones();
          }
        } catch (error) {
          alert('Error deleting zone');
        }
      }
    };

    const editZone = (zone) => {
      setEditingZone(zone);
      setZoneForm({
        name: zone.name,
        areas: zone.areas.join(', '),
        base_fee: zone.base_fee.toString(),
        per_km_rate: zone.per_km_rate.toString(),
        min_order_for_free: zone.min_order_for_free?.toString() || ''
      });
      setShowZoneModal(true);
    };

    return (
      <div className="ecommerce-customization">
        <h2 className="text-3xl font-bold mb-8">🎨 E-commerce Customization</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Store Settings */}
          <div className="customization-section">
            <h3 className="text-xl font-semibold mb-4">🏪 Store Settings</h3>
            <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
              <div>
                <label className="block font-medium mb-2">Store Name</label>
                <input
                  type="text"
                  value={settings.store_name}
                  onChange={(e) => setSettings({...settings, store_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Store Tagline</label>
                <input
                  type="text"
                  value={settings.store_tagline}
                  onChange={(e) => setSettings({...settings, store_tagline: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2">Primary Color</label>
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                    className="w-full h-10 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Secondary Color</label>
                  <input
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                    className="w-full h-10 border rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({...settings, currency: e.target.value, currency_symbol: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="RWF">RWF - Rwandan Franc</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.tax_rate}
                    onChange={(e) => setSettings({...settings, tax_rate: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.enable_delivery}
                    onChange={(e) => setSettings({...settings, enable_delivery: e.target.checked})}
                    className="mr-2"
                  />
                  Enable Home Delivery
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.enable_pickup}
                    onChange={(e) => setSettings({...settings, enable_pickup: e.target.checked})}
                    className="mr-2"
                  />
                  Enable Store Pickup
                </label>
              </div>

              <button
                onClick={handleSettingsUpdate}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
              >
                💾 Save Store Settings
              </button>
            </div>
          </div>

          {/* Delivery Zones */}
          <div className="customization-section">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">🚚 Delivery Zones</h3>
              <button
                onClick={() => setShowZoneModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
              >
                ➕ Add Zone
              </button>
            </div>

            <div className="space-y-4">
              {deliveryZones.map(zone => (
                <div key={zone._id} className="bg-white p-4 rounded-lg shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{zone.name}</h4>
                      <p className="text-gray-600">Areas: {zone.areas.join(', ')}</p>
                      <p className="text-sm text-gray-500">
                        Base Fee: RWF {zone.base_fee.toLocaleString()} | 
                        Per KM: RWF {zone.per_km_rate.toLocaleString()}
                      </p>
                      {zone.min_order_for_free && (
                        <p className="text-sm text-green-600">
                          Free delivery on orders above RWF {zone.min_order_for_free.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => editZone(zone)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteZone(zone._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Checkout Settings */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">🛒 Checkout Settings</h3>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.checkout_fields.require_phone}
                  onChange={(e) => setSettings({
                    ...settings,
                    checkout_fields: {...settings.checkout_fields, require_phone: e.target.checked}
                  })}
                  className="mr-2"
                />
                Require Phone Number
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.checkout_fields.require_address}
                  onChange={(e) => setSettings({
                    ...settings,
                    checkout_fields: {...settings.checkout_fields, require_address: e.target.checked}
                  })}
                  className="mr-2"
                />
                Require Address
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.checkout_fields.allow_notes}
                  onChange={(e) => setSettings({
                    ...settings,
                    checkout_fields: {...settings.checkout_fields, allow_notes: e.target.checked}
                  })}
                  className="mr-2"
                />
                Allow Order Notes
              </label>
            </div>
          </div>
        </div>

        {/* Order Statuses */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">📋 Order Status Management</h3>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-wrap gap-3">
              {settings.order_statuses.map((status, index) => (
                <div key={index} className="flex items-center bg-gray-100 px-3 py-2 rounded-md">
                  <span className="mr-2">{status}</span>
                  <button
                    onClick={() => {
                      const newStatuses = settings.order_statuses.filter((_, i) => i !== index);
                      setSettings({...settings, order_statuses: newStatuses});
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newStatus = prompt('Enter new order status:');
                  if (newStatus) {
                    setSettings({
                      ...settings,
                      order_statuses: [...settings.order_statuses, newStatus.toLowerCase()]
                    });
                  }
                }}
                className="bg-gray-200 px-3 py-2 rounded-md hover:bg-gray-300 transition"
              >
                + Add Status
              </button>
            </div>
          </div>
        </div>

        {/* Zone Modal */}
        {showZoneModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editingZone ? 'Edit Delivery Zone' : 'Add Delivery Zone'}</h3>
                <button onClick={() => {
                  setShowZoneModal(false);
                  setEditingZone(null);
                  setZoneForm({ name: '', areas: '', base_fee: '', per_km_rate: '', min_order_for_free: '' });
                }}>×</button>
              </div>
              <form onSubmit={handleZoneSubmit} className="zone-form p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block font-medium mb-2">Zone Name</label>
                    <input
                      type="text"
                      value={zoneForm.name}
                      onChange={(e) => setZoneForm({...zoneForm, name: e.target.value})}
                      placeholder="e.g., Kigali City Center"
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-2">Areas (comma-separated)</label>
                    <textarea
                      value={zoneForm.areas}
                      onChange={(e) => setZoneForm({...zoneForm, areas: e.target.value})}
                      placeholder="e.g., Nyarugenge, Gasabo, Kicukiro"
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-2">Base Fee (RWF)</label>
                      <input
                        type="number"
                        value={zoneForm.base_fee}
                        onChange={(e) => setZoneForm({...zoneForm, base_fee: e.target.value})}
                        placeholder="2000"
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-2">Per KM Rate (RWF)</label>
                      <input
                        type="number"
                        value={zoneForm.per_km_rate}
                        onChange={(e) => setZoneForm({...zoneForm, per_km_rate: e.target.value})}
                        placeholder="300"
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium mb-2">Free Delivery Threshold (RWF) - Optional</label>
                    <input
                      type="number"
                      value={zoneForm.min_order_for_free}
                      onChange={(e) => setZoneForm({...zoneForm, min_order_for_free: e.target.value})}
                      placeholder="25000"
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
                    {editingZone ? 'Update Zone' : 'Create Zone'}
                  </button>
                  <button type="button" onClick={() => setShowZoneModal(false)} className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition">
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

  const FrontendThemeCustomization = () => {
    const [themeSettings, setThemeSettings] = useState({
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      accentColor: '#f59e0b',
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
      borderRadius: '8',
      spacing: 'normal',
      fontFamily: 'Inter',
      tableRowHeight: 'normal',
      hoverEffect: 'enabled',
      animationSpeed: 'normal'
    });

    const [customCSS, setCustomCSS] = useState('');
    const [livePreview, setLivePreview] = useState(false);

    const spacingOptions = [
      { value: 'compact', label: 'Compact (Less Spacing)' },
      { value: 'normal', label: 'Normal (Default)' },
      { value: 'comfortable', label: 'Comfortable (More Spacing)' },
      { value: 'spacious', label: 'Spacious (Maximum Spacing)' }
    ];

    const fontOptions = [
      { value: 'Inter', label: 'Inter (Modern Sans-serif)' },
      { value: 'Roboto', label: 'Roboto (Google Font)' },
      { value: 'Open Sans', label: 'Open Sans (Clean)' },
      { value: 'Poppins', label: 'Poppins (Rounded)' },
      { value: 'Montserrat', label: 'Montserrat (Elegant)' }
    ];

    const rowHeightOptions = [
      { value: 'compact', label: 'Compact (40px)' },
      { value: 'normal', label: 'Normal (60px)' },
      { value: 'comfortable', label: 'Comfortable (80px)' },
      { value: 'spacious', label: 'Spacious (100px)' }
    ];

    const handleThemeUpdate = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/frontend-theme`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...themeSettings,
            customCSS,
            updatedAt: new Date()
          })
        });

        if (response.ok) {
          alert('Theme settings updated successfully!');
          if (livePreview) {
            applyThemePreview();
          }
        }
      } catch (error) {
        alert('Error updating theme settings');
      }
    };

    const applyThemePreview = () => {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', themeSettings.primaryColor);
      root.style.setProperty('--secondary-color', themeSettings.secondaryColor);
      root.style.setProperty('--accent-color', themeSettings.accentColor);
      root.style.setProperty('--bg-color', themeSettings.backgroundColor);
      root.style.setProperty('--text-color', themeSettings.textColor);
      root.style.setProperty('--border-radius', themeSettings.borderRadius + 'px');
    };

    const resetTheme = () => {
      setThemeSettings({
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        accentColor: '#f59e0b',
        backgroundColor: '#f8fafc',
        textColor: '#1e293b',
        borderRadius: '8',
        spacing: 'normal',
        fontFamily: 'Inter',
        tableRowHeight: 'normal',
        hoverEffect: 'enabled',
        animationSpeed: 'normal'
      });
      setCustomCSS('');
    };

    return (
      <div className="frontend-theme-customization">
        <div className="customization-header">
          <h2>🎨 Frontend Theme Customization</h2>
          <div className="theme-actions">
            <label className="preview-toggle">
              <input
                type="checkbox"
                checked={livePreview}
                onChange={(e) => setLivePreview(e.target.checked)}
              />
              Live Preview
            </label>
            <button onClick={resetTheme} className="reset-btn">
              🔄 Reset to Default
            </button>
            <button onClick={handleThemeUpdate} className="update-btn">
              💾 Save Theme
            </button>
          </div>
        </div>

        <div className="theme-settings-grid">
          {/* Color Settings */}
          <div className="settings-section">
            <h3>🎨 Color Scheme</h3>
            <div className="color-settings">
              <div className="color-group">
                <label>Primary Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={themeSettings.primaryColor}
                    onChange={(e) => setThemeSettings({...themeSettings, primaryColor: e.target.value})}
                  />
                  <input
                    type="text"
                    value={themeSettings.primaryColor}
                    onChange={(e) => setThemeSettings({...themeSettings, primaryColor: e.target.value})}
                    className="color-text-input"
                  />
                </div>
              </div>

              <div className="color-group">
                <label>Secondary Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={themeSettings.secondaryColor}
                    onChange={(e) => setThemeSettings({...themeSettings, secondaryColor: e.target.value})}
                  />
                  <input
                    type="text"
                    value={themeSettings.secondaryColor}
                    onChange={(e) => setThemeSettings({...themeSettings, secondaryColor: e.target.value})}
                    className="color-text-input"
                  />
                </div>
              </div>

              <div className="color-group">
                <label>Accent Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={themeSettings.accentColor}
                    onChange={(e) => setThemeSettings({...themeSettings, accentColor: e.target.value})}
                  />
                  <input
                    type="text"
                    value={themeSettings.accentColor}
                    onChange={(e) => setThemeSettings({...themeSettings, accentColor: e.target.value})}
                    className="color-text-input"
                  />
                </div>
              </div>

              <div className="color-group">
                <label>Background Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={themeSettings.backgroundColor}
                    onChange={(e) => setThemeSettings({...themeSettings, backgroundColor: e.target.value})}
                  />
                  <input
                    type="text"
                    value={themeSettings.backgroundColor}
                    onChange={(e) => setThemeSettings({...themeSettings, backgroundColor: e.target.value})}
                    className="color-text-input"
                  />
                </div>
              </div>

              <div className="color-group">
                <label>Text Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={themeSettings.textColor}
                    onChange={(e) => setThemeSettings({...themeSettings, textColor: e.target.value})}
                  />
                  <input
                    type="text"
                    value={themeSettings.textColor}
                    onChange={(e) => setThemeSettings({...themeSettings, textColor: e.target.value})}
                    className="color-text-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Layout Settings */}
          <div className="settings-section">
            <h3>📐 Layout & Spacing</h3>
            <div className="layout-settings">
              <div className="setting-group">
                <label>Border Radius (px)</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={themeSettings.borderRadius}
                  onChange={(e) => setThemeSettings({...themeSettings, borderRadius: e.target.value})}
                />
                <span className="range-value">{themeSettings.borderRadius}px</span>
              </div>

              <div className="setting-group">
                <label>Overall Spacing</label>
                <select
                  value={themeSettings.spacing}
                  onChange={(e) => setThemeSettings({...themeSettings, spacing: e.target.value})}
                >
                  {spacingOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="setting-group">
                <label>Table Row Height</label>
                <select
                  value={themeSettings.tableRowHeight}
                  onChange={(e) => setThemeSettings({...themeSettings, tableRowHeight: e.target.value})}
                >
                  {rowHeightOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="setting-group">
                <label>Font Family</label>
                <select
                  value={themeSettings.fontFamily}
                  onChange={(e) => setThemeSettings({...themeSettings, fontFamily: e.target.value})}
                >
                  {fontOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Animation & Effects */}
          <div className="settings-section">
            <h3>✨ Animation & Effects</h3>
            <div className="effects-settings">
              <div className="setting-group">
                <label>Hover Effects</label>
                <select
                  value={themeSettings.hoverEffect}
                  onChange={(e) => setThemeSettings({...themeSettings, hoverEffect: e.target.value})}
                >
                  <option value="disabled">Disabled</option>
                  <option value="subtle">Subtle</option>
                  <option value="enabled">Normal</option>
                  <option value="enhanced">Enhanced</option>
                </select>
              </div>

              <div className="setting-group">
                <label>Animation Speed</label>
                <select
                  value={themeSettings.animationSpeed}
                  onChange={(e) => setThemeSettings({...themeSettings, animationSpeed: e.target.value})}
                >
                  <option value="slow">Slow (0.5s)</option>
                  <option value="normal">Normal (0.3s)</option>
                  <option value="fast">Fast (0.15s)</option>
                  <option value="instant">Instant (0s)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Custom CSS Editor */}
        <div className="custom-css-section">
          <h3>💻 Custom CSS</h3>
          <p className="help-text">Add your custom CSS to override default styles. Changes will be applied instantly.</p>
          <textarea
            value={customCSS}
            onChange={(e) => setCustomCSS(e.target.value)}
            className="css-editor"
            placeholder="/* Add your custom CSS here */
.products-table {
  /* Custom table styles */
}

.product-card:hover {
  /* Custom hover effects */
}"
            rows="10"
          />
        </div>

        {/* Theme Preview */}
        <div className="theme-preview-section">
          <h3>👀 Theme Preview</h3>
          <div className="preview-container">
            <div className="preview-table" style={{
              '--primary': themeSettings.primaryColor,
              '--secondary': themeSettings.secondaryColor,
              '--accent': themeSettings.accentColor,
              borderRadius: themeSettings.borderRadius + 'px',
              fontFamily: themeSettings.fontFamily
            }}>
              <div className="preview-header" style={{background: themeSettings.primaryColor, color: 'white'}}>
                Sample Table Header
              </div>
              <div className="preview-row" style={{
                padding: themeSettings.spacing === 'compact' ? '8px' : 
                        themeSettings.spacing === 'comfortable' ? '16px' : 
                        themeSettings.spacing === 'spacious' ? '24px' : '12px'
              }}>
                <span>Sample Product Name</span>
                <span style={{color: themeSettings.accentColor}}>RWF 5,000</span>
                <span>In Stock</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <ProductManagement />;
      case 'offers':
        return <SpecialOffersManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'users':
        return <UserManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'emails':
        return <EmailManagement />;
      case 'settings':
        return <EcommerceCustomization />;
      case 'frontend':
        return <FrontendThemeCustomization />;
      case 'sliders':
        return <SliderManagement />;
      case 'builder':
        return <WebsiteBuilder />;
      case 'maintenance':
        return <MaintenanceMode />;
      case 'whatsapp':
        return <WhatsAppIntegration />;
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
            className={activeTab === 'offers' ? 'active' : ''}
            onClick={() => setActiveTab('offers')}
          >
            🏷️ Special Offers
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
          <button 
            className={activeTab === 'emails' ? 'active' : ''}
            onClick={() => setActiveTab('emails')}
          >
            📧 Email Marketing
          </button>
          <button 
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
          <button 
            className={activeTab === 'frontend' ? 'active' : ''}
            onClick={() => setActiveTab('frontend')}
          >
            🎨 Frontend Theme
          </button>
          <button 
            className={activeTab === 'sliders' ? 'active' : ''}
            onClick={() => setActiveTab('sliders')}
          >
            🖼️ Slider Management
          </button>
          <button 
            className={activeTab === 'builder' ? 'active' : ''}
            onClick={() => setActiveTab('builder')}
          >
            🏗️ Website Builder
          </button>
          <button 
            className={activeTab === 'maintenance' ? 'active' : ''}
            onClick={() => setActiveTab('maintenance')}
          >
            🔧 Maintenance Mode
          </button>
          <button 
            className={activeTab === 'whatsapp' ? 'active' : ''}
            onClick={() => setActiveTab('whatsapp')}
          >
            📱 WhatsApp Integration
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