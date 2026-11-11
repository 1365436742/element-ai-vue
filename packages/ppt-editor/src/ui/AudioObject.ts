import {
  defineComponent,
  h,
  onBeforeUnmount,
  ref,
  watch,
  type PropType,
} from 'vue'
import type { SceneObject } from '../types.js'

/** A single native player with a playback target that fits an audio poster icon. */
export const AudioObject = defineComponent({
  props: { object: { type: Object as PropType<SceneObject>, required: true } },
  setup(props) {
    const player = ref<HTMLAudioElement>(),
      playing = ref(false),
      pending = ref(false),
      error = ref('')
    let request = 0
    const stopEvent = (event: Event) => event.stopPropagation()
    function reset() {
      request++
      pending.value = false
      playing.value = false
    }
    function stop() {
      const active =
        playing.value || pending.value || player.value?.paused === false
      reset()
      if (active) player.value?.pause()
    }
    async function toggle() {
      if (playing.value || pending.value) {
        stop()
        return
      }
      const audio = player.value
      if (!audio) return
      const current = ++request
      error.value = ''
      pending.value = true
      try {
        await audio.play()
        if (current === request) {
          playing.value = true
          pending.value = false
        }
      } catch (reason) {
        if (current === request) {
          reset()
          error.value =
            reason instanceof Error ? reason.message : '音频无法播放'
        }
      }
    }
    watch(
      () => props.object.src,
      () => {
        stop()
        error.value = ''
      }
    )
    onBeforeUnmount(stop)
    return () =>
      h(
        'div',
        {
          style: { position: 'relative', width: '100%', height: '100%' },
          onPointerdown: stopEvent,
          onPointermove: stopEvent,
          onPointerup: stopEvent,
          onDblclick: stopEvent,
        },
        [
          props.object.poster
            ? h('img', {
                src: props.object.poster,
                alt: '',
                draggable: false,
                style: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                },
              })
            : null,
          h('audio', {
            ref: player,
            src: props.object.src,
            preload: 'none',
            autoplay: false,
            'aria-label': props.object.name,
            style: { display: 'none' },
            onPlay: () => {
              playing.value = true
            },
            onPause: reset,
            onEnded: reset,
            onError: () => {
              stop()
              error.value = '音频无法播放，请检查文件或浏览器支持的格式'
            },
          }),
          h(
            'button',
            {
              type: 'button',
              'aria-label': `${playing.value || pending.value ? '暂停' : '播放'} ${props.object.name}`,
              'aria-pressed': playing.value || pending.value,
              title:
                error.value ||
                `${playing.value ? '暂停' : '播放'} ${props.object.name}`,
              onClick: (event: Event) => {
                stopEvent(event)
                void toggle()
              },
              style: {
                position: 'absolute',
                inset: '0',
                width: '100%',
                height: '100%',
                padding: '0',
                border: '1px solid rgba(255,255,255,.8)',
                borderRadius: '8px',
                background: 'rgba(0,0,0,.3)',
                color: '#fff',
                fontSize: '42px',
                lineHeight: '1',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              },
            },
            playing.value || pending.value ? 'Ⅱ' : '▶'
          ),
          error.value
            ? h(
                'span',
                {
                  role: 'alert',
                  style: {
                    position: 'absolute',
                    left: '0',
                    top: '100%',
                    fontSize: '14px',
                    background: '#fff',
                    color: '#a22',
                    minWidth: '160px',
                    padding: '4px',
                    zIndex: 1,
                  },
                },
                error.value
              )
            : null,
        ]
      )
  },
})
