# Lockable

Minimalistic lock implementation with fallback for browsers not supporting
[Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API).
Fallback implementation uses IndexedDB inside. That is the reason of required
timeouts, we have. Some might consider this an advantage.

## Why do not use localStorage?

In most modern browsers you will face undefined (depends on implementation
inside the browser) localStorage behavior during concurrent writes and reads
from multiple tabs/windows. To avoid this situation, we use IndexedDB with its
transactions instead.

## Usage example

```typescript
import { Lockable } from 'lockable'

// Try to avoid creating multiple instances if possible
const lockable = Lockable(
  'lockable', // Any lockable name
  {
    /**
     * An amount of milliseconds, lockable waits for taken lock to release.
     * For cases, when we request a lock, which is currently taken.
     * Is used if isWaiting field equals true in lock request options.
     */
    waitTimout: 3 * 1000, // DEFAULT_WAIT_TIMEOUT = 3 * 1000
    /**
     * An amount of milliseconds, lockable waits after each lock check.
     * This value is used only by IndexedDB implementation.
     * Is also used if isWaiting field equals true in lock request options.
     */
    waitTickDelay: 250, // DEFAULT_WAIT_TICK_DELAY = 250
    /**
     * Amount of miliseconds, after lock will be considered to hanged.
     * Lock request promise will be rejected, lock will be released.
     * It is not okay situation, if you reach this timeout.
     */
    hangTimeout: 10 * 1000, // DEFAULT_HANG_TIMOEUT = 10 * 1000
  },
)

lockable
  .request({ isWaiting: false }, () => {
    lockable
      .request({ isWaiting: false }, () => {
        // We only receive lock immediately, but it is taken now...
        console.log('Yo will never see this message!')
      })
      .catch(console.error)

    lockable
      .request({ isWaiting: true }, () => {
        // We will wait maximum 3 seconds (waitTimout) for lock to release
        // This one should be released after ~ 2 seconds, so we recive next one too.
        console.log('Lock received second time!')
      })
      .catch(console.error)

    return new Promise((resolve) => {
      setTimeout(resolve, 2000)
    })
  })
  .catch((error) => {
    if (error.name === 'LockableHangTimeoutError') {
      // Since this error fired, lock is available,
      // but previous lock callback promise wasn't resolved yet. :(
    }
    console.error(error)
  })
```
