import type { Lockable, LockableLockCallback } from './lockable'
import { LockableHangTimeoutError } from './lockable-hang-timeout-error'

/**
 * IndexedDB Lockable implementation.
 * If Web Locks API is not available for some reason, this one should be used.
 *
 * We can not use localStorage instead of IndexedDB.
 * It (localStorage) has undefined behaviour, when working with multiple tabs/windows.
 */
export class LockableIDB implements Lockable {
  private dbName = 'lockable-db'
  private dbVersion = 1
  private dbStoreName = 'lockable-db-locks'
  private dbTransactionMode: IDBTransactionMode = 'readwrite'

  private name: string
  private hangTimeout: number

  private db: Promise<IDBDatabase>

  constructor(name: string, hangTimeout = 5 * 1000) {
    this.name = name
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

  private async requestLockIfAvailable(): Promise<boolean> {
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

  private async releaseLock(): Promise<void> {
    const db = await this.db
    const transaction = db.transaction(this.dbStoreName, this.dbTransactionMode)
    const store = transaction.objectStore(this.dbStoreName)
    await this.promisifyDBRequest<number>(store.delete(this.name))
  }

  private rejectHanged() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new LockableHangTimeoutError())
      }, this.hangTimeout)
    })
  }

  public async request(callback: LockableLockCallback) {
    if (await this.requestLockIfAvailable()) {
      try {
        await Promise.race([this.rejectHanged(), callback()])
      } finally {
        await this.releaseLock()
      }
    }
  }
}
