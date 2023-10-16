import type { Lockable as LockableInterface } from './lockable'
import { LockableBrowser } from './lockable-browser'
import { LockableIDB } from './lockable-idb'

/**
 * Lockable factory function.
 * Constructs one of existing implementations.
 * Web Locks API implementation will be used if possible:
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API
 */
export const Lockable = (
  name: string,
  hangTimeout?: number,
): LockableInterface =>
  LockableBrowser.isSupported()
    ? new LockableBrowser(name, hangTimeout)
    : new LockableIDB(name, hangTimeout)
