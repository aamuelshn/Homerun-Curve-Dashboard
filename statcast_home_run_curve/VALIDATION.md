# Validation — Vercel Edition

Validated on August 6, 2026.

## Passed

- Python compilation for `index.py` and `src/`
- JavaScript syntax check for `../public/app.js`
- 12 automated Python tests
- FastAPI `/api/health` local request
- Root HTML local request
- JavaScript asset local request
- Demo-data API request returning 92 home-run rows
- No Streamlit runtime dependency
- No required writes to the deployed project directory

## Not verified in this build environment

- A real Vercel production deployment
- A live Baseball Savant request from Vercel
- A live MLB player lookup from Vercel

Those require deployment/network access outside this build container. The app keeps CSV upload and synthetic demo fallbacks.
