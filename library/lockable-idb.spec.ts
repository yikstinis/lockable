import { LockableIDB } from './lockable-idb'

let lockable: LockableIDB

beforeAll(() => {
  lockable = new LockableIDB('lockable')
})

test('grants simple single lock once', (done) => {
  lockable.request({ isWaiting: false }, done)
})

test('grants lock when short wait is required', (done) => {
  lockable.request({ isWaiting: false }, () => {
    return new Promise((resolve) => {
      setTimeout(resolve, 2000)
    })
  })
  lockable.request({ isWaiting: true }, done)
})
