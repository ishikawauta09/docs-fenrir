# Pagination

Fenrir provides built-in pagination utilities for list endpoints.

### Basic Pagination

```python
from fenrir import Fenrir, Depends
from fenrir.pagination import PaginationParams, paginate

app = Fenrir()

def get_items():
    return [{"id": i, "name": f"Item {i}"} for i in range(100)]

@app.get("/items")
async def list_items(pagination: PaginationParams = Depends()):
    items = get_items()
    return paginate(items, page=pagination.page, size=pagination.size)
```

### PaginationParams

Pydantic model for query parameters, injectable via `Depends()`.

**Query parameters:**
- `page`: Page number, 1-based (default: `1`, minimum: `1`)
- `size`: Items per page (default: `20`, minimum: `1`, maximum: `100`)

**Properties:**
- `offset`: Computed offset for database queries
- `limit`: Same as `size`

### paginate()

Paginate a sequence of items and return a standardized response.

```python
from fenrir.pagination import paginate

result = paginate(items, page=2, size=20, base_url="/api/items")
```

**Parameters:**
- `items`: Sequence of items to paginate
- `page`: Page number (default: `1`)
- `size`: Items per page (default: `20`)
- `base_url`: Base URL for pagination links (optional)

**Response format:**
```json
{
    "items": [...],
    "total": 100,
    "page": 2,
    "size": 20,
    "pages": 5,
    "has_next": true,
    "has_prev": true,
    "links": {
        "self_url": "/api/items?page=2&size=20",
        "first_url": "/api/items?page=1&size=20",
        "last_url": "/api/items?page=5&size=20",
        "next_url": "/api/items?page=3&size=20",
        "prev_url": "/api/items?page=1&size=20"
    }
}
```

### paginate_dict()

Same as `paginate` but typed specifically for dict items.

```python
from fenrir.pagination import paginate_dict

items = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]
result = paginate_dict(items, page=1, size=10)
```

### Shortcut Usage

Use plain query parameters without `PaginationParams`:

```python
@app.get("/items2")
async def list_items2(page: int = 1, size: int = 20):
    return paginate(get_items(), page=page, size=size)
```
