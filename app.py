import os
import datetime
import re
from fenrir import Fenrir, render_template, request, g, JSONResponse, HTTPNotFound, Response, send_from_directory

app = Fenrir(title="Fenrir Docs", version="1.2.2")

# Configuration
CONTENT_DIR = os.path.join(os.path.dirname(__file__), 'content')

# Sidebar Structure (File Tree style)
SIDEBAR = [
    {'title': 'Introduction to Fenrir', 'id': 'introduction', 'icon': 'info'},
    {'title': 'Installation Guide', 'id': 'installation', 'icon': 'download'},
    {'title': 'Project Structure', 'id': 'project-structure', 'icon': 'folder'},
    {'title': 'Quick Start Guide', 'id': 'quick-start', 'icon': 'play'},
    {'title': 'Basic Concepts', 'id': 'basic-concepts', 'icon': 'book-open'},
    {'title': 'Routing System', 'id': 'routing', 'icon': 'git-commit'},
    {'title': 'Request & Response', 'id': 'request-response', 'icon': 'arrow-left-right'},
    {'title': 'Dependency Injection', 'id': 'dependency-injection', 'icon': 'plug'},
    {'title': 'Data Validation', 'id': 'data-validation', 'icon': 'check-circle'},
    {'title': 'Context Locals', 'id': 'context-locals', 'icon': 'database'},
    {'title': 'Class-Based Resources', 'id': 'class-based-resources', 'icon': 'layers'},
    {'title': 'File Upload', 'id': 'file-upload', 'icon': 'upload'},
    {'title': 'WebSocket Support', 'id': 'websocket', 'icon': 'zap'},
    {'title': 'Server-Sent Events (SSE)', 'id': 'server-sent-events', 'icon': 'radio'},
    {'title': 'Jinja2 Templating', 'id': 'templating', 'icon': 'layout'},
    {'title': 'Error Handling & Exceptions', 'id': 'error-handling', 'icon': 'alert-circle'},
    {'title': 'Error Handling Compatibility', 'id': 'error-handling-compatibility', 'icon': 'shuffle'},
    {'title': 'Middleware System', 'id': 'middleware', 'icon': 'cpu'},
    {'title': 'Background Tasks', 'id': 'background-tasks', 'icon': 'clock'},
    {'title': 'Authentication & Security', 'id': 'authentication-security', 'icon': 'shield'},
    {'title': 'Blueprints Organization', 'id': 'blueprints', 'icon': 'map'},
    {'title': 'Application Configuration', 'id': 'configuration', 'icon': 'settings'},
    {'title': 'Testing Guide', 'id': 'testing', 'icon': 'clipboard-list'},
    {'title': 'CLI Tools Reference', 'id': 'cli-tools', 'icon': 'terminal'},
    {'title': 'Advanced Features', 'id': 'advanced-features', 'icon': 'sliders'},
    {'title': 'Best Practices', 'id': 'best-practices', 'icon': 'award'},
    {'title': 'Conclusion', 'id': 'conclusion', 'icon': 'flag'},
]

@app.get('/static/<path:path>')
async def serve_static(path: str):
    static_dir = os.path.join(os.path.dirname(__file__), 'static')
    return send_from_directory(static_dir, path)

def render_markdown(filename):
    filepath = os.path.join(CONTENT_DIR, f"{filename}.md")
    if not os.path.exists(filepath):
        return None, None
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    import markdown
    from markdown.extensions.codehilite import CodeHiliteExtension
    from markdown.extensions.fenced_code import FencedCodeExtension
    from markdown.extensions.tables import TableExtension
    from markdown.extensions.toc import TocExtension

    md = markdown.Markdown(extensions=[
        'extra',
        FencedCodeExtension(),
        CodeHiliteExtension(css_class='highlight', linenums=True),
        TableExtension(),
        TocExtension(baselevel=1, marker=None)
    ])
    html = md.convert(content)
    
    # Post-process HTML to add rel="noopener noreferrer" to external links
    html = re.sub(r'<a\s+(?![^>]*rel=)([^>]*href="https?://[^"]+"[^>]*)>', 
                  r'<a \1 rel="noopener noreferrer" target="_blank">', html)
    
    return html, md.toc

