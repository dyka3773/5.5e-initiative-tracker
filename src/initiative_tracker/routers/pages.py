from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates


def build_pages_router(static_directory: str, app_version: str) -> APIRouter:
    router = APIRouter(tags=["pages"])
    templates = Jinja2Templates(directory=static_directory)

    @router.get("/")
    async def index(request: Request):
        return templates.TemplateResponse(
            request=request,
            name="index.html",
            context={"app_version": app_version},
        )

    return router
