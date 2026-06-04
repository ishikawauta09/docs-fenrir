# Authentication & Security

### API Key Authentication

```python
from fenrir import APIKeyHeader, HTTPException

api_key_auth = APIKeyHeader(name="X-API-Key")

@app.get("/protected")
async def protected_endpoint(api_key: str = Depends(api_key_auth)):
    if api_key != "your-secret-key":
        raise HTTPUnauthorized()
    return {"message": "Access granted"}
```

### Bearer Token Authentication

```python
from fenrir import HTTPBearer

bearer = HTTPBearer()

@app.get("/secure")
async def secure_endpoint(credentials = Depends(bearer)):
    token = credentials.credentials
    # Validate token
    if not validate_token(token):
        raise HTTPUnauthorized()
    return {"message": "Authenticated"}
```

### Basic Authentication

```python
from fenrir import HTTPBasic

basic_auth = HTTPBasic()

@app.get("/basic")
async def basic_protected(credentials = Depends(basic_auth)):
    if credentials.username != "admin" or credentials.password != "password":
        raise HTTPUnauthorized()
    return {"message": f"Hello {credentials.username}"}
```

### OAuth2 Password Flow

```python
from fenrir import OAuth2PasswordBearer, HTTPException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.post("/token")
async def login(username: str, password: str):
    # Validate credentials
    if username != "user" or password != "pass":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": "token123", "token_type": "bearer"}

@app.get("/me")
async def read_users_me(token: str = Depends(oauth2_scheme)):
    return {"username": "user"}
```
