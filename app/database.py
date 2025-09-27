from typing import Optional
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Global database variables
client: Optional[AsyncIOMotorClient] = None
database = None


async def connect_to_mongo():
    """Create database connection - FastAPI startup event handler"""
    global client, database
    
    try:
        # Create MongoDB client
        client = AsyncIOMotorClient(settings.mongo_uri)
        
        # Connect to the 'saferide_kids' database
        database = client.saferide_kids
        
        # Test connection
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        print("✅ Successfully connected to MongoDB")
        
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        print(f"❌ Error connecting to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close database connection - FastAPI shutdown event handler"""
    global client
    
    if client:
        client.close()
        logger.info("Disconnected from MongoDB")
        print("✅ Disconnected from MongoDB")


async def get_database():
    """Get the database instance"""
    if database is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return database


# Health check function
async def ping_database():
    """Check if database connection is healthy"""
    try:
        if client is None:
            return False
        await client.admin.command('ping')
        return True
    except Exception:
        return False