from fastapi import APIRouter, Query

from initiative_tracker.services.monster_service import monster_service

router = APIRouter(prefix="/api/monsters", tags=["monsters"])


@router.get("/search")
async def search_monsters(
    q: str = Query(default="", min_length=1, max_length=100),
    limit: int = Query(default=4, ge=1, le=10),
) -> dict[str, list[dict[str, str]]]:
    results = await monster_service.search_monsters(query=q, limit=limit)
    return {
        "results": [
            {
                "index": item.index,
                "name": item.name,
            }
            for item in results
        ]
    }


@router.get("/{monster_index}")
async def get_monster(monster_index: str) -> dict[str, str | int | None]:
    monster = await monster_service.get_monster_details(monster_index)
    return {
        "index": monster.index,
        "name": monster.name,
        "hit_points": monster.hit_points,
        "armor_class": monster.armor_class,
        "initiative_modifier": monster.initiative_modifier,
    }
