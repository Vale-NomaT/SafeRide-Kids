from fastapi import APIRouter, Depends
from app.models.user import UserOut
from app.auth.dependencies import require_admin


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
async def admin_dashboard(current_user: UserOut = Depends(require_admin)):
    """Admin-only dashboard endpoint"""
    return {
        "message": "Welcome to admin dashboard",
        "user": current_user.email,
        "role": current_user.role
    }


@router.get("/users")
async def list_all_users(current_user: UserOut = Depends(require_admin)):
    """Admin-only endpoint to list all users"""
    return {
        "message": "List of all users (admin only)",
        "requested_by": current_user.email
    }


@router.post("/system/maintenance")
async def system_maintenance(current_user: UserOut = Depends(require_admin)):
    """Admin-only system maintenance endpoint"""
    return {
        "message": "System maintenance mode activated",
        "activated_by": current_user.email
    }