from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()


# Ngrok is now handled by Docker container - see docker-compose.yml
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic here if needed
    yield
    # Shutdown logic here if needed
