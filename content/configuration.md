# Configuration

### Application Configuration

```python
from fenrir import Fenrir

app = Fenrir(
    title="My Application",
    version="1.0.0",
    description="An amazing application",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)
```

### Environment-Based Configuration

```python
import os
from fenrir import Fenrir

debug = os.getenv("DEBUG", "False") == "True"
app = Fenrir()
app.debug = debug
```

### Custom Configuration Class

```python
class Config:
    DEBUG = True
    TESTING = False
    DATABASE_URL = "postgresql://localhost/mydb"
    SECRET_KEY = "your-secret-key"

app = Fenrir()
app.config = Config()
```
