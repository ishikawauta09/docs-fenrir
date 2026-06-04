# Request & Response

### Accessing Request

```python
from fenrir import request

@app.get("/info")
async def get_info():
    # Query parameters
    param = request.args.get("param")
    all_params = request.args
    
    # HTTP Headers
    user_agent = request.headers.get("User-Agent")
    all_headers = request.headers
    
    # Cookies
    session = request.cookies.get("session_id")
    
    # Request properties
    method = request.method
    path = request.path
    scheme = request.scheme
    hostname = request.hostname
    url = request.url
    
    return {"info": "retrieved"}
```

### Response Objects

```python
from fenrir import (
    Response, JSONResponse, HTMLResponse, TextResponse,
    RedirectResponse, FileResponse, StreamingResponse
)

# Automatic JSON response
@app.get("/data")
async def json_endpoint():
    return {"key": "value"}  # Automatically JSON-encoded

# Explicit JSON response
@app.get("/json")
async def explicit_json():
    return JSONResponse({"key": "value"}, status=200)

# HTML response
@app.get("/html")
async def html_response():
    return HTMLResponse("<h1>Hello</h1>")

# Plain text response
@app.get("/text")
async def text_response():
    return TextResponse("Plain text content")

# Redirect
@app.get("/old-path")
async def redirect_old():
    return RedirectResponse(url="/new-path", status=301)

# File download
@app.get("/file")
async def download_file():
    return FileResponse("path/to/file.pdf", filename="document.pdf")

# Streaming response
@app.get("/stream")
async def stream():
    async def generate():
        for i in range(100):
            yield f"data: {i}\n"
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### Custom Response with Headers

```python
@app.get("/custom")
async def custom_response():
    return Response(
        body="Hello World",
        status=200,
        headers={"X-Custom-Header": "value"},
        content_type="text/plain"
    )
```
