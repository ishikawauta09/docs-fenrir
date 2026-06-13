# Routing

Fenrir uses a **trie-based routing engine** that provides O(k) route matching, where k is the path depth. This is significantly faster than linear O(n) matching when you have many routes.

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

# With defaults
@app.get("/items")
async def list_items(
    skip: int = Query(default=0),
    limit: int = Query(default=10)
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

### Route Metadata (OpenAPI)

```python
@app.get(
    "/items/<item_id:int>",
    name="get_item",
    tags=["items"],
    summary="Get an item",
    description="Retrieve a single item by its ID.",
    response_model=ItemResponse,
    deprecated=False,
    responses={404: {"description": "Item not found"}},
    status_code=200,
)
async def get_item(item_id: int):
    return {"id": item_id}
```

### Route Metadata Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `str` | Handler `__name__` | Route name for URL building and OpenAPI `operationId` |
| `tags` | `List[str]` | `[]` | OpenAPI tags for grouping |
| `summary` | `str` | `None` | Short summary for OpenAPI (falls back to handler name) |
| `description` | `str` | `None` | Detailed description for OpenAPI |
| `status_code` | `int` | `200` | Default success status code for OpenAPI |
| `deprecated` | `bool` | `False` | Mark route as deprecated in OpenAPI |
| `responses` | `Dict[Any, Any]` | `{}` | Additional OpenAPI response definitions (e.g. `{404: {"description": "Not found"}}`) |
| `response_model` | `Any` | `None` | Pydantic model for the success response schema |
| `response_models` | `Dict[int, Any]` | `{}` | Per-status response models (e.g. `{200: ItemResponse, 404: NotFound}`) |
| `response_model_include` | `Any` | `None` | Fields to include when serializing the response model |
| `response_model_exclude` | `Any` | `None` | Fields to exclude when serializing the response model |
| `response_model_exclude_unset` | `bool` | `False` | Exclude fields not explicitly set in the response |
| `response_model_exclude_defaults` | `bool` | `False` | Exclude fields that match their default values |
| `ws_timeout` | `float` | `None` | WebSocket per-route timeout in seconds |

### APIRouter

Organize routes into reusable routers:

```python
from fenrir import Fenrir, APIRouter

app = Fenrir()
api_router = APIRouter()

@api_router.get("/users")
async def list_users():
    return [{"id": 1}]

@api_router.post("/users")
async def create_user():
    return {"id": 2}

# Register all routes from the router
app.include_router(api_router, prefix="/api/v1")
```

### Circular Router Inclusion Detection

Fenrir detects circular router inclusions and raises a `RuntimeError`:

```python
router_a = APIRouter()
router_b = APIRouter()

router_a.include_router(router_b)
router_b.include_router(router_a)  # Raises RuntimeError: Circular router inclusion detected
```

### Router Class Reference

```python
class Router:
    def __init__(self, route_class: Optional[Type[Route]] = None):
        """Initialize the router.

        Args:
            route_class: Custom Route subclass to use for creating routes.
        """
        self.routes: List[Route] = []
        self.websocket_routes: List[Route] = []
        self.route_class = route_class or Route
        self.included_routers = []
        self._trie = RouteTrie()

    def include_router(self, other: "Router", prefix: str = ""):
        """Include another router's routes, optionally with a path prefix.

        Detects circular inclusions and raises RuntimeError.
        """

    def add_route(
        self,
        path_pattern: str,
        handler: Any,
        methods: List[str] = None,
        **route_kwargs,
    ):
        """Register a route with optional methods and metadata kwargs.

        Automatically adds HEAD for GET routes (RFC 7231).
        Automatically adds OPTIONS unless handler.provide_automatic_options is False.
        """

    def add_websocket_route(
        self,
        path_pattern: str,
        handler: Any,
        ws_timeout: float = None,
    ):
        """Register a WebSocket route."""

    def match(
        self,
        path: str,
        method: str,
    ) -> Tuple[Route, Dict[str, Any], Callable]:
        """Match a request path and method to a route.

        Returns (route, params, handler_or_method).
        Raises HTTPNotFound or HTTPMethodNotAllowed.
        """

    def match_websocket(self, path: str) -> Tuple[Route, Dict[str, Any], Callable]:
        """Match a WebSocket path to a route."""
```

### APIRouter Class Reference

`APIRouter` extends `Router` with decorator helpers:

```python
class APIRouter(Router):
    def route(self, path: str, methods: List[str] = None, **kwargs):
        """Decorator to register a route with multiple methods."""

    def get(self, path: str, **kwargs):
        """Decorator for GET routes."""

    def post(self, path: str, **kwargs):
        """Decorator for POST routes."""

    def put(self, path: str, **kwargs):
        """Decorator for PUT routes."""

    def delete(self, path: str, **kwargs):
        """Decorator for DELETE routes."""

    def patch(self, path: str, **kwargs):
        """Decorator for PATCH routes."""

    def websocket(self, path: str):
        """Decorator for WebSocket routes."""
```

### Route Class Reference

```python
class Route:
    def __init__(
        self,
        path_pattern: str,
        handler: Any,
        methods: List[str] = None,
        *,
        response_model: Any = None,
        response_model_include: Any = None,
        response_model_exclude: Any = None,
        response_model_exclude_unset: bool = False,
        response_model_exclude_defaults: bool = False,
        status_code: int = 200,
        tags: List[str] = None,
        summary: str = None,
        description: str = None,
        deprecated: bool = False,
        responses: Dict[Any, Any] = None,
        name: str = None,
        response_models: Dict[int, Any] = None,
        ws_timeout: float = None,
    ):
        """Create a route.

        The path pattern is compiled to a regex for matching.
        Methods are uppercased automatically.
        """

    def match(self, path: str) -> Optional[Dict[str, Any]]:
        """Match the path against this route's regex.

        Returns extracted parameters dict or None if no match.
        Performs type conversion (int, float, etc.) — returns None on failure.
        """

    def is_falcon_resource(self) -> bool:
        """Check if the handler is a Falcon-style resource class (has on_* methods)."""

    def get_resource_method(self, method: str) -> Optional[Callable]:
        """Get the on_* method for a Falcon resource class."""
```

### RouteTrie (Internal)

The `RouteTrie` is used internally by the `Router` for O(k) route lookup. You don't interact with it directly.

```
/api/v1/users/42
  → api → v1 → users → 42 (parametric)
```

**How it works:**

- Static path segments are stored as exact-match children in the trie.
- Dynamic segments (`<param>`) are stored as a single parametric child per trie node.
- At most one regex-based converter (`<re:pattern:name>`) is allowed per level.
- The trie acts as a **pre-filter**: it yields candidate routes, which are then validated through their compiled regex to extract parameters and handle converter-specific semantics.

```python
from fenrir import RouteTrie

trie = RouteTrie()

# Insert and search are O(k) where k = path depth
trie.insert(route)
candidates = trie.search("/api/v1/users/42")
```

### RFC 7231 HEAD Method Compliance

Any route that supports `GET` automatically supports `HEAD` as well, per RFC 7231. The `HEAD` response body is stripped automatically by the framework.

```python
@app.get("/data")
async def get_data():
    return {"data": "payload"}

# HEAD /data is automatically supported
# Returns same headers/status as GET, but with empty body
```

### Automatic OPTIONS Method Support

All routes automatically respond to `OPTIONS` requests unless the handler explicitly opts out:

```python
@app.get("/resource")
async def resource():
    return {"data": "value"}

# OPTIONS /resource returns 200 with Allow header automatically

# To disable automatic OPTIONS:
@app.get("/no-options")
def no_options():
    no_options.provide_automatic_options = False
    return {"data": "value"}
```

### URL Building

```python
from fenrir import url_for

# Build URL from named route
url = url_for("get_user", user_id=123)
# → "/users/123"

# With blueprint prefix
url = url_for("api.get_user", user_id=456)
# → "/api/users/456"

# Extra query parameters
url = url_for("get_user", user_id=123, tab="profile")
# → "/users/123?tab=profile"
```
