# Authentication & Security

Fenrir provides FastAPI-compatible security dependencies for API key, token, and OAuth2 authentication. All security classes inherit from `SecurityBase` and automatically register their OpenAPI models in the schema.

### Class Hierarchy

```
SecurityBase
├── APIKeyBase
│   ├── APIKeyCookie
│   ├── APIKeyHeader
│   └── APIKeyQuery
├── WebSocketTokenAuth
├── HTTPBase
│   ├── HTTPBasic
│   ├── HTTPBearer
│   └── HTTPDigest
├── OAuth2
│   ├── OAuth2PasswordBearer
│   └── OAuth2AuthorizationCodeBearer
└── OpenIDConnect
```

### SecurityBase

All security classes inherit from `SecurityBase`, which provides common OpenAPI metadata parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `scheme_name` | `str \| None` | `None` | Name shown in OpenAPI schema (defaults to class name if not provided) |
| `description` | `str \| None` | `None` | Description shown in OpenAPI schema |

### API Key Authentication

#### API Key from Header

```python
from fenrir import APIKeyHeader, Depends

api_key_auth = APIKeyHeader(
    name="X-API-Key",
    scheme_name="X-API-Key",
    description="API key passed via header",
    auto_error=True,
)

@app.get("/protected")
async def protected_endpoint(api_key: str = Depends(api_key_auth)):
    return {"message": f"API key from header: {api_key}"}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `str` | *required* | Header name to extract API key from |
| `auto_error` | `bool` | `True` | Raise 401 if authentication fails; return `None` if `False` |
| `scheme_name` | `str \| None` | `None` | Name shown in OpenAPI schema (defaults to class name) |
| `description` | `str \| None` | `None` | Description shown in OpenAPI schema |

**Return type:** `str | None`

**`auto_error=False` behavior:** Returns `None` instead of raising `HTTPException` when the API key is missing.

#### API Key from Cookie

```python
from fenrir import APIKeyCookie, Depends

api_key_cookie = APIKeyCookie(
    name="api_key",
    scheme_name="CookieAPIKey",
    description="API key passed via cookie",
    auto_error=True,
)

@app.get("/cookie-protected")
async def cookie_protected(api_key: str = Depends(api_key_cookie)):
    return {"message": f"API key from cookie: {api_key}"}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `str` | *required* | Cookie name to extract API key from |
| `auto_error` | `bool` | `True` | Raise 401 if authentication fails; return `None` if `False` |
| `scheme_name` | `str \| None` | `None` | Name shown in OpenAPI schema (defaults to class name) |
| `description` | `str \| None` | `None` | Description shown in OpenAPI schema |

**Return type:** `str | None`

**`auto_error=False` behavior:** Returns `None` instead of raising `HTTPException` when the API key is missing.

#### API Key from Query Parameter

```python
from fenrir import APIKeyQuery, Depends

api_key_query = APIKeyQuery(
    name="api_key",
    scheme_name="QueryAPIKey",
    description="API key passed via query parameter",
    auto_error=True,
)

@app.get("/query-protected")
async def query_protected(api_key: str = Depends(api_key_query)):
    return {"message": f"API key from query: {api_key}"}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `str` | *required* | Query parameter name to extract API key from |
| `auto_error` | `bool` | `True` | Raise 401 if authentication fails; return `None` if `False` |
| `scheme_name` | `str \| None` | `None` | Name shown in OpenAPI schema (defaults to class name) |
| `description` | `str \| None` | `None` | Description shown in OpenAPI schema |

**Return type:** `str | None`

**`auto_error=False` behavior:** Returns `None` instead of raising `HTTPException` when the API key is missing.

### HTTPBase

`HTTPBase` is the base class for HTTP authentication schemes (`HTTPBasic`, `HTTPBearer`, `HTTPDigest`). It provides additional parameters beyond `SecurityBase`:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `scheme` | `str` | *required* | HTTP authentication scheme name (e.g., `"basic"`, `"bearer"`, `"digest"`) |
| `realm` | `str \| None` | `None` | Realm for WWW-Authenticate header |
| `scheme_name` | `str \| None` | `None` | Name shown in OpenAPI schema (defaults to class name) |
| `description` | `str \| None` | `None` | Description shown in OpenAPI schema |
| `auto_error` | `bool` | `True` | Raise 401 if authentication fails; return `None` if `False` |

### Bearer Token Authentication

```python
from fenrir import HTTPBearer, Depends

