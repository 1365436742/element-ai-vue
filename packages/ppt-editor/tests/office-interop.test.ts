import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OfficeDocument } from '../src/core/index.js'
import { createLibreOfficeConverter } from '../src/server/conversion.js'

test(
  'LibreOffice opens generated PPTX, converts to legacy PPT and reimports editable text',
  { skip: process.env.PPT_TEST_SOFFICE !== '1' },
  async () => {
    const document = OfficeDocument.create('兼容性样本'),
      part = document.getScene().slides[0]!.part
    document.execute({
      type: 'object.add',
      part,
      object: {
        kind: 'text',
        text: '中文标题 / Interoperability',
        frame: { x: 80, y: 100, width: 700, height: 150 },
        style: { fontSize: 48, bold: true, color: '#234B3B' },
      },
    })
    document.execute({
      type: 'object.add',
      part,
      object: {
        kind: 'shape',
        geometry: 'ellipse',
        fill: '#E78A50',
        frame: { x: 900, y: 150, width: 180, height: 180 },
      },
    })
    const tableRef = document.execute({
      type: 'table.add',
      part,
      cells: [
        ['指标', '本期'],
        ['交付', '完成\n可编辑'],
      ],
      frame: { x: 80, y: 350, width: 700, height: 160 },
    }).ref!
    for (const axis of ['row', 'column'] as const) {
      document.execute({
        type: 'table.structure',
        ref: tableRef,
        axis,
        action: 'insert',
        index: 1,
      })
      document.execute({
        type: 'table.structure',
        ref: tableRef,
        axis,
        action: 'delete',
        index: 1,
      })
    }
    const converter = createLibreOfficeConverter({
      binary: process.env.SOFFICE_BINARY,
      timeoutMs: 90000,
    })
    const legacy = await converter.convert(document.export(), 'pptx', 'ppt')
    assert.equal(legacy[0], 0xd0)
    assert.equal(legacy[1], 0xcf)
    const modern = await converter.convert(legacy, 'ppt', 'pptx'),
      imported = OfficeDocument.load(modern)
    assert.equal(imported.getScene().slides.length, 1)
    const title = imported
      .getScene()
      .slides[0]!.objects.find((o) => o.text?.includes('Interoperability'))
    assert.ok(title)
    const table = imported
      .getScene()
      .slides[0]!.objects.find((o) => o.kind === 'table')
    assert.ok(table)
    assert.equal(table.cells?.[0]?.[0], '指标')
    imported.execute({
      type: 'table.set',
      ref: table,
      cells: [
        ['指标', '下期'],
        ['交付', '继续编辑'],
      ],
    })
    assert.equal(
      OfficeDocument.load(imported.export())
        .getScene()
        .slides[0]!.objects.find((o) => o.id === table.id)?.cells?.[1]?.[1],
      '继续编辑'
    )
    imported.execute({ type: 'text.set', ref: title, text: '转换后继续编辑' })
    assert.equal(
      OfficeDocument.load(imported.export())
        .getScene()
        .slides[0]!.objects.find((o) => o.id === title.id)?.text,
      '转换后继续编辑'
    )
  }
)
