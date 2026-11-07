import { useCallback, useEffect, useRef, useState } from 'react'
import { closeScreen, onScreenMessage, openScreen, ScreenState, sendScreenMessage, webPopupClosed } from '../utils/screenLink'

export interface ScreenLink {
  open: boolean
  openOn: (displayId?: number) => Promise<void>
  close: () => Promise<void>
}

/**
 * 控制台一侧：把抽奖状态推送给大屏，并接收大屏转发回来的按键（翻页笔 / 键盘）。
 */
export function useScreenOperator(state: ScreenState, onKey: (code: string) => void): ScreenLink {
  const [open, setOpen] = useState(false)
  const stateRef = useRef(state)
  stateRef.current = state
  const keyRef = useRef(onKey)
  keyRef.current = onKey

  useEffect(() => {
    const off = onScreenMessage(msg => {
      if (msg.type === 'status') setOpen(msg.open)
      else if (msg.type === 'hello') { setOpen(true); sendScreenMessage({ type: 'state', state: stateRef.current }) }
      else if (msg.type === 'bye') setOpen(false)
      else if (msg.type === 'key') keyRef.current(msg.code)
    })
    window.electronAPI?.isScreenOpen?.().then(isOpen => {
      setOpen(isOpen)
      if (isOpen) sendScreenMessage({ type: 'state', state: stateRef.current })
    })
    return off
  }, [])

  // 网页版：弹窗被用户直接关掉时同步状态
  useEffect(() => {
    if (!open || typeof window.electronAPI?.isScreenOpen === "function") return
    const timer = window.setInterval(() => { if (webPopupClosed()) setOpen(false) }, 1000)
    return () => window.clearInterval(timer)
  }, [open])

  useEffect(() => {
    if (open) sendScreenMessage({ type: 'state', state })
  }, [state, open])

  const openOn = useCallback(async (displayId?: number) => {
    await openScreen(displayId)
    setOpen(true)
    sendScreenMessage({ type: 'state', state: stateRef.current })
  }, [])

  const close = useCallback(async () => {
    await closeScreen()
    setOpen(false)
  }, [])

  return { open, openOn, close }
}
