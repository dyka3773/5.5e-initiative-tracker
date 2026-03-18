# 5.5e-initiative-tracker

A lightweight initiative tracker web app for Dungeons and Dragons 5.5e, built with FastAPI and a single-page frontend.

## Features

- Initiative table with columns for Initiative, Name, HP, AC, and Conditions
- Five starter rows, with an Add Row button for larger encounters
- Sort button to order all combatants by Initiative (descending)
- Clear Table button to reset the board
- Hover-based d20 roll button in each Initiative cell for quick random initiative rolls

## Run Locally

1. Install dependencies:

```bash
uv sync
```

2. Start the app:

```bash
uv run server
```

3. Open http://localhost:8000 in your browser.

## Docker Deployment

1. Compose the Docker container:

```bash
docker compose up --build
```
2. Access the app at http://localhost:8000 in your browser.