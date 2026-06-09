# Authentication & Security

### API Key Authentication

#### API Key from Header

```python
from fenrir import APIKeyHeader, HTTPException

api_key_auth = APIKeyHeader(name="X-API-Key")

@app.get("/protected")
async def protected_endpoint(api_key: str = Depends(api_key_auth)):
    if api_key != "your-secret-key":
        raise HTTPUnauthorized()
    return {"message": "Access granted"}
```

#### API Key from Cookie

```python
from fenrir import APIKeyCookie

api_key_cookie = APIKeyCookie(name="api_key")

@app.get("/cookie-protected")
async def cookie_protected(api_key: str = Depends(api_key_cookie)):
    return {"message": f"API key from cookie: {api_key}"}
```

#### API Key from Query Parameter

```python
from fenrir import APIKeyQuery

api_key_query = APIKeyQuery(name="api_key")

@app.get("/query-protected")
async def query_protected(api_key: str = Depends(api_key_query)):
    return {"message": f"API key from query: {api_key}"}
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

### Digest Authentication

```python
from fenrir import HTTPDigest

digest_auth = HTTPDigest()

@app.get("/digest")
async def digest_protected(credentials = Depends(digest_auth)):
    return {"message": "Digest authenticated"}
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

### OAuth2 Authorization Code Flow

```python
from fenrir import OAuth2AuthorizationCodeBearer

oauth2_code = OAuth2AuthorizationCodeBearer(
    authorizationUrl="https://auth.example.com/authorize",
    tokenUrl="https://auth.example.com/token"
)

@app.get("/oauth2-code")
async def oauth2_code_endpoint(token: str = Depends(oauth2_code)):
    return {"message": "Authorization code flow authenticated"}
```

### OpenID Connect

```python
from fenrir import OpenIDConnect

oidc = OpenIDConnect(
    openIdConnectUrl="https://auth.example.com/.well-known/openid-configuration"
)

@app.get("/oidc")
async def oidc_endpoint(token: str = Depends(oidc)):
    return {"message": "OpenID Connect authenticated"}
```
