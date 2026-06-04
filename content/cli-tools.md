# CLI Tools

### Running the Application

```bash
# Using fenrir CLI
fenrir run app:app

# With custom host and port
fenrir run app:app --host 0.0.0.0 --port 8080

# With reload on file changes
fenrir run app:app --reload
```

### Viewing Routes

```bash
# List all routes
fenrir routes app:app
```

### Interactive Shell

```bash
# Start interactive shell
fenrir shell app:app
```

### Project Scaffolding

```bash
# Create new project
fenrir new myproject
```

### Performance Benchmarking

```bash
# Run benchmark tests
fenrir bench app:app

# Custom iterations and path
fenrir bench app:app -i 2000 -t 5 -p / -m GET
```

### Environment Inspection

```bash
# Inspect system environment and framework details
fenrir info

# Inspect specific app details
fenrir info app:app
```

Example output:
```text
=============================================
SYSTEM ENVIRONMENT
=============================================
Fenrir version:      1.2.2
Python version:      3.11.0
Python executable:   /usr/bin/python3
OS Platform:         Linux 6.1.0
Pydantic installed:  Yes (v2.7.0)
Asteri installed:    Yes (v2.2.2)
=============================================
APPLICATION DETAILS
=============================================
App Title:           My App
App Version:         1.2.2
HTTP Routes:         10
WebSocket Routes:    2
Middlewares:         1
Compat Layers Active: None active in process
=============================================
```

