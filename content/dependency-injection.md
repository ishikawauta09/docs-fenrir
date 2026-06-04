# Dependency Injection

### Basic Dependency Injection

```python
from fenrir import Depends

# Define a dependency
async def get_current_user(x_token: str = Header(...)):
    if x_token != "valid_token":
        raise HTTPException(status_code=401)
    return {"user_id": 1, "name": "John"}

# Use dependency
@app.get("/protected")
async def protected_route(current_user: dict = Depends(get_current_user)):
    return {"message": f"Hello {current_user['name']}"}
```

### Database Session Dependency

```python
from fenrir import Depends

async def get_db():
    # In production, use actual database connection
    db = {"connection": "active"}
    try:
        yield db
    finally:
        # Cleanup
        print("Database connection closed")

@app.get("/users/<user_id:int>")
async def get_user(user_id: int, db: dict = Depends(get_db)):
    return {"user_id": user_id, "from_db": True}
```

### Dependency with Sub-dependencies

```python
async def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    token = authorization.replace("Bearer ", "")
    return token

async def get_current_user(token: str = Depends(verify_token)):
    # Token validation logic
    return {"user_id": 1}

@app.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return current_user
```
