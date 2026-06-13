# File Upload

Fenrir provides the `UploadFile` class for handling file uploads. It wraps file-like objects and transparently supports both sync and async file backends.

## UploadFile

### Attributes

| Attribute     | Type          | Description                                      |
|---------------|---------------|--------------------------------------------------|
| `filename`    | `str`         | The original filename of the uploaded file.       |
| `file`        | `SpooledTemporaryFile` | The underlying file-like object.          |
| `content_type`| `str`         | The MIME type of the uploaded file.               |

### Methods

All methods are `async` and internally handle both sync and async file objects transparently — you call them the same way regardless of the underlying file type.

#### `read(size=-1) -> bytes`

Read up to `size` bytes from the file. If `size` is `-1` (the default), the entire file is read.

```python
contents = await file.read()       # entire file
chunk = await file.read(1024)      # first 1024 bytes
```

#### `write(data: bytes)`

Write `data` bytes to the file.

```python
await file.write(b"hello world")
```

#### `seek(offset: int)`

Move the file pointer to the given byte offset.

```python
await file.seek(0)   # rewind to beginning
```

#### `close()`

Close the underlying file. If the file object has no `close` method this is a no-op.

```python
await file.close()
```

---

## Examples

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
    os.makedirs("uploads", exist_ok=True)

    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as f:
        contents = await file.read()
        f.write(contents)

    return {"message": "File saved", "path": file_path}
```

### Seek and Re-read

```python
from fenrir import File, UploadFile

@app.post("/upload-validate")
async def upload_validate(file: UploadFile = File(...)):
    contents = await file.read()

    # Validate the file content
    if len(contents) == 0:
        return {"error": "Empty file"}

    # Seek back and read again to demonstrate seek support
    await file.seek(0)
    reread = await file.read()

    assert contents == reread
    return {"filename": file.filename, "size": len(contents)}
```

### Write to an UploadFile

```python
from fenrir import File, UploadFile

@app.post("/upload-modify")
async def upload_modify(file: UploadFile = File(...)):
    original = await file.read()

    # Write additional data
    await file.seek(0)
    await file.write(b"PREFIX:" + original)

    await file.seek(0)
    modified = await file.read()

    return {"modified_size": len(modified)}
```
