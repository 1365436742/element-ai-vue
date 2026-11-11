import type { DrawingPaint } from './drawing/paint.js'
import type { RichTextScene } from './drawing/text.js'
export interface ObjectRef {
  part: string
  id: string
}
export interface TextStyle {
  fontSize?: number
  fontFamily?: string
  color?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  align?: 'left' | 'center' | 'right'
}
export interface Frame {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}
export interface TableCellScene {
  rowSpan: number
  columnSpan: number
  mergedInto?: { row: number; column: number }
  fill?: string
  style: TextStyle
  verticalAlign: 'top' | 'center' | 'bottom'
  margins: { top: number; right: number; bottom: number; left: number }
  borders?: Partial<
    Record<
      'top' | 'right' | 'bottom' | 'left',
      { color: string; width: number }
    >
  >
}
export interface ImageCrop {
  left: number
  right: number
  top: number
  bottom: number
}
export interface SceneObject extends Frame {
  id: string
  part: string
  kind:
    | 'text'
    | 'shape'
    | 'image'
    | 'media'
    | 'table'
    | 'diagram'
    | 'unsupported'
  name: string
  paint?: DrawingPaint
  text?: string
  richText?: RichTextScene
  style?: TextStyle
  fill?: string
  stroke?: string
  strokeWidth?: number
  geometry?: string
  paths?: { d: string; fill: string; stroke: boolean }[]
  textRect?: { x: number; y: number; width: number; height: number }
  flipH?: boolean
  flipV?: boolean
  strokeDash?: string
  headEnd?: string
  tailEnd?: string
  crop?: ImageCrop
  mediaType?: 'audio' | 'video'
  poster?: string
  src?: string
  inherited?: boolean
  placeholder?: string
  cells?: string[][]
  tableCells?: TableCellScene[][]
  columnWidths?: number[]
  rowHeights?: number[]
  /** Local dimensions of the cached diagram before ancestor group scaling. */
  childCoordinateSize?: { width: number; height: number }
  children?: SceneObject[]
  diagramTexts?: { id: string; text: string }[]
  diagramNodeId?: string
}
export interface ScenePage {
  id: string
  part: string
  name: string
  background: string
  backgroundPaint?: DrawingPaint
  objects: SceneObject[]
  layoutPart?: string
  masterPart?: string
}
export interface Diagnostic {
  code: string
  message: string
  part?: string
  severity: 'info' | 'warning' | 'error'
}
export interface PresentationScene {
  title: string
  width: number
  height: number
  slides: ScenePage[]
  masters: ScenePage[]
  layouts: ScenePage[]
  diagnostics: Diagnostic[]
  variant: 'transitional' | 'strict'
}
export type Command =
  | { type: 'diagram.text.set'; ref: ObjectRef; nodeId: string; text: string }
  | { type: 'image.crop'; ref: ObjectRef; crop: ImageCrop }
  | {
      type: 'resource.replace'
      ref: ObjectRef
      data: Uint8Array
      mimeType: string
    }
  | {
      type: 'object.add'
      part: string
      object: {
        kind: 'text' | 'shape' | 'image'
        id?: string
        name?: string
        text?: string
        frame: Frame
        style?: TextStyle
        fill?: string
        stroke?: string
        geometry?: string
        data?: Uint8Array
        mimeType?: string
      }
    }
  | {
      type: 'object.update'
      ref: ObjectRef
      patch: Partial<Frame> & {
        fill?: string
        stroke?: string
        style?: TextStyle
      }
    }
  | { type: 'text.set'; ref: ObjectRef; text: string; style?: TextStyle }
  | { type: 'object.delete'; ref: ObjectRef }
  | {
      type: 'object.reorder'
      ref: ObjectRef
      direction: 'front' | 'back' | 'forward' | 'backward'
    }
  | { type: 'slide.add'; after?: string; layoutPart?: string; name?: string }
  | { type: 'slide.delete'; part: string }
  | { type: 'slide.duplicate'; part: string }
  | { type: 'slide.move'; part: string; index: number }
  | { type: 'page.background'; part: string; color: string }
  | { type: 'layout.apply'; part: string; layoutPart: string }
  | {
      type: 'theme.update'
      part?: string
      colors?: Record<string, string>
      fontFamily?: string
    }
  | { type: 'page.rename'; part: string; name: string }
  | { type: 'master.add'; name?: string }
  | { type: 'layout.add'; masterPart: string; name?: string }
  | { type: 'master.delete'; part: string; replacementPart?: string }
  | { type: 'layout.delete'; part: string; replacementPart?: string }
  | {
      type: 'master.duplicate' | 'layout.duplicate'
      part: string
      name?: string
    }
  | {
      type: 'placeholder.set'
      ref: ObjectRef
      placeholderType: string
      index: number
    }
  | { type: 'layout.reset'; part: string }
  | { type: 'page.showMaster'; part: string; visible: boolean }
  | { type: 'slides.import'; data: Uint8Array; slideParts?: string[] }
  | {
      type: 'table.add'
      part: string
      cells: string[][]
      frame: Frame
      name?: string
    }
  | { type: 'table.set'; ref: ObjectRef; cells: string[][] }
  | {
      type: 'table.structure'
      ref: ObjectRef
      axis: 'row' | 'column'
      action: 'insert' | 'delete'
      index: number
    }
