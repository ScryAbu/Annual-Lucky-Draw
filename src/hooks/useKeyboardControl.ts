import { useEffect, useCallback } from 'react'

interface KeyboardControlOptions {
  onSpace?: () => void
  onEscape?: () => void
  onLeft?: () => void
  onRight?: () => void
  onEnter?: () => void
  onF11?: () => void
  enabled?: boolean
}

export function useKeyboardControl(options: KeyboardControlOptions) {
  const {
    onSpace,
    onEscape,
    onLeft,
    onRight,
    onEnter,
    onF11,
    enabled = true,
  } = options

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    // 忽略输入框中的按键
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault()
        onSpace?.()
        break
      case 'Escape':
        e.preventDefault()
        onEscape?.()
        break
      case 'ArrowLeft':
        e.preventDefault()
        onLeft?.()
        break
      case 'ArrowRight':
        e.preventDefault()
        onRight?.()
        break
      case 'Enter':
        e.preventDefault()
        onEnter?.()
        break
      case 'F11':
        e.preventDefault()
        onF11?.()
        break
    }
  }, [enabled, onSpace, onEscape, onLeft, onRight, onEnter, onF11])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}
