from fastapi import FastAPI, HTTPException, Depends, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import os
import uuid
import hashlib
import jwt
import requests
import xml.etree.ElementTree as ET
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import json
from dotenv import load_dotenv
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64
from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware

load_dotenv()

app = FastAPI(title="Butchery E-commerce API", version="1.0.0")

# Add session middleware for OAuth
app.add_middleware(SessionMiddleware, secret_key="your-secret-key-change-in-production")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth setup
oauth = OAuth()

# Google OAuth (if using traditional method)
oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID', 'your-google-client-id'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET', 'your-google-client-secret'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Security
security = HTTPBearer()

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.butchery_ecommerce

# MoMo Configuration
MOMO_APP_ID = "02d16d3e-5a98-11f0-a83d-dead131a2dd9"
MOMO_APP_SECRET = "4b1e9a8f5da8213ceb4b40115154bd68da39a3ee5e6b4b0d3255bfef95601890afd80709"
MOMO_PHONE = "+250783654454"

# DPO Configuration
DPO_COMPANY_TOKEN = "AAED15C2-21D1-4A8F-AD7F-5165CB681FF4"
DPO_SERVICE_TYPE = "52269-Product"
DPO_BASE_URL = "https://secure.3gdirectpay.com"
DPO_CURRENCY = "RWF"  # Rwandan Francs

# JWT Secret
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-here")

# Email Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_USER = os.getenv("EMAIL_USER", "admin@freshcuts.rw")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "your-email-password")

# OAuth and File Upload Models
class GoogleAuthRequest(BaseModel):
    code: str
    redirect_uri: str

class FacebookAuthRequest(BaseModel):
    access_token: str

class ProductBulkUpdate(BaseModel):
    product_ids: List[str]
    updates: Dict[str, Any]

class BulkProductUpdate(BaseModel):
    updates: List[Dict[str, Any]]  # List of product updates with IDs

class User(BaseModel):
    email: str
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

# File Upload Route
@app.post("/api/admin/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Upload product image and return base64 encoded string"""
    try:
        # Read file content
        content = await file.read()
        
        # Convert to base64
        base64_encoded = base64.b64encode(content).decode('utf-8')
        
        # Get file extension for proper mime type
        file_extension = file.filename.split('.')[-1].lower()
        mime_types = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp'
        }
        
        mime_type = mime_types.get(file_extension, 'image/jpeg')
        
        # Create data URL
        data_url = f"data:{mime_type};base64,{base64_encoded}"
        
        return {
            "success": True,
            "image_url": data_url,
            "file_name": file.filename,
            "file_size": len(content)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error uploading image: {str(e)}")

# Google OAuth Routes (Traditional method)
@app.get("/api/auth/google/login")
async def google_login(request: Request):
    """Initiate Google OAuth login"""
    redirect_uri = f"{request.base_url}api/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/api/auth/google/callback")
async def google_callback(request: Request):
    """Handle Google OAuth callback"""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = await oauth.google.parse_id_token(request, token)
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_info['email']})
        
        if existing_user:
            # User exists, login
            jwt_token = create_jwt_token(str(existing_user["_id"]))
            return {"token": jwt_token, "user": user_info}
        else:
            # Create new user
            user_data = {
                "email": user_info['email'],
                "name": user_info['name'],
                "picture": user_info.get('picture'),
                "auth_provider": "google",
                "google_id": user_info['sub'],
                "created_at": datetime.utcnow()
            }
            
            result = await db.users.insert_one(user_data)
            jwt_token = create_jwt_token(str(result.inserted_id))
            
            return {"token": jwt_token, "user": user_info}
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google authentication failed: {str(e)}")

# Facebook OAuth Routes
@app.post("/api/auth/facebook/login")
async def facebook_login(auth_request: FacebookAuthRequest):
    """Handle Facebook OAuth login"""
    try:
        # Verify Facebook token
        fb_response = requests.get(
            f"https://graph.facebook.com/me?access_token={auth_request.access_token}&fields=id,name,email,picture"
        )
        
        if fb_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Facebook token")
        
        user_info = fb_response.json()
        
        if not user_info.get('email'):
            raise HTTPException(status_code=400, detail="Email permission required")
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_info['email']})
        
        if existing_user:
            # User exists, login
            jwt_token = create_jwt_token(str(existing_user["_id"]))
            return {"token": jwt_token, "user": user_info}
        else:
            # Create new user
            user_data = {
                "email": user_info['email'],
                "name": user_info['name'],
                "picture": user_info.get('picture', {}).get('data', {}).get('url'),
                "auth_provider": "facebook",
                "facebook_id": user_info['id'],
                "created_at": datetime.utcnow()
            }
            
            result = await db.users.insert_one(user_data)
            jwt_token = create_jwt_token(str(result.inserted_id))
            
            return {"token": jwt_token, "user": user_info}
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Facebook authentication failed: {str(e)}")

# Enhanced Bulk Product Update Route
@app.put("/api/admin/products/bulk-table")
async def bulk_update_products_table(bulk_update: BulkProductUpdate):
    """Bulk update products using table format"""
    updated_count = 0
    errors = []
    
    for update_data in bulk_update.updates:
        try:
            product_id = update_data.pop('_id', None)
            if not product_id:
                errors.append("Missing product ID in update")
                continue
                
            # Clean update data
            clean_updates = {}
            for key, value in update_data.items():
                if value is not None and value != '':
                    if key in ['price', 'stock', 'weight', 'min_quantity', 'max_quantity', 'discount_percentage']:
                        clean_updates[key] = float(value) if value else 0
                    else:
                        clean_updates[key] = value
            
            if clean_updates:
                clean_updates["updated_at"] = datetime.utcnow()
                
                result = await db.products.update_one(
                    {"_id": ObjectId(product_id)},
                    {"$set": clean_updates}
                )
                
                if result.modified_count > 0:
                    updated_count += 1
                    
        except Exception as e:
            errors.append(f"Error updating product {product_id}: {str(e)}")
    
    return {
        "message": f"Bulk update completed",
        "updated_count": updated_count,
        "errors": errors
    }
