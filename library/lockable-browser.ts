import type { Lockable, LockableLockCallback } from './lockable'
import { LockableHangTimeoutError } from './lockable-hang-timeout-error'

/**
 * Lockable Browser implementation.
 * This implementation is recommended and prefered.
 * Use it, if Web Locks API is supported and available.
 */
export class LockableBrowser implements Lockable {
  private name: string
  private hangTimeout: number

  static isSupported() {
    return !!window.navigator.locks
  }

  constructor(name: string, hangTimeout = 5 * 1000) {
    this.name = name
    this.hangTimeout = hangTimeout
  }

  private rejectHanged() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new LockableHangTimeoutError())
      }, this.hangTimeout)
    })
  }

  async request(callback: LockableLockCallback) {
    window.navigator.locks.request(this.name, { ifAvailable: true }, (lock) => {
      if (lock) {
        return Promise.race([this.rejectHanged(), callback()])
      }
    })
  }
}