@app.get('/')
async def index():
    return await doc('introduction')

@app.get('/docs/<doc_id>')
async def doc(doc_id: str):
    content_html, toc_html = render_markdown(doc_id)
    if content_html is None:
        raise HTTPNotFound(detail="Document not found")
    
    # Next/Prev logic
    current_index = next((i for i, item in enumerate(SIDEBAR) if item['id'] == doc_id), -1)
    prev_page = SIDEBAR[current_index - 1] if current_index > 0 else None
    next_page = SIDEBAR[current_index + 1] if current_index < len(SIDEBAR) - 1 else None
    
    # File metadata (Last Updated)
    filepath = os.path.join(CONTENT_DIR, f"{doc_id}.md")
    mtime = os.path.getmtime(filepath)
    last_updated = datetime.datetime.fromtimestamp(mtime).strftime('%b %d, %Y')
    
    current_page = SIDEBAR[current_index] if current_index != -1 else None
    host = request.host or request.headers.get('host', 'localhost')
    canonical_url = f"https://{host}{request.path}"
    
    return render_template('index.html', 
                           content=content_html, 
                           toc=toc_html,
                           sidebar=SIDEBAR, 
                           current_id=doc_id,
                           current_page=current_page,
                           prev_page=prev_page,
                           next_page=next_page,
                           last_updated=last_updated,
                           canonical_url=canonical_url)

@app.get('/api/search')
async def search():
    query = request.args.get('q', '').lower()
    if not query or len(query) < 2:
        return JSONResponse([])
    
    results = []
    for item in SIDEBAR:
        content_html, _ = render_markdown(item['id'])
        if content_html is None:
            continue
        # Strip HTML tags for searching
        text_content = re.sub('<[^<]+?>', '', content_html)
        
        if query in item['title'].lower() or query in text_content.lower():
            snippet = ""
            idx = text_content.lower().find(query)
            if idx != -1:
                start = max(0, idx - 40)
                end = min(len(text_content), idx + 60)
                snippet = "..." + text_content[start:end].strip() + "..."
            
            results.append({
                'title': item['title'],
                'id': item['id'],
                'snippet': snippet
            })
    
    return JSONResponse(results)

@app.exception(404)
async def page_not_found(req, exc):
    host = request.host or request.headers.get('host', 'localhost')
    canonical_url = f"https://{host}{request.path}"
    return render_template('index.html', 
                           content="<h1>404 - Page Not Found</h1><p>The documentation you are looking for does not exist.</p>", 
                           sidebar=SIDEBAR, 
                           current_id=None,
                           canonical_url=canonical_url), 404

@app.get('/sitemap.xml')
async def sitemap():
    root_url = f"https://{request.headers.get('host', 'localhost')}/"
    pages = []
    pages.append({
        "loc": root_url,
        "lastmod": datetime.datetime.now().strftime("%Y-%m-%d"),
        "priority": "1.0"
    })
    
    for item in SIDEBAR:
        pages.append({
            "loc": f"{root_url}docs/{item['id']}",
            "lastmod": datetime.datetime.now().strftime("%Y-%m-%d"),
            "priority": "0.8"
        })
        
    sitemap_xml = render_template('sitemap.xml', pages=pages)
    return Response(body=sitemap_xml, content_type="application/xml")

@app.get('/llms.txt')
async def llms():
    content = render_template('llms.txt')
    return Response(body=content, content_type='text/markdown')

@app.get('/robots.txt')
async def robots():
    root_url = f"https://{request.headers.get('host', 'localhost')}/"
    content = f"User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: {root_url}sitemap.xml"
    return Response(body=content, content_type='text/plain')

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8000)
