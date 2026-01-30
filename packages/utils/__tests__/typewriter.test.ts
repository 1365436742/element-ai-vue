import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTypewriter } from '../typewriter'

describe('createTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('requestAnimationFrame', (cb: any) => {
      return setTimeout(() => {
        cb(Date.now())
      }, 16)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default props', () => {
    const typewriter = createTypewriter()
    const info = typewriter.getInfo()
    expect(info.status).toBe('stopped')
    expect(info.config.typingSpeed).toBe(2)
    expect(info.config.interval).toBe(50)
    expect(info.currentIndex).toBe(0)
    expect(info.fullText).toBe('')
  })

  it('should initialize with custom props', () => {
    const typewriter = createTypewriter({ typingSpeed: 5, interval: 100 })
    const info = typewriter.getInfo()
    expect(info.config.typingSpeed).toBe(5)
    expect(info.config.interval).toBe(100)
  })

  it('should set and add text correctly', () => {
    const typewriter = createTypewriter()
    typewriter.setText('Hello')
    expect(typewriter.getInfo().fullText).toBe('Hello')

    typewriter.addText(' World')
    expect(typewriter.getInfo().fullText).toBe('Hello World')
  })

  it('should update config', () => {
    const typewriter = createTypewriter()
    typewriter.setConfig({ typingSpeed: 10, interval: 200 })
    const info = typewriter.getInfo()
    expect(info.config.typingSpeed).toBe(10)
    expect(info.config.interval).toBe(200)
  })

  it('should type text correctly', async () => {
    const typewriter = createTypewriter({ typingSpeed: 1, interval: 100 })
    typewriter.setText('Hi')

    const onType = vi.fn()
    typewriter.start(onType)

    expect(typewriter.getInfo().status).toBe('typing')

    // Advance time to trigger first character
    await vi.advanceTimersByTime(150)
    expect(onType).toHaveBeenCalledWith('H')

    await vi.advanceTimersByTime(100)
    expect(onType).toHaveBeenCalledWith('Hi')

    await vi.advanceTimersByTime(100)
    expect(onType).toHaveBeenCalledTimes(2)
  })

  it('should pause and resume', async () => {
    const typewriter = createTypewriter({ typingSpeed: 1, interval: 100 })
    typewriter.setText('Hello')
    const onType = vi.fn()

    typewriter.start(onType)
    await vi.advanceTimersByTime(150)
    expect(onType).toHaveBeenLastCalledWith('H')

    typewriter.paused()
    expect(typewriter.getInfo().status).toBe('paused')

    // Should not type while paused
    await vi.advanceTimersByTime(200)
    expect(onType).toHaveBeenCalledTimes(1)

    // Resume
    typewriter.start(onType)
    expect(typewriter.getInfo().status).toBe('typing')

    // Since we waited 200ms during pause, and interval is 100ms,
    // the next character should be typed almost immediately upon resume
    // because (currentDateTime - lastDateTime) > interval
    await vi.advanceTimersByTime(50)
    expect(onType).toHaveBeenLastCalledWith('He')
  })

  it('should stop and reset', async () => {
    const typewriter = createTypewriter({ typingSpeed: 1, interval: 100 })
    typewriter.setText('Hello')
    const onType = vi.fn()

    typewriter.start(onType)
    await vi.advanceTimersByTime(150)
    expect(onType).toHaveBeenLastCalledWith('H')

    typewriter.stop()
    expect(typewriter.getInfo().status).toBe('stopped')

    // Should not type while stopped
    await vi.advanceTimersByTime(200)
    expect(onType).toHaveBeenCalledTimes(1)

    // Restart should start from beginning
    typewriter.start(onType)
    await vi.advanceTimersByTime(150)
    // Note: implementation resets currentIndex to 0 on start if status was stopped
    expect(onType).toHaveBeenLastCalledWith('H')
  })

  it('should destroy correctly', () => {
    const typewriter = createTypewriter()
    typewriter.setText('Hello')
    typewriter.destory()

    const info = typewriter.getInfo()
    expect(info.status).toBe('stopped')
    expect(info.fullText).toBe('')
    expect(info.currentIndex).toBe(0)
    expect(info.config).toBeNull()
  })
})
