import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.backend.config import settings
from src.backend.database import init_db
from src.backend.websocket_manager import manager
from src.backend.tasks import scheduler

from src.backend.routers import (
    auth_router,
    keys_router,
    messages_router,
    files_router,
    users_router,
)

STATIC_DIR = "src/client/ui"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    if not scheduler.running:
        scheduler.start()
    yield
    if scheduler.running:
        scheduler.shutdown(wait=False)


app = FastAPI(
    title="Secure Messenger",
    version="1.0.0",
    description="End-to-end encrypted messaging platform with PFS",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(keys_router.router, prefix="/api/v1")
app.include_router(messages_router.router, prefix="/api/v1")
app.include_router(files_router.router, prefix="/api/v1")
app.include_router(users_router.router, prefix="/api/v1")


@app.websocket("/ws/v1/chat")
async def websocket_endpoint(websocket: WebSocket, token: str = Query("")):
    await manager.handle_websocket(websocket, token)


@app.get("/api/v1/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}


try:
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="ui")
except Exception:
    pass
