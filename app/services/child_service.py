from typing import List, Optional
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from fastapi import HTTPException, status

from app.database import get_database
from app.models.child import ChildIn, ChildOut, ChildDB
from app.models.user import PyObjectId


async def create_child(guardian_id: str, child_data: ChildIn) -> ChildOut:
    """
    Create a new child for a guardian
    
    Args:
        guardian_id: The ID of the guardian creating the child
        child_data: Child information from the request
        
    Returns:
        ChildOut: The created child with database ID and metadata
        
    Raises:
        HTTPException: If guardian_id is invalid or database operation fails
    """
    db = await get_database()
    
    # Verify guardian exists - try both string and ObjectId formats
    guardian = None
    try:
        # First try as ObjectId
        guardian = await db.users.find_one({
            "_id": ObjectId(guardian_id),
            "role": "guardian",
            "is_active": True
        })
    except:
        pass
    
    if not guardian:
        # Try as string
        guardian = await db.users.find_one({
            "_id": guardian_id,
            "role": "guardian",
            "is_active": True
        })
    
    if not guardian:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guardian not found or not authorized"
        )
    
    # Create child document
    child_dict = child_data.dict()
    # Store guardian_id as string to maintain consistency
    child_dict["guardian_id"] = guardian_id
    # Explicitly set is_active to True
    child_dict["is_active"] = True
    
    child_in_db = ChildDB(**child_dict)
    
    try:
        # Insert into MongoDB children collection
        # Convert to dict and remove _id to let MongoDB generate it
        child_doc = child_in_db.dict(by_alias=True)
        if "_id" in child_doc:
            del child_doc["_id"]
        # Store guardian_id as string
        child_doc["guardian_id"] = guardian_id
        # Explicitly set is_active to True
        child_doc["is_active"] = True
        # Convert date_of_birth to datetime for MongoDB compatibility
        if "date_of_birth" in child_doc:
            from datetime import datetime
            child_doc["date_of_birth"] = datetime.combine(child_doc["date_of_birth"], datetime.min.time())
        result = await db.children.insert_one(child_doc)
        
        # Retrieve the created child
        created_child = await db.children.find_one({"_id": result.inserted_id})
        
        if not created_child:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve created child"
            )
        
        # Convert ObjectIds to strings for response
        if "_id" in created_child:
            created_child["_id"] = str(created_child["_id"])
        # guardian_id is already stored as string
        
        # Convert datetime back to date for date_of_birth
        if "date_of_birth" in created_child and hasattr(created_child["date_of_birth"], 'date'):
            created_child["date_of_birth"] = created_child["date_of_birth"].date()
        
        # Calculate age dynamically from date_of_birth
        child_db = ChildDB(**created_child)
        created_child["age"] = child_db.calculate_age()
        
        return ChildOut(**created_child)
        
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Child with this information already exists"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create child: {str(e)}"
        )


async def get_children_by_guardian(guardian_id: str) -> List[ChildOut]:
    """
    Get all children belonging to a specific guardian
    
    Args:
        guardian_id: The ID of the guardian
        
    Returns:
        List[ChildOut]: List of children belonging to the guardian
        
    Raises:
        HTTPException: If guardian_id is invalid
    """
    db = await get_database()
    
    try:
        # Find all active children for this guardian
        # Handle both ObjectId and string formats for backward compatibility
        # Also handle case where is_active might be missing (treat as active)
        query = {
            "$and": [
                {"$or": [
                    {"guardian_id": ObjectId(guardian_id)},  # Match ObjectId
                    {"guardian_id": guardian_id},  # Match string
                ]},
                {"$or": [
                    {"is_active": True},
                    {"is_active": {"$exists": False}}  # Include children without is_active field
                ]}
            ]
        }
        print(f"🔍 DEBUG: Searching for children with query: {query}")
        
        children_cursor = db.children.find(query).sort("created_at", -1)  # Sort by newest first
        
        children = await children_cursor.to_list(length=None)
        print(f"🔍 DEBUG: Found {len(children)} children in database")
        
        # Convert ObjectIds to strings and create ChildOut objects
        result = []
        for child in children:
            if "_id" in child:
                child["_id"] = str(child["_id"])
            if "guardian_id" in child and isinstance(child["guardian_id"], ObjectId):
                child["guardian_id"] = str(child["guardian_id"])
            
            # Convert datetime back to date for date_of_birth
            if "date_of_birth" in child and hasattr(child["date_of_birth"], 'date'):
                child["date_of_birth"] = child["date_of_birth"].date()
            
            # Calculate age dynamically from date_of_birth
            child_db = ChildDB(**child)
            child["age"] = child_db.calculate_age()
            
            result.append(ChildOut(**child))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve children: {str(e)}"
        )


