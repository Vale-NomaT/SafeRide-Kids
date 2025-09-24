from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import time
import logging
from app.database import connect_to_mongo, close_mongo_connection
from app.routers.auth import router as auth_router
from app.routers.child import router as child_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log incoming request
    logger.info(f"🔵 INCOMING REQUEST:")
    logger.info(f"   📍 Method: {request.method}")
    logger.info(f"   🌐 URL: {request.url}")
    logger.info(f"   📡 Client IP: {request.client.host}")
    logger.info(f"   📋 Headers: {dict(request.headers)}")
    logger.info(f"   🔧 User-Agent: {request.headers.get('user-agent', 'Unknown')}")
    
    # Process request
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"🔴 OUTGOING RESPONSE:")
    logger.info(f"   📊 Status: {response.status_code}")
    logger.info(f"   ⏱️  Process Time: {process_time:.4f}s")
    logger.info(f"   📄 Headers: {dict(response.headers)}")
    
    return response

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for connectivity testing"""
    logger.info("🏥 Health check endpoint called")
    return {
        "status": "healthy",
        "message": "SafeRide Kids API is running",
        "timestamp": time.time(),
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    logger.info("🏠 Root endpoint called")
    return {
        "message": "Welcome to SafeRide Kids API",
        "docs": "/docs",
        "health": "/health"
    }

# Include routers
app.include_router(auth_router)
app.include_router(child_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)