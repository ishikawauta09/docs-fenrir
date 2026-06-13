# Context Locals

Fenrir provides thread/async-task-safe context locals powered by Python's `contextvars`. These proxies allow you to access the current request, application, session, and a per-request namespace object (`g`) from anywhere in your code during a request cycle.

---

## How `contextvars` Ensure Thread/Async Safety

Fenrir uses Python's built-in `contextvars` module, which provides `ContextVar` objects that store values scoped to the current execution context.

- **Threads**: Each thread gets its own copy of context variables automatically. Two concurrent requests in separate threads never share state.
- **Asyncio tasks**: When using `asyncio.create_task()`, the new task inherits a *copy* of the current context. Two concurrent requests in the same event loop remain isolated.

Fenrir defines three `ContextVar` instances in `context.py`:

| `ContextVar` | Holds | Used by |
|---|---|---|
| `_request_ctx_var` | Current `Request` object | `request` proxy |
| `_g_ctx_var` | Current `G` namespace | `g` proxy |
| `_app_ctx_var` | Current `Fenrir` app | `current_app` proxy |

These variables are never accessed directly — they are wrapped by `LocalProxy` subclasses that raise a clear error when accessed outside a valid context.

---

## Core Classes

### `LocalProxy`

`LocalProxy` wraps a `ContextVar` (or a callable) and transparently delegates attribute access, item access, and iteration to the underlying object. It is the base for all context-local proxies.

```python
class LocalProxy:
    def __init__(self, var: Any):
        object.__setattr__(self, "_var", var)

    def _get_current_object(self) -> Any:
        if isinstance(self._var, contextvars.ContextVar):
            try:
                return self._var.get()
            except LookupError:
                raise RuntimeError("Working outside of context.")
        elif callable(self._var):
            return self._var()
        raise RuntimeError("Unrecognized proxy target.")

    # Attribute access
    def __getattr__(self, name: str) -> Any: ...
    def __setattr__(self, name: str, value: Any): ...
    def __delattr__(self, name: str): ...

    # Dict-like access
    def __getitem__(self, key: Any) -> Any: ...
    def __setitem__(self, key: Any, value: Any): ...
    def __delitem__(self, key: Any): ...
    def __contains__(self, key: Any) -> bool: ...
    def __len__(self) -> int: ...
    def __iter__(self) -> Any: ...
    def __repr__(self) -> str: ...
```

**How it works:**

1. On every attribute/item access, `_get_current_object()` reads the current value from the `ContextVar`.
2. If no value has been set for the current context (e.g. outside a request), a `RuntimeError("Working outside of context.")` is raised.
3. All subsequent operations (`getattr`, `getitem`, `iter`, etc.) are forwarded to that real object.

This means `request.method` calls `_get_current_object().method` under the hood — you always interact with the real request, session, or app instance.

---

### `AppProxy`

Subclass of `LocalProxy` that reads from `_app_ctx_var`. Raises a specific error when no application context is active.

```python
class AppProxy(LocalProxy):
    def _get_current_object(self) -> Any:
        try:
            return _app_ctx_var.get()
        except LookupError:
            raise RuntimeError("Working outside of application context.")
```

Used for the `current_app` proxy.

---

### `SessionProxy`

Subclass of `LocalProxy` that reads the session from the current request object. Raises a specific error when no request context is active.

```python
class SessionProxy(LocalProxy):
    def _get_current_object(self) -> Any:
        try:
            req = _request_ctx_var.get()
            return req.session
        except LookupError:
            raise RuntimeError("Working outside of request context.")
```

Used for the `session` proxy. The session is always accessed through the current request — there is no standalone session context.

---

### `G`

A plain namespace object for storing per-request data. It has no predefined attributes; any attribute you set on it is available for the duration of the request.

```python
class G:
    """A namespace object to store temporary data during a request."""
    def __repr__(self) -> str:
        return f"<g {self.__dict__}>"
```

A fresh `G()` instance is created at the start of each `RequestContext` and reset at the end. It is accessed via the `g` proxy.

---

## Context Managers

### `AppContext`

Manages the application context. Sets `_app_ctx_var` on entry and resets it on exit. Calls `do_teardown_appcontext` during cleanup.

```python
class AppContext:
    def __init__(self, app: Any):
        self.app = app
        self._token = None

    def __enter__(self) -> "AppContext":
        self._token = _app_ctx_var.set(self.app)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            if hasattr(self.app, "do_teardown_appcontext"):
                self.app.do_teardown_appcontext(exc_val)
        finally:
            _app_ctx_var.reset(self._token)
```

**Lifecycle:**

1. `__enter__`: Stores the app in `_app_ctx_var`.
2. During the context: `current_app` resolves to this app.
3. `__exit__`: Runs all `@app.teardown_appcontext` functions (even if an exception occurred), then resets the `ContextVar`.

If an exception is passed to `__exit__`, it is forwarded to teardown functions as the `exc` argument.

---

### `RequestContext`

Manages the request context. Wraps `AppContext` (an application context is always active during a request). Sets `_request_ctx_var` and `_g_ctx_var` on entry. Calls `do_teardown_request` during cleanup.

