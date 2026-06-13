# Request & Response

## Request

The `Request` object provides access to all incoming HTTP request data. It is available as a context-local singleton via `from fenrir import request`.

### Request Properties

```python
from fenrir import request

@app.get("/info")
async def get_info():
    # Core properties
    scope = request.scope          # Raw ASGI scope dict
    method = request.method        # HTTP method (GET, POST, etc.)
    path = request.path            # URL path (e.g., "/info")
    query_string = request.query_string  # Raw query string as bytes

    # Parsed query parameters
    args = request.args            # Dict[str, str] – first value per key
    args_list = request.args_list  # Dict[str, List[str]] – all values per key

    # Headers (lowercased keys)
    headers = request.headers      # Dict[str, str]
    user_agent = headers.get("user-agent")

    # Cookies
    cookies = request.cookies      # Dict[str, str]
    session_id = cookies.get("session_id")

    # Body (requires body to be read first)
    raw_body = request.body        # bytes
    json_data = request.json       # Parsed JSON or None

    # Session (if session middleware is active)
    session = request.session      # Session object or None

    # Host (with TRUSTED_HOSTS validation)
    host = request.host            # str

    # Falcon-compatible context dict
    request.context["user"] = {"id": 1}  # Dict[str, Any]

    return {"method": method, "path": path}
```

### Query Parameters

```python
from fenrir import request

@app.get("/search")
async def search():
    # Single value (first occurrence)
    q = request.args.get("q", "")

    # All values for multi-value params
    tags = request.args_list.get("tags", [])
    # e.g., /search?tags=python&tags=web → ["python", "web"]

    return {"query": q, "tags": tags}
```

### Request Body

```python
from fenrir import request

@app.post("/data")
async def receive_data():
    # Read raw body (bytes)
    raw = request.body

    # Parse JSON body (auto-decoded from body)
    data = request.json  # Returns parsed dict/list or None

    # Parse form data (multipart or urlencoded)
    form = await request.form()
    # Returns Dict[str, Any] – fields are strings, files are UploadFile

    return {"received": True}
```

### Streaming Request Body

Process large uploads efficiently without buffering the entire body into memory:

```python
from fenrir.request import Request

@app.post("/upload")
async def upload(raw_request: Request):
    total_bytes = 0
    async for chunk in raw_request.stream_body(chunk_size=65536):
        total_bytes += len(chunk)
    return {"bytes_received": total_bytes}
```

`stream_body(chunk_size=65536)` is an async generator yielding `bytes` chunks. If the body has already been fully read, it yields from the internal buffer. Otherwise it streams directly from the ASGI receive channel (the body is **not** buffered, so `request.body` / `request.json` will not be available afterward).

### Async Body Helpers

```python
from fenrir import request

@app.post("/async-data")
async def async_data():
    # FastAPI-style async accessors
    raw = await request.body_async()   # Returns request.body
    data = await request.json_async()  # Returns request.json

    return {"data": data}
```

### Host Validation (TRUSTED_HOSTS)

The `host` property validates against `TRUSTED_HOSTS` configured on the app. Wildcard matching is supported:

```python
from fenrir import Fenrir

app = Fenrir()
app.config["TRUSTED_HOSTS"] = ["example.com", "*.example.com"]

@app.get("/safe")
async def safe_endpoint():
    host = request.host  # Raises HTTPBadRequest if not trusted
    return {"host": host}
```

Wildcard rules:

- `*.example.com` matches `api.example.com` and `example.com`
- Exact match is always checked

### Falcon-Compatible Request Helpers

```python
from fenrir import request

@app.get("/falcon-style")
async def falcon_style():
    # get_header – case-insensitive header lookup
    content_type = request.get_header("Content-Type")

    # get_param – query parameter with optional required/default
    page = request.get_param("page")
    page_int = request.get_param_as_int("page", required=True, default=1)

    # context – per-request dict (Falcon-style)
    request.context["user"] = {"id": 1}

    return {"content_type": content_type, "page": page}
```

### Request API Reference

**Constructor:**

- `Request(scope: Dict[str, Any])` — initialized from the ASGI scope

**Properties:**

| Property | Type | Description |
|---|---|---|
| `scope` | `Dict[str, Any]` | Raw ASGI scope |
| `method` | `str` | HTTP method (uppercased) |
| `path` | `str` | URL path |
| `query_string` | `bytes` | Raw query string |
| `args` | `Dict[str, str]` | First query value per key |
| `args_list` | `Dict[str, List[str]]` | All query values per key |
| `headers` | `Dict[str, str]` | Lowercased request headers |
| `cookies` | `Dict[str, str]` | Parsed cookies |
| `session` | `Session \| None` | Session object (if middleware active) |
| `body` | `bytes` | Raw request body |
| `json` | `Any \| None` | Parsed JSON body |
| `host` | `str` | Host header (validated against TRUSTED_HOSTS) |
| `context` | `Dict[str, Any]` | Falcon-compatible per-request dict |

**Methods:**

| Method | Returns | Description |
|---|---|---|
| `stream_body(chunk_size=65536)` | `AsyncIterator[bytes]` | Stream body in chunks |
| `form()` | `Dict[str, Any]` | Parse multipart/urlencoded form data |
| `body_async()` | `bytes` | Async wrapper for `body` |
| `json_async()` | `Any` | Async wrapper for `json` |
| `get_header(name, default=None)` | `str \| None` | Case-insensitive header lookup |
| `get_param(name, required=False, default=None)` | `str \| None` | Query parameter with validation |
| `get_param_as_int(name, required=False, default=None)` | `int \| None` | Query parameter cast to int |

---

## Response

