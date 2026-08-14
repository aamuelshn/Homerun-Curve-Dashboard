from fastapi.testclient import TestClient
import index as api

client = TestClient(api.app)

def test_health():
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json() == {'status': 'ok'}

def test_root_loads():
    response = client.get('/')
    assert response.status_code == 200
    assert 'Home Run Career Curve' in response.text
    assert 'Streamlit' not in response.text
    assert 'Home-run metric distributions' in response.text
    assert 'distanceDistribution' in response.text
    assert 'id="playerHeadshot"' in response.text
    assert 'id="selectAllSeasons"' in response.text
    assert 'id="selectAllTeams"' in response.text
    assert 'id="curveMetric"' not in response.text
    assert 'id="careerChart"' not in response.text
    assert '<video' not in response.text

    stylesheet = client.get('/styles.css')
    assert stylesheet.status_code == 200
    assert stylesheet.headers['content-type'].startswith('text/css')

    script = client.get('/app.js')
    assert script.status_code == 200
    assert 'MLB_HR_BENCHMARKS' in script.text
    assert 'scrollZoom: true' in script.text
    assert 'type="checkbox"' in script.text
    assert 'toggleAllFilters' in script.text
    assert 'syncFilterToggleButtons' in script.text
    assert 'Deselect all' in script.text
    assert 'content.mlb.com/images/headshots/current/60x60/' in script.text
    assert 'dragmode: "pan"' in script.text
    assert 'preload="none"' in script.text
    assert '/api/video/embed?' in script.text


def test_video_embed_returns_lazy_playback_metadata(monkeypatch):
    monkeypatch.setattr(
        api,
        'resolve_home_run_video',
        lambda game_pk, at_bat_number, pitch_number: {
            'media_url': 'https://example.mlb.com/home-run.mp4',
            'poster_url': 'https://example.mlb.com/home-run.jpg',
            'external_url': 'https://baseballsavant.mlb.com/sporty-videos?playId=play-id',
            'title': 'Home run',
        },
    )

    response = client.get('/api/video/embed?game_pk=746362&at_bat_number=18&pitch_number=4')

    assert response.status_code == 200
    assert response.json()['media_url'].endswith('home-run.mp4')
    assert response.headers['cache-control'].startswith('public, max-age=86400')

def test_demo_returns_home_runs():
    response = client.get('/api/demo')
    assert response.status_code == 200
    payload = response.json()
    assert len(payload['home_runs']) > 0
    assert 'launch_speed' in payload['home_runs'][0]
    assert payload['summary']['ev90'] is not None
    assert payload['home_runs'][0]['spray_x'] is not None
