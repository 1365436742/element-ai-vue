import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { unzipSync } from 'fflate'
import { OfficeDocument } from '../src/core/index.js'

// The private acceptance deck is supplied locally, never shipped in the package.
const sample = process.env.PPT_SAMPLE_PATH

test(
  'user sample: editable geometry, rich text, theme fills and merged table survive roundtrip',
  { skip: !sample },
  () => {
    const input = new Uint8Array(readFileSync(sample!))
    const doc = OfficeDocument.load(input)
    const scene = doc.getScene()
    assert.equal(scene.slides.length, 13)
    assert.equal(
      scene.slides[9]!.objects.find((o) => o.id === '49')!.fill,
      '#FFC000'
    )
    assert.equal(
      scene.slides[9]!.objects.find((o) => o.id === '59')!.fill,
      '#C55A11'
    )
    assert.equal(
      scene.slides[10]!.objects.filter((o) => o.kind === 'diagram').length,
      2
    )
    assert.equal(
      scene.slides[11]!.objects.filter((o) => o.kind === 'media').length,
      2
    )
    assert.equal(scene.slides[0]!.backgroundPaint?.kind, 'gradient')
    for (const page of scene.slides.slice(1, 4)) {
      assert.ok(page.objects.every((o) => o.kind !== 'unsupported'))
      assert.ok(
        page.objects
          .filter((o) => o.kind === 'shape' || o.kind === 'text')
          .every((o) => o.paths?.length)
      )
    }
    const numbered = scene.slides[5]!.objects.flatMap(
      (o) => o.richText?.paragraphs ?? []
    ).filter((p) => p.bullet?.type === 'number')
    assert.ok(numbered.length > 10)
    assert.ok(
      scene.slides[8]!.objects.some((o) => o.paint?.kind === 'gradient')
    )
    assert.ok(scene.slides[8]!.objects.some((o) => o.paint?.kind === 'image'))
    const table = scene.slides[12]!.objects.find((o) => o.kind === 'table')!
    assert.equal(table.cells!.length, 9)
    assert.equal(table.cells![0]!.length, 8)
    assert.equal(table.tableCells![1]![5]!.columnSpan, 3)
    assert.deepEqual(table.tableCells![1]![7]!.mergedInto, {
      row: 1,
      column: 5,
    })
    assert.equal(table.tableCells![1]![5]!.fill, '#ED7D31')
    const changed = table.cells!.map((row) => [...row])
    changed[1]![5] = '合并单元格编辑验证\n第二行'
    doc.execute({ type: 'table.set', ref: table, cells: changed })
    const shape = scene.slides[1]!.objects.find(
      (o) => o.geometry === 'ellipse'
    )!
    assert.ok(shape)
    doc.execute({
      type: 'object.update',
      ref: shape,
      patch: { x: shape.x + 12, fill: '#135724' },
    })
    const output = doc.export()
    const restored = OfficeDocument.load(output).getScene()
    const result = restored.slides[12]!.objects.find((o) => o.id === table.id)!
    assert.equal(result.cells![1]![5], changed[1]![5])
    assert.equal(result.tableCells![1]![5]!.columnSpan, 3)
    assert.equal(
      restored.slides[1]!.objects.find((o) => o.id === shape.id)!.fill,
      '#135724'
    )
    const before = unzipSync(input),
      after = unzipSync(output)
    const editedParts = new Set([table.part, shape.part])
    assert.deepEqual(Object.keys(after).sort(), Object.keys(before).sort())
    for (const [part, bytes] of Object.entries(before)) {
      if (!editedParts.has(part))
        assert.deepEqual(after[part], bytes, `Unedited part changed: ${part}`)
    }
  }
)
