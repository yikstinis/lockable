import type {
  Lockable,
  LockableLockCallback,
  LockableLockRequestOptions,
  LockableOptions,
} from './lockable'
import {
  DEFAULT_HANG_TIMOEUT,
  DEFAULT_WAIT_TICK_DELAY,
  DEFAULT_WAIT_TIMEOUT,
} from './lockable-default-values'
import { LockableHangTimeoutError } from './lockable-hang-timeout-error'

/**
 * IndexedDB Lockable implementation.
 * If Web Locks API is not available for some reason, this one should be used.
 *
 * We can not use localStorage instead of IndexedDB.
 * It (localStorage) has undefined behaviour, when working with multiple tabs.
 */
export class LockableIDB implements Lockable {
  private db: Promise<IDBDatabase>

  private dbName = 'lockable-db'
  private dbVersion = 1
  private dbStoreName = 'lockable-db-locks'
  private dbTransactionMode: IDBTransactionMode = 'readwrite'

  private name: string
  private waitTimout: number
  private waitTickDelay: number
  private hangTimeout: number

  constructor(
    name: string,
    {
      waitTimout = DEFAULT_WAIT_TIMEOUT,
      waitTickDelay = DEFAULT_WAIT_TICK_DELAY,
      hangTimeout = DEFAULT_HANG_TIMOEUT,
    }: LockableOptions = {},
  ) {
    this.name = name
    this.waitTimout = waitTimout
    this.waitTickDelay = waitTickDelay
    this.hangTimeout = hangTimeout
    this.db = this.openDb()
  }

  private promisifyDBRequest<T>(request: IDBRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      request.addEventListener('success', () => {
        resolve(request.result as T)
      })
      request.addEventListener('error', () => {
        reject(request.error)
      })
    })
  }

  private openDb() {
    const openRequest = indexedDB.open(this.dbName, this.dbVersion)
    openRequest.addEventListener('upgradeneeded', () => {
      openRequest.result.createObjectStore(this.dbStoreName)
    })
    return this.promisifyDBRequest<IDBDatabase>(openRequest)
  }

  private async requestLockOnce(): Promise<boolean> {
    const db = await this.db
    const transaction = db.transaction(this.dbStoreName, this.dbTransactionMode)
    const store = transaction.objectStore(this.dbStoreName)

    // Find existing expiration record.
    const expiresAt = await this.promisifyDBRequest<number>(
      store.get(this.name),
    )
    // No existing record, or existing record expired.
    // No need to compare against undefined here.
    if (!expiresAt || expiresAt < Date.now()) {
      await this.promisifyDBRequest(
        store.put(Date.now() + this.hangTimeout, this.name),
      )
      return true
    }
    return false
  }

  private waitRequestTickDelay(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, this.waitTickDelay)
    })
  }

  private async requestLock(isWaiting: boolean): Promise<boolean> {
    if (!isWaiting) return this.requestLockOnce()
    const waitingExpiresAt = Date.now() + this.waitTimout
    while (Date.now() < waitingExpiresAt) {
      if (await this.requestLockOnce()) {
        return true
      }
      await this.waitRequestTickDelay()
    }
    return false
  }

  private async releaseLock(): Promise<void> {
    const db = await this.db
    const transaction = db.transaction(this.dbStoreName, this.dbTransactionMode)
    const store = transaction.objectStore(this.dbStoreName)
    await this.promisifyDBRequest<number>(store.delete(this.name))
  }

  private rejectHangedCallback() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new LockableHangTimeoutError())
      }, this.hangTimeout)
    })
  }

  public async request(
    { isWaiting }: LockableLockRequestOptions,
    callback: LockableLockCallback,
  ) {
    if (await this.requestLock(isWaiting)) {
      try {
        await Promise.race([this.rejectHangedCallback(), callback()])
      } finally {
        await this.releaseLock()
      }
    }
  }
}
