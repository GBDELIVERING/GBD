import React, { useState, useEffect } from 'react';
import './Admin.css';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('uxbuilder'); // Default to UX Builder
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

  const SliderManagement = () => {
    const [sliders, setSliders] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingSlider, setEditingSlider] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [sliderForm, setSliderForm] = useState({
      title: '',
      subtitle: '',
      description: '',
      image_url: '',
      button_text: '',
      button_link: '',
      order: 0,
      active: true
    });

    useEffect(() => {
      fetchSliders();
    }, []);

    const fetchSliders = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/sliders`);
        if (response.ok) {
          const data = await response.json();
          setSliders(data.sliders || []);
        }
      } catch (error) {
        console.error('Error fetching sliders:', error);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      let imageUrl = sliderForm.image_url;
      
      // Upload image if file is selected
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
        if (!imageUrl) return; // Upload failed
      }
      
      try {
        const url = editingSlider 
          ? `${backendUrl}/api/admin/sliders/${editingSlider._id}`
          : `${backendUrl}/api/admin/sliders`;
        
        const method = editingSlider ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...sliderForm,
            image_url: imageUrl,
            order: parseInt(sliderForm.order)
          })
        });

        if (response.ok) {
          alert(editingSlider ? 'Slider updated successfully!' : 'Slider created successfully!');
          setShowModal(false);
          setEditingSlider(null);
          setImageFile(null);
          resetForm();
          fetchSliders();
        }
      } catch (error) {
        alert('Error saving slider');
      }
    };

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

    const resetForm = () => {
      setSliderForm({
        title: '', subtitle: '', description: '', image_url: '',
        button_text: '', button_link: '', order: 0, active: true
      });
    };

    const handleEdit = (slider) => {
      setEditingSlider(slider);
      setSliderForm({
        title: slider.title,
        subtitle: slider.subtitle || '',
        description: slider.description || '',
        image_url: slider.image_url || '',
        button_text: slider.button_text || '',
        button_link: slider.button_link || '',
        order: slider.order,
        active: slider.active
      });
      setShowModal(true);
    };

    const handleDelete = async (sliderId) => {
      if (window.confirm('Are you sure you want to delete this slider?')) {
        try {
          const response = await fetch(`${backendUrl}/api/admin/sliders/${sliderId}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            alert('Slider deleted successfully!');
            fetchSliders();
          }
        } catch (error) {
          alert('Error deleting slider');
        }
      }
    };

    return (
      <div className="slider-management">
        <div className="management-header">
          <h2>🖼️ Slider Management</h2>
          <button 
            className="add-btn"
            onClick={() => setShowModal(true)}
          >
            ➕ Add New Slider
          </button>
        </div>

        <div className="sliders-grid">
          {sliders.map(slider => (
            <div key={slider._id} className="slider-card">
              <div className="slider-preview">
                <img src={slider.image_url} alt={slider.title} className="slider-image" />
                <div className="slider-overlay">
                  <h3>{slider.title}</h3>
                  {slider.subtitle && <h4>{slider.subtitle}</h4>}
                  {slider.description && <p>{slider.description}</p>}
                  {slider.button_text && (
                    <button className="preview-btn">{slider.button_text}</button>
                  )}
                </div>
              </div>
              <div className="slider-info">
                <div className="slider-meta">
                  <span className="order-badge">Order: {slider.order}</span>
                  <span className={`status-badge ${slider.active ? 'active' : 'inactive'}`}>
                    {slider.active ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
                <div className="slider-actions">
                  <button 
                    onClick={() => handleEdit(slider)} 
                    className="edit-btn"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(slider._id)} 
                    className="delete-btn"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Slider Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal large-modal">
              <div className="modal-header">
                <h3>{editingSlider ? '✏️ Edit Slider' : '➕ Add New Slider'}</h3>
                <button onClick={() => {
                  setShowModal(false);
                  setEditingSlider(null);
                  setImageFile(null);
                  resetForm();
                }}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="slider-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={sliderForm.title}
                      onChange={(e) => setSliderForm({...sliderForm, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Subtitle (Optional)</label>
                    <input
                      type="text"
                      value={sliderForm.subtitle}
                      onChange={(e) => setSliderForm({...sliderForm, subtitle: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    value={sliderForm.description}
                    onChange={(e) => setSliderForm({...sliderForm, description: e.target.value})}
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Button Text (Optional)</label>
                    <input
                      type="text"
                      value={sliderForm.button_text}
                      onChange={(e) => setSliderForm({...sliderForm, button_text: e.target.value})}
                      placeholder="Shop Now, Learn More, etc."
                    />
                  </div>
                  <div className="form-group">
                    <label>Button Link (Optional)</label>
                    <input
                      type="url"
                      value={sliderForm.button_link}
                      onChange={(e) => setSliderForm({...sliderForm, button_link: e.target.value})}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Display Order</label>
                    <input
                      type="number"
                      value={sliderForm.order}
                      onChange={(e) => setSliderForm({...sliderForm, order: e.target.value})}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={sliderForm.active}
                      onChange={(e) => setSliderForm({...sliderForm, active: e.target.value === 'true'})}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>🖼️ Slider Image</label>
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
                    {sliderForm.image_url && !imageFile && (
                      <div className="current-image">
                        <img src={sliderForm.image_url} alt="Current" className="preview-image" />
                        <p>Current image</p>
                      </div>
                    )}
                    <p className="help-text">📁 Upload slider image (recommended: 1920x600px)</p>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={uploadingImage}>
                    {uploadingImage ? '⏳ Uploading...' : (editingSlider ? '💾 Update Slider' : '➕ Create Slider')}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)}>
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

  const WebsiteBuilder = () => {
    const [sections, setSections] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [sectionForm, setSectionForm] = useState({
      section_id: '',
      type: 'hero',
      title: '',
      content: {},
      order: 0,
      active: true
    });

    const sectionTypes = [
      { value: 'hero', label: 'Hero Section', description: 'Main banner with title and call-to-action' },
      { value: 'features', label: 'Features Section', description: 'Showcase product features' },
      { value: 'about', label: 'About Section', description: 'About us information' },
      { value: 'testimonials', label: 'Testimonials', description: 'Customer reviews and testimonials' },
      { value: 'gallery', label: 'Image Gallery', description: 'Photo gallery section' },
      { value: 'contact', label: 'Contact Section', description: 'Contact information and form' },
      { value: 'custom', label: 'Custom HTML', description: 'Custom HTML content' }
    ];

    useEffect(() => {
      fetchSections();
    }, []);

    const fetchSections = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/sections`);
        if (response.ok) {
          const data = await response.json();
          setSections(data.sections || []);
        }
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      try {
        const url = editingSection 
          ? `${backendUrl}/api/admin/sections/${editingSection._id}`
          : `${backendUrl}/api/admin/sections`;
        
        const method = editingSection ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...sectionForm,
            order: parseInt(sectionForm.order)
          })
        });

        if (response.ok) {
          alert(editingSection ? 'Section updated successfully!' : 'Section created successfully!');
          setShowModal(false);
          setEditingSection(null);
          resetSectionForm();
          fetchSections();
        }
      } catch (error) {
        alert('Error saving section');
      }
    };

    const resetSectionForm = () => {
      setSectionForm({
        section_id: '', type: 'hero', title: '', content: {}, order: 0, active: true
      });
    };

    const handleEdit = (section) => {
      setEditingSection(section);
      setSectionForm({
        section_id: section.section_id,
        type: section.type,
        title: section.title,
        content: section.content,
        order: section.order,
        active: section.active
      });
      setShowModal(true);
    };

    const handleDelete = async (sectionId) => {
      if (window.confirm('Are you sure you want to delete this section?')) {
        try {
          const response = await fetch(`${backendUrl}/api/admin/sections/${sectionId}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            alert('Section deleted successfully!');
            fetchSections();
          }
        } catch (error) {
          alert('Error deleting section');
        }
      }
    };

    const renderContentEditor = () => {
      const updateContent = (key, value) => {
        setSectionForm({
          ...sectionForm,
          content: { ...sectionForm.content, [key]: value }
        });
      };

      switch (sectionForm.type) {
        case 'hero':
          return (
            <div className="content-editor">
              <h4>Hero Section Content</h4>
              <div className="form-group">
                <label>Headline</label>
                <input
                  type="text"
                  value={sectionForm.content.headline || ''}
                  onChange={(e) => updateContent('headline', e.target.value)}
                  placeholder="Welcome to our store"
                />
              </div>
              <div className="form-group">
                <label>Subheadline</label>
                <input
                  type="text"
                  value={sectionForm.content.subheadline || ''}
                  onChange={(e) => updateContent('subheadline', e.target.value)}
                  placeholder="Your tagline here"
                />
              </div>
              <div className="form-group">
                <label>Background Image URL</label>
                <input
                  type="url"
                  value={sectionForm.content.background_image || ''}
                  onChange={(e) => updateContent('background_image', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="form-group">
                <label>Call-to-Action Text</label>
                <input
                  type="text"
                  value={sectionForm.content.cta_text || ''}
                  onChange={(e) => updateContent('cta_text', e.target.value)}
                  placeholder="Shop Now"
                />
              </div>
              <div className="form-group">
                <label>Call-to-Action Link</label>
                <input
                  type="url"
                  value={sectionForm.content.cta_link || ''}
                  onChange={(e) => updateContent('cta_link', e.target.value)}
                  placeholder="#products"
                />
              </div>
            </div>
          );
        case 'features':
          return (
            <div className="content-editor">
              <h4>Features Section Content</h4>
              <div className="form-group">
                <label>Features (JSON format)</label>
                <textarea
                  value={JSON.stringify(sectionForm.content.features || [], null, 2)}
                  onChange={(e) => {
                    try {
                      updateContent('features', JSON.parse(e.target.value));
                    } catch (err) {
                      // Invalid JSON, don't update
                    }
                  }}
                  rows="8"
                  placeholder='[{"title": "Feature 1", "description": "Description", "icon": "🚀"}]'
                />
              </div>
            </div>
          );
        case 'custom':
          return (
            <div className="content-editor">
              <h4>Custom HTML Content</h4>
              <div className="form-group">
                <label>HTML Content</label>
                <textarea
                  value={sectionForm.content.html || ''}
                  onChange={(e) => updateContent('html', e.target.value)}
                  rows="10"
                  placeholder="<div>Your custom HTML here</div>"
                />
              </div>
            </div>
          );
        default:
          return (
            <div className="content-editor">
              <h4>Content (JSON format)</h4>
              <div className="form-group">
                <textarea
                  value={JSON.stringify(sectionForm.content, null, 2)}
                  onChange={(e) => {
                    try {
                      setSectionForm({...sectionForm, content: JSON.parse(e.target.value)});
                    } catch (err) {
                      // Invalid JSON, don't update
                    }
                  }}
                  rows="6"
                  placeholder='{"key": "value"}'
                />
              </div>
            </div>
          );
      }
    };

    return (
      <div className="website-builder">
        <div className="management-header">
          <h2>🏗️ Website Builder</h2>
          <button 
            className="add-btn"
            onClick={() => setShowModal(true)}
          >
            ➕ Add New Section
          </button>
        </div>

        <div className="sections-list">
          {sections.map(section => (
            <div key={section._id} className="section-card">
              <div className="section-header">
                <div className="section-info">
                  <h3>{section.title}</h3>
                  <div className="section-meta">
                    <span className="type-badge">{section.type}</span>
                    <span className="order-badge">Order: {section.order}</span>
                    <span className={`status-badge ${section.active ? 'active' : 'inactive'}`}>
                      {section.active ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </div>
                </div>
                <div className="section-actions">
                  <button 
                    onClick={() => handleEdit(section)} 
                    className="edit-btn"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(section._id)} 
                    className="delete-btn"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              <div className="section-preview">
                <pre>{JSON.stringify(section.content, null, 2)}</pre>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Section Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal large-modal">
              <div className="modal-header">
                <h3>{editingSection ? '✏️ Edit Section' : '➕ Add New Section'}</h3>
                <button onClick={() => {
                  setShowModal(false);
                  setEditingSection(null);
                  resetSectionForm();
                }}>×</button>
              </div>
              <form onSubmit={handleSubmit} className="section-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Section ID</label>
                    <input
                      type="text"
                      value={sectionForm.section_id}
                      onChange={(e) => setSectionForm({...sectionForm, section_id: e.target.value})}
                      placeholder="hero-section, features-section, etc."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Section Type</label>
                    <select
                      value={sectionForm.type}
                      onChange={(e) => setSectionForm({...sectionForm, type: e.target.value})}
                      required
                    >
                      {sectionTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label} - {type.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Section Title</label>
                  <input
                    type="text"
                    value={sectionForm.title}
                    onChange={(e) => setSectionForm({...sectionForm, title: e.target.value})}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Display Order</label>
                    <input
                      type="number"
                      value={sectionForm.order}
                      onChange={(e) => setSectionForm({...sectionForm, order: e.target.value})}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={sectionForm.active}
                      onChange={(e) => setSectionForm({...sectionForm, active: e.target.value === 'true'})}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                {renderContentEditor()}

                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    {editingSection ? '💾 Update Section' : '➕ Create Section'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)}>
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

  const MaintenanceMode = () => {
    const [maintenanceSettings, setMaintenanceSettings] = useState({
      enabled: false,
      title: 'Site Under Maintenance',
      message: 'We are currently performing scheduled maintenance. Please check back soon!',
      estimated_time: '',
      contact_email: ''
    });

    useEffect(() => {
      fetchMaintenanceSettings();
    }, []);

    const fetchMaintenanceSettings = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/maintenance`);
        if (response.ok) {
          const data = await response.json();
          setMaintenanceSettings(data);
        }
      } catch (error) {
        console.error('Error fetching maintenance settings:', error);
      }
    };

    const handleToggleMaintenance = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/maintenance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(maintenanceSettings)
        });

        if (response.ok) {
          alert(`Maintenance mode ${maintenanceSettings.enabled ? 'enabled' : 'disabled'} successfully!`);
          fetchMaintenanceSettings();
        }
      } catch (error) {
        alert('Error updating maintenance mode');
      }
    };

    return (
      <div className="maintenance-mode">
        <div className="maintenance-header">
          <h2>🔧 Maintenance Mode</h2>
          <div className="maintenance-status">
            <span className={`status-indicator ${maintenanceSettings.enabled ? 'enabled' : 'disabled'}`}>
              {maintenanceSettings.enabled ? '🔴 Maintenance Active' : '🟢 Site Online'}
            </span>
          </div>
        </div>

        <div className="maintenance-settings">
          <div className="settings-card">
            <h3>Maintenance Settings</h3>
            
            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={maintenanceSettings.enabled}
                  onChange={(e) => setMaintenanceSettings({
                    ...maintenanceSettings,
                    enabled: e.target.checked
                  })}
                />
                <span className="toggle-text">Enable Maintenance Mode</span>
              </label>
              <p className="help-text">
                When enabled, visitors will see a maintenance page. Admins can still access the site.
              </p>
            </div>

            <div className="form-group">
              <label>Maintenance Page Title</label>
              <input
                type="text"
                value={maintenanceSettings.title}
                onChange={(e) => setMaintenanceSettings({
                  ...maintenanceSettings,
                  title: e.target.value
                })}
                placeholder="Site Under Maintenance"
              />
            </div>

            <div className="form-group">
              <label>Maintenance Message</label>
              <textarea
                value={maintenanceSettings.message}
                onChange={(e) => setMaintenanceSettings({
                  ...maintenanceSettings,
                  message: e.target.value
                })}
                rows="4"
                placeholder="We are currently performing scheduled maintenance. Please check back soon!"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Estimated Time (Optional)</label>
                <input
                  type="text"
                  value={maintenanceSettings.estimated_time}
                  onChange={(e) => setMaintenanceSettings({
                    ...maintenanceSettings,
                    estimated_time: e.target.value
                  })}
                  placeholder="2 hours, Tomorrow 9 AM, etc."
                />
              </div>
              <div className="form-group">
                <label>Contact Email (Optional)</label>
                <input
                  type="email"
                  value={maintenanceSettings.contact_email}
                  onChange={(e) => setMaintenanceSettings({
                    ...maintenanceSettings,
                    contact_email: e.target.value
                  })}
                  placeholder="support@yourstore.com"
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                onClick={handleToggleMaintenance}
                className={`maintenance-btn ${maintenanceSettings.enabled ? 'disable' : 'enable'}`}
              >
                {maintenanceSettings.enabled ? '🟢 Disable Maintenance' : '🔴 Enable Maintenance'}
              </button>
            </div>
          </div>

          <div className="maintenance-preview">
            <h3>Preview</h3>
            <div className="preview-container">
              <div className="maintenance-preview-page">
                <h2>{maintenanceSettings.title}</h2>
                <p>{maintenanceSettings.message}</p>
                {maintenanceSettings.estimated_time && (
                  <p><strong>Estimated completion:</strong> {maintenanceSettings.estimated_time}</p>
                )}
                {maintenanceSettings.contact_email && (
                  <p><strong>Contact:</strong> {maintenanceSettings.contact_email}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const WhatsAppIntegration = () => {
    const [whatsappSettings, setWhatsappSettings] = useState({
      enabled: false,
      phone_number: '',
      auto_send: false,
      message_template: 'default'
    });
    const [testOrder, setTestOrder] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [formattedMessage, setFormattedMessage] = useState('');

    useEffect(() => {
      fetchWhatsappSettings();
    }, []);

    const fetchWhatsappSettings = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/whatsapp/settings`);
        if (response.ok) {
          const data = await response.json();
          setWhatsappSettings(data);
        }
      } catch (error) {
        console.error('Error fetching WhatsApp settings:', error);
      }
    };

    const handleSaveSettings = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/whatsapp/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(whatsappSettings)
        });

        if (response.ok) {
          alert('WhatsApp settings saved successfully!');
        }
      } catch (error) {
        alert('Error saving WhatsApp settings');
      }
    };

    const handleTestOrder = async () => {
      if (!testOrder || !whatsappSettings.phone_number) {
        alert('Please enter an order ID and phone number');
        return;
      }

      try {
        const response = await fetch(`${backendUrl}/api/admin/whatsapp/send-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: testOrder,
            phone_number: whatsappSettings.phone_number
          })
        });

        if (response.ok) {
          const data = await response.json();
          setGeneratedUrl(data.whatsapp_url);
          setFormattedMessage(data.formatted_message);
        } else {
          alert('Error generating WhatsApp message');
        }
      } catch (error) {
        alert('Error testing WhatsApp integration');
      }
    };

    return (
      <div className="whatsapp-integration">
        <div className="management-header">
          <h2>📱 WhatsApp Integration</h2>
          <div className="integration-status">
            <span className={`status-indicator ${whatsappSettings.enabled ? 'enabled' : 'disabled'}`}>
              {whatsappSettings.enabled ? '✅ Enabled' : '❌ Disabled'}
            </span>
          </div>
        </div>

        <div className="whatsapp-settings">
          <div className="settings-card">
            <h3>WhatsApp Settings</h3>
            
            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={whatsappSettings.enabled}
                  onChange={(e) => setWhatsappSettings({
                    ...whatsappSettings,
                    enabled: e.target.checked
                  })}
                />
                <span className="toggle-text">Enable WhatsApp Integration</span>
              </label>
            </div>

            <div className="form-group">
              <label>WhatsApp Phone Number</label>
              <input
                type="tel"
                value={whatsappSettings.phone_number}
                onChange={(e) => setWhatsappSettings({
                  ...whatsappSettings,
                  phone_number: e.target.value
                })}
                placeholder="+250783123456"
              />
              <p className="help-text">Include country code (e.g., +250783123456)</p>
            </div>

            <div className="form-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={whatsappSettings.auto_send}
                  onChange={(e) => setWhatsappSettings({
                    ...whatsappSettings,
                    auto_send: e.target.checked
                  })}
                />
                <span className="toggle-text">Auto-send new orders to WhatsApp</span>
              </label>
              <p className="help-text">Automatically generate WhatsApp links for new orders</p>
            </div>

            <div className="form-actions">
              <button onClick={handleSaveSettings} className="save-btn">
                💾 Save Settings
              </button>
            </div>
          </div>

          <div className="test-integration">
            <h3>Test Integration</h3>
            <div className="test-form">
              <div className="form-group">
                <label>Test Order ID</label>
                <input
                  type="text"
                  value={testOrder}
                  onChange={(e) => setTestOrder(e.target.value)}
                  placeholder="Enter an existing order ID"
                />
              </div>
              <button onClick={handleTestOrder} className="test-btn">
                🧪 Generate Test Message
              </button>
            </div>

            {generatedUrl && (
              <div className="test-results">
                <h4>Generated WhatsApp Link:</h4>
                <div className="url-container">
                  <a href={generatedUrl} target="_blank" rel="noopener noreferrer" className="whatsapp-link">
                    📱 Open in WhatsApp
                  </a>
                  <button 
                    onClick={() => navigator.clipboard.writeText(generatedUrl)}
                    className="copy-btn"
                  >
                    📋 Copy Link
                  </button>
                </div>

                <h4>Message Preview:</h4>
                <div className="message-preview">
                  <pre>{formattedMessage}</pre>
                </div>
              </div>
            )}
          </div>

          <div className="integration-help">
            <h3>How it works</h3>
            <div className="help-content">
              <ol>
                <li>Enable WhatsApp integration and set your phone number</li>
                <li>When customers place orders, you can send order details to WhatsApp</li>
                <li>The system generates a formatted message with order information</li>
                <li>Click the WhatsApp link to open the conversation with the formatted message</li>
                <li>You can forward the order details to your team or suppliers</li>
              </ol>
              
              <div className="benefits">
                <h4>Benefits:</h4>
                <ul>
                  <li>📱 Quick order communication</li>
                  <li>📋 Formatted order details</li>
                  <li>⚡ Instant notifications</li>
                  <li>🔗 Easy sharing with team</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const UXBuilder = () => {
    const [pages, setPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(null);
    const [components, setComponents] = useState([]);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [showPageModal, setShowPageModal] = useState(false);
    const [draggedComponent, setDraggedComponent] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [deviceView, setDeviceView] = useState('desktop');
    const [showStylePanel, setShowStylePanel] = useState(false);

    const componentLibrary = [
      { type: 'hero', name: 'Hero Section', icon: '🌟', description: 'Main banner section', category: 'sections' },
      { type: 'navbar', name: 'Navigation Bar', icon: '📍', description: 'Site navigation', category: 'sections' },
      { type: 'footer', name: 'Footer', icon: '📧', description: 'Site footer', category: 'sections' },
      { type: 'text', name: 'Text Block', icon: '📝', description: 'Rich text content', category: 'content' },
      { type: 'heading', name: 'Heading', icon: '📰', description: 'Headings (H1-H6)', category: 'content' },
      { type: 'image', name: 'Image', icon: '🖼️', description: 'Images with captions', category: 'media' },
      { type: 'gallery', name: 'Image Gallery', icon: '🎨', description: 'Photo galleries', category: 'media' },
      { type: 'video', name: 'Video', icon: '🎥', description: 'Video embeds', category: 'media' },
      { type: 'button', name: 'Button', icon: '🔘', description: 'Call-to-action buttons', category: 'interactive' },
      { type: 'form', name: 'Contact Form', icon: '📋', description: 'Contact forms', category: 'interactive' },
      { type: 'map', name: 'Map', icon: '🗺️', description: 'Google Maps embed', category: 'interactive' },
      { type: 'container', name: 'Container', icon: '📦', description: 'Group elements', category: 'layout' },
      { type: 'grid', name: 'Grid Layout', icon: '⚏', description: 'Responsive grid', category: 'layout' },
      { type: 'columns', name: 'Columns', icon: '📊', description: 'Multi-column layout', category: 'layout' },
      { type: 'spacer', name: 'Spacer', icon: '📏', description: 'Add spacing', category: 'layout' },
      { type: 'divider', name: 'Divider', icon: '➖', description: 'Visual dividers', category: 'layout' },
      { type: 'testimonial', name: 'Testimonial', icon: '💬', description: 'Customer testimonials', category: 'content' },
      { type: 'pricing', name: 'Pricing Table', icon: '💰', description: 'Pricing plans', category: 'business' },
      { type: 'features', name: 'Features List', icon: '✨', description: 'Feature highlights', category: 'business' },
      { type: 'team', name: 'Team Member', icon: '👥', description: 'Team showcase', category: 'business' }
    ];

    const componentCategories = [
      { id: 'sections', name: '📄 Sections', description: 'Large page sections' },
      { id: 'content', name: '📝 Content', description: 'Text and content blocks' },
      { id: 'media', name: '🖼️ Media', description: 'Images, videos, galleries' },
      { id: 'interactive', name: '🔧 Interactive', description: 'Forms, buttons, maps' },
      { id: 'layout', name: '📐 Layout', description: 'Structure and spacing' },
      { id: 'business', name: '💼 Business', description: 'Business-focused components' }
    ];

    const pageTemplates = [
      { id: 'blank', name: 'Blank Page', description: 'Start from scratch', thumbnail: '🏳️' },
      { id: 'business', name: 'Business Homepage', description: 'Professional business site', thumbnail: '🏢' },
      { id: 'ecommerce', name: 'E-commerce Store', description: 'Online store layout', thumbnail: '🛒' },
      { id: 'portfolio', name: 'Portfolio', description: 'Showcase your work', thumbnail: '🎨' },
      { id: 'blog', name: 'Blog', description: 'Blog-style layout', thumbnail: '📰' },
      { id: 'restaurant', name: 'Restaurant', description: 'Food & dining theme', thumbnail: '🍽️' },
      { id: 'landing', name: 'Landing Page', description: 'Single page marketing', thumbnail: '🚀' }
    ];

    const deviceViews = [
      { id: 'desktop', name: 'Desktop', icon: '🖥️', width: '100%', height: '800px' },
      { id: 'tablet', name: 'Tablet', icon: '📱', width: '768px', height: '1024px' },
      { id: 'mobile', name: 'Mobile', icon: '📱', width: '375px', height: '667px' }
    ];

    useEffect(() => {
      fetchPages();
    }, []);

    const fetchPages = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/builder/pages`);
        if (response.ok) {
          const data = await response.json();
          setPages(data.pages || []);
          
          // Auto-load homepage if exists, otherwise create one
          const homepage = data.pages?.find(p => p.slug === 'home' || p.slug === 'homepage');
          if (homepage) {
            loadPage(homepage._id);
          } else if (data.pages?.length === 0) {
            // Create default homepage
            createDefaultHomepage();
          }
        }
      } catch (error) {
        console.error('Error fetching pages:', error);
      }
    };

    const createDefaultHomepage = async () => {
      const defaultHomepage = {
        page_id: 'homepage',
        name: 'Homepage',
        slug: 'home',
        title: 'Welcome to Your Website',
        components: [
          {
            component_id: 'hero_default',
            type: 'hero',
            properties: {
              title: 'Welcome to Your Amazing Website',
              subtitle: 'Built with the powerful UX Builder',
              backgroundImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80',
              ctaText: 'Get Started',
              ctaLink: '#contact'
            },
            styles: {
              backgroundColor: '#1e293b',
              color: 'white',
              padding: '80px 20px',
              textAlign: 'center'
            },
            position: { x: 0, y: 0, width: '100%', height: '500px' },
            order: 0
          }
        ]
      };

      try {
        const response = await fetch(`${backendUrl}/api/admin/builder/pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(defaultHomepage)
        });

        if (response.ok) {
          fetchPages();
        }
      } catch (error) {
        console.error('Error creating default homepage:', error);
      }
    };

    const getDefaultProperties = (type) => {
      const defaults = {
        hero: {
          title: 'Hero Section Title',
          subtitle: 'Compelling subtitle text',
          backgroundImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80',
          ctaText: 'Call to Action',
          ctaLink: '#'
        },
        navbar: {
          logo: 'Your Logo',
          menuItems: ['Home', 'About', 'Services', 'Contact'],
          backgroundColor: '#ffffff',
          textColor: '#333333'
        },
        footer: {
          companyName: 'Your Company',
          copyright: '© 2024 Your Company. All rights reserved.',
          links: ['Privacy Policy', 'Terms of Service', 'Contact Us'],
          backgroundColor: '#1f2937',
          textColor: '#ffffff'
        },
        text: { content: 'Edit this text...', fontSize: '16px', lineHeight: '1.6' },
        heading: { content: 'Your Heading', level: 'h2', fontSize: '32px', fontWeight: 'bold' },
        image: { 
          src: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
          alt: 'Image description',
          caption: 'Image caption'
        },
        gallery: {
          images: [
            'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
          ],
          columns: 3,
          spacing: '10px'
        },
        button: { 
          text: 'Click Me', 
          link: '#', 
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          borderRadius: '8px',
          padding: '12px 24px'
        },
        form: { 
          title: 'Contact Us',
          fields: [
            { type: 'text', name: 'name', label: 'Name', required: true },
            { type: 'email', name: 'email', label: 'Email', required: true },
            { type: 'textarea', name: 'message', label: 'Message', required: true }
          ],
          submitText: 'Send Message',
          action: '/contact'
        },
        testimonial: {
          quote: 'This is an amazing service! Highly recommended.',
          author: 'John Doe',
          position: 'CEO, Company Inc.',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
        },
        pricing: {
          title: 'Pricing Plans',
          plans: [
            { name: 'Basic', price: '$9.99', features: ['Feature 1', 'Feature 2'] },
            { name: 'Pro', price: '$19.99', features: ['Feature 1', 'Feature 2', 'Feature 3'] }
          ]
        },
        features: {
          title: 'Our Features',
          items: [
            { icon: '⚡', title: 'Fast', description: 'Lightning fast performance' },
            { icon: '🔒', title: 'Secure', description: 'Bank-level security' },
            { icon: '📱', title: 'Responsive', description: 'Works on all devices' }
          ]
        }
      };

      return defaults[type] || {};
    };

    const renderAdvancedComponent = (component) => {
      const { type, properties, styles, position } = component;
      
      const componentStyle = {
        position: type === 'hero' || type === 'navbar' || type === 'footer' ? 'relative' : 'absolute',
        left: type === 'hero' || type === 'navbar' || type === 'footer' ? 'auto' : position.x,
        top: type === 'hero' || type === 'navbar' || type === 'footer' ? 'auto' : position.y,
        width: position.width,
        height: type === 'spacer' ? properties.height : position.height,
        cursor: previewMode ? 'default' : 'pointer',
        border: selectedComponent?.component_id === component.component_id && !previewMode ? '2px solid #3b82f6' : 'none',
        boxSizing: 'border-box',
        ...styles
      };

      const handleComponentClick = (e) => {
        if (!previewMode) {
          e.stopPropagation();
          setSelectedComponent(component);
        }
      };

      switch (type) {
        case 'hero':
          return (
            <section
              key={component.component_id}
              style={{
                ...componentStyle,
                backgroundImage: properties.backgroundImage ? `url(${properties.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                color: 'white',
                position: 'relative',
                width: '100%'
              }}
              onClick={handleComponentClick}
            >
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                backgroundColor: 'rgba(0,0,0,0.4)' 
              }}></div>
              <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', padding: '0 20px' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                  {properties.title}
                </h1>
                {properties.subtitle && (
                  <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.9 }}>
                    {properties.subtitle}
                  </p>
                )}
                {properties.ctaText && (
                  <a
                    href={properties.ctaLink}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '1rem 2rem',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      display: 'inline-block',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {properties.ctaText}
                  </a>
                )}
              </div>
            </section>
          );

        case 'navbar':
          return (
            <nav
              key={component.component_id}
              style={{
                ...componentStyle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 2rem',
                width: '100%',
                backgroundColor: properties.backgroundColor || '#ffffff',
                borderBottom: '1px solid #e5e7eb'
              }}
              onClick={handleComponentClick}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: properties.textColor }}>
                {properties.logo}
              </div>
              <div style={{ display: 'flex', gap: '2rem' }}>
                {properties.menuItems?.map((item, index) => (
                  <a
                    key={index}
                    href="#"
                    style={{
                      color: properties.textColor,
                      textDecoration: 'none',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </nav>
          );

        case 'testimonial':
          return (
            <div
              key={component.component_id}
              style={{
                ...componentStyle,
                backgroundColor: '#f8fafc',
                padding: '2rem',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              onClick={handleComponentClick}
            >
              <blockquote style={{ fontSize: '1.25rem', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                "{properties.quote}"
              </blockquote>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <img
                  src={properties.avatar}
                  alt={properties.author}
                  style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{properties.author}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{properties.position}</div>
                </div>
              </div>
            </div>
          );

        default:
          // Keep existing component rendering for basic components
          return renderComponent(component);
      }
    };

    // Keep the original renderComponent function for basic components
    const renderComponent = (component) => {
      const { type, properties, styles, position } = component;
      
      const componentStyle = {
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: position.width,
        height: type === 'spacer' ? properties.height : position.height,
        cursor: previewMode ? 'default' : 'pointer',
        border: selectedComponent?.component_id === component.component_id ? '2px solid #3b82f6' : '1px dashed #e5e7eb',
        ...styles
      };

      const handleComponentClick = () => !previewMode && setSelectedComponent(component);

      switch (type) {
        case 'text':
          return (
            <div key={component.component_id} style={componentStyle} onClick={handleComponentClick}>
              <p style={{ fontSize: properties.fontSize, margin: 0, lineHeight: properties.lineHeight }}>
                {properties.content}
              </p>
            </div>
          );
        case 'heading':
          const HeadingTag = properties.level || 'h2';
          return (
            <div key={component.component_id} style={componentStyle} onClick={handleComponentClick}>
              <HeadingTag style={{ fontSize: properties.fontSize, margin: 0, fontWeight: properties.fontWeight }}>
                {properties.content}
              </HeadingTag>
            </div>
          );
        case 'image':
          return (
            <div key={component.component_id} style={componentStyle} onClick={handleComponentClick}>
              <img
                src={properties.src}
                alt={properties.alt}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {properties.caption && (
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
                  {properties.caption}
                </p>
              )}
            </div>
          );
        case 'button':
          return (
            <div key={component.component_id} style={componentStyle} onClick={handleComponentClick}>
              <button
                style={{
                  backgroundColor: properties.backgroundColor,
                  color: properties.textColor,
                  padding: properties.padding,
                  border: 'none',
                  borderRadius: properties.borderRadius,
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                {properties.text}
              </button>
            </div>
          );
        default:
          return (
            <div key={component.component_id} style={componentStyle} onClick={handleComponentClick}>
              {type} component
            </div>
          );
      }
    };

    return (
      <div className="ux-builder advanced-builder">
        <div className="builder-header enhanced">
          <div className="builder-info">
            <h2>🎨 Website Designer</h2>
            <p>Professional drag-and-drop website builder</p>
            {currentPage && (
              <span className="current-page">Editing: {currentPage.name}</span>
            )}
          </div>
          <div className="builder-controls">
            <div className="device-selector">
              {deviceViews.map(device => (
                <button
                  key={device.id}
                  className={`device-btn ${deviceView === device.id ? 'active' : ''}`}
                  onClick={() => setDeviceView(device.id)}
                  title={device.name}
                >
                  {device.icon}
                </button>
              ))}
            </div>
            <div className="builder-actions">
              <button onClick={() => setShowTemplates(true)} className="templates-btn">
                📄 Templates
              </button>
              <button onClick={() => setShowPageModal(true)} className="new-page-btn">
                ➕ New Page
              </button>
              <button 
                onClick={() => setPreviewMode(!previewMode)}
                className={`preview-btn ${previewMode ? 'active' : ''}`}
              >
                {previewMode ? '✏️ Edit' : '👁️ Preview'}
              </button>
              {currentPage && (
                <button onClick={savePage} className="save-btn">
                  💾 Save
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="builder-workspace enhanced">
          {/* Enhanced Component Library Sidebar */}
          {!previewMode && (
            <div className="component-library enhanced">
              <div className="library-header">
                <h3>🧱 Components</h3>
                <p>Drag & drop to add</p>
              </div>
              
              {componentCategories.map(category => (
                <div key={category.id} className="component-category">
                  <h4>{category.name}</h4>
                  <div className="component-grid">
                    {componentLibrary
                      .filter(comp => comp.category === category.id)
                      .map(comp => (
                        <div
                          key={comp.type}
                          className="component-item enhanced"
                          draggable
                          onDragStart={(e) => handleDragStart(e, comp.type)}
                          onClick={() => addComponent(comp.type)}
                          title={comp.description}
                        >
                          <span className="component-icon">{comp.icon}</span>
                          <span className="component-name">{comp.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
              
              {/* Page List */}
              <div className="page-list enhanced">
                <h4>📄 Pages</h4>
                {pages.map(page => (
                  <div
                    key={page._id}
                    className={`page-item ${currentPage?._id === page._id ? 'active' : ''}`}
                    onClick={() => loadPage(page._id)}
                  >
                    <span className="page-name">{page.name}</span>
                    <span className="page-status">{page.status || 'draft'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Canvas */}
          <div className="canvas-container enhanced">
            <div className="canvas-toolbar">
              <div className="canvas-info">
                <span>Canvas: {deviceView}</span>
                {selectedComponent && (
                  <span>Selected: {selectedComponent.type}</span>
                )}
              </div>
              <div className="canvas-actions">
                <button 
                  onClick={() => setShowStylePanel(!showStylePanel)}
                  className={`style-panel-btn ${showStylePanel ? 'active' : ''}`}
                >
                  🎨 Styles
                </button>
              </div>
            </div>
            
            <div
              className="canvas enhanced"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              style={{
                width: deviceView === 'desktop' ? '100%' : deviceViews.find(d => d.id === deviceView)?.width,
                minHeight: deviceView === 'desktop' ? '800px' : deviceViews.find(d => d.id === deviceView)?.height,
                maxWidth: deviceView !== 'desktop' ? deviceViews.find(d => d.id === deviceView)?.width : 'none',
                margin: deviceView !== 'desktop' ? '0 auto' : '0',
                backgroundColor: '#ffffff',
                position: 'relative',
                border: previewMode ? 'none' : '2px dashed #d1d5db',
                borderRadius: deviceView !== 'desktop' ? '12px' : '0',
                overflow: 'hidden',
                boxShadow: deviceView !== 'desktop' ? '0 10px 30px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {components
                .sort((a, b) => a.order - b.order)
                .map(renderAdvancedComponent)}
              
              {!currentPage && (
                <div className="canvas-placeholder enhanced">
                  <div className="placeholder-content">
                    <h3>🎨 Welcome to Website Designer</h3>
                    <p>Your professional website builder</p>
                    <div className="placeholder-actions">
                      <button onClick={() => setShowTemplates(true)} className="template-btn">
                        📄 Choose Template
                      </button>
                      <button onClick={() => setShowPageModal(true)} className="create-btn">
                        ➕ Create Page
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Properties Panel */}
          {!previewMode && selectedComponent && (
            <div className="properties-panel enhanced">
              <div className="panel-header">
                <h3>⚙️ Properties</h3>
                <button 
                  onClick={() => setSelectedComponent(null)}
                  className="close-panel-btn"
                >
                  ×
                </button>
              </div>
              
              <div className="property-sections">
                <div className="property-section">
                  <h4>Component</h4>
                  <div className="property-group">
                    <label>Type</label>
                    <input type="text" value={selectedComponent.type} disabled />
                  </div>
                  <div className="property-group">
                    <label>ID</label>
                    <input type="text" value={selectedComponent.component_id} disabled />
                  </div>
                </div>

                {/* Dynamic property fields based on component type */}
                {selectedComponent.type === 'hero' && (
                  <div className="property-section">
                    <h4>Hero Content</h4>
                    <div className="property-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={selectedComponent.properties.title}
                        onChange={(e) => updateComponent(selectedComponent.component_id, {
                          properties: { ...selectedComponent.properties, title: e.target.value }
                        })}
                      />
                    </div>
                    <div className="property-group">
                      <label>Subtitle</label>
                      <textarea
                        value={selectedComponent.properties.subtitle}
                        onChange={(e) => updateComponent(selectedComponent.component_id, {
                          properties: { ...selectedComponent.properties, subtitle: e.target.value }
                        })}
                        rows="2"
                      />
                    </div>
                    <div className="property-group">
                      <label>Background Image URL</label>
                      <input
                        type="url"
                        value={selectedComponent.properties.backgroundImage}
                        onChange={(e) => updateComponent(selectedComponent.component_id, {
                          properties: { ...selectedComponent.properties, backgroundImage: e.target.value }
                        })}
                      />
                    </div>
                    <div className="property-group">
                      <label>CTA Button Text</label>
                      <input
                        type="text"
                        value={selectedComponent.properties.ctaText}
                        onChange={(e) => updateComponent(selectedComponent.component_id, {
                          properties: { ...selectedComponent.properties, ctaText: e.target.value }
                        })}
                      />
                    </div>
                    <div className="property-group">
                      <label>CTA Button Link</label>
                      <input
                        type="url"
                        value={selectedComponent.properties.ctaLink}
                        onChange={(e) => updateComponent(selectedComponent.component_id, {
                          properties: { ...selectedComponent.properties, ctaLink: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                )}

                {/* Add other component-specific property sections here */}

                <div className="property-section">
                  <h4>Actions</h4>
                  <div className="property-actions">
                    <button
                      onClick={() => deleteComponent(selectedComponent.component_id)}
                      className="delete-component-btn"
                    >
                      🗑️ Delete Component
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rest of the modals remain the same but with enhanced styling */}
        
      </div>
    );
  };

  const CMSManager = () => {
    const [activeSubTab, setActiveSubTab] = useState('posts');
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [media, setMedia] = useState([]);
    const [showPostModal, setShowPostModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

    const subTabs = [
      { id: 'posts', name: '📝 Posts', description: 'Manage blog posts' },
      { id: 'pages', name: '📄 Pages', description: 'Manage static pages' },
      { id: 'categories', name: '🏷️ Categories', description: 'Organize content' },
      { id: 'tags', name: '🔖 Tags', description: 'Tag content' },
      { id: 'media', name: '🖼️ Media Library', description: 'Manage files' }
    ];

    useEffect(() => {
      if (activeSubTab === 'posts' || activeSubTab === 'pages') {
        fetchPosts(activeSubTab === 'pages' ? 'page' : 'post');
      } else if (activeSubTab === 'categories') {
        fetchCategories();
      } else if (activeSubTab === 'tags') {
        fetchTags();
      } else if (activeSubTab === 'media') {
        fetchMedia();
      }
    }, [activeSubTab]);

    const fetchPosts = async (postType = 'post') => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/posts?post_type=${postType}`);
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    const fetchTags = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/tags`);
        if (response.ok) {
          const data = await response.json();
          setTags(data.tags || []);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    const fetchMedia = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/media`);
        if (response.ok) {
          const data = await response.json();
          setMedia(data.media || []);
        }
      } catch (error) {
        console.error('Error fetching media:', error);
      }
    };

    const handleCreatePost = async (postData) => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...postData,
            post_type: activeSubTab === 'pages' ? 'page' : 'post',
            author_id: 'current_user'
          })
        });

        if (response.ok) {
          alert('Post created successfully!');
          setShowPostModal(false);
          fetchPosts(activeSubTab === 'pages' ? 'page' : 'post');
        }
      } catch (error) {
        alert('Error creating post');
      }
    };

    const handleDeletePost = async (postId) => {
      if (window.confirm('Are you sure you want to delete this post?')) {
        try {
          const response = await fetch(`${backendUrl}/api/admin/posts/${postId}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            alert('Post deleted successfully!');
            fetchPosts(activeSubTab === 'pages' ? 'page' : 'post');
          }
        } catch (error) {
          alert('Error deleting post');
        }
      }
    };

    const renderPostsTab = () => (
      <div className="posts-manager">
        <div className="posts-header">
          <h3>{activeSubTab === 'pages' ? '📄 Pages Manager' : '📝 Posts Manager'}</h3>
          <button 
            className="add-btn"
            onClick={() => setShowPostModal(true)}
          >
            ➕ Add New {activeSubTab === 'pages' ? 'Page' : 'Post'}
          </button>
        </div>

        <div className="posts-list">
          {posts.map(post => (
            <div key={post._id} className="post-card">
              <div className="post-info">
                <h4>{post.title}</h4>
                <div className="post-meta">
                  <span className={`status-badge ${post.status}`}>{post.status}</span>
                  <span className="date">{new Date(post.created_at).toLocaleDateString()}</span>
                  {post.categories?.length > 0 && (
                    <span className="categories">
                      Categories: {post.categories.join(', ')}
                    </span>
                  )}
                </div>
                {post.excerpt && <p className="excerpt">{post.excerpt}</p>}
              </div>
              <div className="post-actions">
                <button className="edit-btn">✏️ Edit</button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeletePost(post._id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    const renderCategoriesTab = () => (
      <div className="categories-manager">
        <div className="categories-header">
          <h3>🏷️ Categories Manager</h3>
          <button className="add-btn">➕ Add Category</button>
        </div>
        <div className="categories-grid">
          {categories.map(category => (
            <div key={category._id} className="category-card">
              <h4>{category.name}</h4>
              <p>{category.description}</p>
              <div className="category-actions">
                <button className="edit-btn">✏️ Edit</button>
                <button className="delete-btn">🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    const renderTagsTab = () => (
      <div className="tags-manager">
        <div className="tags-header">
          <h3>🔖 Tags Manager</h3>
          <button className="add-btn">➕ Add Tag</button>
        </div>
        <div className="tags-cloud">
          {tags.map(tag => (
            <div key={tag._id} className="tag-item">
              <span className="tag-name">{tag.name}</span>
              <button className="tag-delete">×</button>
            </div>
          ))}
        </div>
      </div>
    );

    const renderMediaTab = () => (
      <div className="media-manager">
        <div className="media-header">
          <h3>🖼️ Media Library</h3>
          <button className="add-btn">⬆️ Upload Media</button>
        </div>
        <div className="media-grid">
          {media.map(item => (
            <div key={item._id} className="media-item">
              {item.file_type?.startsWith('image/') ? (
                <img src={item.file_url} alt={item.alt_text} />
              ) : (
                <div className="file-icon">📄</div>
              )}
              <div className="media-info">
                <p className="filename">{item.filename}</p>
                <p className="filesize">{(item.file_size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div className="cms-manager">
        <div className="cms-header">
          <h2>📝 CMS Manager</h2>
          <p>WordPress-like content management system</p>
        </div>

        <div className="cms-navigation">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              className={`sub-tab ${activeSubTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveSubTab(tab.id)}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="cms-content">
          {(activeSubTab === 'posts' || activeSubTab === 'pages') && renderPostsTab()}
          {activeSubTab === 'categories' && renderCategoriesTab()}
          {activeSubTab === 'tags' && renderTagsTab()}
          {activeSubTab === 'media' && renderMediaTab()}
        </div>

        {/* Post Creation Modal */}
        {showPostModal && (
          <div className="modal-overlay">
            <div className="modal large-modal">
              <div className="modal-header">
                <h3>✏️ Create New {activeSubTab === 'pages' ? 'Page' : 'Post'}</h3>
                <button onClick={() => setShowPostModal(false)}>×</button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleCreatePost({
                  title: formData.get('title'),
                  content: formData.get('content'),
                  excerpt: formData.get('excerpt'),
                  status: formData.get('status'),
                  meta_description: formData.get('meta_description'),
                  categories: formData.get('categories')?.split(',') || [],
                  tags: formData.get('tags')?.split(',') || []
                });
              }}>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" name="title" required />
                </div>
                
                <div className="form-group">
                  <label>Content</label>
                  <textarea name="content" rows="10" required></textarea>
                </div>
                
                <div className="form-group">
                  <label>Excerpt</label>
                  <textarea name="excerpt" rows="3"></textarea>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Categories (comma-separated)</label>
                    <input type="text" name="categories" placeholder="category1, category2" />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Tags (comma-separated)</label>
                    <input type="text" name="tags" placeholder="tag1, tag2" />
                  </div>
                  <div className="form-group">
                    <label>Meta Description</label>
                    <input type="text" name="meta_description" />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    ➕ Create {activeSubTab === 'pages' ? 'Page' : 'Post'}
                  </button>
                  <button type="button" onClick={() => setShowPostModal(false)}>
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
      case 'uxbuilder':
        return <UXBuilder />;
      case 'cms':
        return <CMSManager />;
      case 'ecommerce':
        return <AdvancedEcommerce />;
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
            className={activeTab === 'uxbuilder' ? 'active' : ''}
            onClick={() => setActiveTab('uxbuilder')}
          >
            🎨 Website Designer
          </button>
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            🏠 Dashboard
          </button>
          <button 
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            📦 Products
          </button>
          <button 
            className={activeTab === 'special_offers' ? 'active' : ''}
            onClick={() => setActiveTab('special_offers')}
          >
            ⭐ Special Offers
          </button>
          <button 
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            📋 Orders
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
            className={activeTab === 'email_marketing' ? 'active' : ''}
            onClick={() => setActiveTab('email_marketing')}
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
          <button 
            className={activeTab === 'cms' ? 'active' : ''}
            onClick={() => setActiveTab('cms')}
          >
            📝 CMS Manager
          </button>
          <button 
            className={activeTab === 'ecommerce' ? 'active' : ''}
            onClick={() => setActiveTab('ecommerce')}
          >
            🛒 Advanced E-commerce
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