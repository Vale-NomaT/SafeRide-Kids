import jwt
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.config import settings


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password to hash
        
    Returns:
        Hashed password as string
    """
    # Convert password to bytes and generate salt
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    
    # Hash the password
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Return as string
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to check against
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        # Convert both to bytes
        plain_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        
        # Verify password
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        # Return False if any error occurs during verification
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing the data to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        JWT token as string
    """
    # Create a copy of the data to avoid modifying the original
    to_encode = data.copy()
    
    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    
    # Add expiration to the payload
    to_encode.update({"exp": expire})
    
    # Create and return the JWT token
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.jwt_secret, 
        algorithm=settings.jwt_algorithm
    )
    
    return encoded_jwt


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string to verify
        
    Returns:
        Decoded token payload as dictionary if valid, None if invalid
    """
    try:
        # Decode and verify the token
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )
        
        # Check if token has expired (jwt.decode should handle this, but double-check)
        exp = payload.get("exp")
        if exp and datetime.utcnow() > datetime.fromtimestamp(exp):
            return None
            
        return payload
        
    except jwt.ExpiredSignatureError:
        # Token has expired
        return None
    except jwt.InvalidTokenError:
        # Token is invalid (malformed, wrong signature, etc.)
        return None
    except Exception:
        # Any other error
        return None