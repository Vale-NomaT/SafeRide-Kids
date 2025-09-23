from typing import Optional
from pymongo.errors import DuplicateKeyError
from app.database import get_database
from app.models.user import UserIn, UserOut, UserDB
from app.auth.utils import get_password_hash, verify_password
from fastapi import HTTPException, status


async def create_user(user_data: UserIn) -> UserOut:
    """Create a new user"""
    db = await get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_dict = user_data.dict()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    
    user_in_db = UserDB(**user_dict)
    
    try:
        result = await db.users.insert_one(user_in_db.dict(by_alias=True))
        created_user = await db.users.find_one({"_id": result.inserted_id})
        # Ensure _id is properly converted to string
        if "_id" in created_user and created_user["_id"]:
            created_user["_id"] = str(created_user["_id"])
        return UserOut(**created_user)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )


async def get_user_by_email(email: str) -> Optional[UserOut]:
    """Get user by email"""
    db = await get_database()
    user = await db.users.find_one({"email": email})
    if user:
        # Ensure _id is properly converted to string
        if "_id" in user and user["_id"]:
            user["_id"] = str(user["_id"])
        return UserOut(**user)
    return None


async def get_user_by_id(user_id: str) -> Optional[UserOut]:
    """Get user by ID"""
    from bson import ObjectId
    db = await get_database()
    
    # Convert string ID to ObjectId for MongoDB query
    try:
        object_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
        user = await db.users.find_one({"_id": object_id})
    except:
        user = await db.users.find_one({"_id": user_id})
    if user:
        # Ensure _id is properly converted to string
        if "_id" in user and user["_id"]:
            user["_id"] = str(user["_id"])
        return UserOut(**user)
    return None


async def authenticate_user(email: str, password: str) -> Optional[UserOut]:
    """Authenticate user with email and password"""
    db = await get_database()
    user = await db.users.find_one({"email": email})
    
    if not user:
        return None
    
    if not verify_password(password, user["hashed_password"]):
        return None
    
    # Ensure _id is properly converted to string
    if "_id" in user and user["_id"]:
        user["_id"] = str(user["_id"])
    
    return UserOut(**user)