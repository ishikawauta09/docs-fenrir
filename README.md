# Fenrir Web Framework Documentation Portal

A professional, modern, and high-performance documentation portal for the **Fenrir Web Framework (v1.2.1)**. Designed with an elegant glassmorphic dark design system, this portal features an interactive playground to demonstrate Fenrir's hybrid ASGI capabilities in real-time.

## 🚀 Core Paradigms Demonstrated

Fenrir merges the best architectural components of modern Python web frameworks into a single unified event loop:

- **Flask-Style:** Imperative request handling via global context-locals (`request`, `g`).
- **FastAPI-Style:** Declarative request body validation using Pydantic models and dependency injection.
- **Falcon-Style:** Low-overhead, high-speed Class-Based Resource Controllers (`on_get`, `on_post`).
- **Sanic/ASGI-Style:** High-throughput asynchronous streaming including low-level WebSockets and Server-Sent Events (SSE).

---

## 🛠️ Project Structure

```text
├── app.py              # Main application router and application entry point
├── index.py            # Vercel Serverless Function entry point handler
├── vercel.json         # Vercel deployment and routing configuration
├── requirements.txt    # Project dependencies
├── templates/          # Jinja2 HTML templates
│   ├── base.html
│   ├── home.html
│   ├── documentation.html
│   ├── playground.html
│   ├── resources.html
│   └── release_notes.html
├── static/             # Static assets
│   ├── css/            # UI styles (main.css)
│   ├── js/             # Interactive web logic (main.js)
│   └── images/         # Images and branding logos
├── robots.txt          # SEO crawler directives
├── sitemap.xml         # SEO crawling index schema
└── llms.txt            # High-density context mapping for AI models

```

---

## 💻 Local Setup & Installation

Follow these steps to clone and spin up the documentation portal locally:

1. **Clone the repository:**

```bash
git clone https://github.com/IshikawaUta/docs-fenrir.git
cd docs-fenrir

```

2. **Create and activate a virtual environment:**

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate

```

3. **Install the dependencies:**

```bash
pip install -r requirements.txt

```

4. **Run the local development server:**

```bash
python app.py

```

Open your browser and navigate to `http://127.0.0.1:8088`.

---

## ☁️ Vercel Deployment

This project is fully configured for serverless hosting on Vercel via `mangum`.

### Deployment via Vercel CLI:

```bash
npm install -g vercel
vercel          # Project configuration stage
vercel --prod   # Push directly to production scale

```

> ⚠️ **Note on Serverless Limitations:** Features requiring persistent network pipes, such as **WebSockets** and continuous **Server-Sent Events (SSE)** on the `/playground` page, will have architectural connection timeout limitations under Vercel Serverless Functions.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.