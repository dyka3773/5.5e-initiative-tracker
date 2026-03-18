from initiative_tracker.routers.health import router as health_router
from initiative_tracker.routers.monsters import router as monsters_router
from initiative_tracker.routers.pages import build_pages_router

__all__ = [
    "build_pages_router",
    "health_router",
    "monsters_router",
]
