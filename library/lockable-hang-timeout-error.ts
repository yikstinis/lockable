/**
 * Custom lock hang timeout error for easy catching.
 * We add error name to be able to find this error among others.
 * This error should mean, that lock callback did not finished,
 * but timeout was reached and lock was released.
 */
export class LockableHangTimeoutError extends Error {
  public name = 'LockableHangTimeoutError'
  constructor() {
    super('Lockable hang timeout reached!')
  }
}
