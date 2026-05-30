import logging
import os
import json
import time
import random
import asyncio
from pydantic import BaseModel
from fenrir import (
    Fenrir,
    request,
    g,
    Depends,
    Query,
    Header,
    render_template,
    Response,
    WebSocket,
    WebSocketDisconnect
)
from fenrir.helpers import send_file, send_from_directory
from fenrir.response import JSONResponse, StreamingResponse

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("docs-server")

# Initialize the Fenrir App
app = Fenrir(
    title="Fenrir Web Framework Docs",
    version="1.2.1"
)

# Base directory for absolute path resolution
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Custom Global Exception Handler for validation errors
@app.exception(ValueError)
async def handle_value_error(req, exc):
    logger.warning(f"Validation failure intercepted: {exc}")
    return JSONResponse({
        "status": "validation_error",
        "error": str(exc)
    }, status=400)


# =====================================================================
# 1. STATIC FILES SERVING (SECURE WILDCARD ROUTE)
# =====================================================================
@app.get("/static/<path:path>")
async def serve_static(path: str):
    static_folder = os.path.join(BASE_DIR, "static")
    return send_from_directory(static_folder, path)

@app.get("/favicon.ico")
async def serve_favicon():
    logo_path = os.path.join(BASE_DIR, "static", "images", "logo.png")
    return send_file(logo_path, mimetype="image/png")


# =====================================================================
# 2. FRONTEND JINJA2 PAGE ROUTERS
# =====================================================================
@app.get("/")
async def home_page():
    return render_template("home.html", active_page="home")

@app.get("/documentation")
async def docs_page():
    return render_template("documentation.html", active_page="docs")

@app.get("/playground")
async def playground_page():
    return render_template("playground.html", active_page="playground")


# =====================================================================
# 3. INTERACTIVE PLAYGROUND ENDPOINTS (FLASK, FASTAPI, FALCON, SANIC)
# =====================================================================

# --- A. Flask-Style Endpoint (Query Params + Context Locals) ---
@app.get("/api/flask/greet")
async def flask_greet():
    # Fetch parameters imperatively from the global request local
    name = request.args.get("name", "Fenrir Developer")
    return {
        "status": "success",
        "message": f"Hello, {name}! This greeting was generated using Flask-style request context-locals.",
        "context_info": {
            "request_path": request.path,
            "request_method": request.method,
            "style": "Flask context-local"
        }
    }


# --- B. FastAPI-Style Endpoint (Pydantic + Header Dependency + Query) ---
class UserRegister(BaseModel):
    username: str
    email: str
    age: int

async def verify_api_key(x_api_key: str = Header(default=None)):
    if x_api_key != "super-secret-key":
        raise ValueError("Invalid Header Authorization key! Set X-API-Key to 'super-secret-key' in the playground fields.")
    return x_api_key

@app.post("/api/register")
async def fastapi_register(
    body: UserRegister,
    api_key: str = Depends(verify_api_key),
    role: str = Query(default="member")
):
    # Perform a couple of dynamic business logic validations to trigger custom ValueErrors
    if "@" not in body.email:
        raise ValueError("Incorrect email format! Must contain an '@' sign.")
    if body.age < 0 or body.age > 150:
        raise ValueError("Incorrect age! Value must be between 0 and 150.")

    return {
        "status": "success",
        "message": f"User '{body.username}' registered successfully!",
        "received_data": {
            "username": body.username,
            "email": body.email,
            "age": body.age
        },
        "resolved_parameters": {
            "x_api_key": api_key,
            "role": role,
            "style": "FastAPI Validation & DI"
        }
    }


# --- C. Falcon-Style Endpoint (Class-Based Resource View) ---
class ItemResource:
    async def on_get(self, req, resp, item_id: int):
        resp.status = 200
        resp.media = {
            "status": "success",
            "message": f"Successfully retrieved item {item_id} via Falcon class-based controller.",
            "style": "Falcon Class views GET",
            "item_id": item_id
        }

    async def on_post(self, req, resp, item_id: int):
        # Read pre-loaded json from the Falcon request object
        data = req.json or {}
        sub_item = data.get("sub_item", "N/A")
        updated_by = data.get("updated_by", "Guest")

        resp.status = 201
        resp.media = {
            "status": "created",
            "message": f"Successfully created sub-item for parent ID {item_id}.",
            "received_body": data,
            "sub_item_created": sub_item,
            "updated_by": updated_by,
            "style": "Falcon Class views POST"
        }

# Register Falcon Resource
app.add_route("/api/falcon/item/<item_id:int>", ItemResource())


# --- D. Sanic-Style WebSocket Channel ---
@app.websocket("/ws/chat")
async def ws_chat(ws: WebSocket):
    await ws.accept()
    logger.info("Playground WebSocket client connected.")
    try:
        while True:
            msg = await ws.receive_text()
            # Echo message back with frame text
            await ws.send_text(f"Event Loop Echo: Received '{msg}' successfully!")
    except WebSocketDisconnect:
        logger.info("Playground WebSocket client disconnected.")


# --- E. Sanic-Style Event Stream (Server-Sent Events) ---
async def sse_metrics_generator():
    try:
        while True:
            # Prepare SSE data structure
            timestamp = time.strftime("%H:%M:%S")
            data = {
                "timestamp": timestamp,
                "random_value": round(random.uniform(10.0, 99.9), 2),
                "active_workers": 2
            }
            # SSE chunks must be formatted as data: <payload>\n\n
            yield f"data: {json.dumps(data)}\n\n"
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        logger.info("SSE metrics stream closed by active client.")

@app.get("/api/sse/events")
async def sse_events():
    return StreamingResponse(
        sse_metrics_generator(),
        media_type="text/event-stream"
    )

# =====================================================================
# SEO & AI ENGINE CORE CHANNELS
# =====================================================================

@app.get("/sitemap.xml")
async def serve_sitemap():
    """Serves the structured sitemap for Google/Bing crawling indexes."""
    # Look for it under base directory root
    sitemap_file = os.path.join(BASE_DIR, "sitemap.xml")
    
    if os.path.exists(sitemap_file):
        return send_file(sitemap_file, mimetype="application/xml")
    return Response("Sitemap file not found.", status=404)


@app.get("/robots.txt")
async def serve_robots():
    """Directs crawler traffic behavior."""
    robots_file = os.path.join(BASE_DIR, "robots.txt")
    if os.path.exists(robots_file):
        return send_file(robots_file, mimetype="text/plain")
    return Response("User-agent: *\nAllow: /", mimetype="text/plain")


@app.get("/llms.txt")
async def serve_llms():
    """Provides high-density prompt context map targeting LLM scrapers."""
    llms_file = os.path.join(BASE_DIR, "llms.txt")
    if os.path.exists(llms_file):
        return send_file(llms_file, mimetype="text/plain")
    return Response("LLM context map currently offline.", status=404)

# =====================================================================
# NEW CORE CONTENT ROUTE MAPS
# =====================================================================

@app.get("/resources")
async def resources_page():
    """Renders the ecosystem and performance benchmarks dashboard."""
    # Inject active_page context variable to handle navbar highlight states
    return render_template("resources.html", active_page="resources")


@app.get("/release-notes")
async def release_notes_page():
    """Renders structural project lifecycle version logs."""
    return render_template("release_notes.html", active_page="release_notes")

# =====================================================================
# 4. PROGRAMMATIC SERVER RUNNER
# =====================================================================
if __name__ == "__main__":
    logger.info("Starting Fenrir Web Documentation Portal...")
    # Bound to port 8088 as approved by the user
    app.run(host="0.0.0.0", port=8088, workers=2, reload=False)