### Response Base Class

```python
from fenrir import Response

@app.get("/custom")
async def custom_response():
    resp = Response(
        body="Hello World",
        status=200,
        headers={"X-Custom-Header": "value"},
        content_type="text/plain",
    )
    resp.set_header("X-Another", "value")
    resp.set_cookie("theme", "dark", max_age=86400)
    return resp
```

**Constructor:**

- `Response(body=b"", status=200, headers=None, content_type="text/html; charset=utf-8")`
- `body` accepts `str` or `bytes` (strings are UTF-8 encoded)

**Properties:**

| Property | Type | Description |
|---|---|---|
| `status` | `int` | HTTP status code (getter/setter) |
| `body` | `bytes` | Raw response body (getter/setter, str auto-encoded) |
| `text` | `str \| None` | UTF-8 decoded body (getter/setter) |
| `headers` | `Dict[str, str]` | Response headers |
| `cookies` | `SimpleCookie` | Response cookies |
| `media` | `Any` | Get/set body as Python object (auto-serialized to/from JSON) |

**Methods:**

| Method | Description |
|---|---|
| `set_header(name, value)` | Set a response header (lowercased key) |
| `unset_header(name)` | Remove a response header |
| `set_cookie(key, value, max_age, expires, path, domain, secure, httponly, samesite)` | Set a cookie |
| `delete_cookie(key, path, domain)` | Mark a cookie for deletion |
| `get_asgi_headers()` | Returns headers as `List[Tuple[bytes, bytes]]` for ASGI transport |

### Cookie Options

```python
resp.set_cookie(
    key="session",
    value="abc123",
    max_age=3600,          # Seconds until expiry
    expires="Wed, 01 Jan 2025 00:00:00 GMT",  # Or int (seconds from now)
    path="/",
    domain=".example.com",
    secure=True,
    httponly=True,
    samesite="lax",
)
```

### Media Property (Falcon-Compat)

```python
resp = Response()
resp.media = {"key": "value"}  # Auto-serializes to JSON, sets content-type
data = resp.media              # Parses body as JSON
```

---

## Response Subclasses

### JSONResponse

Auto-serializes Python objects to JSON with `application/json` content type.

```python
from fenrir import JSONResponse

@app.get("/data")
async def get_data():
    return JSONResponse({"key": "value"}, status=200)

@app.get("/list")
async def get_list():
    return JSONResponse([1, 2, 3])
```

**Constructor:** `JSONResponse(content, status=200, headers=None)`

### HTMLResponse

Returns HTML content with `text/html; charset=utf-8` content type.

```python
from fenrir import HTMLResponse

@app.get("/page")
async def page():
    return HTMLResponse("<h1>Hello World</h1>")
```

**Constructor:** `HTMLResponse(content, status=200, headers=None)`

### TextResponse / PlainTextResponse

Returns plain text with `text/plain; charset=utf-8` content type. `PlainTextResponse` is an alias for `TextResponse`.

```python
from fenrir import TextResponse, PlainTextResponse

@app.get("/text")
async def text():
    return TextResponse("Plain text content")

@app.get("/plain")
async def plain():
    return PlainTextResponse("Also plain text")
```

**Constructor:** `TextResponse(content, status=200, headers=None)`

### RedirectResponse

Returns a redirect with `Location` header. Default status is **307** (Temporary Redirect).

```python
from fenrir import RedirectResponse

@app.get("/old-path")
async def redirect_old():
    return RedirectResponse(url="/new-path")  # 307

@app.get("/permanent")
async def redirect_permanent():
    return RedirectResponse(url="/new", status=301)  # 301
```

**Constructor:** `RedirectResponse(url, status=307, headers=None)`

### StreamingResponse

Streams an async/sync generator or iterable. Use `media_type` (or `content_type`) to set the content type.

```python
from fenrir import StreamingResponse

@app.get("/stream")
async def stream():
    async def generate():
        for i in range(100):
            yield f"data: {i}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")

@app.get("/sync-stream")
async def sync_stream():
    def generate():
        for i in range(10):
            yield f"line {i}\n"
    return StreamingResponse(generate(), content_type="text/plain")
```

**Constructor:**

```python
StreamingResponse(
    content,          # AsyncGenerator, Generator, AsyncIterable, Iterable, or Callable
    status=200,
    headers=None,
    media_type="text/plain; charset=utf-8",
    content_type=None, # Alias for media_type (Sanic/Bottle compat)
)
```

**Attributes:**

- `streaming = True` — marks this as a streaming response for the ASGI dispatcher
- `stream_body()` — async generator yielding body chunks as `bytes`

### FileResponse

Serves a file from the filesystem with automatic MIME type detection.

```python
from fenrir import FileResponse

@app.get("/download")
async def download():
    return FileResponse("path/to/file.pdf")

@app.get("/named")
async def named_download():
    return FileResponse(
        "path/to/report.pdf",
        filename="annual-report.pdf",
        content_disposition_type="attachment",
    )

@app.get("/inline")
async def inline_view():
    return FileResponse(
        "image.png",
        media_type="image/png",
        filename="image.png",
        content_disposition_type="inline",
    )
```

**Constructor:**

```python
FileResponse(
    path,                              # File path string
    status=200,
    headers=None,
    media_type=None,                   # Auto-detected via mimetypes if omitted
    filename=None,                     # Defaults to basename of path
    content_disposition_type="attachment",  # "attachment" or "inline"
)
```

**Attributes:**

- `streaming = True`
- `stream_body()` — async generator yielding file contents in 64 KB chunks
- Automatically sets `Content-Length`, `Content-Type`, and `Content-Disposition` headers
