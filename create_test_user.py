#!/usr/bin/env python3
"""
Direct database script to create a test user
This bypasses the API registration and creates a user directly in MongoDB
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.auth.utils import get_password_hash
from datetime import datetime
import os

async def create_test_user():
    """Create a test user directly in the database"""
    
    # MongoDB connection
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.saferide_kids
    
    # Test user data
    test_email = "testguardian@saferide.com"
    test_password = "testpass123"
    
    print("🔧 Creating test user directly in database...")
    print(f"📧 Email: {test_email}")
    print(f"🔑 Password: {test_password}")
    
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": test_email})
        if existing_user:
            print("⚠️  User already exists, deleting first...")
            await db.users.delete_one({"email": test_email})
        
        # Create new user document
        user_doc = {
            "email": test_email,
            "hashed_password": get_password_hash(test_password),
            "role": "guardian",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert user
        result = await db.users.insert_one(user_doc)
        print(f"✅ User created successfully!")
        print(f"   User ID: {result.inserted_id}")
        
        # Verify user was created
        created_user = await db.users.find_one({"_id": result.inserted_id})
        if created_user:
            print(f"✅ User verification successful!")
            print(f"   Email: {created_user['email']}")
            print(f"   Role: {created_user['role']}")
            print(f"   Created: {created_user['created_at']}")
        
        print("\n🎯 Test credentials:")
        print(f"   Email: {test_email}")
        print(f"   Password: {test_password}")
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_test_user())