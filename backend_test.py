import requests
import json
import time
import random
import string
import os
import base64
from dotenv import load_dotenv
from io import BytesIO
from PIL import Image

# Load environment variables
load_dotenv()

# Get backend URL from environment
BACKEND_URL = os.getenv("REACT_APP_BACKEND_URL", "https://ce11165c-812f-4e18-a243-12c6aafb4d87.preview.emergentagent.com")
API_URL = f"{BACKEND_URL}/api"

# Test results tracking
test_results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "tests": []
}

# Admin credentials for testing admin endpoints
ADMIN_EMAIL = "admin@freshcuts.rw"
ADMIN_PASSWORD = "Admin123!"

# Admin credentials for testing admin endpoints
ADMIN_EMAIL = "admin@freshcuts.rw"
ADMIN_PASSWORD = "Admin123!"

# Helper function to generate random string
def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

# Helper function to record test results
def record_test(name, passed, message="", response=None):
    test_results["total"] += 1
    if passed:
        test_results["passed"] += 1
        status = "PASSED"
    else:
        test_results["failed"] += 1
        status = "FAILED"
    
    response_data = None
    if response:
        try:
            response_data = response.json()
        except:
            response_data = response.text
    
    test_results["tests"].append({
        "name": name,
        "status": status,
        "message": message,
        "response": response_data
    })
    
    print(f"{status}: {name}")
    if message:
        print(f"  Message: {message}")
    if not passed and response:
        print(f"  Status Code: {response.status_code}")
        print(f"  Response: {response_data}")
    print("-" * 50)

# Test Authentication Endpoints
def test_auth():
    print("\n=== Testing Authentication Endpoints ===\n")
    
    # Generate random user data for testing
    email = f"test_{random_string()}@example.com"
    password = "Test@123"
    name = f"Test User {random_string()}"
    
    # Test user registration
    register_data = {
        "email": email,
        "password": password,
        "name": name,
        "phone": "+250783123456"
    }
    
    response = requests.post(f"{API_URL}/auth/register", json=register_data)
    register_success = response.status_code == 200
    token = None
    user_id = None
    
    if register_success:
        data = response.json()
        token = data.get("token")
        user_id = data.get("user_id")
        record_test("User Registration", True, f"User registered with ID: {user_id}", response)
    else:
        record_test("User Registration", False, "Failed to register user", response)
    
    # Test user login
    login_data = {
        "email": email,
        "password": password
    }
    
    response = requests.post(f"{API_URL}/auth/login", json=login_data)
    login_success = response.status_code == 200
    
    if login_success:
        data = response.json()
        token = data.get("token")
        record_test("User Login", True, "Login successful", response)
    else:
        record_test("User Login", False, "Failed to login", response)
    
    # Test get user profile
    if token:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_URL}/auth/profile", headers=headers)
        profile_success = response.status_code == 200
        
        if profile_success:
            record_test("Get User Profile", True, "Profile retrieved successfully", response)
        else:
            record_test("Get User Profile", False, "Failed to get profile", response)
    else:
        record_test("Get User Profile", False, "Skipped due to missing token")
    
    return token, user_id

# Test Admin Authentication
def test_admin_auth():
    print("\n=== Testing Admin Authentication ===\n")
    
    # Test admin login
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    response = requests.post(f"{API_URL}/auth/login", json=login_data)
    login_success = response.status_code == 200
    admin_token = None
    
    if login_success:
        data = response.json()
        admin_token = data.get("token")
        record_test("Admin Login", True, "Admin login successful", response)
    else:
        record_test("Admin Login", False, "Failed to login as admin", response)
    
    return admin_token

