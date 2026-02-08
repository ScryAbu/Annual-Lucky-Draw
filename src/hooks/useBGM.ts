import { useRef, useCallback, useEffect } from 'react'
import { useBgmStore } from '../stores/bgmStore'
import { LotteryStatus } from '../types'

/**
 * BGM 播放控制 Hook
 * 根据抽奖状态自动切换播放对应的 BGM
 */
export function useBGM(status: LotteryStatus) {
  const {
    idleBgm,
    rollingBgm,
    winnerBgm,
    idleVolume,
    rollingVolume,
    winnerVolume,
    bgmEnabled,
  } = useBgmStore()

  const idleAudioRef = useRef<HTMLAudioElement | null>(null)
  const rollingAudioRef = useRef<HTMLAudioElement | null>(null)
  const winnerAudioRef = useRef<HTMLAudioElement | null>(null)

  // 淡出音频
  const fadeOut = useCallback((audio: HTMLAudioElement, duration: number = 500) => {
    return new Promise<void>((resolve) => {
      const startVolume = audio.volume
      const steps = 20
      const stepDuration = duration / steps
      const volumeStep = startVolume / steps
      let currentStep = 0

      const interval = setInterval(() => {
        currentStep++
        audio.volume = Math.max(0, startVolume - volumeStep * currentStep)
        if (currentStep >= steps) {
          clearInterval(interval)
          audio.pause()
          audio.volume = startVolume
          resolve()
        }
      }, stepDuration)
    })
  }, [])

  // 淡入音频
  const fadeIn = useCallback((audio: HTMLAudioElement, targetVolume: number, duration: number = 500) => {
    audio.volume = 0
    audio.play().catch(() => {})
    const steps = 20
    const stepDuration = duration / steps
    const volumeStep = targetVolume / steps
    let currentStep = 0

    const interval = setInterval(() => {
      currentStep++
      audio.volume = Math.min(targetVolume, volumeStep * currentStep)
      if (currentStep >= steps) {
        clearInterval(interval)
      }
    }, stepDuration)
  }, [])

  // 停止所有音频
  const stopAll = useCallback(() => {
    const audios = [idleAudioRef.current, rollingAudioRef.current, winnerAudioRef.current]
    audios.forEach((audio) => {
      if (audio && !audio.paused) {
        fadeOut(audio, 300)
      }
    })
  }, [fadeOut])

  // 播放指定音频
  const playAudio = useCallback(
    (audioRef: React.MutableRefObject<HTMLAudioElement | null>, src: string, volume: number, loop: boolean = true) => {
      if (!bgmEnabled) return

      // 先停止其他音频
      const allRefs = [idleAudioRef, rollingAudioRef, winnerAudioRef]
      const stopPromises = allRefs
        .filter((ref) => ref !== audioRef && ref.current && !ref.current.paused)
        .map((ref) => fadeOut(ref.current!, 300))

      Promise.all(stopPromises).then(() => {
        if (!audioRef.current) {
          audioRef.current = new Audio(src)
        } else if (audioRef.current.src !== src) {
          audioRef.current.src = src
        }

        audioRef.current.loop = loop
        fadeIn(audioRef.current, volume, 400)
      })
    },
    [bgmEnabled, fadeOut, fadeIn]
  )

  // 根据状态切换 BGM
  useEffect(() => {
    if (!bgmEnabled) {
      stopAll()
      return
    }

    switch (status) {
      case 'idle':
        if (idleBgm) {
          playAudio(idleAudioRef, idleBgm.data, idleVolume, true)
        } else {
          stopAll()
        }
        break

      case 'rolling':
        if (rollingBgm) {
          playAudio(rollingAudioRef, rollingBgm.data, rollingVolume, true)
        }
        break

      case 'stopping':
        // 保持滚动音乐，等待结果
        break

      case 'showing':
        if (winnerBgm) {
          playAudio(winnerAudioRef, winnerBgm.data, winnerVolume, false)
        } else {
          // 没有中奖音乐就静音
          stopAll()
        }
        break
    }
  }, [status, bgmEnabled, idleBgm, rollingBgm, winnerBgm, idleVolume, rollingVolume, winnerVolume, playAudio, stopAll])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      ;[idleAudioRef, rollingAudioRef, winnerAudioRef].forEach((ref) => {
        if (ref.current) {
          ref.current.pause()
          ref.current.src = ''
          ref.current = null
        }
      })
    }
  }, [])

  return { stopAll }
}
