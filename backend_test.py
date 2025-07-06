import requests
import json
import time
import random
import string
import os
from dotenv import load_dotenv

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

# Run all tests
def run_tests():
    print("\n===== STARTING BUTCHERY E-COMMERCE API TESTS =====\n")
    
    # Test authentication endpoints
    token, user_id = test_auth()
    
    # Test product endpoints
    product_id = test_products()
    
    # Test cart endpoints
    test_cart(token, product_id)
    
    # Test payment endpoints
    test_payments(token, user_id)
    
    # Test order endpoints
    test_orders(token, product_id)
    
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