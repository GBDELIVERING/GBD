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
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [bulkUpdates, setBulkUpdates] = useState({});
    const [displaySettings, setDisplaySettings] = useState({
      layout: 'table',
      itemsPerPage: 12,
      sortBy: 'name'
    });
    const [selectedProducts, setSelectedProducts] = useState([]);
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

    const handleTableBulkUpdate = async () => {
      const updates = editableProducts
        .filter(product => product.isEditing)
        .map(product => {
          const { isEditing, ...productData } = product;
          return productData;
        });

      if (updates.length === 0) {
        alert('No products selected for update');
        return;
      }

      try {
        const response = await fetch(`${backendUrl}/api/admin/products/bulk-table`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates })
        });

        if (response.ok) {
          const data = await response.json();
          alert(`Bulk update completed! ${data.updated_count} products updated.`);
          if (data.errors.length > 0) {
            console.log('Errors:', data.errors);
          }
          fetchProducts();
          setEditableProducts(prev => prev.map(p => ({ ...p, isEditing: false })));
        }
      } catch (error) {
        alert('Error updating products');
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

    return (
      <div className="product-management">
        <div className="management-header">
          <h2>📦 Product Management</h2>
          <div className="management-actions">
            <button 
              className="add-btn"
              onClick={() => setShowAddModal(true)}
            >
              ➕ Add New Product
            </button>
            <button 
              className="bulk-edit-btn"
              onClick={handleTableBulkUpdate}
              disabled={editableProducts.filter(p => p.isEditing).length === 0}
            >
              💾 Save Changes ({editableProducts.filter(p => p.isEditing).length})
            </button>
          </div>
        </div>

        <div className="table-view">
          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Edit</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price (RWF)</th>
                  <th>Stock</th>
                  <th>Unit</th>
                  <th>Discount %</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {editableProducts.map(product => (
                  <tr key={product._id} className={product.isEditing ? 'editing-row' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={product.isEditing}
                        onChange={() => toggleProductEdit(product._id)}
                        className="edit-checkbox"
                      />
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
                        />
                      ) : (
                        product.name
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
                        product.category.replace('_', ' ')
                      )}
                    </td>
                    <td>
                      {product.isEditing ? (
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) => updateProductField(product._id, 'price', parseFloat(e.target.value))}
                          className="table-input"
                        />
                      ) : (
                        product.price.toLocaleString()
                      )}
                    </td>
                    <td>
                      {product.isEditing ? (
                        <input
                          type="number"
                          value={product.stock}
                          onChange={(e) => updateProductField(product._id, 'stock', parseInt(e.target.value))}
                          className="table-input"
                        />
                      ) : (
                        product.stock
                      )}
                    </td>
                    <td>{product.unit}</td>
                    <td>
                      {product.isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={product.discount_percentage}
                          onChange={(e) => updateProductField(product._id, 'discount_percentage', parseFloat(e.target.value))}
                          className="table-input"
                        />
                      ) : (
                        product.discount_percentage + '%'
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${product.is_special_offer ? 'special' : 'normal'}`}>
                        {product.is_special_offer ? '🏷️ Special' : '📦 Normal'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button onClick={() => handleEdit(product)} className="edit-btn">
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="delete-btn">
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