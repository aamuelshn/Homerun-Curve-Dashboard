# Homerun-Curve-Dashboard

# Home Run Career Curve — Vercel Edition

A Vercel-ready Statcast web application. It does **not** use Streamlit.

## Stack

- FastAPI: the small Python server/API
- Vanilla HTML/CSS/JavaScript: the website
- Plotly.js: interactive charts and hover tooltips
- pandas + requests: Baseball Savant data retrieval and cleanup
- Vercel: deployment

No React, Next.js, database, Docker, or Node build step is required.

## Features preserved

- Search MLB players by name
- Select the correct matching player
- Query Baseball Savant for home runs
- Choose start/end year and regular/postseason coverage
- Distance, exit-velocity, and launch-angle density distributions
- Season-weighted MLB home-run average reference lines from Baseball Savant
- EV90 calculated from each loaded player's home-run exit velocities
- Fixed detail panels that keep chart observations visible
- HR by season
- Zoomable latest-team ballpark spray chart with discrete season colors
- Clickable spray markers and log links to exact Baseball Savant videos
- Season and team checkbox filters
- Collapsible, sortable home-run log with date and metric filters
- CSV download
- Savant CSV upload fallback
- Synthetic demo mode

## Local development

```bash
python -m venv .venv
# macOS/Linux
source .venv/bin/activate
# Windows PowerShell
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn index:app --reload
```

Open http://127.0.0.1:8000

## Deploy to Vercel

## Use this link: https://homeruncurvedashboard.vercel.app/

Import this repository into Vercel or run `vercel` from the project root. Vercel recognizes the FastAPI `app` in `index.py` as a Python Function.

The application never writes required state into the deployment directory. Baseball Savant's disk cache uses the OS temporary directory when writable and is only a performance optimization.
