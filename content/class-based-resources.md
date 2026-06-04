# Class-Based Resources

Falcon-style resources for organized code:

```python
from fenrir import View

# Basic resource with HTTP methods
class ItemResource:
    async def on_get(self, req, resp, item_id: int):
        """Get item"""
        resp.status = 200
        resp.media = {
            "item_id": item_id,
            "name": f"Item {item_id}",
            "status": "active"
        }

    async def on_post(self, req, resp, item_id: int):
        """Create or update item"""
        data = req.json  # Parsed JSON body
        resp.status = 201
        resp.media = {
            "item_id": item_id,
            "data": data,
            "created": True
        }

    async def on_delete(self, req, resp, item_id: int):
        """Delete item"""
        resp.status = 204

# Register resource
app.add_route("/items/<item_id:int>", ItemResource())
```

### Class-Based Views

```python
from fenrir import MethodView, request

class ItemListView(MethodView):
    async def get(self):
        """List all items"""
        return [{"id": 1, "name": "Item 1"}]

    async def post(self):
        """Create new item"""
        data = request.json
        return {"id": 2, "name": data["name"], "created": True}

app.add_route("/items", ItemListView())
```
