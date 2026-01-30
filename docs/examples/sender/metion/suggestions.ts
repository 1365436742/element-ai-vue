import { computePosition, flip, shift } from '@floating-ui/dom'
import type { VirtualElement } from '@floating-ui/dom'
import { posToDOMRect, VueRenderer } from '@tiptap/vue-3'
import { Editor } from '@tiptap/core'
import type { SuggestionProps } from '@tiptap/suggestion'
import MentionList from './MentionList.vue'

const updatePosition = (editor: Editor, element: HTMLElement) => {
  const virtualElement: VirtualElement = {
    getBoundingClientRect: () =>
      posToDOMRect(
        editor.view,
        editor.state.selection.from,
        editor.state.selection.to
      ),
  }

  computePosition(virtualElement, element, {
    placement: 'bottom-start',
    strategy: 'absolute',
    middleware: [shift(), flip()],
  }).then(({ x, y, strategy }) => {
    element.style.width = 'max-content'
    element.style.position = strategy
    element.style.left = `${x}px`
    element.style.top = `${y}px`
  })
}
const suggestions: any[] = [
  {
    char: '@',
    items: ({ query }: { query: string }) => {
      return [
        'Lea Thompson',
        'Cyndi Lauper',
        'Tom Cruise',
        'Madonna',
        'Jerry Hall',
        'Joan Collins',
        'Winona Ryder',
        'Christina Applegate',
        'Alyssa Milano',
        'Molly Ringwald',
        'Ally Sheedy',
        'Debbie Harry',
        'Olivia Newton-John',
        'Elton John',
        'Michael J. Fox',
        'Axl Rose',
        'Emilio Estevez',
        'Ralph Macchio',
        'Rob Lowe',
        'Jennifer Grey',
        'Mickey Rourke',
        'John Cusack',
        'Matthew Broderick',
        'Justine Bateman',
        'Lisa Bonet',
      ]
        .filter((item) => item.toLowerCase().startsWith(query.toLowerCase()))
        .slice(0, 5)
    },

    render: () => {
      let component: VueRenderer

      return {
        onStart: (props: SuggestionProps) => {
          component = new VueRenderer(MentionList, {
            // using vue 2:
            // parent: this,
            // propsData: props,
            // using vue 3:
            props,
            editor: props.editor,
          })

          if (!props.clientRect) {
            return
          }

          ;(component.element as HTMLElement).style.position = 'absolute'

          document.body.appendChild(component.element as HTMLElement)

          updatePosition(props.editor, component.element as HTMLElement)
        },

        onUpdate(props: SuggestionProps) {
          component.updateProps(props)

          if (!props.clientRect) {
            return
          }

          updatePosition(props.editor, component.element as HTMLElement)
        },

        onKeyDown(props: SuggestionProps) {
          // @ts-ignore
          if (props.event.key === 'Escape') {
            component.destroy()

            return true
          }

          return component.ref?.onKeyDown(props)
        },

        onExit() {
          component.destroy()
        },
      }
    },
  },
  {
    char: '#',
    items: ({ query }: { query: string }) => {
      return ['Dirty Dancing', 'Pirates of the Caribbean', 'The Matrix']
        .filter((item) => item.toLowerCase().startsWith(query.toLowerCase()))
        .slice(0, 5)
    },

    render: () => {
      let component: VueRenderer

      return {
        onStart: (props: SuggestionProps) => {
          component = new VueRenderer(MentionList, {
            // using vue 2:
            // parent: this,
            // propsData: props,
            // using vue 3:
            props,
            editor: props.editor,
          })

          if (!props.clientRect) {
            return
          }

          ;(component.element as HTMLElement).style.position = 'absolute'

          document.body.appendChild(component.element as HTMLElement)

          updatePosition(props.editor, component.element as HTMLElement)
        },

        onUpdate(props: SuggestionProps) {
          component.updateProps(props)

          if (!props.clientRect) {
            return
          }

          updatePosition(props.editor, component.element as HTMLElement)
        },

        onKeyDown(props: SuggestionProps) {
          // @ts-ignore
          if (props.event.key === 'Escape') {
            component.destroy()

            return true
          }

          return component.ref?.onKeyDown(props)
        },

        onExit() {
          component.destroy()
        },
      }
    },
  },
]

export default suggestions
