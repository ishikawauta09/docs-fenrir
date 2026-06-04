# Testing

### Creating Test Cases

```python
from fenrir import Fenrir
from fenrir.testing import TestClient

app = Fenrir()

@app.get("/")
async def read_root():
    return {"message": "Hello World"}

def test_read_root():
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}
```

### Testing with pytest

```python
import pytest
from fenrir.testing import TestClient
from app import app

@pytest.fixture
def client():
    return TestClient(app)

def test_get_user(client):
    response = client.get("/users/1")
    assert response.status_code == 200
    assert response.json()["user_id"] == 1

def test_create_user(client):
    response = client.post(
        "/users",
        json={"name": "John", "email": "john@example.com"}
    )
    assert response.status_code == 201
    assert response.json()["id"]
```

### Testing File Uploads

```python
def test_upload_file(client):
    with open("test.txt", "rb") as f:
        response = client.post(
            "/upload",
            files={"file": f}
        )
    assert response.status_code == 200
    assert response.json()["filename"] == "test.txt"
```

### Testing WebSockets

```python
from fenrir.testing import TestClient

def test_websocket():
    client = TestClient(app)
    with client.websocket_connect("/ws") as websocket:
        data = websocket.receive_text()
        assert data
```
