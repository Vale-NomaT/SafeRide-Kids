from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime, date
from app.models.user import PyObjectId


class ChildIn(BaseModel):
    """Child input model for creating a new child"""
    name: str = Field(..., min_length=1, max_length=100, description="Child's full name")
    date_of_birth: date = Field(..., description="Child's date of birth")
    home_address: str = Field(..., min_length=1, max_length=500, description="Home address")
    home_coordinates: List[float] = Field(..., min_items=2, max_items=2, description="Home coordinates [lng, lat]")
    school_name: str = Field(..., min_length=1, max_length=200, description="School name")
    school_address: str = Field(..., min_length=1, max_length=500, description="School address")
    school_coordinates: List[float] = Field(..., min_items=2, max_items=2, description="School coordinates [lng, lat]")
    photo_url: Optional[str] = Field(None, max_length=1000, description="URL to child's photo")
    allergies: Optional[str] = Field(None, max_length=1000, description="Child's allergies and medical notes")
    notes: Optional[str] = Field(None, max_length=2000, description="Additional notes about the child")

    @field_validator('date_of_birth')
    @classmethod
    def validate_date_of_birth(cls, v):
        """Validate date of birth to ensure child is between 0-18 years old"""
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        
        if age < 0:
            raise ValueError('Date of birth cannot be in the future')
        if age > 18:
            raise ValueError('Child must be 18 years old or younger')
            
        return v

    @field_validator('home_coordinates', 'school_coordinates')
    @classmethod
    def validate_coordinates(cls, v):
        """Validate coordinates are in [lng, lat] format (GeoJSON standard)"""
        if len(v) != 2:
            raise ValueError('Coordinates must contain exactly 2 values [longitude, latitude]')
        
        lng, lat = v
        
        # Validate longitude (-180 to 180)
        if not -180 <= lng <= 180:
            raise ValueError('Longitude must be between -180 and 180 degrees')
        
        # Validate latitude (-90 to 90)
        if not -90 <= lat <= 90:
            raise ValueError('Latitude must be between -90 and 90 degrees')
        
        return v

    @field_validator('photo_url')
    @classmethod
    def validate_photo_url(cls, v):
        """Validate photo URL format if provided"""
        if v is not None and v.strip():
            # Basic URL validation
            if not (v.startswith('http://') or v.startswith('https://')):
                raise ValueError('Photo URL must start with http:// or https://')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Emma Johnson",
                "date_of_birth": "2016-01-15",
                "home_address": "123 Oak Street, Springfield, IL 62701",
                "home_coordinates": [-89.6501, 39.7817],
                "school_name": "Springfield Elementary School",
                "school_address": "456 Elm Avenue, Springfield, IL 62701",
                "school_coordinates": [-89.6445, 39.7890],
                "photo_url": "https://example.com/photos/emma.jpg",
                "allergies": "Peanuts, shellfish",
                "notes": "Prefers to sit in the front seat, gets car sick easily"
            }
        }


class ChildOut(BaseModel):
    """Child output model for API responses"""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    guardian_id: PyObjectId = Field(..., description="ID of the guardian who owns this child")
    name: str
    date_of_birth: date
    age: int = Field(..., description="Calculated age based on date of birth")
    home_address: str
    home_coordinates: List[float]
    school_name: str
    school_address: str
    school_coordinates: List[float]
    photo_url: Optional[str] = None
    allergies: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    def calculate_age(self) -> int:
        """Calculate current age from date of birth"""
        today = date.today()
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            PyObjectId: str,
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "guardian_id": "507f1f77bcf86cd799439012",
                "name": "Emma Johnson",
                "date_of_birth": "2016-01-15",
                "age": 8,
                "home_address": "123 Oak Street, Springfield, IL 62701",
                "home_coordinates": [-89.6501, 39.7817],
                "school_name": "Springfield Elementary School",
                "school_address": "456 Elm Avenue, Springfield, IL 62701",
                "school_coordinates": [-89.6445, 39.7890],
                "photo_url": "https://example.com/photos/emma.jpg",
                "allergies": "Peanuts, shellfish",
                "notes": "Prefers to sit in the front seat, gets car sick easily",
                "created_at": "2024-01-15T10:30:00"
            }
        }


class ChildDB(BaseModel):
    """Child database model"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    guardian_id: PyObjectId = Field(..., description="ID of the guardian who owns this child")
    name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date = Field(..., description="Child's date of birth")
    home_address: str = Field(..., min_length=1, max_length=500)
    home_coordinates: List[float] = Field(..., min_items=2, max_items=2)
    school_name: str = Field(..., min_length=1, max_length=200)
    school_address: str = Field(..., min_length=1, max_length=500)
    school_coordinates: List[float] = Field(..., min_items=2, max_items=2)
    photo_url: Optional[str] = Field(None, max_length=1000)
    allergies: Optional[str] = Field(None, max_length=1000)
    notes: Optional[str] = Field(None, max_length=2000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def calculate_age(self) -> int:
        """Calculate current age from date of birth"""
        today = date.today()
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            PyObjectId: str,
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }