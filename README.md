# SafeRide Kids - FastAPI Backend

Secure school transport platform with JWT authentication and role-based access control.

## Project Structure

```
SafeRide-Kids/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py              # Configuration settings
│   ├── database.py            # MongoDB connection
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── security.py        # JWT & password utilities
│   │   └── dependencies.py    # Auth dependencies & role checks
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py           # Pydantic models
│   ├── services/
│   │   ├── __init__.py
│   │   └── user_service.py   # User business logic
│   └── routers/
│       ├── __init__.py
│       ├── auth.py           # Authentication routes
│       ├── admin.py          # Admin-only routes
│       ├── driver.py         # Driver routes
│       ├── guardian.py       # Guardian routes
│       └── public.py         # Public routes
├── requirements.txt
├── .env.example
├── .env
└── README.md
```

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Environment Setup
Copy `.env.example` to `.env` and update values:
```bash
cp .env.example .env
```

**Important**: Change `JWT_SECRET` in production!

### 3. MongoDB Setup
Ensure MongoDB is running locally or update `MONGO_URI` in `.env`

### 4. Run Application
```bash
# Development mode
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# Or using Python
python -m app.main
```

### 5. Access API Documentation
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## API Usage Examples

### Register User
```bash
curl -X POST "http://localhost:8001/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@saferide.com",
    "password": "securepass123",
    "full_name": "Admin User",
    "role": "admin"
  }'
```

### Login
```bash
curl -X POST "http://localhost:8001/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@saferide.com&password=securepass123"
```

### Access Protected Route
```bash
curl -X GET "http://localhost:8001/admin/dashboard" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## User Roles

- **guardian**: Access to child tracking and guardian dashboard
- **driver**: Access to route management and location updates
- **admin**: Full system access including user management

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Environment-based configuration
- CORS middleware
- Input validation with Pydantic

## Production Deployment

1. Set strong `JWT_SECRET`
2. Configure proper CORS origins
3. Use production MongoDB instance
4. Set `ENVIRONMENT=production`
5. Use HTTPS
6. Implement rate limiting
7. Add logging and monitoring