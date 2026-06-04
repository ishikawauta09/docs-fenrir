# Background Tasks

### Simple Background Task

```python
from fenrir import BackgroundTask

@app.post("/send-email")
async def send_email():
    task = BackgroundTask(send_email_task, "user@example.com")
    return {"message": "Email queued", "background_task": task}

async def send_email_task(email: str):
    # Send email asynchronously
    print(f"Sending email to {email}")
    await asyncio.sleep(2)
    print(f"Email sent to {email}")
```

### Multiple Background Tasks

```python
from fenrir import BackgroundTasks

@app.post("/tasks")
async def create_task(background_tasks: BackgroundTasks):
    background_tasks.add_task(process_data, 1)
    background_tasks.add_task(send_notification, "user@example.com")
    return {"message": "Tasks queued"}

async def process_data(data_id: int):
    print(f"Processing data {data_id}")

async def send_notification(email: str):
    print(f"Sending notification to {email}")
```

### Using Sanic-style Task Scheduler

```python
@app.listener("before_server_start")
async def setup_scheduler(app_instance):
    # Schedule background task when the server starts
    app_instance.add_task(scheduled_task())

async def scheduled_task():
    while True:
        print("Running scheduled task")
        await asyncio.sleep(60)
```