async def get_child_by_id(child_id: str, guardian_id: str) -> Optional[ChildOut]:
    """
    Get a specific child by ID, ensuring it belongs to the guardian
    
    Args:
        child_id: The ID of the child
        guardian_id: The ID of the guardian (for authorization)
        
    Returns:
        Optional[ChildOut]: The child if found and authorized, None otherwise
        
    Raises:
        HTTPException: If IDs are invalid or child not found
    """
    db = await get_database()
    
    try:
        # Validate child_id format
        if not ObjectId.is_valid(child_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid child ID format"
            )
        
        # Find child that belongs to this guardian
        # Handle both ObjectId and string formats for guardian_id
        # Also handle case where is_active might be missing (treat as active)
        child = await db.children.find_one({
            "_id": ObjectId(child_id),
            "$or": [
                {"guardian_id": ObjectId(guardian_id) if ObjectId.is_valid(guardian_id) else guardian_id},
                {"guardian_id": guardian_id}
            ],
            "$or": [
                {"is_active": True},
                {"is_active": {"$exists": False}}  # Include children without is_active field
            ]
        })
        
        if not child:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child not found or not authorized"
            )
        
        # Convert ObjectIds to strings
        if "_id" in child:
            child["_id"] = str(child["_id"])
        if "guardian_id" in child and isinstance(child["guardian_id"], ObjectId):
            child["guardian_id"] = str(child["guardian_id"])
        
        # Convert datetime back to date for date_of_birth
        if "date_of_birth" in child and hasattr(child["date_of_birth"], 'date'):
            child["date_of_birth"] = child["date_of_birth"].date()
        
        # Calculate age dynamically from date_of_birth
        child_db = ChildDB(**child)
        child["age"] = child_db.calculate_age()
        
        return ChildOut(**child)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve child: {str(e)}"
        )


async def update_child(child_id: str, guardian_id: str, child_data: ChildIn) -> ChildOut:
    """
    Update a child's information
    
    Args:
        child_id: The ID of the child to update
        guardian_id: The ID of the guardian (for authorization)
        child_data: Updated child information
        
    Returns:
        ChildOut: The updated child
        
    Raises:
        HTTPException: If IDs are invalid, child not found, or update fails
    """
    db = await get_database()
    
    try:
        # Validate child_id format
        if not ObjectId.is_valid(child_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid child ID format"
            )
        
        # Verify child exists and belongs to guardian
        # Handle both ObjectId and string formats for guardian_id
        # Also handle case where is_active might be missing (treat as active)
        existing_child = await db.children.find_one({
            "_id": ObjectId(child_id),
            "$or": [
                {"guardian_id": ObjectId(guardian_id) if ObjectId.is_valid(guardian_id) else guardian_id},
                {"guardian_id": guardian_id}
            ],
            "$or": [
                {"is_active": True},
                {"is_active": {"$exists": False}}  # Include children without is_active field
            ]
        })
        
        if not existing_child:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child not found or not authorized"
            )
        
        # Update child data
        update_data = child_data.dict(exclude_unset=True)
        
        # Convert date_of_birth to datetime for MongoDB compatibility
        if "date_of_birth" in update_data:
            from datetime import datetime
            update_data["date_of_birth"] = datetime.combine(update_data["date_of_birth"], datetime.min.time())
        
        result = await db.children.update_one(
            {
                "_id": ObjectId(child_id),
                "$or": [
                    {"guardian_id": ObjectId(guardian_id) if ObjectId.is_valid(guardian_id) else guardian_id},
                    {"guardian_id": guardian_id}
                ],
                "$or": [
                    {"is_active": True},
                    {"is_active": {"$exists": False}}  # Include children without is_active field
                ]
            },
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes were made to the child"
            )
        
        # Retrieve updated child
        updated_child = await db.children.find_one({"_id": ObjectId(child_id)})
        
        # Convert ObjectIds to strings
        if "_id" in updated_child:
            updated_child["_id"] = str(updated_child["_id"])
        if "guardian_id" in updated_child and isinstance(updated_child["guardian_id"], ObjectId):
            updated_child["guardian_id"] = str(updated_child["guardian_id"])
        
        # Convert datetime back to date for date_of_birth
        if "date_of_birth" in updated_child and hasattr(updated_child["date_of_birth"], 'date'):
            updated_child["date_of_birth"] = updated_child["date_of_birth"].date()
        
        # Calculate age dynamically from date_of_birth
        child_db = ChildDB(**updated_child)
        updated_child["age"] = child_db.calculate_age()
        
        return ChildOut(**updated_child)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update child: {str(e)}"
        )


async def delete_child(child_id: str, guardian_id: str) -> bool:
    """
    Soft delete a child (mark as inactive)
    
    Args:
        child_id: The ID of the child to delete
        guardian_id: The ID of the guardian (for authorization)
        
    Returns:
        bool: True if deletion was successful
        
    Raises:
        HTTPException: If IDs are invalid, child not found, or deletion fails
    """
    db = await get_database()
    
    try:
        # Validate child_id format
        if not ObjectId.is_valid(child_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid child ID format"
            )
        
        # Soft delete by setting is_active to False
        # Handle both ObjectId and string formats for guardian_id
        # Also handle case where is_active might be missing (treat as active)
        result = await db.children.update_one(
            {
                "_id": ObjectId(child_id),
                "$or": [
                    {"guardian_id": ObjectId(guardian_id) if ObjectId.is_valid(guardian_id) else guardian_id},
                    {"guardian_id": guardian_id}
                ],
                "$or": [
                    {"is_active": True},
                    {"is_active": {"$exists": False}}  # Include children without is_active field
                ]
            },
            {"$set": {"is_active": False}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child not found or not authorized"
            )
        
        return result.modified_count > 0
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete child: {str(e)}"
        )