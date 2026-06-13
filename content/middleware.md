# Middleware

Fenrir supports two types of middleware: **request/response middleware** (decorators) and **ASGI middleware classes** (wrapping the entire ASGI app).

## Request/Response Middleware

### before_request

Executes before the request handler. Can modify the request or abort early.

```python
from fenrir import request

@app.before_request
async def log_request():
    print(f"{request.method} {request.path}")
```

### after_request

Executes after the request handler. Can modify the response before sending.

```python
@app.after_request
async def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response
```

### teardown_request

Executes after the response is sent. Used for cleanup regardless of success or failure.

```python
@app.teardown_request
async def cleanup():
    print("Cleaning up resources")
```

### Combining Middleware

```python
from fenrir import g

@app.before_request
async def add_user_context():
    auth_header = request.headers.get("Authorization")
    if auth_header:
        g.user_id = extract_user_id(auth_header)

@app.after_request
async def add_tracking_header(response):
    response.headers["X-Request-ID"] = str(g.get("request_id"))
    return response
```

### Authentication Middleware

```python
from fenrir import HTTPUnauthorized

@app.before_request
async def check_auth():
    if request.path.startswith("/admin"):
        token = request.headers.get("Authorization")
        if not token or token != "Bearer valid-token":
            raise HTTPUnauthorized()
```

---

## ASGI Middleware Classes

ASGI middleware wraps the entire application. They are added using `app.add_middleware()`.

```python
from fenrir import Fenrir
from fenrir.middleware import CORSMiddleware

app = Fenrir()
app.add_middleware(CORSMiddleware, allow_origins=["*"])
```

Middleware is stacked in **addition order** — the first middleware added becomes the outermost layer (executes first on requests, last on responses).

```python
# Request flows: BodyLimit → RateLimit → GZip → Your app
# Response flows: Your app → GZip → RateLimit → BodyLimit
app.add_middleware(BodyLimitMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(GZipMiddleware)
```

---

## CORSMiddleware

Full CORS support for HTTP and WebSocket requests. Handles preflight OPTIONS requests automatically.

```python
from fenrir import Fenrir
from fenrir.middleware import CORSMiddleware

app = Fenrir()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com", "https://app.example.com"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=True,
    expose_headers=["X-Custom-Header"],
    max_age=3600
)
```

**Parameters:**

- `allow_origins`: List of allowed origins, or `"*"` for all (default: `"*"`)
- `allow_methods`: List of allowed HTTP methods (default: `"*"`)
- `allow_headers`: List of allowed headers (default: `"*"`)
- `allow_credentials`: Whether to allow credentials (default: `False`)
- `expose_headers`: Headers to expose to the browser (default: `""`)
- `max_age`: Max age for preflight cache in seconds (default: `600`)

**WebSocket CORS:** The middleware also handles CORS for WebSocket upgrade requests by checking the `Origin` header against allowed origins.

---

## GZipMiddleware

Automatic gzip compression for responses above a configurable size threshold. Uses streaming compression for memory efficiency on large responses.

```python
from fenrir.middleware import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=500, compresslevel=6)
```

**Parameters:**

- `minimum_size`: Minimum response size in bytes to compress (default: `500`)
- `compresslevel`: Gzip compression level 1-9 (default: `6`)

**Compressible types:** The middleware only compresses responses with these content types:

- `text/plain`, `text/html`, `text/css`, `text/xml`, `text/javascript`
- `application/json`, `application/javascript`, `application/xml`
- `application/rss+xml`, `application/atom+xml`, `application/vnd.ms-fontobject`
- `font/opentype`, `image/svg+xml`, `application/xhtml+xml`, `application/wasm`
- Any `text/*` content type

Responses with status codes 204 or 304 are never compressed.

---

## RequestIDMiddleware

Auto-generates unique request IDs or forwards client-provided IDs.

```python
from fenrir.middleware import RequestIDMiddleware

app.add_middleware(RequestIDMiddleware)

# Or with a custom header name
app.add_middleware(RequestIDMiddleware, header_name="X-Correlation-ID")

# Or with a custom generator
import uuid
def custom_id():
    return f"req-{uuid.uuid4().hex[:12]}"

app.add_middleware(RequestIDMiddleware, generator=custom_id)
```

**Parameters:**

- `header_name`: Header name for the request ID (default: `"X-Request-ID"`)
- `generator`: Custom ID generator function (default: `uuid.uuid4`)

If the client sends a request ID header, it is forwarded as-is. Otherwise, the generator is called to create a new ID.

