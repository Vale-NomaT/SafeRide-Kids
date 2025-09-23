from fastapi import APIRouter, Depends
from app.models.user import UserOut
from app.auth.dependencies import require_guardian


router = APIRouter(prefix="/guardian", tags=["guardian"])


@router.get("/dashboard")
async def guardian_dashboard(current_user: UserOut = Depends(require_guardian)):
    """Guardian dashboard endpoint"""
    return {
        "message": "Welcome to guardian dashboard",
        "user": current_user.email,
        "role": current_user.role
    }


@router.get("/children")
async def get_children(current_user: UserOut = Depends(require_guardian)):
    """Get guardian's children information"""
    return {
        "message": "Guardian's children",
        "guardian": current_user.email,
        "children": []  # Placeholder for actual children data
    }


@router.get("/tracking")
async def track_children(current_user: UserOut = Depends(require_guardian)):
    """Track children's transport status"""
    return {
        "message": "Children tracking information",
        "guardian": current_user.email,
        "tracking_data": {}  # Placeholder for tracking data
    }