import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import Admin from './Admin';

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Verify token and get user info
      fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user_id) {
          setUser(data);
        } else {
          logout();
        }
      })
      .catch(() => logout());
    }
  }, [token]);

  const login = (userToken, userData) => {
    setToken(userToken);
    setUser(userData);
    localStorage.setItem('token', userToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// Components
const Header = () => {
  const { user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="bg-red-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-red-800 font-bold text-lg">🥩</span>
            </div>
            <h1 className="text-2xl font-bold">Fresh Cuts Market</h1>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <a href="#home" className="hover:text-red-200 transition">Home</a>
            <a href="#products" className="hover:text-red-200 transition">Products</a>
            <a href="#offers" className="hover:text-red-200 transition">Special Offers</a>
            <a href="#cart" className="hover:text-red-200 transition">Cart</a>
            {user ? (
              <div className="flex items-center space-x-4">
                <span>Welcome, {user.name}</span>
                <button onClick={logout} className="hover:text-red-200 transition">Logout</button>
              </div>
            ) : (
              <a href="#auth" className="hover:text-red-200 transition">Login</a>
            )}
          </nav>

          <button 
            className="md:hidden"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {showMobileMenu && (
          <nav className="md:hidden mt-4 space-y-2">
            <a href="#home" className="block py-2 hover:text-red-200">Home</a>
            <a href="#products" className="block py-2 hover:text-red-200">Products</a>
            <a href="#offers" className="block py-2 hover:text-red-200">Special Offers</a>
            <a href="#cart" className="block py-2 hover:text-red-200">Cart</a>
            {user ? (
              <div>
                <span className="block py-2">Welcome, {user.name}</span>
                <button onClick={logout} className="block py-2 hover:text-red-200">Logout</button>
              </div>
            ) : (
              <a href="#auth" className="block py-2 hover:text-red-200">Login</a>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

const Hero = () => {
  return (
    <section id="home" className="hero-section">
      <div className="hero-overlay">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Premium Quality Meats & Fresh Groceries
          </h2>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
            Experience the finest cuts of meat and freshest supermarket products delivered to your door. 
            Quality you can trust, flavors you'll love.
          </p>
          <button className="bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-700 transition">
            Shop Now
          </button>
        </div>
      </div>
    </section>
  );
};

const QuantitySelector = ({ product, onQuantityChange }) => {
  const [quantity, setQuantity] = useState(product.min_quantity || 1);
  const [unit, setUnit] = useState(product.unit || 'piece');
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  const calculatePrice = (qty, selectedUnit) => {
    let price = product.price;
    
    // Apply discount if applicable
    if (product.discount_percentage > 0) {
      price = price * (1 - product.discount_percentage / 100);
    }
    
    if (product.price_per_unit === 'per_kg') {
      if (selectedUnit === 'gram') {
        return price * (qty / 1000);
      } else if (selectedUnit === 'kg') {
        return price * qty;
      }
    } else if (product.price_per_unit === 'per_gram') {
      if (selectedUnit === 'kg') {
        return price * (qty * 1000);
      } else if (selectedUnit === 'gram') {
        return price * qty;
      }
    } else {
      return price * qty;
    }
    
    return price * qty;
  };

  useEffect(() => {
    const price = calculatePrice(quantity, unit);
    setCalculatedPrice(price);
    onQuantityChange(quantity, unit, price);
  }, [quantity, unit, product]);

  const getAvailableUnits = () => {
    if (product.price_per_unit === 'per_kg') {
      return [
        { value: 'kg', label: 'Kilograms' },
        { value: 'gram', label: 'Grams' }
      ];
    } else if (product.price_per_unit === 'per_gram') {
      return [
        { value: 'gram', label: 'Grams' },
        { value: 'kg', label: 'Kilograms' }
      ];
    } else {
      return [{ value: product.unit, label: product.unit.charAt(0).toUpperCase() + product.unit.slice(1) }];
    }
  };

  return (
    <div className="quantity-selector">
      <h4 className="quantity-title">🛒 Select Your Quantity</h4>
      
      <div className="quantity-controls">
        <div className="quantity-input-group">
          <label className="quantity-label">Quantity:</label>
          <div className="input-with-unit">
            <input
              type="number"
              min={product.min_quantity || 1}
              max={product.max_quantity || 1000}
              step={product.price_per_unit === 'per_kg' ? 0.25 : 1}
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="quantity-input"
              placeholder="Enter quantity"
            />
            
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="unit-selector"
            >
              {getAvailableUnits().map(unitOption => (
                <option key={unitOption.value} value={unitOption.value}>
                  {unitOption.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="quantity-info">
          <div className="limits-info">
            <span className="limit-text">
              Min: {product.min_quantity} • Max: {product.max_quantity || 'No limit'}
            </span>
          </div>
          <div className="price-display">
            <span className="calculated-price">
              Total: RWF {calculatedPrice.toLocaleString()}
            </span>
          </div>
        </div>
        
        {product.discount_percentage > 0 && (
          <div className="discount-badge">
            🎉 {product.discount_percentage}% OFF Applied!
          </div>
        )}
      </div>
    </div>
  );
};

const ProductCard = ({ product, onAddToCart }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState(product.unit);
  const [calculatedPrice, setCalculatedPrice] = useState(product.price);

  const handleQuantityChange = (quantity, unit, price) => {
    setSelectedQuantity(quantity);
    setSelectedUnit(unit);
    setCalculatedPrice(price);
  };

  const handleAddToCart = async () => {
    setIsLoading(true);
    await onAddToCart(product._id, selectedQuantity, selectedUnit);
    setIsLoading(false);
    setShowQuantitySelector(false);
  };

  const displayPrice = product.discount_percentage > 0 
    ? product.price * (1 - product.discount_percentage / 100)
    : product.price;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <div className="relative">
        <img 
          src={product.image_url} 
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        {product.is_special_offer && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
            {product.discount_percentage}% OFF
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{product.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div>
            {product.discount_percentage > 0 ? (
              <div>
                <span className="text-lg line-through text-gray-400 mr-2">
                  RWF {product.price.toLocaleString()}
                </span>
                <span className="text-2xl font-bold text-red-600">
                  RWF {displayPrice.toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-red-600">
                RWF {product.price.toLocaleString()}
              </span>
            )}
            <span className="text-gray-500 ml-1">/{product.unit}</span>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 mb-3">
          Stock: {product.stock} {product.unit}s
        </div>
        
        {!showQuantitySelector ? (
          <button 
            onClick={() => setShowQuantitySelector(true)}
            className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Customize & Add to Cart
          </button>
        ) : (
          <div className="space-y-3">
            <QuantitySelector 
              product={product} 
              onQuantityChange={handleQuantityChange}
            />
            <div className="flex space-x-2">
              <button 
                onClick={handleAddToCart}
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add to Cart'}
              </button>
              <button 
                onClick={() => setShowQuantitySelector(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SpecialOffers = () => {
  const [offers, setOffers] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/products?featured=true`);
      const data = await response.json();
      setFeaturedProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    }
  };

  const handleAddToCart = async (productId, quantity = 1, unit) => {
    if (!token) {
      alert('Please login to add items to cart');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
          unit: unit
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Item added to cart! Total: RWF ${data.calculated_price.toLocaleString()}`);
      } else {
        alert('Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding item to cart');
    }
  };

  return (
    <section id="offers" className="py-16 bg-gradient-to-r from-red-50 to-orange-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">🔥 Special Offers & Deals</h2>
        
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map(product => (
              <ProductCard 
                key={product._id} 
                product={product} 
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 text-lg">No special offers available at the moment.</p>
            <p className="text-gray-500">Check back soon for amazing deals!</p>
          </div>
        )}
      </div>
    </section>
  );
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'fresh_meat', name: 'Fresh Meat' },
    { id: 'processed_meat', name: 'Processed Meat' },
    { id: 'dairy', name: 'Dairy & Eggs' },
    { id: 'supermarket', name: 'Supermarket' }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === selectedCategory));
    }
  }, [selectedCategory, products]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/products`);
      const data = await response.json();
      setProducts(data.products || []);
      setFilteredProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (productId, quantity = 1, unit) => {
    if (!token) {
      alert('Please login to add items to cart');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
          unit: unit
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Item added to cart! Total: RWF ${data.calculated_price.toLocaleString()}`);
      } else {
        alert('Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding item to cart');
    }
  };

  if (isLoading) {
    return (
      <section id="products" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading products...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Our Products</h2>
        
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg transition ${
                selectedCategory === category.id 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product._id} 
              product={product} 
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState({
    method: 'delivery', // 'delivery' or 'pickup'
    address: '',
    district: '',
    sector: '',
    phone: ''
  });
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);
  const { token, user } = useAuth();

  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [token]);

  useEffect(() => {
    if (deliveryInfo.method === 'delivery' && deliveryInfo.district && total > 0) {
      calculateDeliveryFee();
    } else if (deliveryInfo.method === 'pickup') {
      setDeliveryFee(0);
    }
  }, [deliveryInfo.district, deliveryInfo.method, total]);

  const fetchCart = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCartItems(data.cart_items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDeliveryFee = async () => {
    setCalculatingDelivery(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/delivery/calculate-fee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: {
            address: deliveryInfo.address,
            district: deliveryInfo.district,
            sector: deliveryInfo.sector
          },
          order_total: total
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDeliveryFee(data.delivery_fee);
      }
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
    } finally {
      setCalculatingDelivery(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cart/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const rwandaDistricts = [
    'Nyarugenge', 'Gasabo', 'Kicukiro', 'Nyanza', 'Gisagara', 'Nyaruguru',
    'Huye', 'Nyamagabe', 'Ruhango', 'Muhanga', 'Kamonyi', 'Karongi',
    'Rutsiro', 'Rubavu', 'Nyabihu', 'Ngororero', 'Rusizi', 'Nyamasheke',
    'Rulindo', 'Gakenke', 'Musanze', 'Burera', 'Gicumbi', 'Rwamagana',
    'Nyagatare', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Bugesera'
  ];

  if (!token) {
    return (
      <section id="cart" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Shopping Cart</h2>
          <p>Please login to view your cart</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="cart" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Shopping Cart</h2>
          <p>Loading cart...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="cart" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">🛒 Shopping Cart</h2>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Your cart is empty</p>
            <button 
              onClick={() => document.getElementById('products').scrollIntoView()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold mb-4">📦 Your Items</h3>
                  {cartItems.map(item => (
                    <div key={item.product_id} className="flex items-center justify-between border-b py-4">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={item.product.image_url} 
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-semibold">{item.product.name}</h3>
                          <p className="text-gray-600">
                            {item.quantity} {item.unit} × RWF {item.product.price.toLocaleString()}
                          </p>
                          {item.product.discount_percentage > 0 && (
                            <p className="text-green-600 text-sm">
                              🎉 {item.product.discount_percentage}% discount applied
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold">RWF {item.subtotal.toLocaleString()}</span>
                        <button 
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery & Summary */}
              <div className="space-y-6">
                {/* Delivery Options */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold mb-4">🚚 Delivery Options</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="delivery_method"
                          value="delivery"
                          checked={deliveryInfo.method === 'delivery'}
                          onChange={(e) => setDeliveryInfo({...deliveryInfo, method: e.target.value})}
                          className="text-red-600"
                        />
                        <span className="font-medium">🚚 Home Delivery</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="delivery_method"
                          value="pickup"
                          checked={deliveryInfo.method === 'pickup'}
                          onChange={(e) => setDeliveryInfo({...deliveryInfo, method: e.target.value})}
                          className="text-red-600"
                        />
                        <span className="font-medium">🏪 Store Pickup (Free)</span>
                      </label>
                    </div>

                    {deliveryInfo.method === 'delivery' && (
                      <div className="space-y-3 pl-6 border-l-2 border-red-200">
                        <div>
                          <label className="block text-sm font-medium mb-1">📍 District</label>
                          <select
                            value={deliveryInfo.district}
                            onChange={(e) => setDeliveryInfo({...deliveryInfo, district: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                          >
                            <option value="">Select District</option>
                            {rwandaDistricts.map(district => (
                              <option key={district} value={district}>{district}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">🏠 Full Address</label>
                          <textarea
                            value={deliveryInfo.address}
                            onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})}
                            placeholder="Street, sector, cell, landmark..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows="3"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">📱 Phone Number</label>
                          <input
                            type="tel"
                            value={deliveryInfo.phone}
                            onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})}
                            placeholder="+250 xxx xxx xxx"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            required
                          />
                        </div>

                        {calculatingDelivery && (
                          <div className="text-center py-2">
                            <span className="text-blue-600">🔄 Calculating delivery fee...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold mb-4">📄 Order Summary</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>RWF {total.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>
                        {deliveryInfo.method === 'pickup' ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          `RWF ${deliveryFee.toLocaleString()}`
                        )}
                      </span>
                    </div>
                    
                    <hr />
                    
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span>RWF {(total + deliveryFee).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-2">💬 Special Notes (Optional)</label>
                    <textarea
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="Any special instructions for your order..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows="3"
                    />
                  </div>

                  <button 
                    onClick={() => setShowPayment(true)}
                    disabled={deliveryInfo.method === 'delivery' && (!deliveryInfo.district || !deliveryInfo.address || !deliveryInfo.phone)}
                    className="w-full mt-6 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    💳 Proceed to Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {showPayment && (
          <PaymentModal 
            total={total + deliveryFee} 
            onClose={() => setShowPayment(false)}
            cartItems={cartItems}
            customerNotes={customerNotes}
            deliveryInfo={deliveryInfo}
            deliveryFee={deliveryFee}
          />
        )}
      </div>
    </section>
  );
};

const PaymentModal = ({ total, onClose, cartItems, customerNotes }) => {
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const { token } = useAuth();

  const cardTotal = total * 1.03; // 3% processing fee for cards
  const processingFee = total * 0.03;

  const handleMoMoPayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('Initiating MoMo payment...');

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/momo/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: total,
          phone: phone,
          order_id: `ORDER_${Date.now()}`
        })
      });

      const data = await response.json();
      
      if (data.transaction_id) {
        setPaymentStatus('Payment initiated. Please check your phone for USSD prompt.');
        // Start polling for payment status
        pollPaymentStatus(data.transaction_id, 'momo');
      } else {
        setPaymentStatus('Failed to initiate payment');
        setIsProcessing(false);
      }
    } catch (error) {
      setPaymentStatus('Error initiating payment');
      setIsProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('Redirecting to card payment...');

    try {
      const currentUrl = window.location.origin;
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/dpo/create-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: total,
          description: `Fresh Cuts Market - Order Total: RWF ${total.toLocaleString()}`,
          redirect_url: `${currentUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          back_url: currentUrl
        })
      });

      const data = await response.json();
      
      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setPaymentStatus('Failed to create payment session');
        setIsProcessing(false);
      }
    } catch (error) {
      setPaymentStatus('Error creating payment session');
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = async (transactionId, method) => {
    const maxAttempts = 20;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/${method}/status/${transactionId}`);
        const data = await response.json();

        if (data.payment_status === 'completed') {
          setPaymentStatus('Payment successful! Thank you for your purchase.');
          setIsProcessing(false);
          // Create order and clear cart
          createOrder();
        } else if (data.status === 'failed') {
          setPaymentStatus('Payment failed. Please try again.');
          setIsProcessing(false);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 3000);
        } else {
          setPaymentStatus('Payment status check timed out. Please check your order history.');
          setIsProcessing(false);
        }
      } catch (error) {
        setPaymentStatus('Error checking payment status');
        setIsProcessing(false);
      }
    };

    checkStatus();
  };

  const createOrder = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit: item.unit
          })),
          total_amount: paymentMethod === 'card' ? cardTotal : total,
          payment_method: paymentMethod,
          customer_notes: customerNotes
        })
      });

      if (response.ok) {
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Payment Options</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <div className="flex space-x-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="payment"
                value="momo"
                checked={paymentMethod === 'momo'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              Mobile Money (MoMo)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="payment"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              Card Payment
            </label>
          </div>

          {paymentMethod === 'momo' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span>RWF {total.toLocaleString()}</span>
            </div>
            {paymentMethod === 'card' && (
              <>
                <div className="flex justify-between mb-2">
                  <span>Processing Fee (3%):</span>
                  <span>RWF {processingFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>RWF {cardTotal.toLocaleString()}</span>
                </div>
              </>
            )}
            {paymentMethod === 'momo' && (
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>RWF {total.toLocaleString()}</span>
              </div>
            )}
          </div>

          {paymentStatus && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">{paymentStatus}</p>
            </div>
          )}

          <button
            onClick={paymentMethod === 'momo' ? handleMoMoPayment : handleCardPayment}
            disabled={isProcessing || (paymentMethod === 'momo' && !phone)}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isProcessing ? 'Processing...' : `Pay RWF ${paymentMethod === 'card' ? cardTotal.toLocaleString() : total.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/auth/${isLogin ? 'login' : 'register'}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, { user_id: data.user_id, email: formData.email, name: formData.name });
        onClose();
      } else {
        setError(data.detail || 'Authentication failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/google/login`;
  };

  const handleFacebookLogin = () => {
    // Initialize Facebook SDK
    window.FB.login((response) => {
      if (response.authResponse) {
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/facebook/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: response.authResponse.accessToken
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            login(data.token, data.user);
            onClose();
          } else {
            setError('Facebook login failed');
          }
        })
        .catch(() => setError('Facebook login error'));
      }
    }, { scope: 'email' });
  };

  // Load Facebook SDK
  React.useEffect(() => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: 'YOUR_FACEBOOK_APP_ID', // Replace with your Facebook App ID
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
    };

    // Load the SDK asynchronously
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{isLogin ? 'Login' : 'Register'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Social Login Buttons */}
        <div className="mb-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full mb-3 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          
          <button
            onClick={handleFacebookLogin}
            className="w-full mb-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </button>

          <div className="flex items-center mb-4">
            <hr className="flex-1 border-gray-300" />
            <span className="px-3 text-gray-500 text-sm">OR</span>
            <hr className="flex-1 border-gray-300" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">Phone (optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 transition"
          >
            {isLoading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    // Check URL for admin route
    if (window.location.pathname === '/admin') {
      setShowAdmin(true);
    }

    // Handle auth links
    const handleAuthLink = (e) => {
      if (e.target.getAttribute('href') === '#auth') {
        e.preventDefault();
        setShowAuthModal(true);
      }
      if (e.target.getAttribute('href') === '#admin') {
        e.preventDefault();
        setShowAdmin(true);
      }
    };

    document.addEventListener('click', handleAuthLink);
    return () => document.removeEventListener('click', handleAuthLink);
  }, []);

  // Show admin panel if requested
  if (showAdmin) {
    return (
      <AuthProvider>
        <div className="admin-wrapper">
          <div className="admin-header">
            <button 
              onClick={() => setShowAdmin(false)}
              className="back-to-store-btn"
            >
              ← Back to Store
            </button>
          </div>
          <Admin />
        </div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="App">
        <Header />
        <Hero />
        <SpecialOffers />
        <Products />
        <Cart />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        
        <footer className="bg-gray-800 text-white py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Fresh Cuts Market</h3>
                <p className="text-gray-300">
                  Your trusted source for premium quality meats and fresh groceries.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="#home" className="hover:text-white">Home</a></li>
                  <li><a href="#products" className="hover:text-white">Products</a></li>
                  <li><a href="#offers" className="hover:text-white">Special Offers</a></li>
                  <li><a href="#cart" className="hover:text-white">Cart</a></li>
                  <li><a href="#admin" className="hover:text-white">Admin Panel</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Contact</h4>
                <p className="text-gray-300">
                  Phone: +250 783 654 454<br />
                  Email: info@freshcuts.rw
                </p>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
              <p>&copy; 2024 Fresh Cuts Market. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
};

export default App;