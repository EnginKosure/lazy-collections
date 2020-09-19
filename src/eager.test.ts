import { pipe } from './pipe'
import { eager } from './eager'
import { map } from './map'
import { wait } from './delay'
import { toArray } from './toArray'

async function bench(cb: Function) {
  const start = process.hrtime.bigint()
  await cb()
  const end = process.hrtime.bigint()
  return Number((end - start) / BigInt(1e6)) // Nanoseconds to milliseconds
}

it('should be possible to eager load an API call for example (from sync -> async)', async () => {
  function fetch(path: string) {
    return new Promise(resolve => setTimeout(resolve, 50, path))
  }

  const program = pipe(
    map(id => `/user/${id}`),
    map<string, unknown>(path => fetch(path)),
    eager(10),
    wait(), // This is important, otherwise we will resolve to an array of promises
    toArray()
  )

  const diff = await bench(() => {
    return expect(program([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).resolves.toEqual([
      '/user/1',
      '/user/2',
      '/user/3',
      '/user/4',
      '/user/5',
      '/user/6',
      '/user/7',
      '/user/8',
      '/user/9',
      '/user/10',
    ])
  })

  // Because we should at least wait 50ms per call
  expect(diff).toBeGreaterThanOrEqual(50)

  // If eager() was not there, then it would take ~500ms, so to verify that we did made some
  // "parallel" calls we can check if it is way smaller than that.
  expect(diff).toBeLessThanOrEqual(100)

  const diff2 = await bench(() => {
    return expect(program([1, 2, 3, 4, 5])).resolves.toEqual([
      '/user/1',
      '/user/2',
      '/user/3',
      '/user/4',
      '/user/5',
    ])
  })

  expect(diff2).toBeGreaterThanOrEqual(50)
  expect(diff2).toBeLessThanOrEqual(100)
})