bearer = HTTPBearer(
    bearerFormat="JWT",
    scheme_name="BearerAuth",
    description="JWT bearer token authentication",
    auto_error=True,
)

@app.get("/secure")
async def secure_endpoint(token: str = Depends(bearer)):
    return {"message": f"Authenticated with token: {token}"}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `bearerFormat` | `str \| None` | `None` | Format description shown in OpenAPI (e.g., `"JWT"`) |
| `scheme_name` | `str \| None` | `None` | Name shown in OpenAPI schema (defaults to class name) |
| `description` | `str \| None` | `None` | Description shown in OpenAPI schema |
| `auto_error` | `bool` | `True` | Raise 401 if authentication fails; return `None` if `False` |

**Return type:** `str | None`

**`auto_error=False` behavior:** Returns `None` instead of raising `HTTPException` when:

- The `Authorization` header is missing
- The header does not contain a valid `Bearer` token

### Basic Authentication

```python
from fenrir import HTTPBasic, Depends

basic_auth = HTTPBasic(
    realm="Fenrir API",
    scheme_name="BasicAuth",
    description="Basic authentication with username/password",
    auto_error=True,
)

@app.get("/basic")
async def basic_protected(credentials: tuple = Depends(basic_auth)):
    username, password = credentials
    return {"message": f"Hello {username}"}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `realm` | `str \| None` | `None` | Realm for WWW-Authenticate header |
| `scheme_name` | `str \| None` | `None` | Name shown in OpenAPI schema (defaults to class name) |
| `description` | `str \| None` | `None` | Description shown in OpenAPI schema |
| `auto_error` | `bool` | `True` | Raise 401 if authentication fails; return `None` if `False` |

**Return type:** `tuple[str, str] | None` (username, password)

**`auto_error=False` behavior:** Returns `None` instead of raising `HTTPException` when:

- The `Authorization` header is missing
- The header does not contain valid Basic credentials
- The credentials cannot be decoded or parsed

When `auto_error=True` and `realm` is provided, the `WWW-Authenticate` header is included in the 401 response.

### Digest Authentication

```python
from fenrir import HTTPDigest, Depends

digest_auth = HTTPDigest(
    realm="Fenrir Digest",
    scheme_name="DigestAuth",
    description="Digest authentication with parsed digest fields",
    auto_error=True,
)

@app.get("/digest")
async def digest_protected(credentials: dict = Depends(digest_auth)):
    return {"message": "Digest authenticated", "fields": credentials}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `realm` | `str \| None` | `None` | Realm for WWW-Authenticate header |
| `scheme_name` | `str \| None` | `None` | Name shown in OpenAPI schema (defaults to class name) |
| `description` | `str \| None` | `None` | Description shown in OpenAPI schema |
| `auto_error` | `bool` | `True` | Raise 401 if authentication fails; return `None` if `False` |

**Return type:** `dict | None` (parsed digest fields as key-value pairs)

**`auto_error=False` behavior:** Returns `None` instead of raising `HTTPException` when:

- The `Authorization` header is missing
- The header does not start with `Digest `

When `auto_error=True` and `realm` is provided, the `WWW-Authenticate` header is included in the 401 response.

### OAuth2

`OAuth2` is the base class for OAuth2 authentication schemes. It provides additional parameters beyond `SecurityBase`:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `flows` | `dict[str, Any]` | *required* | OAuth2 flows configuration (e.g., `{"password": {"tokenUrl": "token", "scopes": {}}}`) |
| `scheme_name` | `str \| None` | `None` | Name shown in OpenAPI schema (defaults to class name) |
| `description` | `str \| None` | `None` | Description shown in OpenAPI schema |
| `auto_error` | `bool` | `True` | Raise 401 if authentication fails; return `None` if `False` |

