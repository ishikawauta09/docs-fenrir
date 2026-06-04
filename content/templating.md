# Templating

### Basic Template Rendering

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

### Template File Structure

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

### Template with Jinja2 Features

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

### Custom Template Renderer

```python
from fenrir import BaseTemplateRenderer

class CustomRenderer(BaseTemplateRenderer):
    def render(self, template_name: str, **kwargs):
        # Custom rendering logic
        pass

app = Fenrir(template_renderer=CustomRenderer())
```
