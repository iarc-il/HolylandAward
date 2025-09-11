from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
import ngrok
from fastapi import FastAPI

load_dotenv()

NGROK_AUTH_TOKEN = os.getenv("NGROK_AUTH_TOKEN", "")
APPLICATION_PORT = 1293


# ngrok free tier only allows one agent. So we tear down the tunnel on application termination
@asynccontextmanager
async def lifespan(app: FastAPI):
    listener = await ngrok.forward(
        addr=f"localhost:{APPLICATION_PORT}",
        authtoken=NGROK_AUTH_TOKEN,
        domain=os.getenv("NGROK_DOMAIN", None),
    )
    print(f"Public URL: {listener.url()}")
    yield
    await ngrok.disconnect(listener)
