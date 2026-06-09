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

app.add_middleware(GZipMiddleware, minimum_size=500, compresslevel=9)
```

**Parameters:**
- `minimum_size`: Minimum response size in bytes to compress (default: `500`)
- `compresslevel`: Gzip compression level 1-9 (default: `9`)

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
- `generator`: Custom ID generator function (default: UUID4)

### Rate Limit Middleware

Sliding-window rate limiter per client IP.

```python
from fenrir.middleware import RateLimitMiddleware

app.add_middleware(
    RateLimitMiddleware,
    max_requests=100,
    window_seconds=60
)
```

**Parameters:**
- `max_requests`: Maximum requests per window (default: `100`)
- `window_seconds`: Time window in seconds (default: `60`)
- `key_func`: Custom function to extract client key (default: client IP)
- `retry_after_header`: Include Retry-After header in 429 responses (default: `True`)

When rate limited, returns HTTP 429 with a JSON body and `Retry-After` header.
