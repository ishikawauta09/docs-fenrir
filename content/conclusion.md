# Conclusion

Fenrir provides a powerful and flexible framework that combines the best features from multiple Python web frameworks. Whether you prefer FastAPI's validation, Flask's simplicity, Falcon's performance, or Sanic's async features, Fenrir allows you to use them all together seamlessly.

For more information, visit: [https://github.com/IshikawaUta/fenrir](https://github.com/IshikawaUta/fenrir)

Happy coding! 🐺

---

## Release Notes & Changelog

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
- **Result**: All tests pass (482 unit tests + 13 advanced tests). `fenrir new` now works correctly in all environments.

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
- 482 automated unit tests.
- Premium CLI tooling (`run`, `routes`, `shell`, `bench`, `new`, `info`).
- Auto-generated OpenAPI/Swagger documentation.
- WebSocket and Server-Sent Events support.
