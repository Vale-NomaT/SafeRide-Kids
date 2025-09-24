from pydantic import BaseModel, EmailStr, Field, field_validator
from pydantic_core import core_schema
from typing import Optional, Literal, Any
from datetime import datetime
from bson import ObjectId


class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str):
            if ObjectId.is_valid(v):
                return v
            raise ValueError("Invalid ObjectId")
        raise ValueError("Invalid ObjectId")
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate


class UserIn(BaseModel):
    """User input model for registration"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: Literal["guardian", "driver", "admin"] = "guardian"


class UserOut(BaseModel):
    """User output model for API responses"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    role: Literal["guardian", "driver", "admin"]
    created_at: datetime
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserDB(BaseModel):
    """User database model with all fields including hashed_password"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    email: EmailStr
    role: Literal["guardian", "driver", "admin"]
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None