**`auto_error=False` behavior:** Returns `None` instead of raising `HTTPException` when:

- The `Authorization` header is missing
- The header does not contain a valid `Bearer` token

#### OAuth2 Password Flow

```python
from fenrir import OAuth2PasswordBearer, Depends, HTTPException

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="token",
    scheme_name="OAuth2Password",
    description="OAuth2 password flow authentication",
    auto_error=True,
)

@app.post("/token")
async def login(username: str, password: str):
    if username != "user" or password != "pass":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": "token123", "token_type": "bearer"}

@app.get("/me")
async def read_users_me(token: str = Depends(oauth2_scheme)):
    return {"username": "user"}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tokenUrl` | `str` | *required* | URL to obtain the access token |
| `scheme_name` | `str \| None` | `None` | Name shown in OpenAPI schema (defaults to class name) |
| `description` | `str \| None` | `None` | Description shown in OpenAPI schema |
| `auto_error` | `bool` | `True` | Raise 401 if authentication fails; return `None` if `False` |

**Return type:** `str | None` (the access token)

**`auto_error=False` behavior:** Returns `None` instead of raising `HTTPException` when:

- The `Authorization` header is missing
- The header does not contain a valid `Bearer` token

#### OAuth2 Authorization Code Flow

```python
from fenrir import OAuth2AuthorizationCodeBearer, Depends

oauth2_code = OAuth2AuthorizationCodeBearer(
    authorizationUrl="https://auth.example.com/authorize",
    tokenUrl="https://auth.example.com/token",
    scheme_name="OAuth2AuthCode",
    description="OAuth2 authorization code flow authentication",
    auto_error=True,
)

@app.get("/oauth2-code")
async def oauth2_code_endpoint(token: str = Depends(oauth2_code)):
    return {"message": "Authorization code flow authenticated"}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `authorizationUrl` | `str` | *required* | URL to obtain the authorization code |
| `tokenUrl` | `str` | *required* | URL to exchange code for access token |
| `scheme_name` | `str \| None` | `None` | Name shown in OpenAPI schema (defaults to class name) |
| `description` | `str \| None` | `None` | Description shown in OpenAPI schema |
| `auto_error` | `bool` | `True` | Raise 401 if authentication fails; return `None` if `False` |

**Return type:** `str | None` (the access token)

**`auto_error=False` behavior:** Returns `None` instead of raising `HTTPException` when:

- The `Authorization` header is missing
- The header does not contain a valid `Bearer` token

### OpenID Connect

```python
from fenrir import OpenIDConnect, Depends

oidc = OpenIDConnect(
    openIdConnectUrl="https://auth.example.com/.well-known/openid-configuration",
    scheme_name="OpenIDConnect",
    description="OpenID Connect authentication with discovery URL",
    auto_error=True,
)

@app.get("/oidc")
async def oidc_endpoint(token: str = Depends(oidc)):
    return {"message": "OpenID Connect authenticated"}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `openIdConnectUrl` | `str` | *required* | OpenID Connect discovery URL |
| `scheme_name` | `str \| None` | `None` | Name shown in OpenAPI schema (defaults to class name) |
| `description` | `str \| None` | `None` | Description shown in OpenAPI schema |
| `auto_error` | `bool` | `True` | Raise 401 if authentication fails; return `None` if `False` |

**Return type:** `str | None` (the bearer token)

**`auto_error=False` behavior:** Returns `None` instead of raising `HTTPException` when:

- The `Authorization` header is missing
- The header does not contain a valid `Bearer` token

### WebSocket Token Authentication

Authenticate WebSocket connections using tokens from headers or query parameters:

