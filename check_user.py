import asyncio
from app.database import connect_to_mongo, get_database
from bson import ObjectId

async def fix_user():
    await connect_to_mongo()
    db = await get_database()
    
    # Update the user to have is_active = True
    result = await db.users.update_one(
        {'email': 'testguardian@saferide.com'},
        {'$set': {'is_active': True}}
    )
    
    print(f'Updated {result.modified_count} user(s)')
    
    # Check the user again
    user = await db.users.find_one({'email': 'testguardian@saferide.com'})
    if user:
        print(f'User found:')
        print(f'  ID: {user["_id"]}')
        print(f'  Email: {user["email"]}')
        print(f'  Role: {user["role"]}')
        print(f'  Active: {user.get("is_active", "Not set")}')
    else:
        print('User not found')

if __name__ == "__main__":
    asyncio.run(fix_user())