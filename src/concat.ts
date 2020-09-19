import { isAsyncIterable } from './utils/iterator'
import { LazyIterable } from './shared-types'

export function concat<T>(...data: LazyIterable<T>[]) {
  if (data.some(isAsyncIterable) || data.some(datum => datum instanceof Promise)) {
    return {
      async *[Symbol.asyncIterator]() {
        const stream = await Promise.all(data)
        for await (let datum of stream) yield* datum
      },
    }
  }

  return {
    *[Symbol.iterator]() {
      for (let datum of data as Iterable<T>[]) yield* datum
    },
  }
}
