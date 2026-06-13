# Signals

Fenrir provides a signal system inspired by Blinker for event-driven programming. Signals allow decoupled components to notify each other when certain events occur.

### signal() Function

The `signal()` function is the primary way to get or create a named signal on the global signal bus:

```python
from fenrir.signals import signal

# Create or get a signal by name
user_created = signal("user-created")
db_ready = signal("db-ready", doc="Fired when the database connection is ready")
```

If a signal with the given name already exists, it is returned. Otherwise a new `Signal` is created and registered on the global `Namespace`.

### Namespace Class

`Namespace` is a dict subclass that holds named signals:

```python
from fenrir.signals import signal_bus

# signal_bus is the global Namespace instance
# Create signals within it
auth_signal = signal_bus.signal("auth-success")
payment_signal = signal_bus.signal("payment-completed")

# Iterate over registered signals
for name, sig in signal_bus.items():
    print(f"Signal: {name} ({len(sig.receivers)} receivers)")

# Access a signal directly
sig = signal_bus["user-created"]
```

### Signal Class

`Signal` objects represent individual event channels.

#### `Signal.connect(receiver, sender=None, weak=True)`

Connect a receiver function to the signal. The receiver is called with `(sender, **kwargs)` whenever the signal is sent. Returns the receiver so it can be used as a decorator:

```python
from fenrir.signals import signal

my_signal = signal("my-signal")

# Direct connection
def on_event(sender, **kwargs):
    print("Event received!")

my_signal.connect(on_event)

# As a decorator
@my_signal.connect
def on_event_decorated(sender, **kwargs):
    print("Decorated handler!")
```

#### `Signal.disconnect(receiver, sender=None)`

Remove a previously connected receiver:

```python
from fenrir.signals import signal

my_signal = signal("my-signal")

def handler(sender, **kwargs):
    print("Handled!")

my_signal.connect(handler)
my_signal.disconnect(handler)

# Or disconnect all receivers at once
my_signal.receivers.clear()
```

#### `Signal.send(sender=None, **kwargs)`

Send the signal to all connected receivers. Returns a list of `(receiver, result)` pairs:

```python
from fenrir.signals import signal

order_completed = signal("order-completed")

@order_completed.connect
def notify_user(sender, order_id=None, **kwargs):
    print(f"Order {order_id} completed")

@order_completed.connect
def update_inventory(sender, order_id=None, **kwargs):
    print(f"Inventory updated for order {order_id}")

# Send the signal — all receivers are called
results = order_completed.send(sender=None, order_id=42)
```

### Built-in Signals

Fenrir ships with four built-in signals:

| Signal | Description |
|---|---|
| `request_started` | Fires before each request is processed |
| `request_finished` | Fires after each request completes |
| `got_request_exception` | Fires when an unhandled exception occurs |
| `template_rendered` | Fires after a template is rendered |

```python
from fenrir.signals import (
    request_started,
    request_finished,
    got_request_exception,
    template_rendered,
)

def on_request_start(sender, **kwargs):
    print("Request started")

request_started.connect(on_request_start)

def on_request_finish(sender, response=None, **kwargs):
    print(f"Request finished with status {response.status if response else 'unknown'}")

request_finished.connect(on_request_finish)

def on_exception(sender, exception=None, **kwargs):
    print(f"Exception: {exception}")

got_request_exception.connect(on_exception)

def on_template(sender, template=None, context=None, **kwargs):
    print(f"Template rendered: {template}")

template_rendered.connect(on_template)
```

### Async Receivers

Signals support both sync and async receiver functions. Async receivers are automatically scheduled as asyncio tasks when a running event loop is available:

```python
import asyncio
from fenrir.signals import signal

data_ready = signal("data-ready")

# Sync receiver
def sync_handler(sender, data=None, **kwargs):
    print(f"Sync: {data}")

# Async receiver
async def async_handler(sender, data=None, **kwargs):
    await asyncio.sleep(0.1)
    print(f"Async: {data}")

data_ready.connect(sync_handler)
data_ready.connect(async_handler)

# Both handlers are called when signal is sent
data_ready.send(sender=None, data="hello")
```

### Error Handling for Async Receivers

Exceptions raised by async receivers are logged and do not crash the application. If no event loop is running, async receivers are silently skipped:

```python
import asyncio
from fenrir.signals import signal

async def bad_receiver(sender, **kwargs):
    raise ValueError("Something went wrong")

my_signal = signal("my-signal")
my_signal.connect(bad_receiver)

# The exception is logged but not raised — other receivers still run
my_signal.send(sender=None)
```

If an async receiver raises an exception, the `_handle_signal_error` callback logs it via `logging.getLogger("fenrir.signals")`. Sync receivers that raise exceptions propagate normally.

### Signal API Reference

| Function / Class | Description |
|---|---|
| `signal(name, doc=None)` | Get or create a named signal on the global signal bus. Returns `Signal`. |
| `signal_bus` | The global `Namespace` instance holding all registered signals. |
| `Namespace.signal(name, doc=None)` | Create or get a named signal within a namespace. |
| `Signal.connect(receiver, sender=None, weak=True)` | Connect a receiver. Returns the receiver for use as a decorator. |
| `Signal.disconnect(receiver, sender=None)` | Remove a receiver from the signal. |
| `Signal.send(sender=None, **kwargs)` | Send the signal to all connected receivers. Returns `List[Tuple[Callable, Any]]`. |
| `request_started` | Built-in signal fired before each request. |
| `request_finished` | Built-in signal fired after each request. |
| `got_request_exception` | Built-in signal fired on unhandled exceptions. |
| `template_rendered` | Built-in signal fired after a template is rendered. |
