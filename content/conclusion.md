# Conclusion

Fenrir provides a powerful and flexible framework that combines the best features from multiple Python web frameworks. Whether you prefer FastAPI's validation, Flask's simplicity, Falcon's performance, or Sanic's async features, Fenrir allows you to use them all together seamlessly.

For more information, visit: [https://github.com/IshikawaUta/fenrir](https://github.com/IshikawaUta/fenrir)

Happy coding! 🐺

---

## Release Notes & Changelog

---

### v3.0.0 — Major Bug Fix & Architecture Release

Fixed 21 bugs, added 46 new tests, and introduced architecture improvements:

**HIGH SEVERITY Fixes (7)**

- Fixed `routing.py`: Converter keyword as param name producing `param_name=""`.
- Fixed `routing.py`: `<path>` converter now recurses into child nodes at all possible depths, enabling routes like `/api/<path:resource>/details` to match correctly.
- Fixed `app.py`: Global teardown functions no longer run twice — deduplication via `seen` set.
- Fixed `app.py`: WebSocket handlers now properly set `_app_ctx_var` so `current_app` works inside websocket handlers.
- Fixed `dependencies.py`: Plain default params (e.g. `page: int = 1`) now return the actual default value instead of `None`.
- Fixed `dependencies.py`: `Annotated[T, Query()]` with function default now preserves the default value.
- Fixed `compat.py`: WSGI response body iteration now runs in a thread executor via `run_in_executor`, preventing event loop blocking.

**MEDIUM SEVERITY Fixes (8)**

- Fixed `app.py`: `_coerce_response` no longer infinitely recurses on 4+ element tuples — serializes as JSON array.
- Fixed `app.py`: Streaming error now always sends `more_body=False` frame, ensuring complete ASGI responses.
- Fixed `response.py`: `text` property returns `""` instead of `None` for empty bodies.
- Fixed `security.py`: `HTTPDigest` now returns a parsed dict instead of raw header string.
- Fixed `openapi.py`: Path parameter detection now checks both `param_name` and `alias`.
- Fixed `pagination.py`: URL building now deduplicates query params using `urllib.parse` instead of blind appending.
- Fixed `helpers.py`: `Content-Disposition` filename is now properly quoted.
- Fixed `signals.py`: Async signal results are now collected as task objects.

**LOW SEVERITY Fixes (6)**

- Removed dead code `_WsgiMount` exception and `_wsgi_handler` from `app.py`.
- Fixed unused `resp` variable in websocket path — now passed to `resolve_parameters`.
- Removed dead code `regex_segments` from `routing.py` `RouteTrie.insert()`.
- Fixed `templating.py`: Removed destructive `os.makedirs` side effect from `Jinja2Renderer.__init__`.
- Fixed `context.py`: Added `hasattr` guard for `do_teardown_appcontext` in `AppContext.__exit__`.
- Fixed `views.py`: `req.method` can no longer cause `AttributeError` — defaults to `"GET"` when `None`.

**Architecture Improvements**

- Added `BodyLimitMiddleware`: Rejects requests exceeding configurable max body size (default 10 MB), now enforces actual body size via chunk monitoring (not just Content-Length header).
- Added `CSRFMiddleware`: CSRF token validation for state-changing HTTP methods, with automatic token generation and cookie injection (`auto_generate=True` by default).
- Fixed `GZipMiddleware`: Streaming compression for `StreamingResponse` (on-the-fly chunk compression); fixed `_is_compressible()` to only compress explicit text-based types (was incorrectly compressing all `application/*` and `image/*`).
- Added `inspect.signature()` caching via `_get_cached_signature()` in `dependencies.py`, now used by `resolve_parameters()` for optimal parameter resolution.
- Added OpenAPI schema caching in `app.openapi()` — cached after first call, invalidated on route changes.
- Fixed `CORSMiddleware`: Wildcard origin with credentials now echoes the specific origin per CORS spec.
- Fixed `RateLimitMiddleware`: Redis backend now checks limit before adding request (matching in-memory behavior).
- Fixed `app.py`: Lifespan handler now returns after startup failure instead of looping forever.

**New Tests (46 tests)**

- PATCH/PUT/DELETE method routing + 405 on wrong method (7 tests)
- HTTPDigest auth parsing: success, missing header, wrong scheme, auto_error=False, field parsing (5 tests)
- OAuth2AuthorizationCodeBearer: success, missing, auto_error=False (3 tests)
- OpenIDConnect: success, missing, wrong scheme, auto_error=False, model (5 tests)
- Rate limiting via Redis backend: under limit, over limit, different keys (3 tests)
- GZip + streaming response (2 tests)
- 4+ element tuple response coercion (4 tests)
- Malformed JSON body + wrong content-type with strict mode (3 tests)
- Lifespan scope handling: startup/shutdown, startup failure (2 tests)
- CORS wildcard + credentials edge case (2 tests)
- Signature caching verification (3 tests)
- OpenAPI schema caching (2 tests)
- CSRF middleware auto-token generation: GET sets cookie, POST without token rejected, POST with valid token accepted, auto_generate=False (4 tests)
- GZip streaming compression: chunks compressed on-the-fly (1 test)

---

### v2.3.5 — Bug Fix & Changelog Update

- Updated changelog to accurately reflect version history.
- All version references synchronized across codebase.

---

### v2.3.4 — Bug Fix Release

- Fixed server crash: `fenrir run` was passing wrong `app_path` (`fenrir.app:_active_app`) to Asteri worker, causing `'NoneType' object is not callable`.
- Fixed Python 3.8 support: replaced `asyncio.to_thread` with `fenrir.compat.to_thread` shim.

---

### v2.3.3 — 🚫 Retracted

- Published with incomplete version updates, superseded by v2.3.4.

---

### v2.3.2 — Architecture & Performance Upgrade

Major architecture improvements, new features, and performance optimizations:

**Architecture Improvements**

- **Trie-Based Routing**: Replaced O(n) linear route matching with O(k) trie-based routing. Route lookup now scales with path depth, not total route count.
- **Context Vars Migration**: Removed `sys._fenrir_active_app` hack, replaced with proper `contextvars.ContextVar` for thread/async-task-safe app context.

**New Components**

- **Connection Pooling (`fenrir.pool`)**: Generic `ConnectionPool` and `DatabasePool` with health checks, retry logic, automatic connection recycling, and configurable pool sizes.
- **HTTP/2 Push (`fenrir.http2`)**: `HTTP2Push` utility for server push with Link headers, auto-push decorators, and resource type guessing.
- **WebSocket Authentication (`fenrir.security`)**: `WebSocketTokenAuth` dependency for token-based WebSocket authentication via headers or query parameters.

**New Features**

- **Streaming Request Body**: `request.stream_body()` method for memory-efficient processing of large uploads without buffering.
- **Per-User Rate Limiting**: `key_func` parameter in `RateLimitMiddleware` for custom rate limiting keys (user ID, API key, etc.).
- **Distributed Rate Limiting**: Redis backend support for `RateLimitMiddleware` using sliding window algorithm.

**Performance Optimizations**

- **GZip Compression Level**: Default `compresslevel` changed from 9 to 6 for optimal CPU/ratio trade-off.
- **Redis Rate Limiter**: Uses `time.monotonic()` instead of `time.time()` for clock-safe operation, with unique IDs to prevent collisions.
- **Deprecated API Fix**: Replaced deprecated `asyncio.get_event_loop()` with `asyncio.get_running_loop()` in WSGI adapter.

**Bug Fixes**

- Fixed missing `import sys` in `app.py` that silently broke root_path detection.
- Fixed stale `sys._fenrir_active_app` references in `views.py` and `templating.py`.
- Fixed inconsistent version strings across `pyproject.toml`, `__init__.py`, and `app.py`.
- Fixed unused `import asyncio` in `falcon.py`.
- Removed private `Semaphore._value` access from `Pool.stats`.

**New Exports**

- `RouteTrie`, `WebSocketTokenAuth`, `ConnectionPool`, `DatabasePool`, `HTTP2Push`

---

### v2.2.2 — Major Feature Update

New middleware, session backends, pagination, and more:

**New Middleware (`fenrir.middleware`)**

- **CORSMiddleware**: Full CORS support for HTTP and WebSocket with configurable origins, methods, headers, credentials, and max-age.
- **GZipMiddleware**: Automatic gzip compression for responses above a configurable size threshold.
- **RequestIDMiddleware**: Auto-generates unique request IDs or forwards client-provided IDs via configurable header.
- **RateLimitMiddleware**: Sliding-window rate limiter per client IP with configurable limits and block status code.

**New Session Backends (`fenrir.sessions`)**

- **InMemorySessionInterface**: In-memory session storage with TTL expiration, suitable for single-process apps and testing.
- **RedisSessionInterface**: Redis-backed session storage with support for both sync (`fakeredis`) and async (`redis.asyncio`) clients. Install with `pip install fenrir-framework[redis]`.

**New Pagination Utilities (`fenrir.pagination`)**

- **PaginationParams**: Pydantic model for query parameters (`page`, `page_size`, `sort_by`, `sort_order`).
- **paginate()**: Utility to paginate SQLAlchemy-style query results with metadata.
- **paginate_dict()**: Utility to paginate lists of dictionaries.

**New Features**

- **WebSocket per-route timeout**: `@app.websocket("/ws", timeout=5.0)` raises `WebSocketTimeout` if no message received within the timeout.
- **Multiple response models per status**: `response_models={200: SuccessModel, 404: ErrorModel}` applies different models based on the actual response status code.

**Improvements**

- ASGI middleware stack is now built once and cached, with automatic invalidation when new middleware is added.
- Zero deprecation warnings across the entire test suite (528 tests).

---

### v1.2.2 — Logo & Favicon Patch

High-quality logo assets and resolved CLI template favicon issues:

- **High-Resolution Logo**: Updated `logo.png` asset to a high-fidelity image for sharper rendering in documentation and templates.
- **Favicon Resolution**: Ensured favicon is correctly rendered and copied during project scaffolding (`fenrir new`) from the package assets.

---

### v1.2.1 — Packaging & Asset Integration Patch

Logo and favicon assets are now properly included in the package distribution:

**Logo Asset Packaging**

- **Issue**: `fenrir new` command failed to copy logo and favicon files when creating new projects outside the main repository.
- **Root cause**: Logo files (`logo.png`, `logo.jpg`) were stored in the repository root, not within the `fenrir/` package directory, so they were not included when the package was installed via PyPI.
- **Fix**:
  - Moved `logo.png` and `logo.jpg` from repository root to `fenrir/` package directory.
  - Added `[tool.setuptools.package-data]` configuration in `pyproject.toml` to include image files: `fenrir = ["logo.png", "logo.jpg"]`.
  - Updated `fenrir/cli.py` `cmd_new()` function to look for logos in the fenrir package directory first, with fallbacks for development mode.
- **Result**: All tests pass (528 unit tests). `fenrir new` now works correctly in all environments.

---

### v1.1.1 — Python 3.8–3.10 Full Compatibility Patch

Five test failures on Python 3.8 CI were identified and patched:

**1. `RuntimeError: Working outside of request context` (session, redirect in sync handlers)**

- **Root cause**: `loop.run_in_executor()` does **not** propagate `contextvars` by default. Sync route handlers using `session[...]` or `redirect()` lost the request context when moved into the executor thread.
- **Fix**: `fenrir/compat.py` — polyfill now calls `contextvars.copy_context().run(func)` instead of passing `func` directly to the executor.

**2. `AssertionError: {'user': None} != {'user': 'Alice'}` (Annotated[str, Header()])**

- **Root cause**: `typing.get_origin(typing_extensions.Annotated[...])` returns `None` on Python 3.8, so `Annotated` parameters were silently ignored during dependency resolution.
- **Fix**: `fenrir/compat.py` — export `get_origin`/`get_args` from `typing_extensions` (which correctly handles its own `Annotated`). `fenrir/dependencies.py` and `fenrir/openapi.py` now import these from `fenrir.compat`.

**3. `AssertionError: {'content_type': ''} != {'content_type': 'text/plain'}` (file upload)**

- **Root cause**: `python-multipart < 0.0.21` (installed on Python 3.8–3.10 CI runners) did not pass `content_type` into `File.__init__`, so `file.content_type` did not exist.
- **Fix**: `fenrir/request.py` — intercepts the parser's `on_header_field`/`on_header_value`/`on_headers_finished` callbacks to capture the `Content-Type` of each multipart part before the `File` object is constructed, and injects it as a fallback.

**4. `AssertionError: 'target' == '/nested/target'` (relative redirect)**

- Resolved as a side-effect of fix #1 (contextvars propagation restores `request.path` inside the executor thread).

**5. CI timeout on Python 3.9 (gevent build)**

- The Python 3.9 job was cancelled mid-build because compiling `gevent` took too long. This is an infrastructure concern, not a code issue; no code change required.

---

### v1.1.0 — CI/CD & Centering Fix

- Added **GitHub Actions** workflow for automated testing across Python 3.8–3.13.
- Fixed centering of `PROJECT CREATED SUCCESSFULLY` badge and logo in scaffolded template.
- Added **RFC 7231 HEAD** method compliance.
- Added `itsdangerous` and `python-multipart` as explicit core dependencies.

---

### v0.1.0 — Initial Release

- Core ASGI framework with Flask, FastAPI, Sanic, Falcon, and Bottle hybridization.
- 528 automated unit tests.
- Premium CLI tooling (`run`, `routes`, `shell`, `bench`, `new`, `info`).
- Auto-generated OpenAPI/Swagger documentation.
- WebSocket and Server-Sent Events support.
