import mimetypes
from importlib import metadata

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from initiative_tracker.config import STATIC_DIR
from initiative_tracker.routers import build_pages_router, health_router, monsters_router


def create_app() -> FastAPI:
    # Windows can map .js to text/plain, which breaks ES module execution in browsers.
    mimetypes.add_type("application/javascript", ".js")
    mimetypes.add_type("application/javascript", ".mjs")

    version = metadata.version("initiative-tracker")
    application = FastAPI(
        title="5.5e Initiative Tracker",
        description="A lightweight initiative tracker for tabletop combat.",
        version=version,
        docs_url=None,
    )

    application.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    application.include_router(health_router)
    application.include_router(monsters_router)
    application.include_router(build_pages_router(str(STATIC_DIR), version))
    return application


app = create_app()


def main() -> None:
    uvicorn.run(
        "initiative_tracker.server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )


if __name__ == "__main__":
    main()
