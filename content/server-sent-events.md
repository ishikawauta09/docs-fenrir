# Server-Sent Events (SSE)

Fenrir provides `EventSourceResponse` for streaming real-time events to clients using the Server-Sent Events (SSE) protocol.

## EventSourceResponse

### Constructor

```python
EventSourceResponse(
    generator,           # Sync or async iterable that yields events
    status: int = 200,   # HTTP status code
    headers: dict = None # Optional custom headers
)
```

### Default Headers

`EventSourceResponse` automatically sets these headers:

| Header | Value |
|--------|-------|
| Content-Type | `text/event-stream` |
| Cache-Control | `no-cache` |
| Connection | `keep-alive` |
| X-Accel-Buffering | `no` |

The `X-Accel-Buffering: no` header disables nginx buffering, ensuring events are streamed immediately to clients.

### Event Format

Events can be yielded as strings or dictionaries.

**String format** - treated as raw `data`:

```python
yield "Hello, World!"
# Sends: data: Hello, World!\n\n
```

**Dict format** - supports these fields:

| Field | Description |
|-------|-------------|
| `data` | Event payload (required) |
| `event` | Event type name |
| `id` | Event ID for reconnection |
| `retry` | Reconnection interval in ms |

```python
yield {
    "id": "123",
    "event": "update",
    "data": "payload content",
    "retry": 5000
}
# Sends:
# id: 123
# event: update
# data: payload content
# retry: 5000
# \n
```

Multi-line data is supported - each line is prefixed with `data:`:

```python
yield {"data": "line1\nline2\nline3"}
# Sends:
# data: line1
# data: line2
# data: line3
# \n
```

### ASGI Support

`EventSourceResponse` is an ASGI callable. It can be used directly as an ASGI application:

```python
app = EventSourceResponse(generator())
```

### Sync and Async Generators

Both sync and async generators are supported:

```python
# Async generator
async def async_gen():
    for i in range(10):
        yield f"data: {i}\n\n"
        await asyncio.sleep(1)

return EventSourceResponse(async_gen())

# Sync generator
def sync_gen():
    for i in range(10):
        yield f"data: {i}\n\n"
        time.sleep(1)

return EventSourceResponse(sync_gen())
```

## Examples

### Basic SSE Endpoint

```python
from fenrir import EventSourceResponse
import asyncio

@app.get("/events")
async def get_events():
    async def event_generator():
        for i in range(10):
            yield f"data: Message {i}\n\n"
            await asyncio.sleep(1)

    return EventSourceResponse(event_generator())
```

### SSE with Named Events

```python
@app.get("/stream")
async def stream_events():
    async def event_generator():
        for i in range(5):
            yield {
                "event": "update",
                "data": f"{{'count': {i}}}"
            }
            await asyncio.sleep(2)

    return EventSourceResponse(event_generator())
```

### Using Dict Events with IDs

```python
@app.get("/typed-events")
async def typed_events():
    async def event_generator():
        for i in range(5):
            yield {
                "id": str(i),
                "event": "progress",
                "data": f"Step {i} of 5",
                "retry": 3000
            }
            await asyncio.sleep(1)

    return EventSourceResponse(event_generator())
```

### Real-time Notifications

```python
import asyncio
from typing import Set

subscribers: Set = set()

@app.get("/subscribe")
async def subscribe():
    async def event_generator():
        queue = asyncio.Queue()
        subscribers.add(queue)

        try:
            while True:
                message = await queue.get()
                yield f"data: {message}\n\n"
        finally:
            subscribers.remove(queue)

    return EventSourceResponse(event_generator())

@app.post("/notify")
async def notify(message: str = Query(default="")):
    for queue in subscribers:
        await queue.put(message)
    return {"notified": len(subscribers)}
```

### Custom Status and Headers

```python
@app.get("/custom")
async def custom_sse():
    async def event_generator():
        yield "data: custom stream\n\n"

    return EventSourceResponse(
        event_generator(),
        status=200,
        headers={"X-Custom-Header": "value"}
    )
```
