# Error Handling & Exceptions

Fenrir provides the `@app.exception()` decorator to catch specific exceptions or HTTP status codes globally. This is useful for creating custom error pages and handling various error scenarios.

### Base HTTPException

The base class for all HTTP exceptions. Accepts `status_code`, `detail`, and optional `headers`.

```python
from fenrir import HTTPException

@app.get("/items/<item_id:int>")
async def get_item(item_id: int):
    if item_id > 1000:
        raise HTTPException(
            status_code=400,
            detail="Item ID is too large"
        )
    return {"item_id": item_id}
```

The `headers` parameter allows passing custom response headers with the error:

```python
@app.get("/protected")
async def protected_route():
    raise HTTPException(
        status_code=401,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"}
    )
```

### Specific HTTP Exception Classes

Fenrir provides pre-built exception classes with default status codes and detail messages. All accept an optional `detail` string and `headers` dict.

| Class | Status Code | Default Detail |
|-------|------------|----------------|
| `HTTPBadRequest` | 400 | `"Bad Request"` |
| `HTTPUnauthorized` | 401 | `"Unauthorized"` |
| `HTTPForbidden` | 403 | `"Forbidden"` |
| `HTTPNotFound` | 404 | `"Not Found"` |
| `HTTPMethodNotAllowed` | 405 | `"Method Not Allowed"` |
| `HTTPConflict` | 409 | `"Conflict"` |
| `HTTPUnprocessableEntity` | 422 | `"Unprocessable Entity"` |
| `HTTPInternalServerError` | 500 | `"Internal Server Error"` |

```python
from fenrir import (
    HTTPBadRequest,
    HTTPUnauthorized,
    HTTPForbidden,
    HTTPNotFound,
    HTTPMethodNotAllowed,
    HTTPConflict,
    HTTPUnprocessableEntity,
    HTTPInternalServerError
)

@app.get("/users/<user_id:int>")
async def get_user(user_id: int):
    if user_id < 0:
        raise HTTPBadRequest(detail="User ID is invalid")
    if user_id > 999999:
        raise HTTPNotFound(detail="User not found")
    return {"user_id": user_id}
```

#### Using Headers with Specific Exceptions

Each exception class supports the `headers` parameter for custom response headers:

```python
@app.get("/auth/token")
async def get_token():
    token = "..."
    if not token:
        raise HTTPUnauthorized(
            detail="Missing credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return {"token": token}

@app.get("/users/<user_id:int>/profile")
async def get_profile(user_id: int):
    user = None
    if not user:
        raise HTTPForbidden(
            detail="You do not have access to this resource",
            headers={"X-RateLimit-Remaining": "0"}
        )
    return {"profile": user}

@app.post("/resources")
async def create_resource():
    conflict = True
    if conflict:
        raise HTTPConflict(
            detail="Resource already exists",
            headers={"Location": "/resources/123"}
        )
    return {"created": True}
```

### Catching HTTP Status Code (Customize 404 Page)

By default, if a route is not found, Fenrir returns a JSON response. You can change it to a custom HTML page using the `@app.exception()` decorator:

```python
from fenrir import Fenrir, render_template, HTTPNotFound

app = Fenrir()

@app.exception(404)
async def page_not_found(req, exc):
    """Handle all 404 errors with custom HTML page"""
    # Render custom HTML template for 404
    return render_template("404.html", detail=exc.detail), 404
```

Template file `templates/404.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Page Not Found</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            text-align: center;
            background: white;
            padding: 50px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 { color: #333; }
        p { color: #666; }
        a { color: #667eea; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐺 404 - Page Not Found</h1>
        <p>{{ detail }}</p>
        <p><a href="/">← Back to Home</a></p>
    </div>
</body>
</html>
```

### Handling 500 Error (Server Error)

```python
from fenrir import render_template, HTTPInternalServerError

@app.exception(500)
async def server_error(req, exc):
    """Handle all 500 errors with custom HTML page"""
    return render_template("500.html", detail="An error occurred on the server"), 500
```

Template file `templates/500.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Server Error</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .container {
            text-align: center;
            background: white;
            padding: 50px;
            border-radius: 10px;
        }
        h1 { color: #f5576c; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️ 500 - Server Error</h1>
        <p>{{ detail }}</p>
    </div>
</body>
</html>
```

