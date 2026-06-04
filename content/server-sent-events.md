# Server-Sent Events (SSE)

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
            yield f"event: update\ndata: {{'count': {i}}}\n\n"
            await asyncio.sleep(2)
    
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
async def notify(message: str = Query(...)):
    for queue in subscribers:
        await queue.put(message)
    return {"notified": len(subscribers)}
```
