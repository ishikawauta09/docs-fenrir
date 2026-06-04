# Routing

### Basic Routing

```python
# Simple route
@app.get("/hello")
async def hello():
    return {"message": "Hello, World!"}

# Multiple methods
@app.route("/resource", methods=["GET", "POST"])
async def resource():
    return {"message": "Resource"}
```

### Path Parameters

```python
# String parameter (default)
@app.get("/users/<username>")
async def get_user(username: str):
    return {"username": username}

# Integer parameter
@app.get("/posts/<post_id:int>")
async def get_post(post_id: int):
    return {"post_id": post_id}

# Float parameter
@app.get("/prices/<price:float>")
async def get_price(price: float):
    return {"price": price}

# Path parameter (matches anything including slashes)
@app.get("/files/<file_path:path>")
async def get_file(file_path: str):
    return {"file_path": file_path}

# Regex parameter
@app.get("/items/<re:([a-z]+):item_name>")
async def get_item(item_name: str):
    return {"item_name": item_name}
```

### Query Parameters

```python
from fenrir import Query

@app.get("/search")
async def search(q: str = Query(default=None)):
    return {"query": q}

# With validation
@app.get("/items")
async def list_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, le=100)
):
    return {"skip": skip, "limit": limit}
```

### Named Routes

```python
@app.get("/users/<user_id:int>", name="get_user")
async def get_user(user_id: int):
    return {"user_id": user_id}

# In templates or helpers
from fenrir import url_for
user_url = url_for("get_user", user_id=123)
```
