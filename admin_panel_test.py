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

# Test Enhanced Product Management APIs
def test_enhanced_product_management(admin_token):
    print("\n=== Testing Enhanced Product Management APIs ===\n")
    
    if not admin_token:
        record_test("Enhanced Product Creation", False, "Skipped due to missing admin token")
        record_test("Bulk Product Update", False, "Skipped due to missing admin token")
        record_test("Individual Product Update", False, "Skipped due to missing admin token")
        return None
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test enhanced product creation with all new fields
    new_product_data = {
        "name": f"Enhanced Test Product {random_string()}",
        "description": "A detailed description of this premium test product with enhanced features",
        "price": 12500.0,
        "category": "premium_meat",
        "image_url": "https://example.com/premium-test-image.jpg",
        "stock": 25,
        "weight": 1.5,
        "unit": "kg",
        "min_quantity": 0.5,
        "max_quantity": 5.0,
        "price_per_unit": "per_kg",
        "discount_percentage": 0.0,
        "is_special_offer": False
    }
    
    response = requests.post(f"{API_URL}/products", json=new_product_data, headers=headers)
    create_product_success = response.status_code == 200
    new_product_id = None
    
    if create_product_success:
        data = response.json()
        new_product_id = data.get("product_id")
        record_test("Enhanced Product Creation", True, f"Created enhanced product with ID: {new_product_id}", response)
    else:
        record_test("Enhanced Product Creation", False, "Failed to create enhanced product", response)
    
    # Create a second product for bulk testing
    second_product_data = {
        "name": f"Second Test Product {random_string()}",
        "description": "Another test product for bulk operations",
        "price": 8900.0,
        "category": "premium_meat",
        "image_url": "https://example.com/second-test-image.jpg",
        "stock": 15,
        "weight": 0.8,
        "unit": "kg",
        "min_quantity": 0.25,
        "max_quantity": 3.0,
        "price_per_unit": "per_kg",
        "discount_percentage": 0.0,
        "is_special_offer": False
    }
    
    response = requests.post(f"{API_URL}/products", json=second_product_data, headers=headers)
    second_product_id = None
    if response.status_code == 200:
        second_product_id = response.json().get("product_id")
    
    # Test individual product update with new fields
    if new_product_id:
        update_data = {
            "name": f"Updated Enhanced Product {random_string()}",
            "description": "Updated description with more details",
            "weight": 2.0,
            "min_quantity": 0.75,
            "max_quantity": 7.5,
            "stock": 30,
            "price": 13500.0
        }
        
        response = requests.put(f"{API_URL}/admin/products/{new_product_id}", json=update_data, headers=headers)
        update_success = response.status_code == 200
        
        if update_success:
            record_test("Individual Product Update", True, f"Updated product with ID: {new_product_id}", response)
        else:
            record_test("Individual Product Update", False, f"Failed to update product with ID: {new_product_id}", response)
    else:
        record_test("Individual Product Update", False, "Skipped due to missing product ID")
    
    # Test bulk product update with new fields (BEAR-style)
    if new_product_id and second_product_id:
        bulk_updates = {
            "updates": [
                {
                    "_id": new_product_id,
                    "description": "Bulk updated description for product 1",
                    "weight": 2.2,
                    "min_quantity": 1.0,
                    "max_quantity": 8.0,
                    "stock": 35,
                    "price": 14000.0,
                    "discount_percentage": 5.0
                },
                {
                    "_id": second_product_id,
                    "description": "Bulk updated description for product 2",
                    "weight": 1.0,
                    "min_quantity": 0.5,
                    "max_quantity": 4.0,
                    "stock": 20,
                    "price": 9500.0,
                    "discount_percentage": 10.0
                }
            ]
        }
        
        response = requests.put(f"{API_URL}/admin/products/bulk-table", json=bulk_updates, headers=headers)
        bulk_update_success = response.status_code == 200
        
        if bulk_update_success:
            data = response.json()
            updated_count = data.get("updated_count", 0)
            record_test("Bulk Product Update (BEAR-style)", True, f"Updated {updated_count} products", response)
        else:
            record_test("Bulk Product Update (BEAR-style)", False, "Failed to perform bulk update", response)
    else:
        record_test("Bulk Product Update (BEAR-style)", False, "Skipped due to missing product IDs")
    
    # Test traditional bulk product update
    if new_product_id and second_product_id:
        bulk_data = {
            "product_ids": [new_product_id, second_product_id],
            "updates": {
                "is_special_offer": True,
                "discount_percentage": 15.0
            }
        }
        
        response = requests.put(f"{API_URL}/admin/products/bulk", json=bulk_data, headers=headers)
        trad_bulk_update_success = response.status_code == 200
        
        if trad_bulk_update_success:
            data = response.json()
            modified_count = data.get("modified_count", 0)
            record_test("Traditional Bulk Product Update", True, f"Updated {modified_count} products", response)
        else:
            record_test("Traditional Bulk Product Update", False, "Failed to perform traditional bulk update", response)
    else:
        record_test("Traditional Bulk Product Update", False, "Skipped due to missing product IDs")
    
    return new_product_id

