# Error Handling & Exceptions

Fenrir provides the `@app.exception()` decorator to catch specific exceptions or HTTP status codes globally. This is useful for creating custom error pages and handling various error scenarios.

### Basic HTTP Exceptions

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

### Specific HTTP Exception Classes

```python
from fenrir import (
    HTTPBadRequest,
    HTTPUnauthorized,
    HTTPForbidden,
    HTTPNotFound,
    HTTPConflict,
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
