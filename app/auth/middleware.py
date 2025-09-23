from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Dict, Any, Optional
from app.auth.utils import verify_token


# Create HTTPBearer instance for token extraction
security = HTTPBearer()


def extract_token_from_header(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Extract JWT token from Authorization header.
    
    Args:
        credentials: HTTP authorization credentials from FastAPI security
        
    Returns:
        JWT token string
        
    Raises:
        HTTPException: If token is missing or invalid format
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing in Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return credentials.credentials


def verify_jwt_token(token: str = Depends(extract_token_from_header)) -> Dict[str, Any]:
    """
    Verify JWT token and return user data.
    
    Args:
        token: JWT token string
        
    Returns:
        Dictionary containing user data from token
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    # Verify the token using our utility function
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Ensure required fields are present
    if "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload


def require_role(allowed_roles: List[str]):
    """
    Create a dependency that requires specific roles.
    
    Args:
        allowed_roles: List of roles that are allowed to access the endpoint
        
    Returns:
        FastAPI dependency function that checks user role
        
    Usage:
        @app.get("/admin-only")
        async def admin_endpoint(user: dict = Depends(require_role(["admin"]))):
            return {"message": "Admin access granted"}
            
        @app.get("/guardian-or-admin")
        async def mixed_endpoint(user: dict = Depends(require_role(["guardian", "admin"]))):
            return {"message": "Access granted"}
    """
    def role_checker(user_data: Dict[str, Any] = Depends(verify_jwt_token)) -> Dict[str, Any]:
        """
        Check if user's role is in the allowed roles list.
        
        Args:
            user_data: User data from verified JWT token
            
        Returns:
            User data dictionary if role is allowed
            
        Raises:
            HTTPException: If user's role is not in allowed_roles (HTTP 403)
        """
        user_role = user_data.get("role")
        
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing role",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}. Your role: {user_role}",
            )
        
        return user_data
    
    return role_checker


# Convenience dependencies for common role combinations
def require_admin(user_data: Dict[str, Any] = Depends(require_role(["admin"]))) -> Dict[str, Any]:
    """Dependency that requires admin role."""
    return user_data


def require_driver(user_data: Dict[str, Any] = Depends(require_role(["driver"]))) -> Dict[str, Any]:
    """Dependency that requires driver role."""
    return user_data


def require_guardian(user_data: Dict[str, Any] = Depends(require_role(["guardian"]))) -> Dict[str, Any]:
    """Dependency that requires guardian role."""
    return user_data


def require_driver_or_admin(user_data: Dict[str, Any] = Depends(require_role(["driver", "admin"]))) -> Dict[str, Any]:
    """Dependency that requires driver or admin role."""
    return user_data


def require_guardian_or_admin(user_data: Dict[str, Any] = Depends(require_role(["guardian", "admin"]))) -> Dict[str, Any]:
    """Dependency that requires guardian or admin role."""
    return user_data


def require_any_authenticated_user(user_data: Dict[str, Any] = Depends(verify_jwt_token)) -> Dict[str, Any]:
    """Dependency that requires any valid authenticated user (any role)."""
    return user_data


def get_current_user(user_data: Dict[str, Any] = Depends(verify_jwt_token)) -> Dict[str, Any]:
    """Get current authenticated user data."""
    return user_data


# Optional: Get current user without role restrictions (for optional authentication)
def get_current_user_optional(token: Optional[str] = Depends(extract_token_from_header)) -> Optional[Dict[str, Any]]:
    """
    Get current user data if token is provided and valid, otherwise return None.
    Useful for endpoints that have optional authentication.
    
    Args:
        token: Optional JWT token string
        
    Returns:
        User data dictionary if token is valid, None otherwise
    """
    if not token:
        return None
    
    try:
        payload = verify_token(token)
        return payload
    except Exception:
        return None