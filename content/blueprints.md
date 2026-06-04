# Blueprints

### Creating Blueprints

```python
from fenrir import Blueprint

api_bp = Blueprint("api", url_prefix="/api")

@api_bp.get("/items")
async def list_items():
    return [{"id": 1, "name": "Item 1"}]

@api_bp.get("/items/<item_id:int>")
async def get_item(item_id: int):
    return {"id": item_id, "name": f"Item {item_id}"}

@api_bp.post("/items")
async def create_item():
    return {"id": 2, "name": "New Item"}
```

### Register Blueprints

```python
from fenrir import Fenrir

app = Fenrir()
app.register_blueprint(api_bp)
```

### Blueprint with Middleware

```python
api_bp = Blueprint("api", url_prefix="/api")

@api_bp.before_request
async def check_api_key():
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        raise HTTPUnauthorized()

@api_bp.get("/data")
async def get_data():
    return {"data": "protected"}

app.register_blueprint(api_bp)
```

### Multiple Blueprints

```python
# users_bp.py
from fenrir import Blueprint

users_bp = Blueprint("users", url_prefix="/users")

@users_bp.get("")
async def list_users():
    return [{"id": 1, "name": "User 1"}]

# products_bp.py
products_bp = Blueprint("products", url_prefix="/products")

@products_bp.get("")
async def list_products():
    return [{"id": 1, "name": "Product 1"}]

# app.py
app = Fenrir()
app.register_blueprint(users_bp)
app.register_blueprint(products_bp)
```
