# WebSocket

### Basic WebSocket Echo Server

```python
from fenrir import WebSocket, WebSocketDisconnect

@app.websocket("/ws/echo")
async def websocket_echo(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive text
            data = await websocket.receive_text()
            # Send response
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        print("Client disconnected")
```

### WebSocket Chat Application

```python
from typing import Set

# Store active connections
active_connections: Set[WebSocket] = set()

@app.websocket("/ws/chat/<room_id>")
async def websocket_chat(websocket: WebSocket, room_id: str):
    await websocket.accept()
    active_connections.add(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast to all connections
            for connection in active_connections:
                try:
                    await connection.send_text(
                        f"[Room {room_id}] {data}"
                    )
                except:
                    pass
    except WebSocketDisconnect:
        active_connections.remove(websocket)
```

### WebSocket with JSON Messages

```python
@app.websocket("/ws/json")
async def websocket_json(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            # Receive JSON
            data = await websocket.receive_json()
            
            # Process and respond
            result = {"received": data, "processed": True}
            
            # Send JSON response
            await websocket.send_json(result)
    except WebSocketDisconnect:
        print("WebSocket disconnected")
```