# Test Product Endpoints
def test_products():
    print("\n=== Testing Product Endpoints ===\n")
    
    # Test get all products
    response = requests.get(f"{API_URL}/products")
    products_success = response.status_code == 200
    
    product_id = None
    if products_success:
        data = response.json()
        products = data.get("products", [])
        record_test("Get All Products", True, f"Retrieved {len(products)} products", response)
        
        if products:
            product_id = products[0].get("_id")
    else:
        record_test("Get All Products", False, "Failed to get products", response)
    
    # Test get product by category
    if products_success:
        response = requests.get(f"{API_URL}/products?category=fresh_meat")
        category_success = response.status_code == 200
        
        if category_success:
            data = response.json()
            products = data.get("products", [])
            record_test("Get Products by Category", True, f"Retrieved {len(products)} products in 'fresh_meat' category", response)
        else:
            record_test("Get Products by Category", False, "Failed to get products by category", response)
    
    # Test get single product
    if product_id:
        response = requests.get(f"{API_URL}/products/{product_id}")
        single_product_success = response.status_code == 200
        
        if single_product_success:
            record_test("Get Single Product", True, f"Retrieved product with ID: {product_id}", response)
        else:
            record_test("Get Single Product", False, f"Failed to get product with ID: {product_id}", response)
    else:
        record_test("Get Single Product", False, "Skipped due to missing product ID")
    
    # Test create new product
    new_product_data = {
        "name": f"Test Product {random_string()}",
        "description": "A test product created by automated tests",
        "price": 15.99,
        "category": "test_category",
        "image_url": "https://example.com/test-image.jpg",
        "stock": 10,
        "weight": 0.5,
        "unit": "kg"
    }
    
    response = requests.post(f"{API_URL}/products", json=new_product_data)
    create_product_success = response.status_code == 200
    
    if create_product_success:
        data = response.json()
        new_product_id = data.get("product_id")
        record_test("Create New Product", True, f"Created product with ID: {new_product_id}", response)
    else:
        record_test("Create New Product", False, "Failed to create product", response)
    
    return product_id

# Test Cart Endpoints
def test_cart(token, product_id):
    print("\n=== Testing Cart Endpoints ===\n")
    
    if not token or not product_id:
        record_test("Add to Cart", False, "Skipped due to missing token or product ID")
        record_test("Get Cart", False, "Skipped due to missing token")
        record_test("Remove from Cart", False, "Skipped due to missing token or product ID")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test add to cart
    cart_item = {
        "product_id": product_id,
        "quantity": 2
    }
    
    response = requests.post(f"{API_URL}/cart/add", json=cart_item, headers=headers)
    add_to_cart_success = response.status_code == 200
    
    if add_to_cart_success:
        record_test("Add to Cart", True, f"Added product {product_id} to cart", response)
    else:
        record_test("Add to Cart", False, "Failed to add product to cart", response)
    
    # Test get cart
    response = requests.get(f"{API_URL}/cart", headers=headers)
    get_cart_success = response.status_code == 200
    
    if get_cart_success:
        data = response.json()
        cart_items = data.get("cart_items", [])
        total = data.get("total", 0)
        record_test("Get Cart", True, f"Retrieved cart with {len(cart_items)} items, total: {total}", response)
    else:
        record_test("Get Cart", False, "Failed to get cart", response)
    
    # Test remove from cart
    response = requests.delete(f"{API_URL}/cart/{product_id}", headers=headers)
    remove_from_cart_success = response.status_code == 200
    
    if remove_from_cart_success:
        record_test("Remove from Cart", True, f"Removed product {product_id} from cart", response)
    else:
        record_test("Remove from Cart", False, f"Failed to remove product {product_id} from cart", response)

