from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes, chat, alerts, admin
from app.db.database import init_db

app = FastAPI(
    title="Wayvo AI API",
    description="AI-powered multimodal rural travel assistant for Tamil Nadu",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    init_db()
    # Auto-seed data on first run if DB is empty
    try:
        from app.db.database import SessionLocal
        from app.models.transport import BusRoute
        db = SessionLocal()
        count = db.query(BusRoute).count()
        db.close()
        if count == 0:
            import subprocess, sys, os
            seed_script = os.path.join(os.path.dirname(__file__), "..", "ingestion", "seed_all.py")
            if os.path.exists(seed_script):
                subprocess.run([sys.executable, seed_script], check=False)
    except Exception:
        pass


app.include_router(routes.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": "Wayvo AI",
        "version": "1.0.0",
        "description": "Tamil Nadu Rural Travel Intelligence API",
        "docs": "/docs",
    }