# Test E-commerce Settings & Customization APIs
def test_ecommerce_settings(admin_token):
    print("\n=== Testing E-commerce Settings & Customization APIs ===\n")
    
    if not admin_token:
        record_test("Get E-commerce Settings", False, "Skipped due to missing admin token")
        record_test("Update E-commerce Settings", False, "Skipped due to missing admin token")
        record_test("Get Delivery Zones", False, "Skipped due to missing admin token")
        record_test("Create Delivery Zone", False, "Skipped due to missing admin token")
        record_test("Update Delivery Zone", False, "Skipped due to missing admin token")
        record_test("Delete Delivery Zone", False, "Skipped due to missing admin token")
        record_test("Get Special Offers", False, "Skipped due to missing admin token")
        record_test("Create Special Offer", False, "Skipped due to missing admin token")
        record_test("Delete Special Offer", False, "Skipped due to missing admin token")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test get e-commerce settings
    response = requests.get(f"{API_URL}/admin/ecommerce-settings", headers=headers)
    get_settings_success = response.status_code == 200
    
    if get_settings_success:
        record_test("Get E-commerce Settings", True, "Retrieved e-commerce settings", response)
    else:
        record_test("Get E-commerce Settings", False, "Failed to get e-commerce settings", response)
    
    # Test update e-commerce settings
    settings_data = {
        "store_name": f"Test Store {random_string()}",
        "store_tagline": "Premium Quality Test Products",
        "primary_color": "#ff5500",
        "secondary_color": "#0055ff",
        "currency": "RWF",
        "currency_symbol": "RWF",
        "tax_rate": 0.0,
        "enable_delivery": True,
        "enable_pickup": True,
        "checkout_fields": {
            "require_phone": True,
            "require_address": True,
            "allow_notes": True
        },
        "order_statuses": ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"]
    }
    
    response = requests.post(f"{API_URL}/admin/ecommerce-settings", json=settings_data, headers=headers)
    update_settings_success = response.status_code == 200
    
    if update_settings_success:
        record_test("Update E-commerce Settings", True, "Updated e-commerce settings", response)
    else:
        record_test("Update E-commerce Settings", False, "Failed to update e-commerce settings", response)
    
    # Test get delivery zones
    response = requests.get(f"{API_URL}/admin/delivery-zones", headers=headers)
    get_zones_success = response.status_code == 200
    zone_id = None
    
    if get_zones_success:
        data = response.json()
        zones = data.get("zones", [])
        record_test("Get Delivery Zones", True, f"Retrieved {len(zones)} delivery zones", response)
        
        if zones:
            zone_id = zones[0].get("_id")
    else:
        record_test("Get Delivery Zones", False, "Failed to get delivery zones", response)
    
    # Test create delivery zone
    zone_data = {
        "name": f"Test Zone {random_string()}",
        "areas": ["Test Area 1", "Test Area 2"],
        "base_fee": 2000.0,
        "per_km_rate": 300.0,
        "min_order_for_free": 30000.0
    }
    
    response = requests.post(f"{API_URL}/admin/delivery-zones", json=zone_data, headers=headers)
    create_zone_success = response.status_code == 200
    new_zone_id = None
    
    if create_zone_success:
        data = response.json()
        new_zone_id = data.get("zone_id")
        record_test("Create Delivery Zone", True, f"Created delivery zone with ID: {new_zone_id}", response)
    else:
        record_test("Create Delivery Zone", False, "Failed to create delivery zone", response)
    
    # Test update delivery zone
    if new_zone_id:
        update_zone_data = {
            "name": f"Updated Test Zone {random_string()}",
            "areas": ["Updated Area 1", "Updated Area 2", "New Area 3"],
            "base_fee": 2500.0,
            "per_km_rate": 350.0,
            "min_order_for_free": 35000.0
        }
        
        response = requests.put(f"{API_URL}/admin/delivery-zones/{new_zone_id}", json=update_zone_data, headers=headers)
        update_zone_success = response.status_code == 200
        
        if update_zone_success:
            record_test("Update Delivery Zone", True, f"Updated delivery zone with ID: {new_zone_id}", response)
        else:
            record_test("Update Delivery Zone", False, f"Failed to update delivery zone with ID: {new_zone_id}", response)
    else:
        record_test("Update Delivery Zone", False, "Skipped due to missing zone ID")
    
    # Test delete delivery zone
    if new_zone_id:
        response = requests.delete(f"{API_URL}/admin/delivery-zones/{new_zone_id}", headers=headers)
        delete_zone_success = response.status_code == 200
        
        if delete_zone_success:
            record_test("Delete Delivery Zone", True, f"Deleted delivery zone with ID: {new_zone_id}", response)
        else:
            record_test("Delete Delivery Zone", False, f"Failed to delete delivery zone with ID: {new_zone_id}", response)
    else:
        record_test("Delete Delivery Zone", False, "Skipped due to missing zone ID")
    
    # Test get special offers
    response = requests.get(f"{API_URL}/admin/special-offers", headers=headers)
    get_offers_success = response.status_code == 200
    
    if get_offers_success:
        data = response.json()
        offers = data.get("offers", [])
        record_test("Get Special Offers", True, f"Retrieved {len(offers)} special offers", response)
    else:
        record_test("Get Special Offers", False, "Failed to get special offers", response)
    
    # Test create special offer
    # First, get some product IDs to use in the offer
    response = requests.get(f"{API_URL}/products")
    product_ids = []
    if response.status_code == 200:
        products = response.json().get("products", [])
        if products:
            product_ids = [p.get("_id") for p in products[:2]]
    
    if product_ids:
        offer_data = {
            "title": f"Test Special Offer {random_string()}",
            "description": "Special discount on test products",
            "discount_percentage": 20.0,
            "product_ids": product_ids,
            "start_date": "2025-01-01T00:00:00.000Z",
            "end_date": "2025-12-31T23:59:59.999Z",
            "is_active": True
        }
        
        response = requests.post(f"{API_URL}/admin/special-offers", json=offer_data, headers=headers)
        create_offer_success = response.status_code == 200
        offer_id = None
        
        if create_offer_success:
            data = response.json()
            offer_id = data.get("offer_id")
            record_test("Create Special Offer", True, f"Created special offer with ID: {offer_id}", response)
        else:
            record_test("Create Special Offer", False, "Failed to create special offer", response)
        
        # Test delete special offer
        if offer_id:
            response = requests.delete(f"{API_URL}/admin/special-offers/{offer_id}", headers=headers)
            delete_offer_success = response.status_code == 200
            
            if delete_offer_success:
                record_test("Delete Special Offer", True, f"Deleted special offer with ID: {offer_id}", response)
            else:
                record_test("Delete Special Offer", False, f"Failed to delete special offer with ID: {offer_id}", response)
        else:
            record_test("Delete Special Offer", False, "Skipped due to missing offer ID")
    else:
        record_test("Create Special Offer", False, "Skipped due to missing product IDs")
        record_test("Delete Special Offer", False, "Skipped due to missing product IDs")

