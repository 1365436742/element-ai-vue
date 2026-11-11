import { mkdir, readFile, rename, open } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { RoomStore, PersistedRoom } from './room.js'

/** One atomic checkpoint contains the OOXML, CRDT, dedupe log and generation lease. */
export function createFileRoomStore(directory: string): RoomStore {
  const filename = (id: string) => {
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new Error('Invalid room ID')
    return join(directory, `${id}.json`)
  }
  return {
    async load(id) {
      try {
        return JSON.parse(await readFile(filename(id), 'utf8')) as PersistedRoom
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
        throw error
      }
    },
    async save(id, state) {
      await mkdir(directory, { recursive: true })
      const destination = filename(id),
        temp = destination + '.' + randomUUID() + '.tmp'
      const file = await open(temp, 'wx', 0o600)
      try {
        await file.writeFile(JSON.stringify(state))
        await file.sync()
      } finally {
        await file.close()
      }
      await rename(temp, destination)
      const folder = await open(directory, 'r')
      try {
        await folder.sync()
      } finally {
        await folder.close()
      }
    },
  }
}
