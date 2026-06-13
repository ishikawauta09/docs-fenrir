# WebSocket

The `WebSocket` class provides a full-duplex communication channel over a single TCP connection, conforming to the WebSocket protocol. It supports text, binary, and JSON messages, configurable timeouts, and state tracking.

## Exceptions

### WebSocketDisconnect

Raised when a client disconnects. Inherits from `Exception`.

| Attribute | Type   | Default | Description                 |
|-----------|--------|---------|-----------------------------|
| `code`    | `int`  | `1000`  | WebSocket close status code |
| `reason`  | `str`  | `""`    | Human-readable close reason |

### WebSocketTimeout

Raised when a receive operation exceeds the configured timeout. Inherits from `Exception`.

| Attribute | Type    | Description                              |
|-----------|---------|------------------------------------------|
| `timeout` | `float` | The timeout value in seconds that was exceeded |

## WebSocket Class

### Constructor

```python
WebSocket(scope, receive, send, timeout=None)
```

| Parameter | Type               | Default | Description                                              |
|-----------|--------------------|---------|----------------------------------------------------------|
| `scope`   | `Dict[str, Any]`  | —       | ASGI scope dictionary (populated by the framework)       |
| `receive` | `Any`              | —       | ASGI receive callable (populated by the framework)       |
| `send`    | `Any`              | —       | ASGI send callable (populated by the framework)          |
| `timeout` | `Optional[float]`  | `None`  | Per-connection timeout in seconds for receive operations |

When `timeout` is set, every call to `receive()`, `receive_text()`, `receive_bytes()`, and `receive_json()` will raise `WebSocketTimeout` if no message arrives within the specified duration.

### Attributes

#### `client_state`

Tracks the current state of the WebSocket connection.

| Value            | Description                                       |
|------------------|---------------------------------------------------|
| `"CONNECTING"`   | Initial state before `accept()` is called         |
| `"CONNECTED"`    | After a successful `accept()` call                |
| `"DISCONNECTED"` | After the client disconnects or `close()` is called |

```python
print(websocket.client_state)  # "CONNECTING"
await websocket.accept()
print(websocket.client_state)  # "CONNECTED"
```

### Methods

#### `accept(subprotocol=None, headers=None)`

Completes the WebSocket handshake and transitions the connection from `CONNECTING` to `CONNECTED`. Must be called before any other communication.

| Parameter     | Type               | Default | Description                                      |
|---------------|--------------------|---------|--------------------------------------------------|
| `subprotocol` | `str` or `None`   | `None`  | Subprotocol to negotiate with the client          |
| `headers`     | `list` or `None`   | `None`  | Additional headers to include in the accept frame |

Raises `RuntimeError` if the WebSocket is not in the `CONNECTING` state.

```python
await websocket.accept()

# With subprotocol
await websocket.accept(subprotocol="graphql-ws")

# With headers
await websocket.accept(headers=[["X-Custom", "value"]])
```

#### `receive() -> Dict[str, Any]`

Waits for and returns the next raw message as a dictionary. This is the base receive method that all typed receive methods delegate to. Respects the connection-level `timeout` if set.

```python
message = await websocket.receive()
# {"type": "websocket.receive", "text": "hello"}

message = await websocket.receive()
# {"type": "websocket.receive", "bytes": b"\x00\x01"}
```

Raises `WebSocketDisconnect` when the client disconnects. Raises `WebSocketTimeout` if a timeout is configured and no message arrives in time.

#### `receive_text() -> str`

Waits for and returns the next text message. Delegates to `receive()` internally.

```python
data = await websocket.receive_text()
```

Raises `ValueError` if the message does not contain a `text` field.

#### `receive_bytes() -> bytes`

Waits for and returns the next binary message. Delegates to `receive()` internally.

```python
data = await websocket.receive_bytes()
```

Raises `ValueError` if the message does not contain a `bytes` field.

#### `receive_json() -> Any`

Waits for and returns the next message parsed as JSON. Delegates to `receive_text()` internally.

```python
data = await websocket.receive_json()
```

#### `send_text(text: str)`

Sends a text message to the client.

```python
await websocket.send_text("Hello, world!")
```

Raises `RuntimeError` if the WebSocket is not in the `CONNECTED` state.

#### `send_bytes(data: bytes)`

