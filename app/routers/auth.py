from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserIn, UserOut, Token
from app.services.user_service import create_user, authenticate_user
from app.auth.utils import create_access_token


# OAuth2PasswordBearer for token extraction (used by middleware)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# Additional Pydantic models for better validation
class LoginRequest(BaseModel):
    """Login request model with email validation"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")


class RegisterResponse(BaseModel):
    """Registration response model"""
    message: str
    user: UserOut


router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserIn):
    """
    Register a new user
    
    - **email**: Valid email address (required)
    - **password**: Password with minimum 8 characters (required)
    - **role**: User role - guardian, driver, or admin (defaults to guardian)
    
    Returns the created user without password information.
    """
    try:
        user = await create_user(user_data)
        return RegisterResponse(
            message="User registered successfully",
            user=user
        )
    except HTTPException as e:
        # Re-raise HTTP exceptions from the service layer
        raise e
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration"
        )


@router.post("/login", response_model=Token)
async def login_with_form(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login with OAuth2 password form (for compatibility with FastAPI docs)
    
    - **username**: User email address
    - **password**: User password
    
    Returns JWT access token for authenticated requests.
    """
    user = await authenticate_user(form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": str(user.id)}
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.post("/login-json", response_model=Token)
async def login_with_json(login_data: LoginRequest):
    """
    Login with JSON payload (alternative to form-based login)
    
    - **email**: Valid email address
    - **password**: User password
    
    Returns JWT access token for authenticated requests.
    """
    user = await authenticate_user(login_data.email, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": str(user.id)}
    )
    
    return Token(access_token=access_token, token_type="bearer")