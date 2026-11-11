import { defineComponent, h, ref, type PropType } from 'vue'
import type { Command, SceneObject, ImageCrop } from '../types.js'
export const AssetInspector = defineComponent({
  props: {
    object: { type: Object as PropType<SceneObject>, required: true },
    editable: Boolean,
    execute: {
      type: Function as PropType<(command: Command) => Promise<unknown>>,
      required: true,
    },
  },
  setup(props) {
    const error = ref(''),
      busy = ref(false)
    async function run(command: Command) {
      busy.value = true
      error.value = ''
      try {
        await props.execute(command)
      } catch (e) {
        error.value = e instanceof Error ? e.message : String(e)
      } finally {
        busy.value = false
      }
    }
    return () =>
      h(
        'fieldset',
        {
          class: 'ppt-resource-inspector',
          disabled: !props.editable || busy.value,
        },
        [
          h('legend', props.object.kind === 'media' ? '媒体资源' : '图片资源'),
          h('label', [
            '替换资源',
            h('input', {
              type: 'file',
              'aria-label': '替换资源',
              accept:
                props.object.kind === 'media'
                  ? props.object.mediaType === 'audio'
                    ? 'audio/mpeg'
                    : 'video/mp4'
                  : 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml',
              onChange: async (e: Event) => {
                const input = e.target as HTMLInputElement,
                  file = input.files?.[0]
                if (file)
                  await run({
                    type: 'resource.replace',
                    ref: props.object,
                    data: new Uint8Array(await file.arrayBuffer()),
                    mimeType: file.type,
                  })
                input.value = ''
              },
            }),
          ]),
          props.object.kind === 'image'
            ? h(
                'div',
                { class: 'ppt-field-grid' },
                (['left', 'right', 'top', 'bottom'] as const).map((side) =>
                  h('label', [
                    `${{ left: '左', right: '右', top: '上', bottom: '下' }[side]}侧裁剪 (%)`,
                    h('input', {
                      type: 'number',
                      step: 0.01,
                      min: -1000,
                      max: 1000,
                      'aria-label': `${{ left: '左', right: '右', top: '上', bottom: '下' }[side]}侧裁剪百分比`,
                      value: Number(
                        ((props.object.crop?.[side] ?? 0) * 100).toFixed(3)
                      ),
                      onChange: (e: Event) => {
                        const crop: ImageCrop = {
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          ...props.object.crop,
                        }
                        crop[side] =
                          Number((e.target as HTMLInputElement).value) / 100
                        void run({
                          type: 'image.crop',
                          ref: props.object,
                          crop,
                        })
                      },
                    }),
                  ])
                )
              )
            : null,
          error.value ? h('p', { role: 'alert' }, error.value) : null,
        ]
      )
  },
})
