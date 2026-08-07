# Start here

This version was rewritten specifically for Vercel and contains **no Streamlit**.

## Give Codex this prompt

> Read README.md and AGENTS.md. This is the Vercel edition. Install requirements, run the tests, launch `uvicorn index:app --reload`, verify `/api/health`, and verify the page loads. Then deploy the existing project to Vercel. Do not add Streamlit, Next.js, React, a database, Docker, or another framework unless I explicitly ask.

## What changed from the first version

Streamlit previously acted as both the website UI and Python app server. It has been replaced by:

- `public/index.html` — visible page structure
- `public/styles.css` — appearance
- `public/app.js` — search, filters, charts, hover behavior
- `index.py` — FastAPI endpoints that talk to MLB and Baseball Savant

The Baseball Savant data-cleaning code in `src/` is retained.
