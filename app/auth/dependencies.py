from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from app.auth.security import verify_token
from app.models.user import TokenData, UserOut
from app.services.user_service import get_user_by_email


security = HTTPBearer()

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserOut:
    """Get current authenticated user"""
    token_data = verify_token(credentials.credentials, credentials_exception)
    user = await get_user_by_email(token_data.email)
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return user


def require_roles(allowed_roles: List[str]):
    """Dependency factory for role-based access control"""
    def role_checker(current_user: UserOut = Depends(get_current_user)) -> UserOut:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user
    return role_checker


# Convenience dependencies for specific roles
require_admin = require_roles(["admin"])
require_driver = require_roles(["driver", "admin"])
require_guardian = require_roles(["guardian", "admin"])
require_any_role = require_roles(["guardian", "driver", "admin"])