---

## RateLimitMiddleware

Sliding-window rate limiter per client IP or per custom key. Returns HTTP 429 with a JSON body and `Retry-After` header when exceeded.

```python
from fenrir.middleware import RateLimitMiddleware

# Per-IP rate limiting (default)
app.add_middleware(RateLimitMiddleware, max_requests=100, window_seconds=60)

# Per-user rate limiting with custom key function
def user_key(scope):
    for k, v in scope.get("headers", []):
        if k == b"x-user-id":
            return v.decode("latin-1")
    client = scope.get("client")
    return client[0] if client else "unknown"

app.add_middleware(RateLimitMiddleware, key_func=user_key)

# Distributed rate limiting with Redis
import redis.asyncio as aioredis
redis_client = aioredis.Redis()
app.add_middleware(RateLimitMiddleware, redis_client=redis_client)
```

**Parameters:**

- `max_requests`: Maximum requests per window (default: `100`)
- `window_seconds`: Time window in seconds (default: `60`)
- `key_func`: Custom function to extract client key (default: client IP)
- `retry_after_header`: Include Retry-After header in 429 responses (default: `True`)
- `redis_client`: Redis async client for distributed rate limiting (default: `None`, uses in-memory)

**Default key extraction:** Checks `X-Forwarded-For` header first, then falls back to the client IP from `scope["client"]`.

**Algorithm:** Uses a sliding window that tracks timestamps of requests. Automatically cleans up expired entries periodically.

---

## BodyLimitMiddleware

Rejects requests exceeding a maximum body size, preventing DoS via large payloads. Monitors chunk size for unknown-length (chunked) bodies.

```python
from fenrir.middleware import BodyLimitMiddleware

# Limit request body to 1 MB
app.add_middleware(BodyLimitMiddleware, max_content_length=1_048_576)

# Custom status code
app.add_middleware(BodyLimitMiddleware, max_content_length=5_242_880, status_code=400)
```

**Parameters:**

- `max_content_length`: Maximum allowed body size in bytes (default: `10_485_760` — 10 MB)
- `status_code`: HTTP status code returned when body exceeds limit (default: `413`)

**Chunk monitoring:** For requests without a `Content-Length` header (chunked transfer), the middleware wraps `receive()` to monitor the actual body size and rejects if the limit is exceeded.

---

## CSRFMiddleware

Enforces CSRF token validation for state-changing methods (POST, PUT, DELETE, PATCH). Safe methods (GET, HEAD, OPTIONS) are always allowed.

```python
from fenrir.middleware import CSRFMiddleware

app.add_middleware(CSRFMiddleware, secret_key="my-secret")
```

When `auto_generate=True` (default), a CSRF token cookie is injected into every safe-method response. The client must read this cookie and send it back in the `X-CSRF-Token` header for subsequent state-changing requests.

**Parameters:**

- `secret_key`: Secret key for token generation (default: `""`)
- `cookie_name`: Name of the CSRF cookie (default: `"_csrf_token"`)
- `header_name`: Header name for the CSRF token (default: `"X-CSRF-Token"`)
- `safe_methods`: Set of methods that bypass CSRF validation (default: `frozenset({"GET", "HEAD", "OPTIONS"})`)
- `auto_generate`: Auto-inject CSRF cookie on safe methods (default: `True`)

**Token generation:** Uses HMAC-SHA256 with the secret key and current timestamp. Falls back to `secrets.token_hex(32)` if no secret key is provided.

---

## Middleware Execution Order

ASGI middleware stacks in **addition order**. The first middleware added is the outermost layer:

```python
app.add_middleware(CORSMiddleware)      # Outermost
app.add_middleware(GZipMiddleware)      # Second
app.add_middleware(RequestIDMiddleware)  # Third
app.add_middleware(RateLimitMiddleware) # Innermost

# Request flow:  CORSMiddleware → GZipMiddleware → RequestIDMiddleware → RateLimitMiddleware → Your app
# Response flow: RateLimitMiddleware → RequestIDMiddleware → GZipMiddleware → CORSMiddleware
```

**Recommended order:**

1. **CORSMiddleware** — Handle CORS preflight before anything else
2. **BodyLimitMiddleware** — Reject oversized payloads early
3. **RateLimitMiddleware** — Rate limit before expensive processing
4. **GZipMiddleware** — Compress after rate limiting to avoid compressing 429 responses
5. **RequestIDMiddleware** — Add request ID for tracing
6. **CSRFMiddleware** — Validate CSRF tokens for state-changing requests
