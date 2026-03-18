from importlib import metadata
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
templates = Jinja2Templates(directory=STATIC_DIR)

app = FastAPI(
    title="5.5e Initiative Tracker",
    description="A lightweight initiative tracker for tabletop combat.",
    version=metadata.version("initiative-tracker"),
    docs_url=None,
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"app_version": app.version},
    )


def main() -> None:
    uvicorn.run("initiative_tracker.server:app", host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
