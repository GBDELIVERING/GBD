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

const ProductCard = ({ product, onAddToCart }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    await onAddToCart(product._id);
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <img 
        src={product.image_url} 
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{product.description}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-red-600">${product.price}</span>
            <span className="text-gray-500 ml-1">/{product.unit}</span>
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={isLoading}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Stock: {product.stock} {product.unit}s
        </div>
      </div>
    </div>
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

  const handleAddToCart = async (productId) => {
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
          quantity: 1
        })
      });

      if (response.ok) {
        alert('Item added to cart!');
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
  const { token, user } = useAuth();

  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [token]);

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
        <h2 className="text-3xl font-bold text-center mb-12">Shopping Cart</h2>
        
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
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
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
                      <p className="text-gray-600">${item.product.price} each</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-600">Qty: {item.quantity}</span>
                    <span className="font-semibold">${item.subtotal.toFixed(2)}</span>
                    <button 
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold">Total: ${total.toFixed(2)}</span>
                  <button 
                    onClick={() => setShowPayment(true)}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {showPayment && (
          <PaymentModal 
            total={total} 
            onClose={() => setShowPayment(false)}
            cartItems={cartItems}
          />
        )}
      </div>
    </section>
  );
};

const PaymentModal = ({ total, onClose, cartItems }) => {
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
          description: `Fresh Cuts Market - Order Total: $${total}`,
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
            quantity: item.quantity
          })),
          total_amount: paymentMethod === 'card' ? cardTotal : total,
          payment_method: paymentMethod
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
              <span>${total.toFixed(2)}</span>
            </div>
            {paymentMethod === 'card' && (
              <>
                <div className="flex justify-between mb-2">
                  <span>Processing Fee (3%):</span>
                  <span>${processingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${cardTotal.toFixed(2)}</span>
                </div>
              </>
            )}
            {paymentMethod === 'momo' && (
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
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
            {isProcessing ? 'Processing...' : `Pay ${paymentMethod === 'card' ? `$${cardTotal.toFixed(2)}` : `$${total.toFixed(2)}`}`}
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

  useEffect(() => {
    // Handle auth links
    const handleAuthLink = (e) => {
      if (e.target.getAttribute('href') === '#auth') {
        e.preventDefault();
        setShowAuthModal(true);
      }
    };

    document.addEventListener('click', handleAuthLink);
    return () => document.removeEventListener('click', handleAuthLink);
  }, []);

  return (
    <AuthProvider>
      <div className="App">
        <Header />
        <Hero />
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
                  <li><a href="#cart" className="hover:text-white">Cart</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Contact</h4>
                <p className="text-gray-300">
                  Phone: +250 783 654 454<br />
                  Email: info@freshcutsmarket.com
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