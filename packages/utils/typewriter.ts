export interface TypewriterProps {
  /**
   * 每次间隔吐出多少字符
   * 默认 2 个字符
   */
  typingSpeed: number
  /**
   * 每次打字的时间间隔
   * 默认 50ms
   */
  interval: number
  /**
   * 静态文字，文字到最后一个之后自动结束
   */
  staticText?: boolean
}

export const createTypewriter = (initProps: Partial<TypewriterProps> = {}) => {
  let config: TypewriterProps = {
    typingSpeed: 2,
    interval: 50,
    staticText: false,
    ...initProps,
  }

  let status: 'typing' | 'paused' | 'stopped' = 'stopped' // 'typing' | 'paused' | 'stopped'
  let currentIndex = 0
  let fullText = ''
  let dateTime = 0
  let _onType: ((chunk: string) => void) | null = null

  const timerInterval = (onType: (chunk: string) => void) => {
    if (status !== 'typing') return
    _onType = onType
    requestAnimationFrame(() => {
      const currentDateTime = Date.now()
      if (currentDateTime - dateTime >= config.interval) {
        dateTime = currentDateTime
        const nextIndex = Math.min(
          currentIndex + config.typingSpeed,
          fullText.length
        )
        const str = fullText.slice(0, nextIndex)
        if (nextIndex !== currentIndex) {
          onType(str)
        }
        if (nextIndex === fullText.length && config?.staticText) {
          stop()
          return
        }
        currentIndex = nextIndex
      }
      timerInterval(onType)
    })
  }

  const start = async (onType: (chunk: string) => void) => {
    if (status === 'typing') return
    if (status === 'stopped') {
      currentIndex = 0
      dateTime = Date.now()
    }
    status = 'typing'
    timerInterval(onType)
  }

  const paused = () => {
    status = 'paused'
  }

  const stop = () => {
    status = 'stopped'
  }

  const done = () => {
    status = 'stopped'
    currentIndex = fullText.length
    _onType?.(fullText)
  }

  return {
    start,
    paused,
    stop,
    done,
    getInfo: () => ({
      status,
      currentIndex,
      fullText,
      config,
    }),
    setConfig: (newConfig: Partial<TypewriterProps>) => {
      config = {
        ...config,
        ...newConfig,
      }
    },
    setText(text: string) {
      fullText = text
    },
    addText: (text: string) => {
      fullText += text
    },
    destory: () => {
      stop()
      fullText = ''
      currentIndex = 0
      config = null as any
      _onType = null
    },
  }
}
