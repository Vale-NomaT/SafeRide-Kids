from fastapi import APIRouter, Depends
from app.models.user import UserOut
from app.auth.dependencies import get_current_user


router = APIRouter(prefix="/api", tags=["public"])


@router.get("/")
async def root():
    """Public root endpoint"""
    return {
        "message": "Welcome to SafeRide Kids API",
        "version": "1.0.0",
        "status": "active"
    }


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@router.get("/mobile-test")
async def mobile_test():
    """Simple endpoint for mobile connectivity testing"""
    return {
        "status": "success",
        "message": "Mobile device can reach the API server!",
        "timestamp": "2024-01-24T11:35:00Z",
        "server": "SafeRide Kids API",
        "connectivity": "OK"
    }


@router.get("/profile")
async def get_profile(current_user: UserOut = Depends(get_current_user)):
    """Get current user profile (requires authentication)"""
    return {
        "message": "User profile",
        "user": current_user
    }