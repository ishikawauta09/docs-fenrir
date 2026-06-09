# Advanced Features

### WSGI Application Mounting

Mount legacy WSGI applications:

```python
from fenrir import Fenrir, WsgiToAsgi

app = Fenrir()

# Legacy WSGI app
def wsgi_app(environ, start_response):
    status = '200 OK'
    headers = [('Content-Type', 'text/plain')]
    start_response(status, headers)
    return [b'Hello from WSGI']

# Mount WSGI app
wsgi_asgi = WsgiToAsgi(wsgi_app)
app.mount_wsgi("/legacy", wsgi_asgi)
```

### Framework Compatibility Modes

#### Bottle Compatibility

```python
from fenrir import install_bottle_compat

install_bottle_compat()

# Now use Bottle-style features
from fenrir.bottle import Bottle
bottle_app = Bottle()
```

#### Falcon Compatibility

```python
from fenrir import install_falcon_compat

install_falcon_compat()

# Now use Falcon-style features
import fenrir.falcon as falcon
```

#### Sanic Compatibility

```python
from fenrir import install_sanic_compat

install_sanic_compat()

# Now use Sanic-style features
import fenrir.sanic as sanic
```

### Response Models

```python
from pydantic import BaseModel

class Item(BaseModel):
    id: int
    name: str
    price: float

@app.get("/items/<item_id:int>", response_model=Item)
async def get_item(item_id: int):
    return {"id": item_id, "name": "Item", "price": 9.99}
```

### Multiple Response Models per Status

Apply different response models based on the actual response status code:

```python
from pydantic import BaseModel

class SuccessResponse(BaseModel):
    id: int
    name: str

class ErrorResponse(BaseModel):
    detail: str
    code: int

@app.get(
    "/items/<item_id:int>",
    response_models={
        200: SuccessResponse,
        404: ErrorResponse
    }
)
async def get_item(item_id: int):
    if item_id < 0:
        return JSONResponse(
            status_code=404,
            content={"detail": "Item not found", "code": 404}
        )
    return {"id": item_id, "name": "Item"}
```

### Event Listeners

```python
@app.listener("before_server_start")
async def startup(app_instance):
    print("Server starting")

@app.listener("after_server_stop")
async def shutdown(app_instance):
    print("Server stopping")
```

### Custom Response Models with Include/Exclude

```python
class User(BaseModel):
    id: int
    name: str
    email: str
    password: str

@app.get(
    "/users/<user_id:int>",
    response_model=User,
    response_model_exclude={"password"}
)
async def get_user(user_id: int):
    return User(
        id=user_id,
        name="John",
        email="john@example.com",
        password="secret"
    )
```
