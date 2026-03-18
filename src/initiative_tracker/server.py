from importlib import metadata
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(
    title="5.5e Initiative Tracker",
    description="A lightweight initiative tracker for tabletop combat.",
    version=metadata.version("initiative-tracker"),
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


def main() -> None:
    uvicorn.run("initiative_tracker.server:app", host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
