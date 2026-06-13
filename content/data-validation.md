# Data Validation

Fenrir uses Pydantic v2 for automatic data validation and supports FastAPI-style parameter markers.

### Pydantic Models

```python
from pydantic import BaseModel, Field

class User(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    age: int = Field(..., ge=0, le=150)
    is_active: bool = True

# Use in routes
@app.post("/users")
async def create_user(user: User):
    # Automatic validation and parsing
    return {"created": True, "user": user}
```

### Query Parameter Validation

```python
from fenrir import Query

@app.get("/items")
async def list_items(
    skip: int = Query(default=0),
    limit: int = Query(default=10),
    search: str = Query(default=None)
):
    # Validate manually or use Pydantic models for complex validation
    skip = max(0, skip)
    limit = min(100, max(1, limit))
    return {"skip": skip, "limit": limit, "search": search}
```

### Path Parameter Validation

```python
from fenrir import Path

@app.get("/users/<user_id:int>")
async def get_user(user_id: int = Path(...)):
    return {"user_id": user_id}
```

### Header Parameters

```python
from fenrir import Header

@app.get("/check")
async def check_version(
    x_api_version: str = Header(default="v1"),
    authorization: str = Header(default=None),
):
    return {"version": x_api_version, "has_auth": authorization is not None}
```

### Cookie Parameters

```python
from fenrir import Cookie

@app.get("/preferences")
async def get_prefs(
    theme: str = Cookie(default="light"),
    language: str = Cookie(default="en"),
):
    return {"theme": theme, "language": language}
```

### Request Body (Explicit)

```python
from fenrir import Body

@app.post("/items")
async def create_item(
    name: str = Body(...),
    price: float = Body(...),
    description: str = Body(default=""),
):
    return {"name": name, "price": price, "description": description}
```

### Form Data

```python
from fenrir import Form, File, UploadFile

@app.post("/upload-form")
async def upload_form(
    title: str = Form(...),
    file: UploadFile = File(...),
):
    content = await file.read()
    return {"title": title, "filename": file.filename, "size": len(content)}
```

### Request Body with Multiple Parameters

```python
from pydantic import BaseModel

class Item(BaseModel):
    name: str
    description: str = None
    price: float
    tax: float = None

@app.post("/items")
async def create_item(
    item: Item,
    q: str = Query(default=None),
    user_id: int = Query(default=0)
):
    return {"item": item, "query": q, "user_id": user_id}
```

### Annotated Type Markers (Python 3.9+)

```python
from typing import Annotated
from fenrir import Query, Header, Cookie, Body, Path

@app.get("/users/<user_id:int>")
async def get_user(
    user_id: Annotated[int, Path(...)],
    x_api_key: Annotated[str, Header(default=None)],
    tab: Annotated[str, Query(default="profile")],
):
    return {"user_id": user_id, "tab": tab}

@app.post("/items")
async def create_item(
    name: Annotated[str, Body(...)],
    price: Annotated[float, Body(...)],
):
    return {"name": name, "price": price}
```

### Parameter Markers Summary

| Marker | Source | Example |
|--------|--------|---------|
| `Query(default=...)` | Query string | `?page=1` |
| `Header(default=...)` | HTTP header | `Authorization: Bearer ...` |
| `Cookie(default=...)` | Cookie | `theme=dark` |
| `Path(...)` | URL path | `/users/42` |
| `Body(...)` | Request body | `{"name": "item"}` |
| `Form(...)` | Form data | `multipart/form-data` |
| `File(...)` | File upload | `multipart/form-data` |
