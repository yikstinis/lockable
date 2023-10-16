/**
 * Lock callback function.
 * The fact, that this function is called, means, that the lock was received.
 * The lock will be held until callback function is done or failed.
 */
export type LockableLockCallback = () => void | Promise<void>

/**
 * Lockable minimalistic interface.
 * If you need more flexible interface, just use:
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API
 * This implementation is required only to support old browsers.
 * It uses IndexedDB inside if Web Locks API is not supported.
 */
export interface Lockable {
  /**
   * Try to request the lock and call callback function, if was able to.
   * It returns a promise, that can be rejected with various errors.
   * Rejects with custom `LockableHangTimeoutError`, if it reaches timeout
   * while waiting for callback promise be resolved (more thab 5 seconds by default).
   * You must catch and handle this errors (make sure at least you know about it)!
   */
  request(callback: LockableLockCallback): Promise<void>
}