### Custom Exception Handlers

```python
from fenrir import JSONResponse

class CustomException(Exception):
    def __init__(self, detail: str, code: int = 400):
        self.detail = detail
        self.code = code

@app.exception(CustomException)
async def custom_exception_handler(request, exc):
    return JSONResponse(
        {"error": exc.detail},
        status=exc.code
    )

@app.get("/custom-error")
async def trigger_error():
    raise CustomException("Something went wrong", code=422)
```

### Pydantic Validation Error (422)

When Pydantic validation fails, Fenrir automatically returns status 422. You can handle it customly:

```python
from fenrir import render_template

@app.exception(422)
async def validation_error(req, exc):
    """Handle validation errors with custom page"""
    return render_template(
        "validation_error.html",
        detail="The data you sent is invalid",
        errors=exc.detail if hasattr(exc, 'detail') else []
    ), 422
```

### Error Response Structure with Headers

```python
from fenrir import HTTPException

@app.get("/demo-error")
async def demo_error():
    try:
        1 / 0
    except ZeroDivisionError:
        raise HTTPException(
            status_code=400,
            detail="Division by zero",
            headers={"X-Error-Type": "math", "X-Custom-Header": "error-value"}
        )
```

### Multiple Exception Handlers

#### Using `@app.exception()` with Multiple Exceptions

The `@app.exception()` decorator accepts multiple exception classes or status codes in a single call, mapping them all to the same handler:

```python
@app.exception(400, 422)
async def handle_bad_request(req, exc):
    return JSONResponse(
        {"error": "Invalid request", "detail": exc.detail},
        status=getattr(exc, "status_code", 400)
    )

@app.exception(HTTPNotFound, HTTPMethodNotAllowed)
async def handle_not_found(req, exc):
    return JSONResponse(
        {"error": "Resource not available"},
        status=exc.status_code
    )
```

#### Registering Separate Handlers

You can register individual handlers using `@app.exception()` for each exception class:

```python
class DatabaseError(Exception):
    pass

class AuthenticationError(Exception):
    pass

@app.exception(DatabaseError)
async def handle_database_error(req, exc):
    return JSONResponse(
        {"error": "Database error", "detail": str(exc)},
        status=500
    )

@app.exception(AuthenticationError)
async def handle_auth_error(req, exc):
    return JSONResponse(
        {"error": "Authentication failed"},
        status=401
    )

@app.get("/data")
async def get_data():
    try:
        # Simulate database error
        raise DatabaseError("Database connection failed")
    except DatabaseError as e:
        raise  # Will be caught by handler
```

#### Using `app.register_error_handler()`

As an alternative to the decorator, you can register handlers programmatically using `app.register_error_handler()`:

```python
async def handle_validation(req, exc):
    return JSONResponse(
        {"error": "Validation failed", "detail": exc.detail},
        status=422
    )

async def handle_rate_limit(req, exc):
    return JSONResponse(
        {"error": "Rate limit exceeded"},
        status=429,
        headers={"Retry-After": "60"}
    )

app.register_error_handler(422, handle_validation)
app.register_error_handler(HTTPConflict, handle_rate_limit)
```

### Exception Handler Resolution Order

When an exception is raised, Fenrir resolves the handler in the following order:

1. **Status code handler first** — If a handler is registered for the exception's `status_code` attribute, it is used. For example, if an `HTTPNotFound` (status 404) is raised, Fenrir checks for a handler registered on `404` before checking for `HTTPNotFound`.

2. **Exception class handler second** — If no status code handler is found, Fenrir walks the exception handlers dict looking for a registered exception class that matches via `isinstance`.

3. **Default fallback** — If no custom handler matches, `HTTPException` subclasses return `{"detail": "<detail>"}` with their status code. Any other unhandled exception returns `{"detail": "Internal Server Error"}` with status 500.

```python
# Status code 404 is checked before HTTPNotFound class
@app.exception(404)
async def handle_404(req, exc):
    return JSONResponse({"error": "Page not found"}, status=404)

@app.exception(HTTPNotFound)
async def handle_http_not_found(req, exc):
    # This handler is only reached if no 404 status code handler exists
    return JSONResponse({"error": "Not found"}, status=404)
```
