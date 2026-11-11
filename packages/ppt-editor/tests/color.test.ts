import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DOMParser } from '@xmldom/xmldom'
import { applyColorTransforms } from '../src/core/color.js'
const xml = (value: string) =>
  new DOMParser().parseFromString(
    `<a:srgbClr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" val="4472C4">${value}</a:srgbClr>`,
    'text/xml'
  ).documentElement

test('DrawingML tint and shade scale RGB channels with their specified proportions', () => {
  assert.equal(
    applyColorTransforms('#4472C4', xml('<a:tint val="20000"/>')),
    '#DAE3F3'
  )
  assert.equal(
    applyColorTransforms('#4472C4', xml('<a:shade val="50000"/>')),
    '#223962'
  )
})
test('DrawingML luminance transforms use HSL and alpha retains opacity', () => {
  assert.equal(
    applyColorTransforms('#4472C4', xml('<a:lumMod val="50000"/>')),
    '#203864'
  )
  assert.equal(
    applyColorTransforms('#4472C4', xml('<a:alpha val="50000"/>')),
    'rgba(68, 114, 196, 0.5)'
  )
  assert.equal(
    applyColorTransforms(
      '#4472C4',
      xml(
        '<a:alpha val="50000"/><a:alphaMod val="50000"/><a:alphaOff val="25000"/>'
      )
    ),
    'rgba(68, 114, 196, 0.5)'
  )
})
