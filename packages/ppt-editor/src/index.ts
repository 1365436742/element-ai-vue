import { createApp, h } from 'vue'
import { EditorController } from './controller.js'
import { PptEditor } from './ui/PptEditor.js'
import type { PptEditorOptions, PptEditorHandle } from './types.js'
export { PptEditor, EditorController }
export type * from './types.js'

/** DOM is accessed only when mounting, so importing the package is SSR-safe. */
export function createPptEditor(
  element: HTMLElement,
  options: PptEditorOptions = {}
): PptEditorHandle {
  const controller = new EditorController(options)
  const app = createApp({
    render: () =>
      h(PptEditor, { controller, options, editable: options.editable ?? true }),
  })
  app.mount(element)
  const destroy = controller.destroy.bind(controller)
  controller.destroy = () => {
    app.unmount()
    destroy()
  }
  return controller
}
