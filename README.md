# Lockable

Minimalistic Web Locks API. If you can ignore the old browsers - use
[Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)
directly instead. This module provides fallback, using
[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) for
older browsers.

## Why do not use localStorage?

In most modern browsers you will face undefined (depends on implementation
inside the browser) localStorage behavior during concurrent writes and reads
from multiple tabs/windows. To avoid this situation, we use IndexedDB with its
transactions instead.

## Usage example

```ts
import { Lockable } from '<path_to_lockable>'

// Try to avoid creating multiple instances if possible
const lockable = Lockable(
  'lockable', // Any lockable resource name
  5 * 1000, // Hang timeout in milliseconds
)

lockable
  // Try to request the lock
  .request(async () => {
    // Will be called, if lock is available right now.
    // If lock is taken already, callback will be ignored.
    await doSomeAsyncStuff()
  })
  .catch((error) => {
    if (error.name === 'LockableHangTimeoutError') {
      // Since this error lock is available,
      // but previous lock callback did not finished yet..
    }
    console.error(error)
  })
```
