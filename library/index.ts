import type { Lockable as LockableInterface, LockableOptions } from './lockable'
import { LockableIDB } from './lockable-idb'
import { LockableWebAPI } from './lockable-web-api'

/**
 * Lockable factory function.
 * Constructs one of existing implementations.
 * Web Locks API implementation will be used if possible:
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API
 */
export const Lockable = (
  name: string,
  options?: LockableOptions,
): LockableInterface =>
  LockableWebAPI.isSupported()
    ? new LockableWebAPI(name, options)
    : new LockableIDB(name, options)