Sends a binary message to the client.

```python
await websocket.send_bytes(b"\x00\x01\x02")
```

Raises `RuntimeError` if the WebSocket is not in the `CONNECTED` state.

#### `send_json(data: Any)`

Sends a JSON message to the client. Serializes `data` to JSON text and delegates to `send_text()`.

```python
await websocket.send_json({"status": "ok", "count": 42})
```

#### `close(code=1000, reason="")`

Closes the WebSocket connection with an optional status code and reason.

| Parameter | Type    | Default | Description                          |
|-----------|---------|---------|--------------------------------------|
| `code`    | `int`   | `1000`  | WebSocket close status code          |
| `reason`  | `str`   | `""`    | Human-readable close reason          |

If the connection is already disconnected, this is a no-op.

```python
await websocket.close()

# With custom code and reason
await websocket.close(code=1001, reason="Going away")
```

## Per-Route Timeout

Set a timeout on individual WebSocket routes by passing the `timeout` parameter to the route decorator. This applies a per-connection timeout to all receive operations on that route.

```python
@app.websocket("/ws/echo", timeout=30.0)
async def websocket_echo(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketTimeout:
        print("Client timed out")
        await websocket.close(code=1000, reason="Timeout")
    except WebSocketDisconnect:
        print("Client disconnected")
```

| Parameter | Type    | Description                                              |
|-----------|---------|----------------------------------------------------------|
| `timeout` | `float` | Seconds to wait for a message before raising `WebSocketTimeout` |

## Examples

### Basic WebSocket Echo Server

```python
from fenrir import WebSocket, WebSocketDisconnect

@app.websocket("/ws/echo")
async def websocket_echo(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        print("Client disconnected")
```

### WebSocket with Timeout

```python
from fenrir import WebSocket, WebSocketDisconnect, WebSocketTimeout

@app.websocket("/ws/echo", timeout=30.0)
async def websocket_echo(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketTimeout:
        print("Client timed out")
        await websocket.close(code=1000, reason="Timeout")
    except WebSocketDisconnect:
        print("Client disconnected")
```

### WebSocket Chat Application

```python
from typing import Set

active_connections: Set[WebSocket] = set()

@app.websocket("/ws/chat/<room_id>")
async def websocket_chat(websocket: WebSocket, room_id: str):
    await websocket.accept()
    active_connections.add(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            for connection in active_connections:
                try:
                    await connection.send_text(f"[Room {room_id}] {data}")
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
            data = await websocket.receive_json()
            result = {"received": data, "processed": True}
            await websocket.send_json(result)
    except WebSocketDisconnect:
        print("WebSocket disconnected")
```

### WebSocket with Subprotocol Negotiation

```python
@app.websocket("/ws/graphql")
async def websocket_graphql(websocket: WebSocket):
    await websocket.accept(subprotocol="graphql-ws")

    try:
        while True:
            data = await websocket.receive_json()
            # Handle GraphQL subscription messages
            await websocket.send_json({"type": "next", "id": "1", "payload": {}})
    except WebSocketDisconnect:
        print("Client disconnected")
```

### WebSocket with Custom Close Codes

```python
@app.websocket("/ws/secure")
async def websocket_secure(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if data == "shutdown":
                await websocket.close(code=1001, reason="Server shutting down")
                return
            await websocket.send_text(f"Received: {data}")
    except WebSocketDisconnect as e:
        print(f"Client disconnected with code {e.code}: {e.reason}")
```

### Tracking Connection State

```python
@app.websocket("/ws/status")
async def websocket_status(websocket: WebSocket):
    print(f"State: {websocket.client_state}")  # "CONNECTING"
    await websocket.accept()
    print(f"State: {websocket.client_state}")  # "CONNECTED"

    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"State: {websocket.client_state}")
    except WebSocketDisconnect:
        print(f"State: {websocket.client_state}")  # "DISCONNECTED"
```

### Raw Message Receiving

```python
@app.websocket("/ws/raw")
async def websocket_raw(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            message = await websocket.receive()
            msg_type = message["type"]

            if "text" in message:
                await websocket.send_text(f"Got text: {message['text']}")
            elif "bytes" in message:
                await websocket.send_bytes(message["bytes"])
    except WebSocketDisconnect:
        print("Client disconnected")
```
