from __future__ import annotations

from datetime import date
from difflib import SequenceMatcher
from functools import lru_cache
from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .config import MLB_GAME_FEED_URL, MLB_PEOPLE_SEARCH_URL, MLB_PERSON_URL, SAVANT_VIDEO_URL
from .models import PlayerCandidate


class PlayerLookupError(RuntimeError):
    """Raised when MLB's player lookup cannot be completed."""


class MLBVideoError(RuntimeError):
    """Raised when an MLB play cannot be mapped to a Savant video."""


def _session() -> requests.Session:
    retry = Retry(
        total=3,
        connect=3,
        read=3,
        backoff_factor=0.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset({"GET"}),
    )
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "StatcastHomeRunCurve/1.0 (educational project)",
            "Accept": "application/json",
        }
    )
    session.mount("https://", HTTPAdapter(max_retries=retry))
    return session


def _parse_date(value: Any) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def _candidate_from_person(person: dict[str, Any]) -> PlayerCandidate:
    position = person.get("primaryPosition") or {}
    team = person.get("currentTeam") or {}
    return PlayerCandidate(
        player_id=int(person["id"]),
        full_name=str(person.get("fullName") or person.get("fullFMLName") or person["id"]),
        active=person.get("active"),
        position=position.get("abbreviation") or position.get("name"),
        team=team.get("name"),
        debut_date=_parse_date(person.get("mlbDebutDate")),
        last_played_date=_parse_date(person.get("lastPlayedDate")),
    )


def _similarity(query: str, name: str) -> float:
    return SequenceMatcher(None, query.casefold().strip(), name.casefold().strip()).ratio()


def search_players(query: str, *, timeout: int = 20) -> list[PlayerCandidate]:
    """Search MLB's people endpoint and return likely player matches."""
    clean = " ".join(query.split())
    if len(clean) < 2:
        return []

    session = _session()
    attempts = [clean]
    if " " in clean:
        attempts.append(clean.split()[-1])

    people: dict[int, dict[str, Any]] = {}
    errors: list[str] = []
    for name in attempts:
        try:
            response = session.get(
                MLB_PEOPLE_SEARCH_URL,
                params={"names": name},
                timeout=(8, timeout),
            )
            response.raise_for_status()
            payload = response.json()
            for person in payload.get("people", []):
                if person.get("id") is not None:
                    people[int(person["id"])] = person
            if people:
                break
        except (requests.RequestException, ValueError) as exc:
            errors.append(str(exc))

    if not people and errors:
        raise PlayerLookupError(
            "Player search could not reach MLB's lookup service. "
            "Check your internet connection or use the manual MLBAM ID option."
        )

    candidates = [_candidate_from_person(person) for person in people.values()]
    candidates.sort(
        key=lambda candidate: (
            _similarity(clean, candidate.full_name),
            candidate.active is True,
            candidate.last_played_date or date.min,
        ),
        reverse=True,
    )
    return candidates[:15]


def get_player_detail(player_id: int, *, timeout: int = 20) -> PlayerCandidate:
    """Retrieve a fuller player record after a search result is selected."""
    session = _session()
    try:
        response = session.get(
            MLB_PERSON_URL.format(player_id=int(player_id)),
            timeout=(8, timeout),
        )
        response.raise_for_status()
        people = response.json().get("people", [])
    except (requests.RequestException, ValueError) as exc:
        raise PlayerLookupError(
            f"Could not retrieve details for MLBAM {player_id}: {exc}"
        ) from exc

    if not people:
        raise PlayerLookupError(f"MLBAM {player_id} did not return a player record.")
    return _candidate_from_person(people[0])


@lru_cache(maxsize=64)
def _game_plays(game_pk: int) -> tuple[dict[str, Any], ...]:
    session = _session()
    try:
        response = session.get(
            MLB_GAME_FEED_URL.format(game_pk=int(game_pk)),
            timeout=(8, 30),
        )
        response.raise_for_status()
        plays = response.json().get("liveData", {}).get("plays", {}).get("allPlays", [])
    except (requests.RequestException, ValueError) as exc:
        raise MLBVideoError(f"MLB could not load the video record for game {game_pk}.") from exc
    return tuple(play for play in plays if isinstance(play, dict))


def resolve_home_run_video_url(
    game_pk: int,
    at_bat_number: int,
    pitch_number: int | None = None,
) -> str:
    """Resolve a Savant video URL from Statcast's game and at-bat identifiers."""
    target_indexes = {int(at_bat_number) - 1, int(at_bat_number)}
    candidates = [
        play
        for play in _game_plays(int(game_pk))
        if play.get("about", {}).get("atBatIndex") in target_indexes
    ]
    home_runs = [
        play for play in candidates if play.get("result", {}).get("eventType") == "home_run"
    ]
    if home_runs:
        candidates = home_runs

    for play in candidates:
        events = [event for event in play.get("playEvents", []) if event.get("playId")]
        if pitch_number is not None:
            exact = [event for event in events if event.get("pitchNumber") == int(pitch_number)]
            if exact:
                events = exact
        in_play = [event for event in events if event.get("details", {}).get("isInPlay")]
        selected = (in_play or events)[-1] if (in_play or events) else None
        if selected:
            return SAVANT_VIDEO_URL.format(play_id=selected["playId"])

    raise MLBVideoError("MLB does not have a video play ID for this home run.")
