# Middleware

### Request Middleware

```python
from fenrir import request

@app.before_request
async def log_request():
    print(f"{request.method} {request.path}")

@app.after_request
async def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response
```

### Middleware for Authentication

```python
from fenrir import HTTPUnauthorized

@app.before_request
async def check_auth():
    if request.path.startswith("/admin"):
        token = request.headers.get("Authorization")
        if not token or token != "Bearer valid-token":
            raise HTTPUnauthorized()
```

### Request/Response Modification

```python
from fenrir import g

@app.before_request
async def add_user_context():
    # Extract user from request
    auth_header = request.headers.get("Authorization")
    if auth_header:
        g.user_id = extract_user_id(auth_header)

@app.after_request
async def add_tracking_header(response):
    response.headers["X-Request-ID"] = str(g.get("request_id"))
    return response
```

### Teardown Request

```python
@app.teardown_request
async def cleanup():
    # Cleanup resources
    print("Cleaning up resources")
```
