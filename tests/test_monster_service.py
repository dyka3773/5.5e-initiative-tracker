import asyncio
import importlib

import httpx
import pytest
from fastapi import HTTPException

monster_service_module = importlib.import_module("initiative_tracker.services.monster_service")
from initiative_tracker.services.monster_service import MonsterDetails, MonsterIndexEntry, MonsterService


class _FakeResponse:
    def __init__(self, payload, *, status_code: int = 200) -> None:
        self._payload = payload
        self.status_code = status_code
        self._request = httpx.Request("GET", "https://example.com")

    def json(self):
        return self._payload

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            response = httpx.Response(self.status_code, request=self._request)
            raise httpx.HTTPStatusError("error", request=self._request, response=response)


class _FakeAsyncClient:
    def __init__(self, response: _FakeResponse) -> None:
        self._response = response

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        return None

    async def get(self, url: str) -> _FakeResponse:
        return self._response


def test_ability_modifier() -> None:
    assert MonsterService._ability_modifier(8) == -1
    assert MonsterService._ability_modifier(10) == 0
    assert MonsterService._ability_modifier(18) == 4


def test_extract_armor_class() -> None:
    assert MonsterService._extract_armor_class({"armor_class": 13}) == 13
    assert MonsterService._extract_armor_class({"armor_class": [{"value": 15}]}) == 15
    assert MonsterService._extract_armor_class({"armor_class": []}) is None
    assert MonsterService._extract_armor_class({"armor_class": [{"value": "15"}]}) is None


def test_get_monster_index_uses_cache(monkeypatch) -> None:
    service = MonsterService()
    cached = [MonsterIndexEntry(index="goblin", name="Goblin")]
    service._monster_index_cache["data"] = cached
    service._monster_index_cache["expires_at"] = 10_000_000_000

    async def fail_fetch() -> list[MonsterIndexEntry]:
        pytest.fail("_fetch_monster_index should not be called while cache is valid")

    monkeypatch.setattr(service, "_fetch_monster_index", fail_fetch)

    result = asyncio.run(service.get_monster_index())

    assert result == cached


def test_search_monsters_filters_and_limits(monkeypatch) -> None:
    service = MonsterService()

    async def fake_get_index() -> list[MonsterIndexEntry]:
        return [
            MonsterIndexEntry(index="goblin", name="Goblin"),
            MonsterIndexEntry(index="goblin-boss", name="Goblin Boss"),
            MonsterIndexEntry(index="dragon", name="Dragon"),
        ]

    monkeypatch.setattr(service, "get_monster_index", fake_get_index)

    matches = asyncio.run(service.search_monsters(" GO ", limit=1))

    assert matches == [MonsterIndexEntry(index="goblin", name="Goblin")]


def test_search_monsters_returns_empty_for_blank_query(monkeypatch) -> None:
    service = MonsterService()

    async def fail_get_index() -> list[MonsterIndexEntry]:
        pytest.fail("get_monster_index should not be called for blank query")

    monkeypatch.setattr(service, "get_monster_index", fail_get_index)

    assert asyncio.run(service.search_monsters("   ", limit=4)) == []


def test_get_monster_details_uses_cache() -> None:
    service = MonsterService()
    cached = MonsterDetails(
        index="goblin",
        name="Goblin",
        hit_points=7,
        armor_class=15,
        initiative_modifier=2,
    )
    service._monster_cache["goblin"] = cached

    result = asyncio.run(service.get_monster_details("goblin"))

    assert result == cached


def test_get_monster_details_handles_not_found(monkeypatch) -> None:
    service = MonsterService()

    fake_response = _FakeResponse({}, status_code=404)
    monkeypatch.setattr(monster_service_module.httpx, "AsyncClient", lambda timeout=10.0: _FakeAsyncClient(fake_response))

    with pytest.raises(HTTPException) as exc:
        asyncio.run(service.get_monster_details("missing-monster"))

    assert exc.value.status_code == 404
    assert exc.value.detail == "Monster not found"


def test_get_monster_details_returns_parsed_payload_and_caches(monkeypatch) -> None:
    service = MonsterService()

    payload = {
        "index": "goblin",
        "name": "Goblin",
        "hit_points": 7,
        "armor_class": [{"value": 15}],
        "dexterity": 14,
    }
    fake_response = _FakeResponse(payload)
    monkeypatch.setattr(monster_service_module.httpx, "AsyncClient", lambda timeout=10.0: _FakeAsyncClient(fake_response))

    details = asyncio.run(service.get_monster_details("goblin"))

    assert details == MonsterDetails(
        index="goblin",
        name="Goblin",
        hit_points=7,
        armor_class=15,
        initiative_modifier=2,
    )
    assert service._monster_cache["goblin"] == details
