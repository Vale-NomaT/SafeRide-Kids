from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.models.child import ChildIn, ChildOut
from app.models.user import UserOut
from app.services.child_service import (
    create_child,
    get_children_by_guardian,
    get_child_by_id,
    update_child,
    delete_child
)
from app.auth.middleware import require_role, get_current_user

# Create router for child management endpoints
router = APIRouter(
    prefix="/children",
    tags=["children"],
    responses={
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden - Guardian access required"},
        404: {"description": "Not found"},
        422: {"description": "Validation error"}
    }
)

# Guardian-only dependency
guardian_required = require_role(["guardian"])


@router.post(
    "/",
    response_model=ChildOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new child",
    description="Create a new child profile. Only guardians can create children."
)
async def create_child_endpoint(
    child_data: ChildIn,
    current_user: dict = Depends(guardian_required)
) -> ChildOut:
    """
    Create a new child for the authenticated guardian.
    
    - **name**: Child's full name (required)
    - **age**: Child's age in years (0-18)
    - **home_address**: Home address (required)
    - **home_coordinates**: Home coordinates as [longitude, latitude]
    - **school_name**: School name (required)
    - **school_address**: School address (required)
    - **school_coordinates**: School coordinates as [longitude, latitude]
    - **photo_url**: Optional URL to child's photo
    - **allergies**: Optional allergy information
    - **notes**: Optional additional notes
    
    Returns the created child with assigned ID and metadata.
    """
    try:
        # Use the current user's ID as guardian_id
        guardian_id = str(current_user.get("user_id"))
        
        # Create the child
        new_child = await create_child(guardian_id, child_data)
        
        return new_child
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create child: {str(e)}"
        )


@router.get(
    "/me",
    response_model=List[ChildOut],
    summary="Get my children",
    description="Get all children belonging to the authenticated guardian."
)
async def get_my_children(
    current_user: dict = Depends(guardian_required)
) -> List[ChildOut]:
    """
    Get all children belonging to the authenticated guardian.
    
    Returns a list of children sorted by creation date (newest first).
    """
    try:
        # Get the current user's ID as guardian_id
        guardian_id = str(current_user.get("user_id"))
        
        # Retrieve children
        children = await get_children_by_guardian(guardian_id)
        
        return children
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve children: {str(e)}"
        )


@router.get(
    "/{child_id}",
    response_model=ChildOut,
    summary="Get a specific child",
    description="Get details of a specific child. Only the child's guardian can access this."
)
async def get_child_endpoint(
    child_id: str,
    current_user: dict = Depends(guardian_required)
) -> ChildOut:
    """
    Get details of a specific child by ID.
    
    - **child_id**: The ID of the child to retrieve
    
    Only the child's guardian can access this endpoint.
    """
    try:
        guardian_id = str(current_user.get("user_id"))
        
        # Get the child
        child = await get_child_by_id(child_id, guardian_id)
        
        return child
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve child: {str(e)}"
        )


@router.put(
    "/{child_id}",
    response_model=ChildOut,
    summary="Update a child",
    description="Update a child's information. Only the child's guardian can update."
)
async def update_child_endpoint(
    child_id: str,
    child_data: ChildIn,
    current_user: dict = Depends(guardian_required)
) -> ChildOut:
    """
    Update a child's information.
    
    - **child_id**: The ID of the child to update
    - **child_data**: Updated child information
    
    Only the child's guardian can update the child's information.
    """
    try:
        guardian_id = str(current_user.get("user_id"))
        
        # Update the child
        updated_child = await update_child(child_id, guardian_id, child_data)
        
        return updated_child
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update child: {str(e)}"
        )


@router.delete(
    "/{child_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a child",
    description="Delete a child profile. Only the child's guardian can delete."
)
async def delete_child_endpoint(
    child_id: str,
    current_user: dict = Depends(guardian_required)
):
    """
    Delete a child profile (soft delete - marks as inactive).
    
    - **child_id**: The ID of the child to delete
    
    Only the child's guardian can delete the child's profile.
    """
    try:
        guardian_id = str(current_user.get("user_id"))
        
        # Delete the child
        success = await delete_child(child_id, guardian_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete child"
            )
        
        return JSONResponse(
            status_code=status.HTTP_204_NO_CONTENT,
            content={"message": "Child deleted successfully"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete child: {str(e)}"
        )


@router.get(
    "/",
    response_model=List[ChildOut],
    summary="Get all children (alternative endpoint)",
    description="Alternative endpoint to get all children belonging to the authenticated guardian."
)
async def get_children_alternative(
    current_user: dict = Depends(guardian_required)
) -> List[ChildOut]:
    """
    Alternative endpoint to get all children belonging to the authenticated guardian.
    
    This is the same as GET /children/me but follows REST conventions.
    """
    try:
        guardian_id = str(current_user.get("user_id"))
        children = await get_children_by_guardian(guardian_id)
        return children
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve children: {str(e)}"
        )


# Health check endpoint for the children service
@router.get(
    "/health",
    summary="Children service health check",
    description="Check if the children service is operational."
)
async def children_health_check():
    """
    Health check endpoint for the children service.
    """
    return {
        "status": "healthy",
        "service": "children",
        "message": "Children management service is operational"
    }