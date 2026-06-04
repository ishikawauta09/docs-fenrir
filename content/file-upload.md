# File Upload

### Single File Upload

```python
from fenrir import File, UploadFile

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    return {
        "filename": file.filename,
        "size": len(contents),
        "content_type": file.content_type
    }
```

### Multiple Files Upload

```python
from typing import List
from fenrir import File, UploadFile

@app.post("/upload-multiple")
async def upload_multiple(files: List[UploadFile] = File(...)):
    results = []
    for file in files:
        contents = await file.read()
        results.append({
            "filename": file.filename,
            "size": len(contents)
        })
    return results
```

### File Upload with Form Data

```python
from fenrir import Form, File, UploadFile

@app.post("/upload-with-form")
async def upload_with_form(
    title: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...)
):
    contents = await file.read()
    return {
        "title": title,
        "description": description,
        "filename": file.filename,
        "file_size": len(contents)
    }
```

### Save Uploaded Files

```python
import os
from fenrir import UploadFile, File

@app.post("/save-file")
async def save_file(file: UploadFile = File(...)):
    # Create uploads directory
    os.makedirs("uploads", exist_ok=True)
    
    # Save file
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as f:
        contents = await file.read()
        f.write(contents)
    
    return {"message": "File saved", "path": file_path}
```
