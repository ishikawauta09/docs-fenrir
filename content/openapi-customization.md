# OpenAPI & Docs Customization

Fenrir auto-generates OpenAPI 3.0.3 schemas from your route definitions and Pydantic models, powering the built-in Swagger UI and ReDoc endpoints.

### Default Setup

```python
from fenrir import Fenrir

app = Fenrir(
    title="My API",
    version="1.0.0",
    docs_url="/docs",        # Swagger UI (default)
    redoc_url="/redoc",      # ReDoc (default)
    openapi_url="/openapi.json"  # OpenAPI schema (default)
)
```

- **Swagger UI**: `GET /docs`
- **ReDoc**: `GET /redoc`
- **OpenAPI JSON**: `GET /openapi.json`

### Disabling Docs

```python
app = Fenrir(
    docs_url=None,       # Disable Swagger UI
    redoc_url=None,      # Disable ReDoc
    openapi_url=None     # Disable schema endpoint
)
```

### Customizing the Schema

Access and modify the OpenAPI schema programmatically:

```python
@app.get("/items", tags=["items"], summary="List all items")
async def list_items():
    return [{"id": 1}]
```

### Route Metadata

Add OpenAPI metadata to routes via decorator kwargs:

```python
@app.get(
    "/users/<user_id:int>",
    tags=["users"],
    summary="Get a user by ID",
    description="Retrieve detailed information about a specific user.",
    response_model=UserResponse,
    responses={
        404: {"description": "User not found"}
    }
)
async def get_user(user_id: int):
    return {"id": user_id, "name": "John"}
```

### Route Tags

Organize endpoints in Swagger UI using tags:

```python
@app.get("/items", tags=["items"])
async def list_items(): ...

@app.post("/items", tags=["items"])
async def create_item(): ...

@app.get("/users", tags=["users"])
async def list_users(): ...
```

### Deprecated Routes

Mark routes as deprecated:

```python
@app.get("/old-endpoint", deprecated=True, summary="Deprecated endpoint")
async def old_endpoint():
    return {"message": "Use /new-endpoint instead"}
```

### Response Models

Use Pydantic models for automatic response validation and documentation:

```python
from pydantic import BaseModel

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

@app.get("/users/<user_id:int>", response_model=UserResponse)
async def get_user(user_id: int):
    return {"id": user_id, "name": "John", "email": "john@example.com"}
```

### Multiple Response Models per Status

Apply different models based on HTTP status code:

```python
class ErrorResponse(BaseModel):
    detail: str

@app.get(
    "/items/<item_id:int>",
    response_models={
        200: ItemResponse,
        404: ErrorResponse
    }
)
async def get_item(item_id: int):
    if item_id < 0:
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    return {"id": item_id, "name": "Item"}
```

### Response Model Filtering

Control which fields are included in the response:

```python
@app.get(
    "/users/<user_id:int>",
    response_model=User,
    response_model_exclude={"password", "secret_token"}
)
async def get_user(user_id: int):
    return User(id=user_id, name="John", password="hidden")
```

### Generating the Schema Programmatically

```python
from fenrir.openapi import get_openapi

schema = get_openapi(
    title="My API",
    version="1.0.0",
    routes=app.router.routes
)
```
