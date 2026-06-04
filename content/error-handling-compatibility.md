# Multi-Style Error Handling Compatibility

Fenrir supports multiple paradigms (FastAPI, Flask, Falcon, Sanic) so error handling also works with various styles. Here's a complete guide:

### FastAPI Style (Pydantic Validation)

When using Pydantic models, automatic validation is performed and returns status 422 (Unprocessable Entity):

```python
from pydantic import BaseModel, Field
from fenrir import Fenrir, JSONResponse

app = Fenrir()

class User(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    age: int = Field(..., ge=0, le=150)

# Handler to catch Pydantic validation errors
@app.exception(422)
async def validation_error_handler(req, exc):
    """Handle validation errors from Pydantic"""
    return JSONResponse(
        {
            "error": "Validation failed",
            "detail": "Please check your input again",
            "errors": exc.detail if hasattr(exc, 'detail') else []
        },
        status=422
    )

@app.post("/users")
async def create_user(user: User):
    # If validation fails, 422 error will be caught by handler above
    return {"created": True, "user": user}
```

Example error response:

```json
{
  "error": "Validation failed",
  "detail": "Please check your input again",
  "errors": [
    {
      "loc": ["body", "username"],
      "msg": "ensure this value has at least 3 characters",
      "type": "value_error.string.too_short"
    }
  ]
}
```

### Falcon Style (Class-Based Resources)

In Falcon-style class-based resources, you can throw HTTP exceptions directly, which will be automatically caught:

```python
from fenrir import HTTPNotFound, HTTPForbidden

class ItemResource:
    async def on_get(self, req, resp, item_id: int):
        """Get item - throws HTTPNotFound if not found"""
        if item_id > 1000:
            raise HTTPNotFound(detail=f"Item with ID {item_id} not found")
        
        resp.media = {
            "item_id": item_id,
            "name": f"Item {item_id}",
            "status": "active"
        }

    async def on_delete(self, req, resp, item_id: int):
        """Delete item - requires auth"""
        if not req.headers.get("Authorization"):
            raise HTTPForbidden(detail="You don't have access to delete")
        
        resp.status = 204

# Register resource
app.add_route("/items/<item_id:int>", ItemResource())

# Exception handlers will automatically catch HTTP exceptions from class-based resources
@app.exception(404)
async def handle_not_found(req, exc):
    return render_template("404.html", detail=exc.detail), 404

@app.exception(403)
async def handle_forbidden(req, exc):
    return render_template("403.html", detail=exc.detail), 403
```

### Flask Style (Middleware + Exception Handling)

Combine Flask-style middleware with Fenrir exception handling:

```python
from fenrir import request, g, HTTPUnauthorized, render_template

@app.before_request
async def authenticate():
    """Flask-style middleware for authentication"""
    if request.path.startswith("/admin"):
        token = request.headers.get("Authorization")
        if not token:
            raise HTTPUnauthorized(detail="Token required")
        
        # Store user info in g
        g.user = validate_token(token)

@app.exception(401)
async def handle_unauthorized(req, exc):
    """Handle unauthorized error with custom page"""
    return render_template(
        "unauthorized.html",
        detail=exc.detail
    ), 401

@app.get("/admin/dashboard")
async def admin_dashboard():
    # g.user automatically available from middleware
    return render_template("admin/dashboard.html", user=g.user)
```

### Sanic Style (Lifecycle + Error Handling)

Use Sanic-style listeners with Fenrir exception handling:

```python
@app.listener("before_server_start")
async def setup_error_handlers(app_instance):
    """Setup error handlers when server starts"""
    print("Exception handlers registered")

@app.exception(500)
async def handle_server_error(req, exc):
    """Handle server errors with logging"""
    import logging
    logger = logging.getLogger("fenrir")
    logger.error(f"Server error: {exc}")
    
    return render_template(
        "500.html",
        detail="An error occurred on the server"
    ), 500

@app.listener("after_server_stop")
async def cleanup(app_instance):
    """Cleanup when server stops"""
    print("Server error handlers cleaned up")
```

### Combining All Paradigms

```python
from fenrir import (
    Fenrir, render_template, HTTPException,
    request, g, JSONResponse, HTTPUnauthorized,
    HTTPNotFound, HTTPForbidden
)
from pydantic import BaseModel

app = Fenrir()

# 1. Pydantic Model (FastAPI-style)
class Product(BaseModel):
    name: str
    price: float

# 2. Flask-style middleware for logging
@app.before_request
async def log_requests():
    g.request_time = __import__('time').time()

# 3. Falcon-style class-based resource
class ProductResource:
    async def on_get(self, req, resp, product_id: int):
        if product_id < 0:
            raise HTTPNotFound(detail="Product is invalid")
        resp.media = {"id": product_id, "name": "Product"}

    async def on_post(self, req, resp, product_id: int):
        if not req.headers.get("Authorization"):
            raise HTTPForbidden(detail="Access denied")
        resp.status = 201

# 4. Exception handlers for various errors
@app.exception(404)
async def not_found_handler(req, exc):
    return render_template("404.html", detail=exc.detail), 404

@app.exception(422)
async def validation_handler(req, exc):
    return JSONResponse({"error": "Validation failed"}, status=422)

@app.exception(403)
async def forbidden_handler(req, exc):
    return render_template("403.html", detail=exc.detail), 403

# 5. Sanic-style listener
@app.listener("before_server_start")
async def startup(app_instance):
    print("App started with full error handling")

# Register routes
app.add_route("/products/<product_id:int>", ProductResource())
```
