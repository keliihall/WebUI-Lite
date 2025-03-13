from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import router
from backend.database.init import init_db
from backend.utils.security import add_security_headers
from backend.config.settings import config

# Initialize the database
init_db()

app = FastAPI(
    title="Chat WebUI API",
    description="API for Chat WebUI with Ollama integration",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.server.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Add security headers middleware
app.middleware("http")(add_security_headers)

# Include API routes
app.include_router(router, prefix="/api")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": __import__("backend").__version__} 