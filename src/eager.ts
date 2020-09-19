import { isAsyncIterable } from './utils/iterator'
import { LazyIterable } from './shared-types'

export function eager<T>(size: number) {
  return function eagerFn(data: LazyIterable<T>) {
    if (data == null) return

    // TODO: Do we need to deal with this?
    if (isAsyncIterable(data) || data instanceof Promise) return data

    return {
      *[Symbol.iterator]() {
        const buffer = []
        const iterator = data[Symbol.iterator]()
        let state = { more: true }

        while (state.more) {
          for (let i = 0; i < size; i++) {
            const { value, done } = iterator.next()
            if (done) state.more = false
            if (!done) buffer.push(value)
          }

          yield* buffer.splice(0)
        }
      },
    }
  }
}
