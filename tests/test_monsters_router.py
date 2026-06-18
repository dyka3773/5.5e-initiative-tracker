from fastapi import FastAPI
from fastapi.testclient import TestClient

from initiative_tracker.routers import monsters as monsters_router_module
from initiative_tracker.services.monster_service import MonsterDetails, MonsterIndexEntry


def test_search_monsters_endpoint_returns_results(monkeypatch) -> None:
    async def fake_search_monsters(query: str, limit: int) -> list[MonsterIndexEntry]:
        assert query == "go"
        assert limit == 2
        return [
            MonsterIndexEntry(index="goblin", name="Goblin"),
            MonsterIndexEntry(index="goblin-boss", name="Goblin Boss"),
        ]

    monkeypatch.setattr(monsters_router_module.monster_service, "search_monsters", fake_search_monsters)

    app = FastAPI()
    app.include_router(monsters_router_module.router)
    client = TestClient(app)

    response = client.get("/api/monsters/search", params={"q": "go", "limit": 2})

    assert response.status_code == 200
    assert response.json() == {
        "results": [
            {"index": "goblin", "name": "Goblin"},
            {"index": "goblin-boss", "name": "Goblin Boss"},
        ]
    }


def test_search_monsters_endpoint_rejects_empty_query() -> None:
    app = FastAPI()
    app.include_router(monsters_router_module.router)
    client = TestClient(app)

    response = client.get("/api/monsters/search", params={"q": ""})

    assert response.status_code == 422


def test_get_monster_endpoint_returns_details(monkeypatch) -> None:
    async def fake_get_monster_details(monster_index: str) -> MonsterDetails:
        assert monster_index == "goblin"
        return MonsterDetails(
            index="goblin",
            name="Goblin",
            hit_points=7,
            armor_class=15,
            initiative_modifier=2,
        )

    monkeypatch.setattr(monsters_router_module.monster_service, "get_monster_details", fake_get_monster_details)

    app = FastAPI()
    app.include_router(monsters_router_module.router)
    client = TestClient(app)

    response = client.get("/api/monsters/goblin")

    assert response.status_code == 200
    assert response.json() == {
        "index": "goblin",
        "name": "Goblin",
        "hit_points": 7,
        "armor_class": 15,
        "initiative_modifier": 2,
    }
