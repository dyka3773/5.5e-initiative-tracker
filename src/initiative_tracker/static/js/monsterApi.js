import { MAX_SUGGESTIONS } from "./constants.js";

export async function searchMonstersByName(query) {
  const response = await fetch(`/api/monsters/search?q=${encodeURIComponent(query)}&limit=${MAX_SUGGESTIONS}`);

  if (!response.ok) {
    throw new Error("Failed to fetch monster suggestions");
  }

  const payload = await response.json();
  return Array.isArray(payload.results) ? payload.results : [];
}

export async function fetchMonster(index) {
  const response = await fetch(`/api/monsters/${encodeURIComponent(index)}`);

  if (!response.ok) {
    throw new Error("Failed to fetch monster details");
  }

  return response.json();
}
