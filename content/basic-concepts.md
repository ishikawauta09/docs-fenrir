# Basic Concepts

### Fenrir Application

```python
from fenrir import Fenrir

app = Fenrir(
    title="My Application",
    version="1.0.0",
    description="An amazing application",
    docs_url="/docs",           # Swagger UI endpoint
    redoc_url="/redoc",         # ReDoc endpoint
    openapi_url="/openapi.json" # OpenAPI schema endpoint
)
```

### HTTP Methods

Fenrir supports all standard HTTP methods:

```python
@app.get("/path")
async def get_handler():
    pass

@app.post("/path")
async def post_handler():
    pass

@app.put("/path")
async def put_handler():
    pass

@app.delete("/path")
async def delete_handler():
    pass

@app.patch("/path")
async def patch_handler():
    pass

@app.options("/path")
async def options_handler():
    pass
```
