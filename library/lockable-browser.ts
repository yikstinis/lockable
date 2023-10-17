import type {
  Lockable,
  LockableLockCallback,
  LockableLockRequestOptions,
  LockableOptions,
} from './lockable'
import {
  DEFAULT_HANG_TIMOEUT,
  DEFAULT_WAIT_TIMEOUT,
} from './lockable-default-values'
import { LockableHangTimeoutError } from './lockable-hang-timeout-error'

/**
 * Lockable Browser implementation.
 * This implementation is recommended and prefered.
 * Use it, if Web Locks API is supported and available.
 */
export class LockableBrowser implements Lockable {
  private name: string
  private waitTimout: number
  private hangTimeout: number

  static isSupported() {
    return !!window.navigator.locks
  }

  constructor(
    name: string,
    {
      waitTimout = DEFAULT_WAIT_TIMEOUT,
      hangTimeout = DEFAULT_HANG_TIMOEUT,
    }: LockableOptions = {},
  ) {
    this.name = name
    this.waitTimout = waitTimout
    this.hangTimeout = hangTimeout
  }

  private rejectHangedCallback() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new LockableHangTimeoutError())
      }, this.hangTimeout)
    })
  }

  async request(
    { isWaiting }: LockableLockRequestOptions,
    callback: LockableLockCallback,
  ) {
    let isStillWaiting = true
    setTimeout(() => {
      isStillWaiting = false
    }, this.waitTimout)

    window.navigator.locks.request(
      this.name,
      { ifAvailable: !isWaiting },
      (lock) => {
        if (lock && isStillWaiting) {
          return Promise.race([this.rejectHangedCallback(), callback()])
        }
      },
    )
  }
}
