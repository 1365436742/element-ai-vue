/* eslint-disable no-console -- This manual benchmark writes measurements to stdout. */
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { EditorController } from '../src/controller.js'
const sample = process.env.PPT_SAMPLE_PATH
if (!sample) throw Error('Set PPT_SAMPLE_PATH to a local benchmark deck')
const bytes = readFileSync(sample)
const editor = new EditorController()
const time = async (fn: () => unknown) => {
  const t = performance.now()
  await fn()
  return performance.now() - t
}
console.log(
  'load_ms',
  await time(() =>
    editor.open(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    )
  )
)
const scene = editor.getState().scene
const text = scene.slides
  .flatMap((p) =>
    p.objects
      .filter((o) => !o.inherited && o.kind === 'text')
      .map((o) => ({ part: p.part, id: o.id }))
  )
  .at(0)!
const part = scene.slides[0]!.part
const table = await editor.execute({
  type: 'table.add',
  part,
  frame: { x: 10, y: 10, width: 200, height: 100 },
  cells: [
    ['a', 'b'],
    ['c', 'd'],
  ],
})
for (const name of ['text', 'frame', 'table', 'state']) {
  const samples: number[] = []
  for (let i = 0; i < 7; i++)
    samples.push(
      await time(() =>
        name === 'text'
          ? editor.execute({ type: 'text.set', ref: text, text: `bench ${i}` })
          : name === 'frame'
            ? editor.execute({
                type: 'object.update',
                ref: text,
                patch: { x: 20 + i },
              })
            : name === 'table'
              ? editor.execute({
                  type: 'table.set',
                  ref: table.ref!,
                  cells: [
                    [`${i}`, 'b'],
                    ['c', 'd'],
                  ],
                })
              : editor.getState()
      )
    )
  console.log(
    name,
    JSON.stringify(samples),
    'median_ms',
    samples.sort((a, b) => a - b)[3]
  )
}