```python
class RequestContext:
    def __init__(self, app: Any, request_obj: Any):
        self.app = app
        self.request = request_obj
        self.app_ctx = AppContext(app)
        self._token_req = None
        self._token_g = None

    def __enter__(self) -> "RequestContext":
        self.app_ctx.__enter__()
        self._token_req = _request_ctx_var.set(self.request)
        self._token_g = _g_ctx_var.set(G())
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            self.app.do_teardown_request(exc_val)
        finally:
            _request_ctx_var.reset(self._token_req)
            _g_ctx_var.reset(self._token_g)
            self.app_ctx.__exit__(exc_type, exc_val, exc_tb)
```

**Lifecycle:**

1. `__enter__`: Enters the app context, then sets the request and a fresh `G` in their respective `ContextVar`s.
2. During the context: `request`, `g`, `current_app`, and `session` all resolve correctly.
3. `__exit__`: Runs `do_teardown_request` (blueprint-specific and global teardown functions), resets `request` and `g`, then exits the app context (which runs app-context teardowns).

Teardown functions are called even if an exception occurred. If a teardown function itself raises, the exception is silently caught to avoid masking the original error.

---

## The Global Proxies

Defined at module level in `context.py`:

```python
request = LocalProxy(_request_ctx_var)
g = LocalProxy(_g_ctx_var)
current_app = AppProxy(None)
session = SessionProxy(None)
```

| Proxy | Type | Resolves To | Active During |
|---|---|---|---|
| `request` | `LocalProxy` | The current `Request` object | `RequestContext` |
| `g` | `LocalProxy` | A per-request `G` namespace | `RequestContext` |
| `current_app` | `AppProxy` | The `Fenrir` app instance | `AppContext` or `RequestContext` |
| `session` | `SessionProxy` | `request.session` | `RequestContext` (when session middleware is active) |

---

## App Methods

### `app.app_context()`

Returns an `AppContext` context manager. Use this when you need `current_app` outside of a request — for example in CLI commands, background scripts, or tests.

```python
with app.app_context():
    print(current_app.title)
    print(current_app.config["DEBUG"])
```

### `app.test_request_context(path, **kwargs)`

Returns a `RequestContext` context manager with a synthetic request. Useful for testing code that accesses `request`, `g`, `session`, or `current_app` outside of a real HTTP server.

```python
with app.test_request_context("/hello", method="GET", headers={"Accept": "application/json"}):
    print(request.path)        # /hello
    print(request.method)      # GET
    print(request.headers)     # {'accept': 'application/json'}
```

Internally it:

1. Builds an ASGI scope from the provided arguments.
2. Creates a `Request` object from that scope.
3. Opens a session if a session interface is configured.
4. Returns a `RequestContext` wrapping the app and request.

---

## Usage Examples

### Request context

```python
from fenrir import request

@app.get("/info")
async def info():
    path = request.path
    method = request.method
    query_params = request.args
    headers = request.headers
    return {"path": path, "method": method}
```

### Per-request data with `g`

```python
from fenrir import g

@app.before_request
async def load_user():
    token = request.headers.get("authorization")
    g.user = await db.get_user_by_token(token)

@app.get("/profile")
async def profile():
    return {"user": g.user.name}

@app.get("/settings")
async def settings():
    return {"theme": g.user.theme}
```

`g` is reset to a fresh `G()` instance at the start of every request. It is not shared between requests.

### Accessing the app with `current_app`

```python
from fenrir import current_app

@app.get("/config")
async def get_config():
    debug = current_app.config.get("DEBUG", False)
    title = current_app.title
    return {"debug": debug, "title": title}

# Outside a request (with app_context):
with app.app_context():
    db_url = current_app.config["DATABASE_URL"]
```

### Session

```python
from fenrir import session

@app.get("/login")
async def login():
    session["user_id"] = 123
    session["role"] = "admin"
    return {"status": "logged in"}

@app.get("/dashboard")
async def dashboard():
    user_id = session.get("user_id")
    if not user_id:
        return {"error": "not logged in"}, 401
    return {"user_id": user_id}
```

### Testing with `test_request_context`

```python
def test_info_endpoint():
    with app.test_request_context("/info", method="GET"):
        assert request.path == "/info"
        assert request.method == "GET"

def test_g_isolation():
    with app.test_request_context("/"):
        g.value = 42
        assert g.value == 42
    # g is reset after the context exits
    with app.test_request_context("/"):
        assert not hasattr(g, "value")
```

---

## Summary

| Concept | Description |
|---|---|
| `LocalProxy` | Transparent proxy over a `ContextVar`; forwards attribute/item access to the real object |
| `AppProxy` | `LocalProxy` subclass for the application context (`current_app`) |
| `SessionProxy` | `LocalProxy` subclass for the session (delegates to `request.session`) |
| `G` | Plain namespace object for per-request data, accessed via `g` |
| `AppContext` | Context manager that sets the app context and runs `do_teardown_appcontext` on exit |
| `RequestContext` | Context manager that sets request + g context, wraps `AppContext`, and runs `do_teardown_request` on exit |
| `app.app_context()` | Returns an `AppContext` for use outside of requests |
| `app.test_request_context()` | Returns a `RequestContext` with a synthetic request for testing |
| Thread safety | Each thread gets its own `ContextVar` values automatically |
| Async safety | Each `asyncio.create_task()` inherits a copy of the context, keeping concurrent requests isolated |