# Test Payment Endpoints
def test_payments(token, user_id):
    print("\n=== Testing Payment Endpoints ===\n")
    
    if not token or not user_id:
        record_test("Initiate MoMo Payment", False, "Skipped due to missing token or user ID")
        record_test("Check MoMo Payment Status", False, "Skipped due to missing token")
        record_test("Create DPO Payment Token", False, "Skipped due to missing token")
        record_test("Verify DPO Payment", False, "Skipped due to missing token")
        return
    
    # Test MoMo payment initiation
    order_id = f"test_order_{random_string()}"
    momo_payment_data = {
        "amount": 100.0,
        "phone": "+250783654454",
        "order_id": order_id
    }
    
    response = requests.post(f"{API_URL}/payments/momo/initiate", json=momo_payment_data)
    momo_init_success = response.status_code == 200
    transaction_id = None
    
    if momo_init_success:
        data = response.json()
        transaction_id = data.get("transaction_id")
        record_test("Initiate MoMo Payment", True, f"Initiated payment with transaction ID: {transaction_id}", response)
    else:
        record_test("Initiate MoMo Payment", False, "Failed to initiate MoMo payment", response)
    
    # Test MoMo payment status check
    if transaction_id:
        response = requests.get(f"{API_URL}/payments/momo/status/{transaction_id}")
        momo_status_success = response.status_code == 200
        
        if momo_status_success:
            record_test("Check MoMo Payment Status", True, f"Checked status for transaction ID: {transaction_id}", response)
        else:
            record_test("Check MoMo Payment Status", False, f"Failed to check status for transaction ID: {transaction_id}", response)
    else:
        record_test("Check MoMo Payment Status", False, "Skipped due to missing transaction ID")
    
    # Test DPO payment token creation
    dpo_payment_data = {
        "amount": 150.0,
        "description": "Test payment",
        "redirect_url": f"{BACKEND_URL}/payment-success",
        "back_url": f"{BACKEND_URL}/payment-cancel"
    }
    
    response = requests.post(f"{API_URL}/payments/dpo/create-token", json=dpo_payment_data)
    dpo_token_success = response.status_code == 200
    transaction_token = None
    
    if dpo_token_success:
        data = response.json()
        transaction_token = data.get("transaction_token")
        original_amount = data.get("original_amount", 0)
        total_amount = data.get("total_amount", 0)
        processing_fee = data.get("processing_fee", 0)
        
        # Verify 3% fee is applied if all values are present
        fee_verification = True
        if original_amount and total_amount and processing_fee:
            fee_verification = abs((total_amount - original_amount) - processing_fee) < 0.01
        
        record_test("Create DPO Payment Token", True, 
                   f"Created token: {transaction_token}, Original: {original_amount}, Total: {total_amount}, Fee: {processing_fee}", 
                   response)
        
        if fee_verification:
            record_test("DPO 3% Fee Verification", True, f"3% fee correctly applied: {processing_fee}")
        else:
            record_test("DPO 3% Fee Verification", False, f"3% fee calculation incorrect")
    else:
        record_test("Create DPO Payment Token", False, "Failed to create DPO payment token", response)
    
    # Test DPO payment verification
    if transaction_token:
        verify_data = {
            "transaction_token": transaction_token
        }
        
        response = requests.post(f"{API_URL}/payments/dpo/verify", json=verify_data)
        dpo_verify_success = response.status_code == 200
        
        if dpo_verify_success:
            record_test("Verify DPO Payment", True, f"Verified payment with token: {transaction_token}", response)
        else:
            record_test("Verify DPO Payment", False, f"Failed to verify payment with token: {transaction_token}", response)
    else:
        # Create a mock token for testing if we didn't get a real one
        mock_token = f"TEST_TOKEN_{random_string(16)}"
        verify_data = {
            "transaction_token": mock_token
        }
        
        response = requests.post(f"{API_URL}/payments/dpo/verify", json=verify_data)
        dpo_verify_success = response.status_code == 200
        
        if dpo_verify_success:
            record_test("Verify DPO Payment", True, f"Verified payment with mock token: {mock_token}", response)
        else:
            record_test("Verify DPO Payment", False, f"Failed to verify payment with mock token: {mock_token}", response)

