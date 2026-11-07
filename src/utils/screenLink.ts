import { Employee, LotteryStatus } from '../types'

/**
 * 控制台 ⇄ 大屏 的消息通道。
 * - 桌面版：经 Electron 主进程转发（大屏是独立的无边框全屏窗口）。
 * - 网页版：同源 BroadcastChannel，大屏是 window.open 打开的弹窗。
 * 抽奖只在控制台进行，大屏只渲染这里推过去的状态。
 */
export interface ScreenState {
  status: LotteryStatus
  prize: { id: string; name: string; count: number; won: number; prizeImage?: string } | null
  /** 当前场景中展示的人员编号（大屏用自己加载的名单还原，避免反复传照片） */
  poolIds: string[]
  winners: Employee[]
}

export type ScreenMessage =
  | { type: 'state'; state: ScreenState }
  | { type: 'hello' }
  | { type: 'bye' }
  | { type: 'key'; code: string }
  | { type: 'status'; open: boolean }

const CHANNEL = 'annual-lucky-draw-screen'
let channel: BroadcastChannel | null = null
function bc() {
  if (!channel && typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel(CHANNEL)
  return channel
}

const isElectron = () => Boolean(window.electronAPI?.sendScreenMessage)

export function sendScreenMessage(msg: ScreenMessage) {
  if (isElectron()) window.electronAPI.sendScreenMessage(msg)
  else bc()?.postMessage(msg)
}

export function onScreenMessage(cb: (msg: ScreenMessage) => void): () => void {
  if (isElectron()) return window.electronAPI.onScreenMessage(m => cb(m as ScreenMessage))
  const ch = bc()
  if (!ch) return () => {}
  const listener = (e: MessageEvent) => cb(e.data as ScreenMessage)
  ch.addEventListener('message', listener)
  return () => ch.removeEventListener('message', listener)
}

export interface DisplayInfo { id: number; label: string; isOperator: boolean }

export async function listDisplays(): Promise<DisplayInfo[] | null> {
  if (window.electronAPI?.listDisplays) return window.electronAPI.listDisplays()
  return null // 网页版无法枚举显示器
}

let popup: Window | null = null

export async function openScreen(displayId?: number) {
  if (window.electronAPI?.openScreen && displayId !== undefined) return window.electronAPI.openScreen(displayId)
  const url = `${location.href.split('#')[0]}#/screen`
  if (popup && !popup.closed) { popup.focus(); return }
  popup = window.open(url, 'lottery-screen', 'popup,width=1280,height=720')
  if (!popup) throw new Error('浏览器拦截了弹出窗口，请允许本页面打开弹窗')
}

export async function closeScreen() {
  if (window.electronAPI?.closeScreen) return window.electronAPI.closeScreen()
  popup?.close()
  popup = null
}

/** 网页版：轮询弹窗是否已被关掉 */
export function webPopupClosed() {
  return !popup || popup.closed
}
