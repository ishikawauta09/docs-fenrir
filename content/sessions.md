# Sessions

Fenrir provides multiple session backends for storing user data across requests.

### Secure Cookie Sessions (Default)

Sessions stored in signed cookies using `itsdangerous`.

```python
from fenrir import Fenrir, session

app = Fenrir()
app.config["SECRET_KEY"] = "your-secret-key"

@app.get("/set")
async def set_session():
    session["user_id"] = 123
    session["theme"] = "dark"
    return {"status": "set"}

@app.get("/get")
async def get_session():
    user_id = session.get("user_id")
    return {"user_id": user_id}
```

**Configuration keys:**
- `SECRET_KEY`: Secret key for signing cookies (required)
- `SESSION_COOKIE_NAME`: Cookie name (default: `"session"`)
- `SESSION_COOKIE_DOMAIN`: Cookie domain
- `SESSION_COOKIE_PATH`: Cookie path (default: `"/"`)
- `SESSION_COOKIE_SECURE`: HTTPS-only cookies (default: `False`)
- `SESSION_COOKIE_HTTPONLY`: JavaScript-inaccessible cookies (default: `True`)
- `SESSION_COOKIE_SAMESITE`: SameSite cookie attribute

### In-Memory Sessions

Server-side sessions stored in memory. Useful for testing and single-process apps.

```python
from fenrir import Fenrir
from fenrir.sessions import InMemorySessionInterface

app = Fenrir()
app.config["SECRET_KEY"] = "your-secret-key"
app.session_interface = InMemorySessionInterface(ttl=3600)
```

**Parameters:**
- `backend`: Custom `InMemorySessionBackend` instance
- `ttl`: Session time-to-live in seconds (default: `86400`)

### Redis Sessions

Server-side sessions backed by Redis. Supports both sync and async Redis clients.

```python
from fenrir import Fenrir
from fenrir.sessions import RedisSessionInterface

app = Fenrir()
app.config["SECRET_KEY"] = "your-secret-key"

# With fakeredis (for testing)
import fakeredis
redis_client = fakeredis.FakeRedis()
app.session_interface = RedisSessionInterface(redis_client=redis_client)

# With real Redis
import redis
redis_client = redis.Redis(host="localhost", port=6379, db=0)
app.session_interface = RedisSessionInterface(redis_client=redis_client, ttl=7200)
```

**Parameters:**
- `redis_client`: Redis client instance (required)
- `prefix`: Key prefix (default: `"session:"`)
- `ttl`: Session time-to-live in seconds (default: `86400`)

Install Redis support: `pip install fenrir-framework[redis]`
