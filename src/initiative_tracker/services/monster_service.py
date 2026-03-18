from dataclasses import dataclass
from time import monotonic
from typing import Any

import httpx
from fastapi import HTTPException

from initiative_tracker.config import DND_5E_API_BASE, MONSTER_INDEX_CACHE_TTL_SECONDS


@dataclass(slots=True)
class MonsterIndexEntry:
    index: str
    name: str


@dataclass(slots=True)
class MonsterDetails:
    index: str
    name: str
    hit_points: int | None
    armor_class: int | None


class MonsterService:
    def __init__(self) -> None:
        self._monster_index_cache: dict[str, Any] = {
            "expires_at": 0.0,
            "data": None,
        }
        self._monster_cache: dict[str, MonsterDetails] = {}

    @staticmethod
    def _extract_armor_class(monster_payload: dict[str, Any]) -> int | None:
        raw_armor_class = monster_payload.get("armor_class")

        if isinstance(raw_armor_class, int):
            return raw_armor_class

        if isinstance(raw_armor_class, list) and raw_armor_class:
            first_entry = raw_armor_class[0]
            if isinstance(first_entry, dict):
                value = first_entry.get("value")
                if isinstance(value, int):
                    return value

        return None

    async def _fetch_monster_index(self) -> list[MonsterIndexEntry]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{DND_5E_API_BASE}/monsters")
                response.raise_for_status()
        except httpx.HTTPError as error:
            raise HTTPException(status_code=503, detail="Monster data provider unavailable") from error

        results = response.json().get("results")
        if not isinstance(results, list):
            raise HTTPException(status_code=502, detail="Monster data provider returned invalid data")

        return [
            MonsterIndexEntry(index=item["index"], name=item["name"])
            for item in results
            if isinstance(item, dict) and isinstance(item.get("index"), str) and isinstance(item.get("name"), str)
        ]

    async def get_monster_index(self) -> list[MonsterIndexEntry]:
        now = monotonic()
        cached_data = self._monster_index_cache.get("data")
        if isinstance(cached_data, list) and self._monster_index_cache.get("expires_at", 0.0) > now:
            return cached_data

        monsters = await self._fetch_monster_index()
        self._monster_index_cache["data"] = monsters
        self._monster_index_cache["expires_at"] = now + MONSTER_INDEX_CACHE_TTL_SECONDS
        return monsters

    async def search_monsters(self, query: str, limit: int) -> list[MonsterIndexEntry]:
        normalized_query = query.strip().lower()
        if not normalized_query:
            return []

        monsters = await self.get_monster_index()
        matches = [monster for monster in monsters if normalized_query in monster.name.lower()]
        return matches[:limit]

    async def get_monster_details(self, monster_index: str) -> MonsterDetails:
        cached_monster = self._monster_cache.get(monster_index)
        if cached_monster:
            return cached_monster

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{DND_5E_API_BASE}/monsters/{monster_index}")
                response.raise_for_status()
        except httpx.HTTPStatusError as error:
            if error.response.status_code == 404:
                raise HTTPException(status_code=404, detail="Monster not found") from error
            raise HTTPException(status_code=503, detail="Monster data provider unavailable") from error
        except httpx.HTTPError as error:
            raise HTTPException(status_code=503, detail="Monster data provider unavailable") from error

        payload = response.json()
        if not isinstance(payload, dict):
            raise HTTPException(status_code=502, detail="Monster data provider returned invalid data")

        hit_points = payload.get("hit_points")
        details = MonsterDetails(
            index=payload.get("index", monster_index),
            name=payload.get("name", ""),
            hit_points=hit_points if isinstance(hit_points, int) else None,
            armor_class=self._extract_armor_class(payload),
        )

        self._monster_cache[monster_index] = details
        return details


monster_service = MonsterService()
