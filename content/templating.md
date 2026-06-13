# Templating

Fenrir provides a template rendering system powered by Jinja2 with automatic HTML escaping, signal integration, and a pluggable renderer architecture.

## Basic Template Rendering

```python
from fenrir import render_template

@app.get("/")
async def home():
    return render_template(
        "index.html",
        title="Home",
        name="Fenrir User"
    )
```

## Template File Structure

Create `templates/index.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>{{ title }}</title>
</head>
<body>
    <h1>Hello, {{ name }}!</h1>
    <ul>
    {% for item in items %}
        <li>{{ item }}</li>
    {% endfor %}
    </ul>
</body>
</html>
```

## Template with Jinja2 Features

```python
from fenrir import render_template

@app.get("/blog")
async def blog_list():
    posts = [
        {"id": 1, "title": "First Post"},
        {"id": 2, "title": "Second Post"}
    ]

    return render_template(
        "blog.html",
        posts=posts,
        total=len(posts)
    )
```

## BaseTemplateRenderer

The `BaseTemplateRenderer` is an abstract base class that all template renderers must subclass. It defines a single `render()` method that subclasses must implement.

```python
from fenrir.templating import BaseTemplateRenderer

class BaseTemplateRenderer:
    def render(self, template_name: str, **context: Any) -> str:
        raise NotImplementedError("Renderer must implement render()")
```

Any custom renderer must inherit from `BaseTemplateRenderer` and override the `render()` method.

## Jinja2Renderer

The default renderer uses Jinja2 with **autoescape enabled by default** to prevent XSS attacks:

```python
from fenrir.templating import Jinja2Renderer

renderer = Jinja2Renderer(template_folder="templates")

# Access the Jinja2 environment
renderer.env.globals["app_name"] = "My App"

app = Fenrir(renderer=renderer)
```

**Parameters:**

- `template_folder`: Directory containing templates (default: `"templates"`). Relative paths are resolved to absolute paths automatically.

**Attributes:**

- `renderer.env`: The Jinja2 `Environment` instance for adding globals, filters, and extensions.

**Autoescape Behavior:**

`Jinja2Renderer` configures Jinja2 with `autoescape=True`, which automatically escapes HTML entities in template output. This is critical for preventing cross-site scripting (XSS) when rendering user-provided data.

## render_template Signal Integration

The `render_template()` function fires the `template_rendered` signal after a template is successfully rendered. You can connect to this signal for logging, analytics, or debugging:

```python
from fenrir.signals import template_rendered

def on_template_rendered(sender, template, context):
    print(f"Rendered {template} with {len(context)} variables")

template_rendered.connect(on_template_rendered)

@app.get("/")
async def home():
    return render_template("index.html", title="Home")
```

## Fallback Renderer Behavior

If no app-level renderer is configured, `render_template()` automatically creates a default `Jinja2Renderer` with the standard `templates` folder and renders the template. The `template_rendered` signal is still fired if an active app exists:

```python
from fenrir import render_template

# No renderer configured on app — falls back to default Jinja2Renderer
@app.get("/")
async def home():
    return render_template("index.html", title="Home")
```

This means `render_template()` works out of the box without explicit renderer configuration.

## Custom Template Renderer

Implement your own renderer by subclassing `BaseTemplateRenderer`:

```python
from fenrir.templating import BaseTemplateRenderer

class CustomRenderer(BaseTemplateRenderer):
    def render(self, template_name: str, **kwargs):
        # Custom rendering logic
        pass

app = Fenrir(renderer=CustomRenderer())
```

### Example: File-Based Renderer

```python
from fenrir.templating import BaseTemplateRenderer

class PlainTextRenderer(BaseTemplateRenderer):
    def render(self, template_name: str, **context):
        with open(f"templates/{template_name}") as f:
            content = f.read()
        for key, value in context.items():
            content = content.replace(f"{{{{{key}}}}}", str(value))
        return content

app = Fenrir(renderer=PlainTextRenderer())
```

### Example: Cached Renderer

```python
from fenrir.templating import Jinja2Renderer

class CachedRenderer(Jinja2Renderer):
    def __init__(self, template_folder="templates"):
        super().__init__(template_folder)
        self.cache = {}

    def render(self, template_name: str, **context):
        if template_name not in self.cache:
            self.cache[template_name] = self.env.get_template(template_name)
        return self.cache[template_name].render(**context)

app = Fenrir(renderer=CachedRenderer())
```

## App Renderer Configuration

Set a renderer after app creation:

```python
from fenrir.templating import Jinja2Renderer

app.renderer = Jinja2Renderer(template_folder="my_templates")
```
