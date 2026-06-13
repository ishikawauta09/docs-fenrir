# Middleware Classes

Fenrir provides built-in ASGI middleware classes for common tasks like CORS, compression, request IDs, and rate limiting.

### CORS Middleware

Full CORS support for HTTP and WebSocket requests.

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

### GZip Middleware

Automatic gzip compression for responses above a configurable size threshold.

```python
from fenrir.middleware import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=500, compresslevel=6)
```

**Parameters:**

- `minimum_size`: Minimum response size in bytes to compress (default: `500`)
- `compresslevel`: Gzip compression level 1-9 (default: `6`)

Compressible content types include: `text/*`, `application/json`, `application/javascript`, `application/xml`, `image/svg+xml`, and more.

### Request ID Middleware

Auto-generates unique request IDs or forwards client-provided IDs.

```python
from fenrir.middleware import RequestIDMiddleware

app.add_middleware(RequestIDMiddleware)

# Or with a custom header name
app.add_middleware(RequestIDMiddleware, header_name="X-Correlation-ID")
```

**Parameters:**

- `header_name`: Header name for the request ID (default: `"X-Request-ID"`)
- `generator`: Custom ID generator function (default: `uuid.uuid4`)

### Rate Limit Middleware

Sliding-window rate limiter per client IP.

```python
from fenrir.middleware import RateLimitMiddleware

app.add_middleware(
    RateLimitMiddleware,
    max_requests=100,
    window_seconds=60
)

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
- `redis_client`: Redis async client for distributed rate limiting (default: `None`, uses in-memory)
- `retry_after_header`: Include Retry-After header in 429 responses (default: `True`)

When rate limited, returns HTTP 429 with a JSON body and `Retry-After` header.

### Body Limit Middleware

Rejects requests exceeding a maximum body size, preventing DoS via large payloads.

```python
from fenrir.middleware import BodyLimitMiddleware

# Limit request body to 1 MB
app.add_middleware(BodyLimitMiddleware, max_content_length=1_048_576)
```

**Parameters:**

- `max_content_length`: Maximum allowed body size in bytes (default: `10_485_760` — 10 MB)
- `status_code`: HTTP status code returned when body exceeds limit (default: `413`)

### CSRF Middleware

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
- `auto_generate`: Auto-inject CSRF cookie on safe methods (default: `True`)
