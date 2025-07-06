from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
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

load_dotenv()

app = FastAPI(title="Butchery E-commerce API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# JWT Secret
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-here")

# Pydantic Models
class User(BaseModel):
    email: str
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Product(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: Optional[str] = None
    stock: int = 0
    weight: Optional[float] = None
    unit: str = "piece"

class CartItem(BaseModel):
    product_id: str
    quantity: int

class Order(BaseModel):
    user_id: str
    items: List[CartItem]
    total_amount: float
    status: str = "pending"
    payment_method: str

class MoMoPayment(BaseModel):
    amount: float
    phone: str
    order_id: str

class DPOPayment(BaseModel):
    amount: float
    description: str
    redirect_url: str
    back_url: str

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
        # For demo purposes, we'll mark as successful after some time
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
                <PaymentCurrency>RWF</PaymentCurrency>
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
        "phone": current_user.get("phone")
    }

# Product Routes
@app.get("/api/products")
async def get_products(category: Optional[str] = None):
    """Get all products or filter by category"""
    query = {}
    if category:
        query["category"] = category
    
    products = await db.products.find(query).to_list(100)
    for product in products:
        product["_id"] = str(product["_id"])
    
    return {"products": products}

@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    """Get single product"""
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product["_id"] = str(product["_id"])
    return product

@app.post("/api/products")
async def create_product(product: Product):
    """Create new product"""
    product_data = product.dict()
    product_data["created_at"] = datetime.utcnow()
    
    result = await db.products.insert_one(product_data)
    return {"message": "Product created", "product_id": str(result.inserted_id)}

# Cart Routes
@app.post("/api/cart/add")
async def add_to_cart(item: CartItem, current_user: dict = Depends(get_current_user)):
    """Add item to cart"""
    user_id = str(current_user["_id"])
    
    # Check if product exists
    product = await db.products.find_one({"_id": ObjectId(item.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if item already in cart
    existing_item = await db.cart_items.find_one({
        "user_id": user_id,
        "product_id": item.product_id
    })
    
    if existing_item:
        # Update quantity
        await db.cart_items.update_one(
            {"user_id": user_id, "product_id": item.product_id},
            {"$inc": {"quantity": item.quantity}}
        )
    else:
        # Add new item
        cart_item = {
            "user_id": user_id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "added_at": datetime.utcnow()
        }
        await db.cart_items.insert_one(cart_item)
    
    return {"message": "Item added to cart"}

@app.get("/api/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    """Get user's cart"""
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
            "product.name": 1,
            "product.price": 1,
            "product.image_url": 1,
            "subtotal": {"$multiply": ["$quantity", "$product.price"]}
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

# Order Routes
@app.post("/api/orders")
async def create_order(order: Order, current_user: dict = Depends(get_current_user)):
    """Create new order"""
    user_id = str(current_user["_id"])
    
    order_data = order.dict()
    order_data["user_id"] = user_id
    order_data["order_id"] = str(uuid.uuid4())
    order_data["created_at"] = datetime.utcnow()
    
    result = await db.orders.insert_one(order_data)
    
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

# Initialize sample data
@app.on_event("startup")
async def startup_event():
    """Initialize database with sample products"""
    # Check if products exist
    product_count = await db.products.count_documents({})
    
    if product_count == 0:
        # Sample products
        sample_products = [
            {
                "name": "Premium Beef Ribeye",
                "description": "Prime cut ribeye steak, perfect for grilling",
                "price": 25.99,
                "category": "fresh_meat",
                "image_url": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f",
                "stock": 20,
                "weight": 1.0,
                "unit": "kg"
            },
            {
                "name": "Fresh Chicken Breast",
                "description": "Organic free-range chicken breast",
                "price": 12.99,
                "category": "fresh_meat",
                "image_url": "https://images.pexels.com/photos/8353841/pexels-photo-8353841.jpeg",
                "stock": 35,
                "weight": 0.5,
                "unit": "kg"
            },
            {
                "name": "Italian Sausages",
                "description": "Homemade Italian sausages with herbs",
                "price": 8.99,
                "category": "processed_meat",
                "image_url": "https://images.pexels.com/photos/6294390/pexels-photo-6294390.jpeg",
                "stock": 25,
                "weight": 0.5,
                "unit": "pack"
            },
            {
                "name": "Smoked Bacon",
                "description": "Thick-cut smoked bacon strips",
                "price": 6.99,
                "category": "processed_meat",
                "image_url": "https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg",
                "stock": 30,
                "weight": 0.3,
                "unit": "pack"
            },
            {
                "name": "Fresh Milk",
                "description": "Organic whole milk",
                "price": 3.99,
                "category": "dairy",
                "image_url": "https://images.pexels.com/photos/6294297/pexels-photo-6294297.jpeg",
                "stock": 50,
                "weight": 1.0,
                "unit": "liter"
            },
            {
                "name": "Farm Fresh Eggs",
                "description": "Free-range chicken eggs",
                "price": 4.99,
                "category": "dairy",
                "image_url": "https://images.unsplash.com/photo-1542528180-a1208c5169a5",
                "stock": 40,
                "weight": 0.6,
                "unit": "dozen"
            }
        ]
        
        for product in sample_products:
            product["created_at"] = datetime.utcnow()
        
        await db.products.insert_many(sample_products)
        print("Sample products inserted")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)