from fastapi.testclient import TestClient
from index import app

client = TestClient(app)

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

def test_demo_returns_home_runs():
    response = client.get('/api/demo')
    assert response.status_code == 200
    payload = response.json()
    assert len(payload['home_runs']) > 0
    assert 'launch_speed' in payload['home_runs'][0]
    assert payload['summary']['ev90'] is not None
    assert payload['home_runs'][0]['spray_x'] is not None
