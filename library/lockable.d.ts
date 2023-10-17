/**
 * Lockable options, passed to constructor.
 * Used to configure whole instance once, during creation.
 */
interface LockableOptions {
  /**
   * An amount of milliseconds, lockable waits for taken lock to release.
   * For cases, when we request a lock, which is currently taken.
   * Is used if isWaiting field equals true in lock request options.
   */
  waitTimout?: number // DEFAULT_WAIT_TIMEOUT = 3 * 1000
  /**
   * An amount of milliseconds, lockable waits after each lock check.
   * This value is used only by IndexedDB implementation.
   * Is also used if isWaiting field equals true in lock request options.
   */
  waitTickDelay?: number // DEFAULT_WAIT_TICK_DELAY = 250
  /**
   * Amount of miliseconds, after lock will be considered to hanged.
   * Lock request promise will be rejected, lock will be released.
   * It is not okay situation, if you reach this timeout.
   */
  hangTimeout?: number // DEFAULT_HANG_TIMOEUT = 10 * 1000
}

interface LockableLockRequestOptions {
  isWaiting: boolean
}

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
  request(
    options: LockableLockRequestOptions,
    callback: LockableLockCallback,
  ): Promise<void>
}
