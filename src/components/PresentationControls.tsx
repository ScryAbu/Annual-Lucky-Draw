import { useEffect, useRef, useState } from 'react'
import { Icon } from './ui/Icon'
import type { ScreenLink } from '../hooks/useScreenOperator'
import { DisplayInfo, listDisplays } from '../utils/screenLink'

/**
 * 投屏按钮。
 * - 传入 link（常规抽奖页）：在所选显示器上打开「只有抽奖画面」的大屏窗口，控制台留在本机。
 * - 不传 link（轮盘 / 终极大奖）：把当前窗口整体移到所选显示器并全屏。
 */
export function PresentationControls({ link, className = "", buttonClassName = "" }: { link?: ScreenLink; className?: string; buttonClassName?: string }) {
  const [screens, setScreens] = useState<DisplayInfo[] | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  const toggleMenu = async () => {
    setError('')
    if (!open) setScreens(await listDisplays())
    setOpen(!open)
  }

  const choose = async (id?: number) => {
    try {
      if (link) await link.openOn(id)
      else if (id !== undefined) await window.electronAPI.presentOnDisplay(id)
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : '显示器已断开，请重新选择')
    }
  }

  const live = Boolean(link?.open)

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={toggleMenu}
        className={`ui-btn ${buttonClassName} ${live ? "ui-btn-active" : ""}`}
        title="投到大屏"
      >
        <Icon name="cast" size={17} />
        {live ? (
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" /></span>
            大屏已开启
          </span>
        ) : '投大屏'}
      </button>

      {open && (
        <div className="ui-menu absolute right-0 top-full mt-2 w-80 p-2 z-50 text-left">
          <div className="px-3 pt-2 pb-3">
            <div className="text-sm font-semibold">{link ? '在大屏上只显示抽奖画面' : '把当前窗口移到大屏'}</div>
            <p className="text-xs ui-muted mt-1 leading-relaxed">
              {link
                ? '观众只看到抽奖画面；控制按钮留在本机，空格 / 翻页笔照常控制。'
                : '此模式会把整个窗口移过去，操作按钮闲置 3 秒后自动隐藏。'}
            </p>
          </div>

          {screens === null ? (
            <button type="button" onClick={() => choose()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-2)] text-sm">
              <Icon name="monitor" size={18} className="ui-muted" />
              <span className="flex-1">打开大屏窗口</span>
            </button>
          ) : screens.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => choose(s.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-2)] text-sm text-left"
            >
              <Icon name="monitor" size={18} className="ui-muted" />
              <span className="flex-1 min-w-0 truncate">{s.label}</span>
            </button>
          ))}

          {screens !== null && screens.length < 2 && (
            <p className="text-xs px-3 py-2 rounded-xl mt-1" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}>
              只检测到一块屏幕。请先连接投影/大屏，并在系统显示设置里选择「扩展」而不是「复制」。
            </p>
          )}
          {screens === null && (
            <p className="text-xs ui-muted px-3 py-2">网页版会打开一个新窗口，把它拖到大屏后按 F11 全屏即可。</p>
          )}
          {error && <p className="text-xs px-3 py-2" style={{ color: 'var(--danger)' }}>{error}</p>}

          {live && (
            <>
              <div className="h-px my-2" style={{ background: 'var(--border)' }} />
              <button type="button" onClick={async () => { await link!.close(); setOpen(false) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--danger-soft)] text-sm" style={{ color: 'var(--danger)' }}>
                <Icon name="x" size={18} />
                关闭大屏
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
