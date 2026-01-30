import { createTypewriter, TypewriterProps } from '@element-ai-vue/utils'
import { onBeforeUnmount, ref } from 'vue'

export const useTyperwriter = (initProps?: Partial<TypewriterProps>) => {
  const content = ref('')
  const status = ref('stopped')
  const typewriter = createTypewriter(initProps)

  typewriter.setText('Hello, Element AI Vue!')

  const getStatus = () => {
    status.value = typewriter.getInfo().status
    return status.value
  }

  getStatus()

  const start = () => {
    typewriter.start((text: string) => {
      content.value = text
    })
  }

  const paused = () => {
    typewriter.paused()
    getStatus()
  }

  const stop = () => {
    typewriter.stop()
    getStatus()
  }

  const done = () => {
    typewriter.done()
    getStatus()
  }

  onBeforeUnmount(() => {
    typewriter.destory()
  })
  return {
    ...typewriter,
    start,
    paused,
    stop,
    done,
    status,
    content,
  }
}
