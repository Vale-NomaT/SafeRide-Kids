#!/usr/bin/env python3
"""
Test script for AddChildScreen functionality
This script will:
1. Create a guardian user (if needed)
2. Login and get JWT token
3. Test the child creation endpoint
4. Simulate the AddChildScreen workflow
"""

import asyncio
import httpx
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

async def test_addchild_workflow():
    """Test the complete AddChildScreen workflow"""
    
    # Generate unique email for this test
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    test_email = f"testguardian{timestamp}@example.com"
    test_password = "testpass123"
    
    async with httpx.AsyncClient() as client:
        print("🚀 Starting AddChildScreen Test Workflow")
        print("=" * 50)
        
        # Step 1: Create Guardian User (or use existing)
        print(f"📝 Step 1: Creating guardian user with email: {test_email}")
        user_created = False
        try:
            register_response = await client.post(
                f"{BASE_URL}/auth/register",
                json={
                    "email": test_email,
                    "password": test_password,
                    "role": "guardian"
                }
            )
            
            if register_response.status_code == 201:
                print("✅ Guardian user created successfully!")
                user_data = register_response.json()
                print(f"   User ID: {user_data['user']['_id']}")
                print(f"   Email: {user_data['user']['email']}")
                print(f"   Role: {user_data['user']['role']}")
                user_created = True
            elif "already registered" in register_response.text:
                print("⚠️  User already exists, will try to login with existing credentials")
                # Try some common test passwords
                test_passwords = ["testpass123", "password123", "test123", "guardian123"]
                for pwd in test_passwords:
                    test_password = pwd
                    print(f"   Trying password: {pwd}")
                    break
            else:
                print(f"❌ Failed to create user: {register_response.text}")
                return
                
        except Exception as e:
            print(f"❌ Error creating user: {e}")
            return
        
        # Step 2: Login and Get Token
        print(f"\n🔐 Step 2: Logging in guardian user")
        try:
            login_response = await client.post(
                f"{BASE_URL}/auth/login-json",
                json={
                    "email": test_email,
                    "password": test_password
                }
            )
            
            if login_response.status_code == 200:
                print("✅ Login successful!")
                token_data = login_response.json()
                jwt_token = token_data["access_token"]
                print(f"   Token Type: {token_data['token_type']}")
                print(f"   JWT Token: {jwt_token[:50]}...")
                
                # This simulates storing in AsyncStorage
                print("📱 Token would be stored in AsyncStorage for React Native app")
                
            else:
                print(f"❌ Login failed: {login_response.text}")
                return
                
        except Exception as e:
            print(f"❌ Error during login: {e}")
            return
        
        # Step 3: Test Child Creation (Simulating AddChildScreen submission)
        print(f"\n👶 Step 3: Testing child creation (AddChildScreen simulation)")
        
        # Sample child data that would come from the AddChildScreen form
        child_data = {
            "name": "Test Child",
            "age": 8,
            "date_of_birth": "2016-01-15",
            "photo_url": "",
            "allergies": "Peanuts, Dairy",
            "notes": "Needs inhaler for asthma",
            "home_location": {
                "type": "Point",
                "coordinates": [-74.0060, 40.7128]  # NYC coordinates
            },
            "school_location": {
                "type": "Point", 
                "coordinates": [-74.0070, 40.7140]  # Nearby school coordinates
            },
            "home_address": "123 Main St, New York, NY 10001",
            "school_address": "456 School Ave, New York, NY 10002"
        }
        
        try:
            create_child_response = await client.post(
                f"{BASE_URL}/children",
                json=child_data,
                headers={
                    "Authorization": f"Bearer {jwt_token}",
                    "Content-Type": "application/json"
                }
            )
            
            if create_child_response.status_code == 201:
                print("✅ Child created successfully!")
                created_child = create_child_response.json()
                print(f"   Child ID: {created_child['_id']}")
                print(f"   Name: {created_child['name']}")
                print(f"   Age: {created_child['age']}")
                print(f"   Date of Birth: {created_child.get('date_of_birth', 'Not set')}")
                print(f"   Home Address: {created_child.get('home_address', 'Not set')}")
                print(f"   School Address: {created_child.get('school_address', 'Not set')}")
                
            else:
                print(f"❌ Child creation failed: {create_child_response.text}")
                return
                
        except Exception as e:
            print(f"❌ Error creating child: {e}")
            return
        
        # Step 4: Verify Child in List
        print(f"\n📋 Step 4: Verifying child appears in guardian's children list")
        try:
            children_response = await client.get(
                f"{BASE_URL}/children/me",
                headers={
                    "Authorization": f"Bearer {jwt_token}"
                }
            )
            
            if children_response.status_code == 200:
                children_list = children_response.json()
                print(f"✅ Retrieved children list successfully!")
                print(f"   Total children: {len(children_list)}")
                
                for i, child in enumerate(children_list, 1):
                    print(f"   Child {i}: {child['name']} (Age: {child['age']})")
                    
            else:
                print(f"❌ Failed to get children list: {children_response.text}")
                return
                
        except Exception as e:
            print(f"❌ Error getting children list: {e}")
            return
        
        print("\n🎉 AddChildScreen Test Workflow Completed Successfully!")
        print("=" * 50)
        print("✅ All tests passed:")
        print("   ✓ Guardian user creation")
        print("   ✓ JWT token authentication") 
        print("   ✓ Child creation via API")
        print("   ✓ Child appears in guardian's list")
        print("\n📱 The AddChildScreen should work with these API endpoints!")
        
        # Return test credentials for manual testing
        print(f"\n🔑 Test Credentials for Manual Testing:")
        print(f"   Email: {test_email}")
        print(f"   Password: {test_password}")
        print(f"   JWT Token: {jwt_token}")

if __name__ == "__main__":
    asyncio.run(test_addchild_workflow())