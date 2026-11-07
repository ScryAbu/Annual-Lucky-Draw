import { useEffect, useMemo, useRef, useState } from 'react'
import LotteryStage from '../components/LotteryStage'
import { useEmployeeStore } from '../stores/employeeStore'
import { useThemeStore } from '../stores/themeStore'
import { onScreenMessage, ScreenState, sendScreenMessage } from '../utils/screenLink'
import { Employee } from '../types'

const FORWARD_KEYS = new Set(['Space', 'Enter', 'NumpadEnter', 'Escape', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'])

/**
 * 大屏（观众）窗口：只渲染控制台推送的状态，不含任何操作按钮，也不进行抽取。
 */
export default function ScreenPage() {
  const [state, setState] = useState<ScreenState | null>(null)
  const employees = useEmployeeStore(s => s.employees)
  const loadEmployees = useEmployeeStore(s => s.loadFromDB)
  const reloadedFor = useRef('')

  useEffect(() => {
    let connected = false
    const off = onScreenMessage(msg => { if (msg.type === 'state') { connected = true; setState(msg.state) } })
    sendScreenMessage({ type: 'hello' })
    // 控制台可能晚于大屏打开（或刷新过）：没收到状态前每 2 秒打一次招呼
    const retry = window.setInterval(() => { if (!connected) sendScreenMessage({ type: 'hello' }) }, 2000)
    const bye = () => sendScreenMessage({ type: 'bye' })
    window.addEventListener('beforeunload', bye)
    return () => { off(); window.clearInterval(retry); window.removeEventListener('beforeunload', bye) }
  }, [])

  // 控制台改了外观（主题、标题、动效等）时同步过来
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'lottery-theme') void useThemeStore.persist.rehydrate()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // 翻页笔 / 键盘按在大屏窗口上时，转发给控制台处理
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'F11') {
        e.preventDefault()
        if (window.electronAPI?.toggleFullscreen) void window.electronAPI.toggleFullscreen()
        else if (document.fullscreenElement) void document.exitFullscreen()
        else void document.documentElement.requestFullscreen()
        return
      }
      if (FORWARD_KEYS.has(e.code)) {
        e.preventDefault()
        sendScreenMessage({ type: 'key', code: e.code })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const byId = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees])
  const sceneEmployees = useMemo(
    () => (state?.poolIds ?? []).map(id => byId.get(id)).filter((e): e is Employee => Boolean(e)),
    [state?.poolIds, byId]
  )

  // 名单在控制台被改过：重新读取一次本地数据库
  useEffect(() => {
    if (!state) return
    const missing = state.poolIds.length - sceneEmployees.length
    const key = `${state.poolIds.length}:${employees.length}`
    if (missing > 0 && reloadedFor.current !== key) {
      reloadedFor.current = key
      void loadEmployees()
    }
  }, [state, sceneEmployees.length, employees.length, loadEmployees])

  return (
    <div className="cursor-none">
      <LotteryStage
        status={state?.status ?? 'idle'}
        prize={state?.prize ?? null}
        sceneEmployees={sceneEmployees}
        totalPool={state?.poolIds.length ?? 0}
        winners={state?.winners ?? []}
        onCloseWinner={() => sendScreenMessage({ type: 'key', code: 'Escape' })}
      />
      {!state && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 stage-glass rounded-full px-4 py-2 text-sm opacity-80">
          正在连接控制台…
        </div>
      )}
    </div>
  )
}
