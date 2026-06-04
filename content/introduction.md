# Introduction

Welcome to **Fenrir**, a next-generation, high-performance hybrid Python web framework designed to revolutionize the way modern web services and APIs are built. In the vast landscape of Python web development, developers are often forced to make rigid choices. If they need native data validation and OpenAPI generation, they choose FastAPI. If they require simple context-locals and template rendering, they go with Flask. For raw speed and class-based REST resources, Falcon is the usual suspect, while Sanic offers robust async features and background tasks. 

Fenrir is built to dismantle these artificial boundaries. It acts as a unified space where the best paradigms from Python's most popular web frameworks—**Flask**, **FastAPI**, **Sanic**, **Falcon**, and **Bottle**—coexist harmoniously in a single, high-fidelity codebase. Powered by the premium **Asteri v2.2.2** application server, Fenrir brings unmatched flexibility, performance, and robustness to Python developers.

---

## The Hybrid Philosophy: Why Choose One?

Traditionally, choosing a framework meant accepting its opinionated architectural styles. This led to "framework lock-in," where migrating from one paradigm to another required a complete rewrite of the routing layer, dependency management, and error handling. 

Fenrir introduces a new way of thinking: **Framework Hybridization**. Instead of dictating a single style, Fenrir provides a polymorphic engine that natively understands and executes code written in various paradigms.

* **Microservices and Multi-paradigm Teams**: If your team consists of developers with different backgrounds, those familiar with Flask can write standard decorators and context-based controllers, while those with FastAPI expertise can leverage Pydantic schemas and dependency injection. They can all work on the same app instance without friction.
* **Incremental Modernization**: If you have legacy WSGI services, you can mount them directly into Fenrir's ASGI pipeline. This allows you to gradually migrate your endpoints to fast async handlers without running multiple servers.

---

## The Five Pillars of Fenrir

Fenrir's hybridization is structured around five main paradigms, each treated as a first-class citizen within the framework core.

### 1. The FastAPI Paradigm (Validation & Dependency Injection)
Fenrir implements a native dependency resolution and data validation engine powered by Pydantic v2. When you declare path parameters, query parameters, request bodies, or headers with type annotations, Fenrir automatically parses, validates, and injects them into your handler function.
* **Automatic OpenAPI Generation**: Every route defined using Pydantic models automatically registers its schemas to generate interactive **Swagger UI** (`/docs`) and **ReDoc** (`/redoc`) portals.
* **Dependency Injection (`Depends`)**: Reuse logic dynamically across endpoints. Declare dependencies via `Depends(...)` to resolve database sessions, authentication helpers, or rate-limiters at runtime.

### 2. The Flask Paradigm (Context & Simplicity)
For scenarios where explicit argument passing is tedious, Fenrir offers Flask-style task-local context variables.
* **Context Locals**: Natively access `request`, `g`, and `session` variables globally from anywhere in your application. The framework uses Python's modern `contextvars` to ensure thread-safety and task-safety under high async concurrency.
* **Jinja2 Templating**: Render dynamic HTML files using `render_template` with a pre-configured template engine.
* **Teardown Hooks**: Manage database connections or resource cleanup using `@app.teardown_request` decorators.

### 3. The Falcon Paradigm (Class-Based Resources)
If you prefer clean object-oriented design and maximum controller performance, Fenrir supports class-based resources inspired by Falcon.
* **Resource Mapping**: Map URLs to class objects that define `on_get`, `on_post`, `on_put`, `on_delete`, and other HTTP-verb methods.
* **In-place Mutation**: Mutate the `req` (Request) and `resp` (Response) objects directly within the resource methods instead of returning values.
* **Before/After Hooks**: Execute custom middleware logic on specific resources using decorators like `@before` and `@after`.

### 4. The Sanic Paradigm (Listeners & Async Scheduling)
Fenrir embraces Sanic's asynchronous event-driven lifecycle and background processing tools.
* **Lifecycle Listeners**: Register hooks for server events such as `before_server_start`, `after_server_start`, `before_server_stop`, and `after_server_stop` to set up database pools or close client sessions.
* **Background Tasks**: Schedule background coroutines directly from your controllers using `app.add_task(...)` or `BackgroundTasks` objects without blocking the main request-response pipeline.

### 5. The Bottle Paradigm (WSGI Adapters)
Legacy applications shouldn't be left behind. Fenrir features a built-in WSGI-to-ASGI wrapper.
* **Legacy Mounts**: Mount old Bottle, Flask, or standard WSGI apps directly under specific paths using `app.mount_wsgi(...)`. They will run at high speeds inside Fenrir's ASGI worker.

---

## Core Architecture and Performance

At its foundation, Fenrir is built on an extremely low-overhead, asynchronous routing engine. It implements the ASGI (Asynchronous Server Gateway Interface) specification, allowing it to handle thousands of concurrent connections with minimal memory usage.

### 1. High-Performance ASGI Engine
Fenrir’s router uses an optimized path-compilation mechanism that matches incoming requests in logarithmic time. When a request enters the application:
1. The routing engine matches the path and extracts parameters.
2. Context variables are initialized using `contextvars`.
3. If the handler is synchronous, it is executed inside a context-aware worker thread pool (`compat.to_thread`) to prevent blocking the main event loop.
4. If it is asynchronous, it is awaited directly.
5. Response serialization handles Pydantic models, JSON dictionaries, raw strings, streams, and websockets automatically.

### 2. Under the Hood with Asteri
Fenrir is paired with the **Asteri Application Server**. Asteri is a premium ASGI server that supports dynamic worker multiprocessing, hot-reloading, and advanced HTTP connection management. Together, they form a deployment-ready ecosystem designed to maximize CPU utilization and throughput on modern containerized environments.

---

## Real-world Applications

Fenrir is suitable for a wide range of web architectures:
* **High-Throughput APIs**: Ideal for services that process heavy JSON payloads, requiring automatic validation (FastAPI style) and high concurrency (Sanic/ASGI core).
* **Enterprise Web Portals**: Useful for applications that serve both dynamic HTML pages via templates (Flask style) and real-time dashboard notifications using WebSockets or Server-Sent Events (SSE).
* **Monolith-to-Microservices Migrations**: Facilitates incremental refactoring of legacy codebases by mounting old routes while writing new ones in modern async styles.

---

## Getting Started

To explore Fenrir's hybrid capabilities, you can install the framework and immediately begin scaffolding a new application:

```bash
# Install the framework
pip install fenrir-framework

# Scaffold a premium project template
fenrir new my_app
cd my_app

# Start the development server
fenrir run app:app --dev
```

Dive into the sidebar sections to learn how to configure routing, handle data validation, execute background tasks, write tests, and deploy your application. Welcome to the future of hybrid Python web development!