class Product(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: Optional[str] = None
    stock: int = 0
    weight: Optional[float] = None
    unit: str = "piece"
    min_quantity: float = 1.0
    max_quantity: Optional[float] = None
    price_per_unit: Optional[str] = None  # "per_kg", "per_gram", "per_piece"
    discount_percentage: float = 0.0
    is_special_offer: bool = False

# OAuth and File Upload Models
class GoogleAuthRequest(BaseModel):
    code: str
    redirect_uri: str

class FacebookAuthRequest(BaseModel):
    access_token: str

class ProductBulkUpdate(BaseModel):
    product_ids: List[str]
    updates: Dict[str, Any]

class BulkProductUpdate(BaseModel):
    updates: List[Dict[str, Any]]  # List of product updates with IDs

class BulkProductUpdate(BaseModel):
    updates: List[Dict[str, Any]]  # List of product updates with IDs

class CartItem(BaseModel):
    product_id: str
    quantity: float  # Changed to float for custom quantities
    unit: Optional[str] = None

class Order(BaseModel):
    user_id: str
    items: List[CartItem]
    total_amount: float
    status: str = "pending"
    payment_method: str
    customer_notes: Optional[str] = None

class MoMoPayment(BaseModel):
    amount: float
    phone: str
    order_id: str

class DPOPayment(BaseModel):
    amount: float
    description: str
    redirect_url: str
    back_url: str

class SpecialOffer(BaseModel):
    title: str
    description: str
    discount_percentage: float
    product_ids: List[str]
    start_date: datetime
    end_date: datetime
    is_active: bool = True

class EmailSettings(BaseModel):
    admin_email: str
    notify_new_orders: bool = True
    notify_low_stock: bool = True
    low_stock_threshold: int = 10

# Location and Delivery Models
class DeliveryZone(BaseModel):
    name: str
    areas: List[str]
    base_fee: float
    per_km_rate: float = 0.0
    min_order_for_free: Optional[float] = None

class CustomerLocation(BaseModel):
    address: str
    district: str
    sector: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class EcommerceSettings(BaseModel):
    store_name: str = "Fresh Cuts Market"
    store_tagline: str = "Premium Quality Meats & Fresh Groceries"
    primary_color: str = "#dc2626"
    secondary_color: str = "#991b1b"
    currency: str = "RWF"
    currency_symbol: str = "RWF"
    tax_rate: float = 0.0
    enable_delivery: bool = True
    enable_pickup: bool = True
    maintenance_mode: bool = False
    maintenance_message: str = "We are currently performing scheduled maintenance. Please check back soon!"
    checkout_fields: Dict[str, Any] = {
        "require_phone": True,
        "require_address": True,
        "allow_notes": True
    }
    order_statuses: List[str] = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"]

class MaintenanceSettings(BaseModel):
    enabled: bool = False
    title: str = "Site Under Maintenance"
    message: str = "We are currently performing scheduled maintenance. Please check back soon!"
    estimated_time: Optional[str] = None
    contact_email: Optional[str] = None

class SliderItem(BaseModel):
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    image_url: str
    button_text: Optional[str] = None
    button_link: Optional[str] = None
    order: int = 0
    active: bool = True

class SectionContent(BaseModel):
    section_id: str
    type: str  # hero, features, testimonials, about, etc.
    title: str
    content: Dict[str, Any]
    order: int = 0
    active: bool = True

# Maintenance mode middleware
@app.middleware("http")
async def maintenance_mode_middleware(request: Request, call_next):
    # Check if maintenance mode is enabled
    if request.url.path not in ["/api/admin/maintenance", "/api/admin/ecommerce-settings"] and not request.url.path.startswith("/api/admin"):
        settings = await db.ecommerce_settings.find_one({"type": "main"})
        if settings and settings.get("maintenance_mode", False):
            # Allow admin to bypass maintenance mode
            auth_header = request.headers.get("authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JSONResponse(
                    status_code=503,
                    content={
                        "maintenance": True,
                        "title": "Site Under Maintenance",
                        "message": settings.get("maintenance_message", "We are currently performing scheduled maintenance. Please check back soon!"),
                        "estimated_time": settings.get("estimated_time"),
                        "contact_email": settings.get("contact_email")
                    }
                )
    
    response = await call_next(request)
    return response

# Helper Functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hashlib.sha256(password.encode()).hexdigest() == hashed

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_jwt_token(token: str) -> Dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_jwt_token(credentials.credentials)
    user = await db.users.find_one({"_id": ObjectId(payload["user_id"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def send_email(to_email: str, subject: str, body: str):
    """Send email notification"""
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(EMAIL_USER, to_email, text)
        server.quit()
        
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

def calculate_product_price(base_price: float, quantity: float, unit: str, price_per_unit: str = None) -> float:
    """Calculate price based on quantity and unit"""
    if price_per_unit == "per_kg":
        if unit == "gram":
            return base_price * (quantity / 1000)
        elif unit == "kg":
            return base_price * quantity
    elif price_per_unit == "per_gram":
        if unit == "kg":
            return base_price * (quantity * 1000)
        elif unit == "gram":
            return base_price * quantity
    else:  # per_piece
        return base_price * quantity
    
    return base_price * quantity

# MoMo Payment Service
class MoMoService:
    def __init__(self):
        self.app_id = MOMO_APP_ID
        self.app_secret = MOMO_APP_SECRET
        self.base_url = "https://developer.mtn.com"
        
    async def initiate_payment(self, amount: float, phone: str, order_id: str) -> Dict:
        """Initiate MoMo payment"""
        transaction_id = str(uuid.uuid4())
        
        # Store transaction
        transaction = {
            "_id": transaction_id,
            "order_id": order_id,
            "amount": amount,
            "phone": phone,
            "status": "pending",
            "payment_method": "momo",
            "created_at": datetime.utcnow()
        }
        
        await db.payment_transactions.insert_one(transaction)
        
        # Mock response for MoMo (implement actual API call)
        return {
            "transaction_id": transaction_id,
            "status": "pending",
            "message": "Payment initiated. Please check your phone for USSD prompt."
        }
    
    async def check_payment_status(self, transaction_id: str) -> Dict:
        """Check MoMo payment status"""
        transaction = await db.payment_transactions.find_one({"_id": transaction_id})
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Mock status check (implement actual API call)
        return {
            "transaction_id": transaction_id,
            "status": transaction["status"],
            "payment_status": "completed" if transaction["status"] == "completed" else "pending"
        }

# DPO Payment Service
class DPOService:
    def __init__(self):
        self.company_token = DPO_COMPANY_TOKEN
        self.service_type = DPO_SERVICE_TYPE
        self.base_url = DPO_BASE_URL
        
    def create_payment_token(self, amount: float, description: str, redirect_url: str, back_url: str) -> Dict:
        """Create DPO payment token"""
        # Add 3% processing fee for card payments
        total_amount = amount * 1.03
        
        xml_data = f"""<?xml version="1.0" encoding="utf-8"?>
        <API3G>
            <CompanyToken>{self.company_token}</CompanyToken>
            <Request>createToken</Request>
            <Transaction>
                <PaymentAmount>{total_amount:.2f}</PaymentAmount>
                <PaymentCurrency>{DPO_CURRENCY}</PaymentCurrency>
                <CompanyRef>ORDER_{uuid.uuid4().hex[:8]}</CompanyRef>
                <RedirectURL>{redirect_url}</RedirectURL>
                <BackURL>{back_url}</BackURL>
                <CompanyRefUnique>0</CompanyRefUnique>
                <PTL>5</PTL>
            </Transaction>
            <Services>
                <Service>
                    <ServiceType>{self.service_type}</ServiceType>
                    <ServiceDescription>{description}</ServiceDescription>
                    <ServiceDate>{datetime.now().strftime('%Y/%m/%d %H:%M')}</ServiceDate>
                </Service>
            </Services>
        </API3G>"""
        
        try:
            response = requests.post(
                f"{self.base_url}/API/v6/",
                data=xml_data,
                headers={"Content-Type": "application/xml"}
            )
            
            return self._parse_xml_response(response.text)
        except Exception as e:
            return {"error": str(e)}
    
    def verify_payment(self, transaction_token: str) -> Dict:
        """Verify DPO payment"""
        xml_data = f"""<?xml version="1.0" encoding="utf-8"?>
        <API3G>
            <CompanyToken>{self.company_token}</CompanyToken>
            <Request>verifyToken</Request>
            <TransactionToken>{transaction_token}</TransactionToken>
        </API3G>"""
        
        try:
            response = requests.post(
                f"{self.base_url}/API/v6/",
                data=xml_data,
                headers={"Content-Type": "application/xml"}
            )
            
            return self._parse_xml_response(response.text)
        except Exception as e:
            return {"error": str(e)}
    
    def _parse_xml_response(self, xml_text: str) -> Dict:
        """Parse XML response from DPO"""
        try:
            root = ET.fromstring(xml_text)
            result = {}
            for child in root:
                result[child.tag] = child.text
            return result
        except ET.ParseError:
            return {"error": "Invalid XML response"}

# Initialize services
momo_service = MoMoService()
dpo_service = DPOService()

# API Routes

@app.get("/")
async def root():
    return {"message": "Butchery E-commerce API", "version": "1.0.0"}

# Auth Routes
@app.post("/api/auth/register")
async def register(user: User):
    """Register new user"""
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_data = {
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "phone": user.phone,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_data)
    token = create_jwt_token(str(result.inserted_id))
    
    return {"message": "User registered successfully", "token": token, "user_id": str(result.inserted_id)}

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    """User login"""
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(str(user["_id"]))
    return {"message": "Login successful", "token": token, "user_id": str(user["_id"])}

@app.get("/api/auth/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile"""
    return {
        "user_id": str(current_user["_id"]),
        "email": current_user["email"],
        "name": current_user["name"],
        "phone": current_user.get("phone"),
        "role": current_user.get("role", "customer")
    }

# Product Routes
@app.get("/api/products")
async def get_products(category: Optional[str] = None, featured: Optional[bool] = None):
    """Get all products or filter by category/featured"""
    query = {}
    if category:
        query["category"] = category
    if featured:
        query["is_special_offer"] = True
    
    products = await db.products.find(query).to_list(100)
    for product in products:
        product["_id"] = str(product["_id"])
        # Calculate discounted price if applicable
        if product.get("discount_percentage", 0) > 0:
            product["discounted_price"] = product["price"] * (1 - product["discount_percentage"] / 100)
    
    return {"products": products}

@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    """Get single product"""
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product["_id"] = str(product["_id"])
    if product.get("discount_percentage", 0) > 0:
        product["discounted_price"] = product["price"] * (1 - product["discount_percentage"] / 100)
    
    return product

@app.post("/api/products")
async def create_product(product: Product):
    """Create new product"""
    product_data = product.dict()
    product_data["created_at"] = datetime.utcnow()
    
    result = await db.products.insert_one(product_data)
    return {"message": "Product created", "product_id": str(result.inserted_id)}

@app.put("/api/admin/products/bulk")
async def bulk_update_products(bulk_update: ProductBulkUpdate):
    """Bulk update products"""
    product_ids = [ObjectId(pid) for pid in bulk_update.product_ids]
    
    updates = bulk_update.updates
    updates["updated_at"] = datetime.utcnow()
    
    result = await db.products.update_many(
        {"_id": {"$in": product_ids}},
        {"$set": updates}
    )
    
    return {
        "message": f"Updated {result.modified_count} products",
        "modified_count": result.modified_count
    }

# Cart Routes with Custom Quantities
@app.post("/api/cart/add")
async def add_to_cart(item: CartItem, current_user: dict = Depends(get_current_user)):
    """Add item to cart with custom quantity"""
    user_id = str(current_user["_id"])
    
    # Check if product exists
    product = await db.products.find_one({"_id": ObjectId(item.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Validate quantity
    min_qty = product.get("min_quantity", 1.0)
    max_qty = product.get("max_quantity")
    
    if item.quantity < min_qty:
        raise HTTPException(status_code=400, detail=f"Minimum quantity is {min_qty}")
    
    if max_qty and item.quantity > max_qty:
        raise HTTPException(status_code=400, detail=f"Maximum quantity is {max_qty}")
    
    # Calculate price based on quantity and unit
    unit = item.unit or product.get("unit", "piece")
    price_per_unit = product.get("price_per_unit", "per_piece")
    calculated_price = calculate_product_price(
        product["price"], 
        item.quantity, 
        unit, 
        price_per_unit
    )
    
    # Apply discount if applicable
    if product.get("discount_percentage", 0) > 0:
        calculated_price *= (1 - product["discount_percentage"] / 100)
    
    # Check if item already in cart
    existing_item = await db.cart_items.find_one({
        "user_id": user_id,
        "product_id": item.product_id
    })
    
    if existing_item:
        # Update quantity and price
        new_quantity = existing_item["quantity"] + item.quantity
        new_price = calculate_product_price(
            product["price"], 
            new_quantity, 
            unit, 
            price_per_unit
        )
        
        if product.get("discount_percentage", 0) > 0:
            new_price *= (1 - product["discount_percentage"] / 100)
        
        await db.cart_items.update_one(
            {"user_id": user_id, "product_id": item.product_id},
            {
                "$set": {
                    "quantity": new_quantity,
                    "unit": unit,
                    "calculated_price": new_price,
                    "updated_at": datetime.utcnow()
                }
            }
        )
    else:
        # Add new item
        cart_item = {
            "user_id": user_id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit": unit,
            "calculated_price": calculated_price,
            "added_at": datetime.utcnow()
        }
        await db.cart_items.insert_one(cart_item)
    
    return {"message": "Item added to cart", "calculated_price": calculated_price}

@app.get("/api/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    """Get user's cart with calculated prices"""
    user_id = str(current_user["_id"])
    
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$lookup": {
            "from": "products",
            "localField": "product_id",
            "foreignField": "_id",
            "as": "product"
        }},
        {"$unwind": "$product"},
        {"$project": {
            "product_id": 1,
            "quantity": 1,
            "unit": 1,
            "calculated_price": 1,
            "product.name": 1,
            "product.price": 1,
            "product.image_url": 1,
            "product.discount_percentage": 1,
            "subtotal": "$calculated_price"
        }}
    ]
    
    cart_items = await db.cart_items.aggregate(pipeline).to_list(100)
    
    total = sum(item["subtotal"] for item in cart_items)
    
    return {"cart_items": cart_items, "total": total}

@app.delete("/api/cart/{product_id}")
async def remove_from_cart(product_id: str, current_user: dict = Depends(get_current_user)):
    """Remove item from cart"""
    user_id = str(current_user["_id"])
    
    result = await db.cart_items.delete_one({
        "user_id": user_id,
        "product_id": product_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    
    return {"message": "Item removed from cart"}

# Payment Routes
@app.post("/api/payments/momo/initiate")
async def initiate_momo_payment(payment: MoMoPayment):
    """Initiate MoMo payment"""
    result = await momo_service.initiate_payment(
        amount=payment.amount,
        phone=payment.phone,
        order_id=payment.order_id
    )
    return result

@app.get("/api/payments/momo/status/{transaction_id}")
async def check_momo_payment_status(transaction_id: str):
    """Check MoMo payment status"""
    result = await momo_service.check_payment_status(transaction_id)
    return result

@app.post("/api/payments/dpo/create-token")
async def create_dpo_payment_token(payment: DPOPayment):
    """Create DPO payment token"""
    result = dpo_service.create_payment_token(
        amount=payment.amount,
        description=payment.description,
        redirect_url=payment.redirect_url,
        back_url=payment.back_url
    )
    
    if "TransToken" in result:
        transaction_token = result["TransToken"]
        
        # Store transaction
        transaction = {
            "transaction_token": transaction_token,
            "amount": payment.amount,
            "total_amount": payment.amount * 1.03,  # With 3% fee
            "currency": DPO_CURRENCY,
            "description": payment.description,
            "status": "created",
            "payment_method": "dpo",
            "created_at": datetime.utcnow()
        }
        
        await db.payment_transactions.insert_one(transaction)
        
        payment_url = f"{DPO_BASE_URL}/payv2.php?ID={transaction_token}"
        
        return {
            "success": True,
            "transaction_token": transaction_token,
            "payment_url": payment_url,
            "original_amount": payment.amount,
            "total_amount": payment.amount * 1.03,
            "processing_fee": payment.amount * 0.03
        }
    
    return {"success": False, "error": "Failed to create payment token"}

@app.post("/api/payments/dpo/verify")
async def verify_dpo_payment(request: dict):
    """Verify DPO payment"""
    transaction_token = request.get("transaction_token")
    
    result = dpo_service.verify_payment(transaction_token)
    
    # Update transaction status
    update_data = {
        "verification_response": result,
        "verified_at": datetime.utcnow()
    }
    
    if result.get("Result") == "000":
        update_data["status"] = "completed"
        update_data["payment_status"] = "paid"
    else:
        update_data["status"] = "failed"
        update_data["payment_status"] = "failed"
    
    await db.payment_transactions.update_one(
        {"transaction_token": transaction_token},
        {"$set": update_data}
    )
    
    return {
        "success": result.get("Result") == "000",
        "status": update_data["status"],
        "payment_status": update_data.get("payment_status"),
        "response": result
    }

# Order Routes with Email Notifications
@app.post("/api/orders")
async def create_order(order: Order, current_user: dict = Depends(get_current_user)):
    """Create new order and send email notification"""
    user_id = str(current_user["_id"])
    
    order_data = order.dict()
    order_data["user_id"] = user_id
    order_data["order_id"] = str(uuid.uuid4())
    order_data["created_at"] = datetime.utcnow()
    order_data["customer_email"] = current_user["email"]
    order_data["customer_name"] = current_user["name"]
    
    result = await db.orders.insert_one(order_data)
    
    # Send email notification to admin
    admin_email = "admin@freshcuts.rw"
    subject = f"New Order #{order_data['order_id'][:8]}"
    body = f"""
    <h2>New Order Received</h2>
    <p><strong>Order ID:</strong> {order_data['order_id']}</p>
    <p><strong>Customer:</strong> {current_user['name']} ({current_user['email']})</p>
    <p><strong>Total Amount:</strong> RWF {order_data['total_amount']:,.0f}</p>
    <p><strong>Payment Method:</strong> {order_data['payment_method']}</p>
    <p><strong>Items:</strong> {len(order_data['items'])} items</p>
    <p><strong>Order Time:</strong> {order_data['created_at']}</p>
    """
    
    if order_data.get('customer_notes'):
        body += f"<p><strong>Customer Notes:</strong> {order_data['customer_notes']}</p>"
    
    await send_email(admin_email, subject, body)
    
    # Clear cart after order creation
    await db.cart_items.delete_many({"user_id": user_id})
    
    return {"message": "Order created", "order_id": order_data["order_id"]}

@app.get("/api/orders")
async def get_orders(current_user: dict = Depends(get_current_user)):
    """Get user's orders"""
    user_id = str(current_user["_id"])
    
    orders = await db.orders.find({"user_id": user_id}).to_list(100)
    for order in orders:
        order["_id"] = str(order["_id"])
    
    return {"orders": orders}

# Special Offers Routes
@app.post("/api/admin/special-offers")
async def create_special_offer(offer: SpecialOffer):
    """Create special offer"""
    offer_data = offer.dict()
    offer_data["created_at"] = datetime.utcnow()
    
    # Apply discount to products
    product_ids = [ObjectId(pid) for pid in offer.product_ids]
    await db.products.update_many(
        {"_id": {"$in": product_ids}},
        {
            "$set": {
                "discount_percentage": offer.discount_percentage,
                "is_special_offer": True,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    result = await db.special_offers.insert_one(offer_data)
    return {"message": "Special offer created", "offer_id": str(result.inserted_id)}

@app.get("/api/admin/special-offers")
async def get_special_offers():
    """Get all special offers"""
    offers = await db.special_offers.find({}).to_list(100)
    for offer in offers:
        offer["_id"] = str(offer["_id"])
    
    return {"offers": offers}

@app.delete("/api/admin/special-offers/{offer_id}")
async def delete_special_offer(offer_id: str):
    """Delete special offer and remove discounts"""
    offer = await db.special_offers.find_one({"_id": ObjectId(offer_id)})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Remove discounts from products
    product_ids = [ObjectId(pid) for pid in offer["product_ids"]]
    await db.products.update_many(
        {"_id": {"$in": product_ids}},
        {
            "$set": {
                "discount_percentage": 0.0,
                "is_special_offer": False,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    await db.special_offers.delete_one({"_id": ObjectId(offer_id)})
    return {"message": "Special offer deleted"}

# Admin Routes
@app.get("/api/admin/orders")
async def get_all_orders():
    """Get all orders for admin"""
    orders = await db.orders.find({}).to_list(1000)
    for order in orders:
        order["_id"] = str(order["_id"])
    
    return {"orders": orders}

@app.get("/api/admin/users")
async def get_all_users():
    """Get all users for admin"""
    users = await db.users.find({}).to_list(1000)
    for user in users:
        user["_id"] = str(user["_id"])
        # Remove password from response
        user.pop("password", None)
    
    return {"users": users}

@app.get("/api/admin/payments")
async def get_all_payments():
    """Get all payment transactions for admin"""
    payments = await db.payment_transactions.find({}).to_list(1000)
    for payment in payments:
        if "_id" in payment:
            payment["_id"] = str(payment["_id"])
    
    return {"payments": payments}

@app.put("/api/admin/products/{product_id}")
async def update_product(product_id: str, product: Product):
    """Update product for admin"""
    product_data = product.dict()
    product_data["updated_at"] = datetime.utcnow()
    
    result = await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": product_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check for low stock and send notification
    if product_data.get("stock", 0) <= 10:
        admin_email = "admin@freshcuts.rw"
        subject = f"Low Stock Alert - {product_data['name']}"
        body = f"""
        <h2>Low Stock Alert</h2>
        <p><strong>Product:</strong> {product_data['name']}</p>
        <p><strong>Current Stock:</strong> {product_data.get('stock', 0)} {product_data.get('unit', 'units')}</p>
        <p><strong>Category:</strong> {product_data.get('category', 'N/A')}</p>
        <p>Please restock this item soon to avoid running out of inventory.</p>
        """
        await send_email(admin_email, subject, body)
    
    return {"message": "Product updated"}

@app.patch("/api/admin/products/{product_id}")
async def partial_update_product(product_id: str, updates: Dict[str, Any]):
    """Partially update product for admin"""
    # Remove None values and empty strings
    clean_updates = {}
    for key, value in updates.items():
        if value is not None and value != '':
            clean_updates[key] = value
    
    if not clean_updates:
        raise HTTPException(status_code=400, detail="No valid updates provided")
    
    clean_updates["updated_at"] = datetime.utcnow()
    
    result = await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": clean_updates}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check for low stock and send notification if stock was updated
    if "stock" in clean_updates and clean_updates.get("stock", 0) <= 10:
        # Get product name for notification
        product = await db.products.find_one({"_id": ObjectId(product_id)})
        if product:
            admin_email = "admin@freshcuts.rw"
            subject = f"Low Stock Alert - {product['name']}"
            body = f"""
            <h2>Low Stock Alert</h2>
            <p><strong>Product:</strong> {product['name']}</p>
            <p><strong>Current Stock:</strong> {clean_updates.get('stock', 0)} {product.get('unit', 'units')}</p>
            <p><strong>Category:</strong> {product.get('category', 'N/A')}</p>
            <p>Please restock this item soon to avoid running out of inventory.</p>
            """
            await send_email(admin_email, subject, body)
    
    return {"message": "Product updated partially", "updated_fields": list(clean_updates.keys())}

@app.delete("/api/admin/products/{product_id}")
async def delete_product(product_id: str):
    """Delete product for admin"""
    result = await db.products.delete_one({"_id": ObjectId(product_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted successfully"}

@app.get("/api/admin/analytics")
async def get_analytics():
    """Get business analytics"""
    # Get product analytics
    total_products = await db.products.count_documents({})
    low_stock_products = await db.products.count_documents({"stock": {"$lte": 10}})
    
    # Get order analytics
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    
    # Get revenue analytics
    revenue_pipeline = [
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    # Get top products
    top_products_pipeline = [
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product_id",
            "total_quantity": {"$sum": "$items.quantity"},
            "total_revenue": {"$sum": "$items.calculated_price"}
        }},
        {"$sort": {"total_quantity": -1}},
        {"$limit": 5}
    ]
    top_products = await db.orders.aggregate(top_products_pipeline).to_list(5)
    
    return {
        "total_products": total_products,
        "low_stock_products": low_stock_products,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_revenue": total_revenue,
        "top_products": top_products
    }

# Bulk Email Routes
@app.post("/api/admin/send-bulk-email")
async def send_bulk_email(request: dict):
    """Send bulk email to all users or specific groups"""
    subject = request.get("subject")
    message = request.get("message")
    recipient_type = request.get("recipient_type", "all")  # all, customers, admins
    
    if not subject or not message:
        raise HTTPException(status_code=400, detail="Subject and message are required")
    
    # Get recipients based on type
    query = {}
    if recipient_type == "customers":
        query = {"role": {"$ne": "admin"}}
    elif recipient_type == "admins":
        query = {"role": "admin"}
    
    users = await db.users.find(query).to_list(1000)
    
    # Send emails
    sent_count = 0
    failed_count = 0
    
    for user in users:
        if user.get("email"):
            success = await send_email(
                user["email"],
                subject,
                f"""
                <html>
                <body>
                    <h2>Fresh Cuts Market</h2>
                    <p>Dear {user.get('name', 'Customer')},</p>
                    <div style="margin: 20px 0;">
                        {message}
                    </div>
                    <p>Best regards,<br/>Fresh Cuts Market Team</p>
                    <hr>
                    <p style="font-size: 12px; color: #666;">
                        This email was sent from Fresh Cuts Market Admin Panel.
                    </p>
                </body>
                </html>
                """
            )
            if success:
                sent_count += 1
            else:
                failed_count += 1
    
    # Log email campaign
    campaign_log = {
        "subject": subject,
        "message": message,
        "recipient_type": recipient_type,
        "sent_count": sent_count,
        "failed_count": failed_count,
        "total_recipients": len(users),
        "sent_at": datetime.utcnow()
    }
    
    await db.email_campaigns.insert_one(campaign_log)
    
    return {
        "message": f"Email campaign completed",
        "sent_count": sent_count,
        "failed_count": failed_count,
        "total_recipients": len(users)
    }

@app.post("/api/admin/send-custom-email")
async def send_custom_email(request: dict):
    """Send custom email to specific users"""
    subject = request.get("subject")
    message = request.get("message")
    recipient_emails = request.get("recipient_emails", [])
    
    if not subject or not message or not recipient_emails:
        raise HTTPException(status_code=400, detail="Subject, message, and recipient emails are required")
    
    sent_count = 0
    failed_count = 0
    
    for email in recipient_emails:
        # Get user info for personalization
        user = await db.users.find_one({"email": email})
        user_name = user.get("name", "Customer") if user else "Customer"
        
        success = await send_email(
            email,
            subject,
            f"""
            <html>
            <body>
                <h2>Fresh Cuts Market</h2>
                <p>Dear {user_name},</p>
                <div style="margin: 20px 0;">
                    {message}
                </div>
                <p>Best regards,<br/>Fresh Cuts Market Team</p>
                <hr>
                <p style="font-size: 12px; color: #666;">
                    This email was sent from Fresh Cuts Market Admin Panel.
                </p>
            </body>
            </html>
            """
        )
        if success:
            sent_count += 1
        else:
            failed_count += 1
    
    # Log custom email
    custom_log = {
        "subject": subject,
        "message": message,
        "recipient_emails": recipient_emails,
        "sent_count": sent_count,
        "failed_count": failed_count,
        "total_recipients": len(recipient_emails),
        "sent_at": datetime.utcnow()
    }
    
    await db.custom_emails.insert_one(custom_log)
    
    return {
        "message": f"Custom email campaign completed",
        "sent_count": sent_count,
        "failed_count": failed_count,
        "total_recipients": len(recipient_emails)
    }

@app.get("/api/admin/email-campaigns")
async def get_email_campaigns():
    """Get email campaign history"""
    campaigns = await db.email_campaigns.find({}).sort("sent_at", -1).to_list(100)
    custom_emails = await db.custom_emails.find({}).sort("sent_at", -1).to_list(100)
    
    for campaign in campaigns:
        campaign["_id"] = str(campaign["_id"])
        campaign["type"] = "bulk"
    
    for email in custom_emails:
        email["_id"] = str(email["_id"])
        email["type"] = "custom"
    
    # Combine and sort by date
    all_campaigns = campaigns + custom_emails
    all_campaigns.sort(key=lambda x: x["sent_at"], reverse=True)
    
    return {"campaigns": all_campaigns}

# Delivery Fee Calculation Routes
@app.post("/api/delivery/calculate-fee")
async def calculate_delivery_fee(location: CustomerLocation, order_total: float):
    """Calculate delivery fee based on customer location"""
    
    # Get delivery zones from database
    zones = await db.delivery_zones.find({}).to_list(100)
    
    # Default delivery fee
    delivery_fee = 2000.0  # Default RWF
    zone_found = None
    
    # Find matching zone
    for zone in zones:
        if location.district.lower() in [area.lower() for area in zone.get('areas', [])]:
            zone_found = zone
            break
    
    if zone_found:
        delivery_fee = zone_found['base_fee']
        
        # Check if order qualifies for free delivery
        if zone_found.get('min_order_for_free') and order_total >= zone_found['min_order_for_free']:
            delivery_fee = 0.0
        
        # Calculate distance-based fee if coordinates available
        if location.latitude and location.longitude and zone_found.get('per_km_rate'):
            # Simple distance calculation (you can integrate Google Maps API)
            estimated_distance = 5.0  # Default 5km
            distance_fee = estimated_distance * zone_found['per_km_rate']
            delivery_fee += distance_fee
    
    return {
        "delivery_fee": delivery_fee,
        "zone": zone_found['name'] if zone_found else "Standard Zone",
        "free_delivery_threshold": zone_found.get('min_order_for_free') if zone_found else None,
        "estimated_time": "30-45 minutes"
    }

# Admin Delivery Zone Management
@app.post("/api/admin/delivery-zones")
async def create_delivery_zone(zone: DeliveryZone):
    """Create delivery zone"""
    zone_data = zone.dict()
    zone_data["created_at"] = datetime.utcnow()
    
    result = await db.delivery_zones.insert_one(zone_data)
    return {"message": "Delivery zone created", "zone_id": str(result.inserted_id)}

@app.get("/api/admin/delivery-zones")
async def get_delivery_zones():
    """Get all delivery zones"""
    zones = await db.delivery_zones.find({}).to_list(100)
    for zone in zones:
        zone["_id"] = str(zone["_id"])
    return {"zones": zones}

@app.put("/api/admin/delivery-zones/{zone_id}")
async def update_delivery_zone(zone_id: str, zone: DeliveryZone):
    """Update delivery zone"""
    zone_data = zone.dict()
    zone_data["updated_at"] = datetime.utcnow()
    
    result = await db.delivery_zones.update_one(
        {"_id": ObjectId(zone_id)},
        {"$set": zone_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    return {"message": "Delivery zone updated"}

@app.delete("/api/admin/delivery-zones/{zone_id}")
async def delete_delivery_zone(zone_id: str):
    """Delete delivery zone"""
    result = await db.delivery_zones.delete_one({"_id": ObjectId(zone_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    return {"message": "Delivery zone deleted"}

# E-commerce Settings Management
@app.post("/api/admin/ecommerce-settings")
async def update_ecommerce_settings(settings: EcommerceSettings):
    """Update e-commerce settings"""
    settings_data = settings.dict()
    settings_data["updated_at"] = datetime.utcnow()
    
    await db.ecommerce_settings.update_one(
        {"type": "main"},
        {"$set": settings_data},
        upsert=True
    )
    
    return {"message": "E-commerce settings updated"}

@app.get("/api/admin/ecommerce-settings")
async def get_ecommerce_settings():
    """Get e-commerce settings"""
    settings = await db.ecommerce_settings.find_one({"type": "main"})
    if not settings:
        # Return default settings
        default_settings = EcommerceSettings()
        return default_settings.dict()
    
    settings.pop("_id", None)
    settings.pop("type", None)
    return settings

@app.get("/api/public/ecommerce-settings")
async def get_public_ecommerce_settings():
    """Get public e-commerce settings for frontend"""
    settings = await db.ecommerce_settings.find_one({"type": "main"})
    if not settings:
        default_settings = EcommerceSettings()
        return default_settings.dict()
    
    # Remove sensitive data
    public_settings = {
        "store_name": settings.get("store_name", "Fresh Cuts Market"),
        "store_tagline": settings.get("store_tagline", "Premium Quality Meats & Fresh Groceries"),
        "primary_color": settings.get("primary_color", "#dc2626"),
        "secondary_color": settings.get("secondary_color", "#991b1b"),
        "currency": settings.get("currency", "RWF"),
        "currency_symbol": settings.get("currency_symbol", "RWF"),
        "enable_delivery": settings.get("enable_delivery", True),
        "enable_pickup": settings.get("enable_pickup", True),
        "checkout_fields": settings.get("checkout_fields", {
            "require_phone": True,
            "require_address": True,
            "allow_notes": True
        }),
        "order_statuses": settings.get("order_statuses", ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"])
    }
    
    return public_settings

# Initialize delivery zones and settings
@app.on_event("startup")
async def startup_event():
    """Initialize database with sample products, admin user, delivery zones and settings"""
    # Check if products exist
    product_count = await db.products.count_documents({})
    
    if product_count == 0:
        # Sample products with RWF prices and enhanced features
        sample_products = [
            {
                "name": "Premium Beef Ribeye",
                "description": "Prime cut ribeye steak, perfect for grilling",
                "price": 8500.0,  # RWF per kg
                "category": "fresh_meat",
                "image_url": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f",
                "stock": 20,
                "weight": 1.0,
                "unit": "kg",
                "min_quantity": 0.25,
                "max_quantity": 10.0,
                "price_per_unit": "per_kg",
                "discount_percentage": 0.0,
                "is_special_offer": False
            },
            {
                "name": "Fresh Chicken Breast",
                "description": "Organic free-range chicken breast",
                "price": 4200.0,  # RWF per kg
                "category": "fresh_meat",
                "image_url": "https://images.pexels.com/photos/8353841/pexels-photo-8353841.jpeg",
                "stock": 35,
                "weight": 0.5,
                "unit": "kg",
                "min_quantity": 0.5,
                "max_quantity": 5.0,
                "price_per_unit": "per_kg",
                "discount_percentage": 10.0,
                "is_special_offer": True
            },
            {
                "name": "Italian Sausages",
                "description": "Homemade Italian sausages with herbs",
                "price": 2900.0,  # RWF per pack
                "category": "processed_meat",
                "image_url": "https://images.pexels.com/photos/6294390/pexels-photo-6294390.jpeg",
                "stock": 25,
                "weight": 0.5,
                "unit": "pack",
                "min_quantity": 1.0,
                "max_quantity": 20.0,
                "price_per_unit": "per_piece",
                "discount_percentage": 0.0,
                "is_special_offer": False
            },
            {
                "name": "Smoked Bacon",
                "description": "Thick-cut smoked bacon strips",
                "price": 2300.0,  # RWF per pack
                "category": "processed_meat",
                "image_url": "https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg",
                "stock": 30,
                "weight": 0.3,
                "unit": "pack",
                "min_quantity": 1.0,
                "max_quantity": 15.0,
                "price_per_unit": "per_piece",
                "discount_percentage": 5.0,
                "is_special_offer": True
            },
            {
                "name": "Fresh Milk",
                "description": "Organic whole milk",
                "price": 1300.0,  # RWF per liter
                "category": "dairy",
                "image_url": "https://images.pexels.com/photos/6294297/pexels-photo-6294297.jpeg",
                "stock": 50,
                "weight": 1.0,
                "unit": "liter",
                "min_quantity": 1.0,
                "max_quantity": 10.0,
                "price_per_unit": "per_piece",
                "discount_percentage": 0.0,
                "is_special_offer": False
            },
            {
                "name": "Farm Fresh Eggs",
                "description": "Free-range chicken eggs",
                "price": 1600.0,  # RWF per dozen
                "category": "dairy",
                "image_url": "https://images.unsplash.com/photo-1542528180-a1208c5169a5",
                "stock": 40,
                "weight": 0.6,
                "unit": "dozen",
                "min_quantity": 1.0,
                "max_quantity": 5.0,
                "price_per_unit": "per_piece",
                "discount_percentage": 0.0,
                "is_special_offer": False
            }
        ]
        
        for product in sample_products:
            product["created_at"] = datetime.utcnow()
        
        await db.products.insert_many(sample_products)
        print("Sample products inserted")
    
    # Create admin user if doesn't exist
    admin_exists = await db.users.find_one({"email": "admin@freshcuts.rw"})
    if not admin_exists:
        admin_user = {
            "email": "admin@freshcuts.rw",
            "password": hash_password("Admin123!"),
            "name": "Fresh Cuts Administrator",
            "phone": "+250783654454",
            "role": "admin",
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_user)
        print("Admin user created: admin@freshcuts.rw / Admin123!")
    
    # Initialize delivery zones
    zones_count = await db.delivery_zones.count_documents({})
    if zones_count == 0:
        sample_zones = [
            {
                "name": "Kigali City Center",
                "areas": ["Nyarugenge", "Gasabo", "Kicukiro"],
                "base_fee": 1500.0,
                "per_km_rate": 300.0,
                "min_order_for_free": 25000.0,
                "created_at": datetime.utcnow()
            },
            {
                "name": "Kigali Suburbs",
                "areas": ["Kimironko", "Remera", "Gikondo", "Nyamirambo"],
                "base_fee": 2500.0,
                "per_km_rate": 400.0,
                "min_order_for_free": 30000.0,
                "created_at": datetime.utcnow()
            },
            {
                "name": "Outside Kigali",
                "areas": ["Muhanga", "Rwamagana", "Kayonza", "Bugesera"],
                "base_fee": 5000.0,
                "per_km_rate": 500.0,
                "min_order_for_free": 50000.0,
                "created_at": datetime.utcnow()
            }
        ]
        
        await db.delivery_zones.insert_many(sample_zones)
        print("Sample delivery zones created")
    
    # Initialize default e-commerce settings
    settings_exists = await db.ecommerce_settings.find_one({"type": "main"})
    if not settings_exists:
        default_settings = {
            "type": "main",
            "store_name": "German Butchery",
            "store_tagline": "Premium Quality Meats & Fresh Groceries",
            "primary_color": "#dc2626",
            "secondary_color": "#991b1b",
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
            "order_statuses": ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"],
            "created_at": datetime.utcnow()
        }
        await db.ecommerce_settings.insert_one(default_settings)
        print("Default e-commerce settings created")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)