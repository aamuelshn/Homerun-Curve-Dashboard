from __future__ import annotations

from src import mlb_client


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


class FakeSession:
    def get(self, url, params=None, timeout=None):
        return FakeResponse(
            {
                "people": [
                    {
                        "id": 660271,
                        "fullName": "Shohei Ohtani",
                        "active": True,
                        "primaryPosition": {"abbreviation": "DH"},
                        "currentTeam": {"name": "Los Angeles Dodgers"},
                        "mlbDebutDate": "2018-03-29",
                    },
                    {
                        "id": 999999,
                        "fullName": "A Different Name",
                        "active": False,
                    },
                ]
            }
        )


def test_player_search_ranks_exact_name_first(monkeypatch) -> None:
    monkeypatch.setattr(mlb_client, "_session", lambda: FakeSession())
    results = mlb_client.search_players("Shohei Ohtani")
    assert results[0].player_id == 660271
    assert results[0].position == "DH"
    assert results[0].debut_date.year == 2018


def test_home_run_video_uses_exact_at_bat_and_pitch(monkeypatch) -> None:
    plays = (
        {
            "about": {"atBatIndex": 17},
            "result": {"eventType": "home_run"},
            "playEvents": [
                {"pitchNumber": 3, "playId": "earlier-play"},
                {
                    "pitchNumber": 4,
                    "playId": "0940f201-99d4-426b-9f0e-f6686c25473f",
                    "details": {"isInPlay": True},
                },
            ],
        },
    )
    monkeypatch.setattr(mlb_client, "_game_plays", lambda game_pk: plays)

    url = mlb_client.resolve_home_run_video_url(746362, 18, 4)

    assert url.endswith("playId=0940f201-99d4-426b-9f0e-f6686c25473f")


def test_home_run_video_returns_playable_media_and_poster(monkeypatch) -> None:
    play_id = "0940f201-99d4-426b-9f0e-f6686c25473f"
    plays = (
        {
            "about": {"atBatIndex": 17},
            "result": {"eventType": "home_run"},
            "playEvents": [
                {
                    "pitchNumber": 4,
                    "playId": play_id,
                    "details": {"isInPlay": True},
                },
            ],
        },
    )
    highlights = (
        {
            "guid": play_id,
            "title": "Shohei Ohtani's solo home run (32)",
            "playbacks": [
                {"name": "hlsCloud", "url": "https://example.mlb.com/video.m3u8"},
                {"name": "mp4Avc", "url": "https://example.mlb.com/video.mp4"},
            ],
            "image": {
                "cuts": [
                    {"aspectRatio": "16:9", "width": 320, "src": "https://example.mlb.com/320.jpg"},
                    {"aspectRatio": "16:9", "width": 640, "src": "https://example.mlb.com/640.jpg"},
                ],
            },
        },
    )
    monkeypatch.setattr(mlb_client, "_game_plays", lambda game_pk: plays)
    monkeypatch.setattr(mlb_client, "_game_highlights", lambda game_pk: highlights)

    video = mlb_client.resolve_home_run_video(746362, 18, 4)

    assert video["media_url"] == "https://example.mlb.com/video.mp4"
    assert video["poster_url"] == "https://example.mlb.com/640.jpg"
    assert video["external_url"].endswith(f"playId={play_id}")
    assert video["title"] == "Shohei Ohtani's solo home run (32)"