# Test File Upload & Image Management
def test_file_upload(admin_token):
    print("\n=== Testing File Upload & Image Management ===\n")
    
    if not admin_token:
        record_test("Upload Product Image", False, "Skipped due to missing admin token")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create a simple test image
    try:
        # Create a small red square image
        img = Image.new('RGB', (100, 100), color='red')
        img_io = BytesIO()
        img.save(img_io, 'JPEG')
        img_io.seek(0)
        
        files = {
            'file': ('test_image.jpg', img_io, 'image/jpeg')
        }
        
        response = requests.post(f"{API_URL}/admin/upload-image", files=files, headers=headers)
        upload_success = response.status_code == 200
        
        if upload_success:
            data = response.json()
            image_url = data.get("image_url")
            record_test("Upload Product Image", True, f"Uploaded image successfully", response)
        else:
            record_test("Upload Product Image", False, "Failed to upload image", response)
    except Exception as e:
        record_test("Upload Product Image", False, f"Error creating test image: {str(e)}")

# Test Admin Panel Specific APIs
def test_admin_panel_apis(admin_token):
    print("\n=== Testing Admin Panel Specific APIs ===\n")
    
    if not admin_token:
        record_test("Admin Dashboard Analytics", False, "Skipped due to missing admin token")
        record_test("Get All Users", False, "Skipped due to missing admin token")
        record_test("Get All Orders", False, "Skipped due to missing admin token")
        record_test("Get All Payments", False, "Skipped due to missing admin token")
        record_test("Send Bulk Email", False, "Skipped due to missing admin token")
        record_test("Get Email Campaigns", False, "Skipped due to missing admin token")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test admin dashboard analytics
    response = requests.get(f"{API_URL}/admin/analytics", headers=headers)
    analytics_success = response.status_code == 200
    
    if analytics_success:
        record_test("Admin Dashboard Analytics", True, "Retrieved admin dashboard analytics", response)
    else:
        record_test("Admin Dashboard Analytics", False, "Failed to get admin dashboard analytics", response)
    
    # Test get all users
    response = requests.get(f"{API_URL}/admin/users", headers=headers)
    users_success = response.status_code == 200
    
    if users_success:
        data = response.json()
        users = data.get("users", [])
        record_test("Get All Users", True, f"Retrieved {len(users)} users", response)
    else:
        record_test("Get All Users", False, "Failed to get all users", response)
    
    # Test get all orders
    response = requests.get(f"{API_URL}/admin/orders", headers=headers)
    orders_success = response.status_code == 200
    
    if orders_success:
        data = response.json()
        orders = data.get("orders", [])
        record_test("Get All Orders", True, f"Retrieved {len(orders)} orders", response)
    else:
        record_test("Get All Orders", False, "Failed to get all orders", response)
    
    # Test get all payments
    response = requests.get(f"{API_URL}/admin/payments", headers=headers)
    payments_success = response.status_code == 200
    
    if payments_success:
        data = response.json()
        payments = data.get("payments", [])
        record_test("Get All Payments", True, f"Retrieved {len(payments)} payments", response)
    else:
        record_test("Get All Payments", False, "Failed to get all payments", response)
    
    # Test send bulk email (mock test to avoid sending real emails)
    email_data = {
        "subject": "Test Email Campaign",
        "message": "This is a test email from the automated testing system.",
        "recipient_type": "all"
    }
    
    response = requests.post(f"{API_URL}/admin/send-bulk-email", json=email_data, headers=headers)
    email_success = response.status_code == 200
    
    if email_success:
        record_test("Send Bulk Email", True, "Bulk email campaign initiated", response)
    else:
        record_test("Send Bulk Email", False, "Failed to initiate bulk email campaign", response)
    
    # Test get email campaigns
    response = requests.get(f"{API_URL}/admin/email-campaigns", headers=headers)
    campaigns_success = response.status_code == 200
    
    if campaigns_success:
        data = response.json()
        campaigns = data.get("campaigns", [])
        record_test("Get Email Campaigns", True, f"Retrieved {len(campaigns)} email campaigns", response)
    else:
        record_test("Get Email Campaigns", False, "Failed to get email campaigns", response)

# Run all tests
def run_tests():
    print("\n===== STARTING ENHANCED ADMIN PANEL API TESTS =====\n")
    
    # Test admin authentication
    admin_token = test_admin_auth()
    
    # Test enhanced product management APIs
    test_enhanced_product_management(admin_token)
    
    # Test e-commerce settings & customization APIs
    test_ecommerce_settings(admin_token)
    
    # Test file upload & image management
    test_file_upload(admin_token)
    
    # Test admin panel specific APIs
    test_admin_panel_apis(admin_token)
    
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