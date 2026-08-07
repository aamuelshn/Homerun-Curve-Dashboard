from __future__ import annotations

from datetime import date
from io import StringIO
from pathlib import Path
import sys
from typing import Any
from urllib.parse import urlencode

import numpy as np
import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.config import STATCAST_METRICS_START_YEAR
from src.data import HomeRunDataError, career_summary, normalize_home_runs
from src.demo import make_demo_home_runs
from src.mlb_client import MLBVideoError, PlayerLookupError, resolve_home_run_video_url, search_players
from src.savant_client import SavantDataError, fetch_career_home_runs

PUBLIC = ROOT / "public"

app = FastAPI(title="Home Run Career Curve")


def _clean_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return None if np.isnan(value) else float(value)
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if isinstance(value, float) and np.isnan(value):
        return None
    return value


def _serialize(frame: pd.DataFrame) -> list[dict[str, Any]]:
    columns = [
        "game_date", "game_date_label", "season", "home_run_number",
        "season_home_run_number", "home_run_distance", "launch_speed",
        "launch_angle", "bat_speed", "swing_length", "release_speed",
        "pitch_label", "pitch_type", "matchup", "inning_label", "count_label",
        "base_state", "score_label", "batting_team", "opponent", "game_type_label",
        "estimated_ba_using_speedangle", "estimated_woba_using_speedangle",
        "estimated_slg_using_speedangle", "delta_home_win_exp", "delta_run_exp",
        "des", "game_url", "video_url", "rolling_distance_10",
        "rolling_exit_velocity_10", "rolling_launch_angle_10",
        "game_pk", "at_bat_number", "pitch_number", "hc_x", "hc_y",
        "spray_angle", "spray_x", "spray_y",
    ]
    present = [c for c in columns if c in frame.columns]
    records: list[dict[str, Any]] = []
    for row in frame[present].to_dict(orient="records"):
        record = {key: _clean_value(value) for key, value in row.items()}
        if not record.get("video_url") and record.get("game_pk") and record.get("at_bat_number"):
            params = {
                "game_pk": int(record["game_pk"]),
                "at_bat_number": int(record["at_bat_number"]),
            }
            if record.get("pitch_number"):
                params["pitch_number"] = int(record["pitch_number"])
            record["video_url"] = f"/api/video?{urlencode(params)}"
        records.append(record)
    return records


def _payload(frame: pd.DataFrame, player: dict[str, Any] | None = None, source: str = "") -> dict[str, Any]:
    normalized = normalize_home_runs(frame)
    return {
        "player": player,
        "source": source,
        "summary": career_summary(normalized),
        "home_runs": _serialize(normalized),
    }


@app.get("/", response_class=HTMLResponse)
def root() -> FileResponse:
    return FileResponse(PUBLIC / "index.html", media_type="text/html")


@app.get("/{filename}", include_in_schema=False)
def static_asset(filename: str) -> FileResponse:
    if filename not in {"app.js", "styles.css"}:
        raise HTTPException(status_code=404)
    media = "application/javascript" if filename.endswith(".js") else "text/css"
    return FileResponse(PUBLIC / filename, media_type=media)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/video")
def home_run_video(
    game_pk: int = Query(gt=0),
    at_bat_number: int = Query(gt=0),
    pitch_number: int | None = Query(default=None, gt=0),
) -> RedirectResponse:
    try:
        url = resolve_home_run_video_url(game_pk, at_bat_number, pitch_number)
    except MLBVideoError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return RedirectResponse(url, status_code=302)


@app.get("/api/search")
def player_search(q: str = Query(min_length=2, max_length=80)) -> dict[str, Any]:
    try:
        matches = search_players(q)
    except PlayerLookupError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {"matches": [candidate.to_dict() | {"label": candidate.label} for candidate in matches]}


@app.get("/api/home-runs")
def home_runs(
    player_id: int = Query(gt=0),
    player_name: str = Query(default="MLB player", max_length=100),
    start_year: int = Query(default=STATCAST_METRICS_START_YEAR, ge=2008, le=2100),
    end_year: int = Query(default_factory=lambda: date.today().year, ge=2008, le=2100),
    game_types: str = Query(default="R", max_length=20),
    force_refresh: bool = False,
) -> dict[str, Any]:
    if end_year < start_year:
        raise HTTPException(status_code=400, detail="End year must be at least the start year.")
    codes = tuple(code.strip() for code in game_types.split(",") if code.strip())
    if not codes:
        raise HTTPException(status_code=400, detail="At least one game type is required.")
    try:
        raw = fetch_career_home_runs(
            player_id,
            start_year,
            end_year,
            codes,
            force_refresh=force_refresh,
            polite_delay_seconds=0.05,
        )
        normalized = normalize_home_runs(raw)
    except (SavantDataError, HomeRunDataError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    player = {"player_id": player_id, "full_name": player_name}
    return {
        "player": player,
        "source": "Baseball Savant",
        "summary": career_summary(normalized),
        "home_runs": _serialize(normalized),
    }


@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a CSV file.")
    try:
        raw_bytes = await file.read()
        raw = pd.read_csv(StringIO(raw_bytes.decode("utf-8-sig")), low_memory=False)
        return _payload(raw, source=f"Uploaded CSV: {file.filename}")
    except (UnicodeDecodeError, pd.errors.ParserError, HomeRunDataError) as exc:
        raise HTTPException(status_code=400, detail=f"Could not read this Savant CSV: {exc}") from exc


@app.get("/api/demo")
def demo() -> dict[str, Any]:
    raw = make_demo_home_runs()
    return _payload(raw, player={"full_name": "Synthetic Demo"}, source="Synthetic demo")
