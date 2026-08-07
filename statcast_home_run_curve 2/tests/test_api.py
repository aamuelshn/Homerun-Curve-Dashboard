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

def test_demo_returns_home_runs():
    response = client.get('/api/demo')
    assert response.status_code == 200
    payload = response.json()
    assert len(payload['home_runs']) > 0
    assert 'launch_speed' in payload['home_runs'][0]
