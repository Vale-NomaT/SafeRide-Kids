from fastapi import APIRouter, Depends
from app.models.user import UserOut
from app.auth.dependencies import require_driver


router = APIRouter(prefix="/driver", tags=["driver"])


@router.get("/dashboard")
async def driver_dashboard(current_user: UserOut = Depends(require_driver)):
    """Driver dashboard endpoint"""
    return {
        "message": "Welcome to driver dashboard",
        "user": current_user.email,
        "role": current_user.role
    }


@router.get("/routes")
async def get_assigned_routes(current_user: UserOut = Depends(require_driver)):
    """Get driver's assigned routes"""
    return {
        "message": "Driver assigned routes",
        "driver": current_user.email,
        "routes": []  # Placeholder for actual route data
    }


@router.post("/location/update")
async def update_location(current_user: UserOut = Depends(require_driver)):
    """Update driver's current location"""
    return {
        "message": "Location updated successfully",
        "driver": current_user.email
    }