export interface CommandResult {
  changed: boolean
  ref?: ObjectRef
  part?: string
}
export type PptSource =
  | string
  | File
  | Blob
  | ArrayBuffer
  | { type: 'url'; url: string; request?: RequestInit }
  | { type: 'file'; file: File | Blob | ArrayBuffer }
  | {
      type: 'binary-stream'
      stream: ReadableStream<Uint8Array>
      fileName: string
    }
  | {
      type: 'events'
      events: AsyncIterable<GenerationEvent>
      mode?: 'replace' | 'append'
    }
  | { type: 'new'; title?: string }
export type GenerationEvent =
  | {
      type: 'generation.start'
      sessionId: string
      seq: number
      mode?: 'replace' | 'append'
      title?: string
    }
  | { type: 'command'; sessionId: string; seq: number; command: Command }
  | { type: 'generation.complete'; sessionId: string; seq: number }
  | {
      type: 'generation.error'
      sessionId: string
      seq: number
      message: string
    }
export interface ConversionAdapter {
  convert(
    input: Uint8Array,
    from: 'ppt' | 'pptx',
    to: 'ppt' | 'pptx',
    signal?: AbortSignal
  ): Promise<Uint8Array>
}
export interface CollaborationOptions {
  url: string
  roomId: string
  token: string
  user: { id: string; name: string; color?: string }
}
export interface PptEditorOptions {
  source?: PptSource
  editable?: boolean
  conversion?: ConversionAdapter
  collaboration?: CollaborationOptions
  theme?: 'light' | 'dark'
  locale?: 'zh-CN' | 'en'
  title?: string
}
export type EditorPhase =
  | 'ready'
  | 'loading'
  | 'generating'
  | 'finalizing'
  | 'error'
  | 'destroyed'
export interface EditorState {
  phase: EditorPhase
  editable: boolean
  revision: number
  scene: PresentationScene
  error?: string
  canUndo: boolean
  canRedo: boolean
  workspace: 'slides' | 'master'
  generation?: { sessionId: string; seq: number }
  connection?: 'offline' | 'connecting' | 'connected'
  peers?: { id: string; name: string; color?: string }[]
}
export interface PptEditorHandle {
  open(source: PptSource): Promise<void>
  getState(): EditorState
  execute(command: Command): Promise<CommandResult>
  applyGenerationEvent(event: GenerationEvent): Promise<void>
  cancelGeneration(): void
  resolveDraft(action: 'accept' | 'discard'): void
  exportFile(options?: { format?: 'pptx' | 'ppt' }): Promise<Blob>
  undo(): Promise<void>
  redo(): Promise<void>
  setWorkspace(workspace: 'slides' | 'master'): void
  destroy(): void
  subscribe(listener: (state: EditorState) => void): () => void
}
