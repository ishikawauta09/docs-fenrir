# Pagination

Fenrir provides built-in pagination utilities for list endpoints.

## Basic Pagination

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

## PaginationParams

Pydantic model for pagination query parameters, injectable via `Depends()`.

**Query parameters:**

| Parameter | Type | Default | Constraints | Description |
|-----------|------|---------|-------------|-------------|
| `page` | `int` | `1` | `ge=1` | Page number (1-based) |
| `size` | `int` | `20` | `ge=1, le=100` | Items per page |

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `offset` | `int` | Computed offset for database queries: `(page - 1) * size` |
| `limit` | `int` | Same as `size` |

```python
pagination = PaginationParams(page=3, size=10)
pagination.offset  # 20
pagination.limit   # 10
```

## PaginationLinks

Pydantic model for HATEOAS-style pagination links.

**Fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `self_url` | `str` | `""` | URL for the current page |
| `first_url` | `str` | `""` | URL for the first page |
| `last_url` | `str` | `""` | URL for the last page |
| `next_url` | `Optional[str]` | `None` | URL for the next page, or `None` if on the last page |
| `prev_url` | `Optional[str]` | `None` | URL for the previous page, or `None` if on the first page |

## PaginatedResponse

Standardised paginated response envelope returned by `paginate()`.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `items` | `List[Any]` | Paginated items for the current page |
| `total` | `int` | Total number of items across all pages |
| `page` | `int` | Current page number |
| `size` | `int` | Items per page |
| `pages` | `int` | Total number of pages |
| `has_next` | `bool` | Whether a next page exists |
| `has_prev` | `bool` | Whether a previous page exists |
| `links` | `Optional[PaginationLinks]` | Navigation links (only present when `base_url` is provided) |

## paginate()

Paginate a sequence of items and return a paginated response dict.

```python
from fenrir.pagination import paginate

result = paginate(items, page=2, size=20, base_url="/api/items")
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `items` | `Sequence[Any]` | — | Sequence of items to paginate |
| `page` | `int` | `1` | Page number (1-based) |
| `size` | `int` | `20` | Items per page |
| `base_url` | `str` | `""` | Base URL for generating pagination links. When provided, the response includes a `links` field with navigation URLs. Supports existing query parameters in the URL. |

**Response format (without base_url):**

```json
{
    "items": [...],
    "total": 100,
    "page": 2,
    "size": 20,
    "pages": 5,
    "has_next": true,
    "has_prev": true
}
```

**Response format (with base_url):**

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

**Link generation with existing query parameters:**

If `base_url` contains existing query parameters, they are preserved:

```python
paginate(items, page=2, size=20, base_url="/api/items?category=books&sort=name")
# links.self_url → "/api/items?category=books&sort=name&page=2&size=20"
```

## paginate_dict()

Same as `paginate` but typed specifically for dict items.

```python
from fenrir.pagination import paginate_dict

items = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]
result = paginate_dict(items, page=1, size=10, base_url="/api/users")
```

**Parameters:** Same as `paginate()`.

## Shortcut Usage

Use plain query parameters without `PaginationParams`:

```python
@app.get("/items2")
async def list_items2(page: int = 1, size: int = 20):
    return paginate(get_items(), page=page, size=size)
```
