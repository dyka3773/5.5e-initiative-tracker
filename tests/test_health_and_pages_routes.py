from fastapi import FastAPI
from fastapi.testclient import TestClient

from initiative_tracker.config import STATIC_DIR
from initiative_tracker.routers.health import router as health_router
from initiative_tracker.routers.pages import build_pages_router


def test_health_endpoint_returns_ok() -> None:
    app = FastAPI()
    app.include_router(health_router)
    client = TestClient(app)

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_index_page_renders_with_app_version() -> None:
    app = FastAPI()
    app.include_router(build_pages_router(str(STATIC_DIR), "9.9.9"))
    client = TestClient(app)

    response = client.get("/")

    assert response.status_code == 200
    assert "v9.9.9" in response.text
    assert "/static/styles.css?v=9.9.9" in response.text