```python
from fenrir import Fenrir, WebSocket, Depends
from fenrir.security import WebSocketTokenAuth

app = Fenrir()
auth = WebSocketTokenAuth(
    header_name="authorization",
    query_param="token",
    scheme_name="WSAuth",
    description="WebSocket token authentication",
    auto_error=True,
)

@app.websocket("/ws")
async def websocket_handler(websocket: WebSocket, token: str = Depends(auth)):
    await websocket.accept()
    await websocket.send_text(f"Authenticated with token: {token}")
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Echo: {data}")
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `header_name` | `str` | `"authorization"` | Header name to extract token from |
| `query_param` | `str` | `"token"` | Query parameter name to extract token from |
| `scheme_name` | `str \| None` | `None` | Name shown in OpenAPI schema (defaults to class name) |
| `description` | `str \| None` | `None` | Description shown in OpenAPI schema |
| `auto_error` | `bool` | `True` | Raise 401 if authentication fails; return `None` if `False` |

**Return type:** `str | None` (the token)

**Token extraction logic:**

1. First checks the header for a `Bearer <token>` format
2. If no Bearer token found, uses the raw header value
3. Falls back to the query parameter if no header token found

**`auto_error=False` behavior:** Returns `None` instead of raising `HTTPException` when:

- The WebSocket connection has no scope (invalid WebSocket object)
- No token is found in either the header or query parameter

### OpenAPI Integration

Security classes automatically register their OpenAPI security scheme models. Each class exposes a `model` attribute containing the OpenAPI security scheme definition:

| Class | OpenAPI Type | Scheme | Additional Fields |
|-------|--------------|--------|-------------------|
| `APIKeyHeader` | `apiKey` | `in: header` | `name` (header name) |
| `APIKeyCookie` | `apiKey` | `in: cookie` | `name` (cookie name) |
| `APIKeyQuery` | `apiKey` | `in: query` | `name` (query param name) |
| `HTTPBasic` | `http` | `basic` | `realm` (if provided) |
| `HTTPBearer` | `http` | `bearer` | `bearerFormat` (if provided) |
| `HTTPDigest` | `http` | `digest` | `realm` (if provided) |
| `OAuth2PasswordBearer` | `oauth2` | `password` flow | `tokenUrl` |
| `OAuth2AuthorizationCodeBearer` | `oauth2` | `authorizationCode` flow | `authorizationUrl`, `tokenUrl` |
| `OpenIDConnect` | `openIdConnect` | N/A | `openIdConnectUrl` |
| `WebSocketTokenAuth` | `http` | `bearer` | N/A |

All classes include `description` in the OpenAPI model if provided via the `description` parameter.

### Return Types Summary

| Class | Return Type | Notes |
|-------|-------------|-------|
| `APIKeyHeader` | `str \| None` | `None` when `auto_error=False` and key missing |
| `APIKeyCookie` | `str \| None` | `None` when `auto_error=False` and key missing |
| `APIKeyQuery` | `str \| None` | `None` when `auto_error=False` and key missing |
| `HTTPBearer` | `str \| None` | `None` when `auto_error=False` and token invalid/missing |
| `HTTPBasic` | `tuple[str, str] \| None` | `None` when `auto_error=False` and credentials invalid/missing |
| `HTTPDigest` | `dict \| None` | `None` when `auto_error=False` and digest invalid/missing |
| `OAuth2PasswordBearer` | `str \| None` | `None` when `auto_error=False` and token invalid/missing |
| `OAuth2AuthorizationCodeBearer` | `str \| None` | `None` when `auto_error=False` and token invalid/missing |
| `OpenIDConnect` | `str \| None` | `None` when `auto_error=False` and token invalid/missing |
| `WebSocketTokenAuth` | `str \| None` | `None` when `auto_error=False` and token missing |

### Error Behavior

When `auto_error=True` (default), all security classes raise an `HTTPException` with status code `401` and detail `"Not authenticated"` or `"Invalid credentials"` on failure.

When `auto_error=False`, all security classes return `None` on failure, allowing the endpoint to handle the missing authentication gracefully (e.g., returning a default value, redirecting, or providing anonymous access).
