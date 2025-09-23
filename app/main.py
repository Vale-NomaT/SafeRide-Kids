from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import connect_to_mongo, close_mongo_connection
from app.routers.auth import router as auth_router
from app.routers.child import router as child_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events for MongoDB connection"""
    # Startup event
    print("🚀 Starting SafeRide Kids API...")
    await connect_to_mongo()
    print("✅ MongoDB connection established")
    yield
    # Shutdown event
    print("🔄 Shutting down SafeRide Kids API...")
    await close_mongo_connection()
    print("✅ MongoDB connection closed")


# Initialize FastAPI app
app = FastAPI(
    title="SafeRide Kids API",
    description="Secure school transport platform with role-based access control",
    version="1.0.0",
    docs_url="/docs",  # Mount /docs for Swagger
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # React development server
        "http://localhost:19006",     # Expo development server
        "exp://localhost:19000",      # Expo client
        "http://localhost:8081",      # React Native Metro bundler
        "*"                           # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
)

# Include routers
app.include_router(auth_router)
app.include_router(child_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)