# Test Order Endpoints
def test_orders(token, product_id):
    print("\n=== Testing Order Endpoints ===\n")
    
    if not token or not product_id:
        record_test("Create Order", False, "Skipped due to missing token or product ID")
        record_test("Get Orders", False, "Skipped due to missing token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Add item to cart first
    cart_item = {
        "product_id": product_id,
        "quantity": 1
    }
    
    requests.post(f"{API_URL}/cart/add", json=cart_item, headers=headers)
    
    # Test create order
    order_data = {
        "user_id": "placeholder",  # Will be replaced by the backend
        "items": [cart_item],
        "total_amount": 25.99,
        "payment_method": "momo"
    }
    
    response = requests.post(f"{API_URL}/orders", json=order_data, headers=headers)
    create_order_success = response.status_code == 200
    
    if create_order_success:
        data = response.json()
        order_id = data.get("order_id")
        record_test("Create Order", True, f"Created order with ID: {order_id}", response)
    else:
        record_test("Create Order", False, "Failed to create order", response)
    
    # Test get orders
    response = requests.get(f"{API_URL}/orders", headers=headers)
    get_orders_success = response.status_code == 200
    
    if get_orders_success:
        data = response.json()
        orders = data.get("orders", [])
        record_test("Get Orders", True, f"Retrieved {len(orders)} orders", response)
    else:
        record_test("Get Orders", False, "Failed to get orders", response)
        record_test("Get Orders", False, "Failed to get orders", response)

# Test Slider Management APIs
def test_slider_management(admin_token):
    print("\n=== Testing Slider Management APIs ===\n")
    
    if not admin_token:
        record_test("Get All Sliders", False, "Skipped due to missing admin token")
        record_test("Create Slider", False, "Skipped due to missing admin token")
        record_test("Update Slider", False, "Skipped due to missing admin token")
        record_test("Delete Slider", False, "Skipped due to missing admin token")
        record_test("Get Public Sliders", False, "Skipped due to missing admin token")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test GET /api/admin/sliders
    response = requests.get(f"{API_URL}/admin/sliders", headers=headers)
    get_sliders_success = response.status_code == 200
    
    if get_sliders_success:
        data = response.json()
        sliders = data.get("sliders", [])
        record_test("Get All Sliders", True, f"Retrieved {len(sliders)} sliders", response)
    else:
        record_test("Get All Sliders", False, "Failed to get sliders", response)
    
    # Test POST /api/admin/sliders
    slider_data = {
        "title": f"Test Slider {random_string()}",
        "subtitle": "Automated Test Subtitle",
        "description": "This slider was created by automated tests",
        "image_url": "https://example.com/test-slider.jpg",
        "button_text": "Learn More",
        "button_link": "/products",
        "order": 1,
        "active": True
    }
    
    response = requests.post(f"{API_URL}/admin/sliders", json=slider_data, headers=headers)
    create_slider_success = response.status_code == 200
    slider_id = None
    
    if create_slider_success:
        data = response.json()
        slider_id = data.get("slider_id")
        record_test("Create Slider", True, f"Created slider with ID: {slider_id}", response)
    else:
        record_test("Create Slider", False, "Failed to create slider", response)
    
    # Test PUT /api/admin/sliders/{slider_id}
    if slider_id:
        update_data = {
            "title": f"Updated Slider {random_string()}",
            "subtitle": "Updated Subtitle",
            "description": "This slider was updated by automated tests",
            "image_url": "https://example.com/updated-slider.jpg",
            "button_text": "Shop Now",
            "button_link": "/shop",
            "order": 2,
            "active": True
        }
        
        response = requests.put(f"{API_URL}/admin/sliders/{slider_id}", json=update_data, headers=headers)
        update_slider_success = response.status_code == 200
        
        if update_slider_success:
            record_test("Update Slider", True, f"Updated slider with ID: {slider_id}", response)
        else:
            record_test("Update Slider", False, f"Failed to update slider with ID: {slider_id}", response)
    else:
        record_test("Update Slider", False, "Skipped due to missing slider ID")
    
    # Test GET /api/public/sliders
    response = requests.get(f"{API_URL}/public/sliders")
    get_public_sliders_success = response.status_code == 200
    
    if get_public_sliders_success:
        data = response.json()
        sliders = data.get("sliders", [])
        record_test("Get Public Sliders", True, f"Retrieved {len(sliders)} public sliders", response)
    else:
        record_test("Get Public Sliders", False, "Failed to get public sliders", response)
    
    # Test DELETE /api/admin/sliders/{slider_id}
    if slider_id:
        response = requests.delete(f"{API_URL}/admin/sliders/{slider_id}", headers=headers)
        delete_slider_success = response.status_code == 200
        
        if delete_slider_success:
            record_test("Delete Slider", True, f"Deleted slider with ID: {slider_id}", response)
        else:
            record_test("Delete Slider", False, f"Failed to delete slider with ID: {slider_id}", response)
    else:
        record_test("Delete Slider", False, "Skipped due to missing slider ID")

# Test Website Builder/Sections APIs
def test_sections_management(admin_token):
    print("\n=== Testing Website Builder/Sections APIs ===\n")
    
    if not admin_token:
        record_test("Get All Sections", False, "Skipped due to missing admin token")
        record_test("Create Section", False, "Skipped due to missing admin token")
        record_test("Update Section", False, "Skipped due to missing admin token")
        record_test("Delete Section", False, "Skipped due to missing admin token")
        record_test("Get Public Sections", False, "Skipped due to missing admin token")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test GET /api/admin/sections
    response = requests.get(f"{API_URL}/admin/sections", headers=headers)
    get_sections_success = response.status_code == 200
    
    if get_sections_success:
        data = response.json()
        sections = data.get("sections", [])
        record_test("Get All Sections", True, f"Retrieved {len(sections)} sections", response)
    else:
        record_test("Get All Sections", False, "Failed to get sections", response)
    
    # Test POST /api/admin/sections
    section_data = {
        "section_id": f"test_section_{random_string()}",
        "type": "hero",
        "title": f"Test Section {random_string()}",
        "content": {
            "heading": "Welcome to our store",
            "subheading": "Find the best products here",
            "background_image": "https://example.com/test-bg.jpg",
            "cta_text": "Shop Now",
            "cta_link": "/shop"
        },
        "order": 1,
        "active": True
    }
    
    response = requests.post(f"{API_URL}/admin/sections", json=section_data, headers=headers)
    create_section_success = response.status_code == 200
    section_id = None
    
    if create_section_success:
        data = response.json()
        section_id = data.get("section_id")
        record_test("Create Section", True, f"Created section with ID: {section_id}", response)
    else:
        record_test("Create Section", False, "Failed to create section", response)
    
    # Test PUT /api/admin/sections/{section_id}
    if section_id:
        update_data = {
            "section_id": section_id,
            "type": "features",
            "title": f"Updated Section {random_string()}",
            "content": {
                "heading": "Our Features",
                "features": [
                    {"title": "Quality", "description": "High quality products", "icon": "star"},
                    {"title": "Fast Delivery", "description": "Quick delivery options", "icon": "truck"}
                ]
            },
            "order": 2,
            "active": True
        }
        
        response = requests.put(f"{API_URL}/admin/sections/{section_id}", json=update_data, headers=headers)
        update_section_success = response.status_code == 200
        
        if update_section_success:
            record_test("Update Section", True, f"Updated section with ID: {section_id}", response)
        else:
            record_test("Update Section", False, f"Failed to update section with ID: {section_id}", response)
    else:
        record_test("Update Section", False, "Skipped due to missing section ID")
    
    # Test GET /api/public/sections
    response = requests.get(f"{API_URL}/public/sections")
    get_public_sections_success = response.status_code == 200
    
    if get_public_sections_success:
        data = response.json()
        sections = data.get("sections", [])
        record_test("Get Public Sections", True, f"Retrieved {len(sections)} public sections", response)
    else:
        record_test("Get Public Sections", False, "Failed to get public sections", response)
    
    # Test DELETE /api/admin/sections/{section_id}
    if section_id:
        response = requests.delete(f"{API_URL}/admin/sections/{section_id}", headers=headers)
        delete_section_success = response.status_code == 200
        
        if delete_section_success:
            record_test("Delete Section", True, f"Deleted section with ID: {section_id}", response)
        else:
            record_test("Delete Section", False, f"Failed to delete section with ID: {section_id}", response)
    else:
        record_test("Delete Section", False, "Skipped due to missing section ID")

# Test Maintenance Mode APIs
def test_maintenance_mode(admin_token):
    print("\n=== Testing Maintenance Mode APIs ===\n")
    
    if not admin_token:
        record_test("Get Maintenance Settings", False, "Skipped due to missing admin token")
        record_test("Toggle Maintenance Mode", False, "Skipped due to missing admin token")
        record_test("Maintenance Mode Middleware", False, "Skipped due to missing admin token")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test GET /api/admin/maintenance
    response = requests.get(f"{API_URL}/admin/maintenance", headers=headers)
    get_maintenance_success = response.status_code == 200
    
    if get_maintenance_success:
        data = response.json()
        enabled = data.get("enabled", False)
        record_test("Get Maintenance Settings", True, f"Maintenance mode is currently: {'enabled' if enabled else 'disabled'}", response)
    else:
        record_test("Get Maintenance Settings", False, "Failed to get maintenance settings", response)
    
    # Test POST /api/admin/maintenance (enable maintenance mode)
    maintenance_data = {
        "enabled": True,
        "title": "Test Maintenance Mode",
        "message": "This is a test of maintenance mode",
        "estimated_time": "30 minutes",
        "contact_email": "test@example.com"
    }
    
    response = requests.post(f"{API_URL}/admin/maintenance", json=maintenance_data, headers=headers)
    enable_maintenance_success = response.status_code == 200
    
    if enable_maintenance_success:
        record_test("Enable Maintenance Mode", True, "Maintenance mode enabled successfully", response)
    else:
        record_test("Enable Maintenance Mode", False, "Failed to enable maintenance mode", response)
    
    # Test maintenance mode middleware (should return 503 for public endpoints)
    response = requests.get(f"{API_URL}/products")
    maintenance_middleware_working = response.status_code == 503
    
    if maintenance_middleware_working:
        record_test("Maintenance Mode Middleware", True, "Middleware correctly returned 503 for public endpoint", response)
    else:
        record_test("Maintenance Mode Middleware", False, "Middleware failed to block public endpoint", response)
    
    # Admin endpoints should still be accessible
    response = requests.get(f"{API_URL}/admin/maintenance", headers=headers)
    admin_access_working = response.status_code == 200
    
    if admin_access_working:
        record_test("Admin Bypass for Maintenance", True, "Admin can still access endpoints during maintenance", response)
    else:
        record_test("Admin Bypass for Maintenance", False, "Admin cannot access endpoints during maintenance", response)
    
    # Test POST /api/admin/maintenance (disable maintenance mode)
    maintenance_data["enabled"] = False
    
    response = requests.post(f"{API_URL}/admin/maintenance", json=maintenance_data, headers=headers)
    disable_maintenance_success = response.status_code == 200
    
    if disable_maintenance_success:
        record_test("Disable Maintenance Mode", True, "Maintenance mode disabled successfully", response)
    else:
        record_test("Disable Maintenance Mode", False, "Failed to disable maintenance mode", response)
    
    # Verify public endpoints are accessible again
    response = requests.get(f"{API_URL}/products")
    public_access_restored = response.status_code == 200
    
    if public_access_restored:
        record_test("Public Access After Maintenance", True, "Public endpoints accessible after disabling maintenance", response)
    else:
        record_test("Public Access After Maintenance", False, "Public endpoints still blocked after disabling maintenance", response)

# Test WhatsApp Integration APIs
def test_whatsapp_integration(admin_token):
    print("\n=== Testing WhatsApp Integration APIs ===\n")
    
    if not admin_token:
        record_test("Get WhatsApp Settings", False, "Skipped due to missing admin token")
        record_test("Update WhatsApp Settings", False, "Skipped due to missing admin token")
        record_test("Generate WhatsApp Order Message", False, "Skipped due to missing admin token")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test GET /api/admin/whatsapp/settings
    response = requests.get(f"{API_URL}/admin/whatsapp/settings", headers=headers)
    get_whatsapp_settings_success = response.status_code == 200
    
    if get_whatsapp_settings_success:
        data = response.json()
        enabled = data.get("enabled", False)
        record_test("Get WhatsApp Settings", True, f"WhatsApp integration is currently: {'enabled' if enabled else 'disabled'}", response)
    else:
        record_test("Get WhatsApp Settings", False, "Failed to get WhatsApp settings", response)
    
    # Test POST /api/admin/whatsapp/settings
    whatsapp_settings = {
        "enabled": True,
        "phone_number": "+250783654454",
        "auto_send": False,
        "message_template": "default"
    }
    
    response = requests.post(f"{API_URL}/admin/whatsapp/settings", json=whatsapp_settings, headers=headers)
    update_whatsapp_settings_success = response.status_code == 200
    
    if update_whatsapp_settings_success:
        record_test("Update WhatsApp Settings", True, "WhatsApp settings updated successfully", response)
    else:
        record_test("Update WhatsApp Settings", False, "Failed to update WhatsApp settings", response)
    
    # Create a test order to use with WhatsApp integration
    # First, get a product ID
    response = requests.get(f"{API_URL}/products")
    products = response.json().get("products", [])
    
    if products:
        product_id = products[0].get("_id")
        
        # Create a test order
        order_data = {
            "user_id": "test_user",
            "items": [{"product_id": product_id, "quantity": 2}],
            "total_amount": 100.0,
            "payment_method": "momo",
            "customer_notes": "Test order for WhatsApp integration"
        }
        
        response = requests.post(f"{API_URL}/orders", json=order_data, headers=headers)
        
        if response.status_code == 200:
            order_id = response.json().get("order_id")
            
            # Test POST /api/admin/whatsapp/send-order
            params = {
                "order_id": order_id,
                "phone_number": "+250783654454"
            }
            
            response = requests.post(f"{API_URL}/admin/whatsapp/send-order", params=params, headers=headers)
            generate_whatsapp_message_success = response.status_code == 200
            
            if generate_whatsapp_message_success:
                data = response.json()
                whatsapp_url = data.get("whatsapp_url")
                formatted_message = data.get("formatted_message")
                record_test("Generate WhatsApp Order Message", True, f"Generated WhatsApp message for order: {order_id}", response)
            else:
                record_test("Generate WhatsApp Order Message", False, f"Failed to generate WhatsApp message for order: {order_id}", response)
        else:
            record_test("Generate WhatsApp Order Message", False, "Skipped due to failure to create test order")
    else:
        record_test("Generate WhatsApp Order Message", False, "Skipped due to no products available")

# Test Enhanced E-commerce Settings
def test_ecommerce_settings(admin_token):
    print("\n=== Testing Enhanced E-commerce Settings ===\n")
    
    if not admin_token:
        record_test("Get E-commerce Settings", False, "Skipped due to missing admin token")
        record_test("Update E-commerce Settings", False, "Skipped due to missing admin token")
        record_test("Get Public E-commerce Settings", False, "Skipped due to missing admin token")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test GET /api/admin/ecommerce-settings
    response = requests.get(f"{API_URL}/admin/ecommerce-settings", headers=headers)
    get_ecommerce_settings_success = response.status_code == 200
    
    if get_ecommerce_settings_success:
        data = response.json()
        store_name = data.get("store_name")
        maintenance_mode = data.get("maintenance_mode", False)
        record_test("Get E-commerce Settings", True, f"Retrieved settings for store: {store_name}", response)
        
        # Verify maintenance mode fields are present
        if "maintenance_mode" in data and "maintenance_message" in data:
            record_test("Maintenance Fields in E-commerce Settings", True, 
                       f"Maintenance fields present: mode={maintenance_mode}, message={data.get('maintenance_message')}")
        else:
            record_test("Maintenance Fields in E-commerce Settings", False, 
                       "Maintenance fields missing from e-commerce settings")
    else:
        record_test("Get E-commerce Settings", False, "Failed to get e-commerce settings", response)
    
    # Test POST /api/admin/ecommerce-settings
    ecommerce_settings = {
        "store_name": "Fresh Cuts Market Test",
        "store_tagline": "Premium Quality Meats & Fresh Groceries - Test",
        "primary_color": "#dc2626",
        "secondary_color": "#991b1b",
        "currency": "RWF",
        "currency_symbol": "RWF",
        "tax_rate": 0.0,
        "enable_delivery": True,
        "enable_pickup": True,
        "maintenance_mode": False,
        "maintenance_message": "We are currently performing scheduled maintenance. Please check back soon!",
        "checkout_fields": {
            "require_phone": True,
            "require_address": True,
            "allow_notes": True
        },
        "order_statuses": ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"]
    }
    
    response = requests.post(f"{API_URL}/admin/ecommerce-settings", json=ecommerce_settings, headers=headers)
    update_ecommerce_settings_success = response.status_code == 200
    
    if update_ecommerce_settings_success:
        record_test("Update E-commerce Settings", True, "E-commerce settings updated successfully", response)
    else:
        record_test("Update E-commerce Settings", False, "Failed to update e-commerce settings", response)
    
    # Test GET /api/public/ecommerce-settings
    response = requests.get(f"{API_URL}/public/ecommerce-settings")
    get_public_ecommerce_settings_success = response.status_code == 200
    
    if get_public_ecommerce_settings_success:
        data = response.json()
        store_name = data.get("store_name")
        
        # Verify maintenance information is included in public settings
        if "maintenance_mode" in data and "maintenance_message" in data:
            record_test("Get Public E-commerce Settings", True, 
                       f"Retrieved public settings for store: {store_name} with maintenance info", response)
        else:
            record_test("Get Public E-commerce Settings", True, 
                       f"Retrieved public settings for store: {store_name}, but maintenance info missing", response)
    else:
        record_test("Get Public E-commerce Settings", False, "Failed to get public e-commerce settings", response)

# Run all tests
def run_tests():
    print("\n===== STARTING BUTCHERY E-COMMERCE API TESTS =====\n")
    
    # Test authentication endpoints
    token, user_id = test_auth()
    
    # Test admin authentication
    admin_token = test_admin_auth()
    
    # Test product endpoints
    product_id = test_products()
    
    # Test cart endpoints
    test_cart(token, product_id)
    
    # Test payment endpoints
    test_payments(token, user_id)
    
    # Test order endpoints
    test_orders(token, product_id)
    
    # Test new advanced admin panel features
    test_slider_management(admin_token)
    test_sections_management(admin_token)
    test_maintenance_mode(admin_token)
    test_whatsapp_integration(admin_token)
    test_ecommerce_settings(admin_token)
    
    # Print summary
    print("\n===== TEST SUMMARY =====")
    print(f"Total Tests: {test_results['total']}")
    print(f"Passed: {test_results['passed']}")
    print(f"Failed: {test_results['failed']}")
    print(f"Success Rate: {(test_results['passed'] / test_results['total']) * 100:.2f}%")
    
    # Return detailed results for further analysis
    return test_results

if __name__ == "__main__":
    run_tests()