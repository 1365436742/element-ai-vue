import { execFile } from 'node:child_process'
import { mkdtemp, writeFile, readFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ConversionAdapter } from '../types.js'

/** Run this adapter in an isolated conversion container, separate from the collaboration process. */
export function createLibreOfficeConverter(
  options: {
    binary?: string
    timeoutMs?: number
    maxConcurrent?: number
    maxBytes?: number
  } = {}
): ConversionAdapter {
  let active = 0
  return {
    async convert(input, from, to, signal) {
      if (from === to) return input.slice()
      if (active >= (options.maxConcurrent ?? 2))
        throw new Error('CONVERSION_BUSY: retry later')
      if (input.length > (options.maxBytes ?? 100 * 1024 * 1024))
        throw new Error('Conversion input limit exceeded')
      if (!['ppt', 'pptx'].includes(from) || !['ppt', 'pptx'].includes(to))
        throw new Error('Unsupported conversion format')
      signal?.throwIfAborted()
      active++
      let directory: string | undefined
      try {
        directory = await mkdtemp(join(tmpdir(), 'element-ppt-'))
        const source = join(directory, `input.${from}`),
          out = join(directory, 'output'),
          profile = join(directory, 'profile')
        await mkdir(out)
        await writeFile(source, input)
        const filter =
          to === 'pptx'
            ? 'pptx:Impress MS PowerPoint 2007 XML'
            : 'ppt:MS PowerPoint 97'
        await new Promise<void>((resolve, reject) =>
          execFile(
            options.binary ?? 'soffice',
            [
              `-env:UserInstallation=${pathToFileURL(profile).href}`,
              '--headless',
              '--nologo',
              '--nodefault',
              '--norestore',
              '--convert-to',
              filter,
              '--outdir',
              out,
              source,
            ],
            {
              timeout: options.timeoutMs ?? 60000,
              maxBuffer: 1024 * 1024,
              signal,
            },
            (error) =>
              error
                ? reject(new Error(`CONVERSION_FAILED: ${error.message}`))
                : resolve()
          )
        )
        const result = await readFile(join(out, `input.${to}`))
        if (
          !result.length ||
          result.length > (options.maxBytes ?? 100 * 1024 * 1024)
        )
          throw new Error('Invalid converted file size')
        if (to === 'pptx' && (result[0] !== 0x50 || result[1] !== 0x4b))
          throw new Error('Converter did not produce PPTX')
        if (to === 'ppt' && (result[0] !== 0xd0 || result[1] !== 0xcf))
          throw new Error('Converter did not produce PPT')
        return new Uint8Array(result)
      } finally {
        active--
        if (directory) await rm(directory, { recursive: true, force: true })
      }
    },
  }
}
