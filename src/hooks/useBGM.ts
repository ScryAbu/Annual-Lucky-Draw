import { useEffect, useRef } from 'react'
import { useBgmStore } from '../stores/bgmStore'
import { LotteryStatus } from '../types'

type Track = 'idle' | 'rolling' | 'winner'

const FADE_IN_MS = 400
const FADE_OUT_MS = 350

/** 抽奖状态 → 应播放的曲目；stopping（减速揭晓前）沿用滚动音乐 */
export function trackForStatus(status: LotteryStatus): Track {
  if (status === 'rolling' || status === 'stopping') return 'rolling'
  if (status === 'showing') return 'winner'
  return 'idle'
}

/**
 * BGM 播放控制
 * - 每次进入某段音乐（开始滚动 / 揭晓中奖 / 回到待机）都从头播放，绝不接着上次暂停的位置；
 * - 是否循环由「音效设置」里每段音乐的循环开关决定；
 * - 淡入淡出可被打断：快速连按开始/停止时，旧的淡出不会把新开始的音乐暂停掉。
 */
export function useBGM(status: LotteryStatus) {
  const store = useBgmStore()
  const audios = useRef<Partial<Record<Track, HTMLAudioElement>>>({})
  const fades = useRef(new Map<HTMLAudioElement, number>())
  const current = useRef<Track | null>(null)

  const config = {
    idle: { bgm: store.idleBgm, volume: store.idleVolume, loop: store.idleLoop },
    rolling: { bgm: store.rollingBgm, volume: store.rollingVolume, loop: store.rollingLoop },
    winner: { bgm: store.winnerBgm, volume: store.winnerVolume, loop: store.winnerLoop },
  }
  const configRef = useRef(config)
  configRef.current = config

  const target: Track | null = store.bgmEnabled ? trackForStatus(status) : null
  const targetSrc = target ? config[target].bgm?.data ?? null : null

  useEffect(() => {
    const cancelFade = (audio: HTMLAudioElement) => {
      const id = fades.current.get(audio)
      if (id !== undefined) { window.clearInterval(id); fades.current.delete(audio) }
    }
    const rampTo = (audio: HTMLAudioElement, to: number, ms: number, done?: () => void) => {
      cancelFade(audio)
      const from = audio.volume
      const steps = Math.max(1, Math.round(ms / 25))
      let step = 0
      const id = window.setInterval(() => {
        step++
        audio.volume = Math.min(1, Math.max(0, from + (to - from) * (step / steps)))
        if (step >= steps) { cancelFade(audio); done?.() }
      }, 25)
      fades.current.set(audio, id)
    }
    const stop = (track: Track) => {
      const audio = audios.current[track]
      if (!audio || audio.paused) return
      rampTo(audio, 0, FADE_OUT_MS, () => { audio.pause(); audio.currentTime = 0 })
    }

    // 停掉不是目标的曲目
    ;(['idle', 'rolling', 'winner'] as Track[]).forEach(t => { if (t !== target) stop(t) })
    current.current = target
    if (!target || !targetSrc) return

    const { volume, loop } = configRef.current[target]
    let audio = audios.current[target]
    if (!audio) { audio = new Audio(); audio.preload = 'auto'; audios.current[target] = audio }
    if (audio.src !== targetSrc) audio.src = targetSrc
    cancelFade(audio)
    audio.pause()
    audio.loop = loop
    audio.currentTime = 0 // 每次都从头播放
    audio.volume = 0
    audio.play().catch(() => { /* 浏览器未获得用户手势时会拒绝自动播放，忽略 */ })
    rampTo(audio, volume, FADE_IN_MS)
  }, [target, targetSrc])

  // 播放中调节音量 / 循环开关：直接作用于当前曲目，不重新开始
  useEffect(() => {
    const t = current.current
    const audio = t ? audios.current[t] : undefined
    if (!t || !audio || audio.paused || fades.current.has(audio)) return
    audio.volume = config[t].volume
    audio.loop = config[t].loop
  })

  useEffect(() => {
    const fadeMap = fades.current
    const all = audios.current
    return () => {
      fadeMap.forEach(id => window.clearInterval(id))
      fadeMap.clear()
      Object.values(all).forEach(audio => { if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load() } })
    }
  }, [])
}
