import { useState } from 'react'

export function PresentationControls() {
  const [screens, setScreens] = useState<Array<{ id: number; label: string }>>([])
  const [open, setOpen] = useState(false)
  return <div className="relative">
    <button className="px-3 py-2 rounded-xl bg-indigo-600 text-white" onClick={async () => {
      if (!window.electronAPI?.listDisplays) {
        alert('请在系统显示设置中选择镜像或扩展，将浏览器移到大屏后点击全屏。'); return
      }
      setScreens(await window.electronAPI.listDisplays()); setOpen(!open)
    }}>投大屏</button>
    {open && <div className="absolute right-0 top-full w-72 p-3 bg-slate-900 text-white rounded-xl shadow-xl">
      <p className="text-sm mb-2">将当前抽奖窗口移到所选显示器并全屏</p>
      {screens.map(screen => <button className="block p-2 hover:bg-white/10 w-full text-left" key={screen.id} onClick={async () => {
        try { await window.electronAPI.presentOnDisplay(screen.id); setOpen(false) }
        catch { alert('显示器已断开，请重新选择') }
      }}>{screen.label}</button>)}
      <p className="text-xs mt-2">先通过 HDMI 或系统无线投屏连接。F11 退出全屏。</p>
    </div>}
  </div>
}
