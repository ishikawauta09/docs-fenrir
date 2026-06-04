# Data Validation

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
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(10, le=100, description="Maximum items"),
    search: str = Query(None, min_length=1)
):
    return {"skip": skip, "limit": limit, "search": search}
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
    q: str = Query(None),
    user_id: int = Query(...)
):
    return {"item": item, "query": q, "user_id": user_id}
```
