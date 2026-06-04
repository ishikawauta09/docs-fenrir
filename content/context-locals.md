# Context Locals

### Request Context

```python
from fenrir import request, g

@app.get("/context-example")
async def context_example():
    # Access request context
    path = request.path
    method = request.method
    query_params = request.args
    headers = request.headers
    
    # Store data in g (Flask-style)
    g.user_id = 123
    g.session_data = {"key": "value"}
    
    return {"context": "available"}
```

### Using g for Data Storage

```python
@app.before_request
async def before_request():
    # Extract user from token
    g.user = {"id": 1, "name": "John"}

@app.get("/user-profile")
async def user_profile():
    # g.user automatically available
    return g.user
```

### Session Context

```python
from fenrir import session

@app.get("/set-session")
async def set_session():
    session["user_id"] = 123
    session["theme"] = "dark"
    return {"session": "set"}

@app.get("/get-session")
async def get_session():
    user_id = session.get("user_id")
    return {"user_id": user_id}
```
