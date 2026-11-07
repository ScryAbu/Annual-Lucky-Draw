import { useCallback, useEffect, useRef, useState } from 'react'
import { useBgmStore, BgmConfig } from '../../stores/bgmStore'
import { Icon, IconName } from '../ui/Icon'

type Track = 'idle' | 'rolling' | 'winner'

// 全局只保留一个试听播放器：点另一首会自动停掉上一首
let previewAudio: HTMLAudioElement | null = null
let previewOwner: Track | null = null
const previewListeners = new Set<() => void>()
const notifyPreview = () => previewListeners.forEach(fn => fn())

function stopPreview() {
  if (previewAudio) {
    previewAudio.pause()
    previewAudio.removeAttribute('src')
    previewAudio.load()
  }
  previewAudio = null
  previewOwner = null
  notifyPreview()
}

function usePreview(track: Track, bgm: BgmConfig | null, volume: number) {
  const [, force] = useState(0)
  const [progress, setProgress] = useState(0)
  const playing = previewOwner === track

  useEffect(() => {
    const fn = () => force(n => n + 1)
    previewListeners.add(fn)
    return () => { previewListeners.delete(fn) }
  }, [])

  // 试听时拖动音量立即生效
  useEffect(() => { if (playing && previewAudio) previewAudio.volume = volume }, [playing, volume])

  // 进度条
  useEffect(() => {
    if (!playing) { setProgress(0); return }
    let raf = 0
    const tick = () => {
      const a = previewAudio
      if (a && a.duration > 0) setProgress(a.currentTime / a.duration)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  // 移除或更换音乐时停止试听
  useEffect(() => { if (previewOwner === track) stopPreview() }, [bgm?.data, track])

  const toggle = useCallback(() => {
    if (previewOwner === track) { stopPreview(); return }
    stopPreview()
    if (!bgm) return
    const audio = new Audio(bgm.data)
    audio.volume = volume
    audio.onended = () => { if (previewAudio === audio) stopPreview() }
    previewAudio = audio
    previewOwner = track
    audio.play().catch(() => stopPreview())
    notifyPreview()
  }, [bgm, track, volume])

  return { playing, progress, toggle }
}

function pickAudioInBrowser(): Promise<BgmConfig | null> {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'audio/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      const reader = new FileReader()
      reader.onload = () => resolve({ name: file.name, data: String(reader.result) })
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    }
    input.click()
  })
}

function BgmCard({
  track,
  icon,
  label,
  description,
  bgm,
  volume,
  loop,
  onSelect,
  onRemove,
  onVolumeChange,
  onLoopChange,
}: {
  track: Track
  icon: IconName
  label: string
  description: string
  bgm: BgmConfig | null
  volume: number
  loop: boolean
  onSelect: () => void
  onRemove: () => void
  onVolumeChange: (v: number) => void
  onLoopChange: (v: boolean) => void
}) {
  const { playing, progress, toggle } = usePreview(track, bgm, volume)

  return (
    <div className="ui-card p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}>
          <Icon name={icon} size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold">{label}</h4>
          <p className="text-xs ui-muted mt-0.5">{description}</p>
        </div>
        <label className="flex items-center gap-2 text-xs ui-muted cursor-pointer select-none" title="关闭后音乐播放一遍即停止">
          <Icon name="repeat" size={14} />
          循环
          <button type="button" role="switch" aria-checked={loop} aria-label={`${label}循环播放`} className="ui-switch" onClick={() => onLoopChange(!loop)} />
        </label>
      </div>

      {bgm ? (
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-2)' }}>
          <button
            type="button"
            onClick={toggle}
            className={`ui-btn ui-btn-icon ui-btn-sm rounded-full ${playing ? 'ui-btn-primary' : ''}`}
            title={playing ? '停止试听' : '试听'}
            aria-label={playing ? '停止试听' : '试听'}
          >
            <Icon name={playing ? 'stop' : 'play'} size={14} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate" title={bgm.name}>{bgm.name}</div>
            <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: 'var(--accent)', transition: playing ? 'none' : 'width .2s' }} />
            </div>
          </div>
          <button type="button" onClick={onSelect} className="ui-btn ui-btn-ghost ui-btn-sm">更换</button>
          <button type="button" onClick={onRemove} className="ui-btn ui-btn-ghost ui-btn-sm ui-btn-icon" title="移除" aria-label="移除音乐">
            <Icon name="trash" size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className="w-full rounded-xl py-4 text-sm ui-muted border border-dashed transition-colors hover:border-[var(--accent)] hover:text-[var(--text)] flex items-center justify-center gap-2"
          style={{ borderColor: 'var(--border-strong)' }}
        >
          <Icon name="upload" size={16} />
          选择音频文件
        </button>
      )}

      <div className="flex items-center gap-3">
        <Icon name="volume" size={16} className="ui-subtle" />
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(volume * 100)}
          onChange={(e) => onVolumeChange(parseInt(e.target.value) / 100)}
          className="ui-range flex-1"
          style={{ ['--fill' as string]: `${Math.round(volume * 100)}%` }}
          aria-label={`${label}音量`}
        />
        <span className="text-xs w-10 text-right ui-muted tabular">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  )
}

export default function BgmSettings() {
  const store = useBgmStore()
  const {
    idleBgm, rollingBgm, winnerBgm,
    idleVolume, rollingVolume, winnerVolume,
    idleLoop, rollingLoop, winnerLoop,
    bgmEnabled,
    setIdleBgm, setRollingBgm, setWinnerBgm,
    setIdleVolume, setRollingVolume, setWinnerVolume,
    setBgmEnabled, setLoop,
  } = store
  const mounted = useRef(true)

  // 离开设置页时停止试听
  useEffect(() => () => { mounted.current = false; stopPreview() }, [])

  const handleSelectAudio = useCallback(async (setter: (bgm: BgmConfig | null) => void) => {
    const result = window.electronAPI?.selectAudio ? await window.electronAPI.selectAudio() : await pickAudioInBrowser()
    if (result && mounted.current) setter({ name: result.name, data: result.data })
  }, [])

  return (
    <div className="space-y-5">
      <div className="ui-card p-6 flex items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-semibold">背景音乐</h3>
          <p className="text-sm ui-muted mt-1">
            为待机、抽奖、中奖三个阶段分别配乐。每次进入某个阶段，对应音乐都会<strong className="font-semibold" style={{ color: 'var(--text)' }}>从头播放</strong>。
          </p>
        </div>
        <button type="button" role="switch" aria-checked={bgmEnabled} aria-label="启用背景音乐" className="ui-switch" onClick={() => setBgmEnabled(!bgmEnabled)} />
      </div>

      {bgmEnabled && (
        <div className="grid gap-4 lg:grid-cols-3">
          <BgmCard
            track="idle"
            icon="music"
            label="待机音乐"
            description="进入抽奖页、等待开始时播放"
            bgm={idleBgm}
            volume={idleVolume}
            loop={idleLoop}
            onSelect={() => handleSelectAudio(setIdleBgm)}
            onRemove={() => setIdleBgm(null)}
            onVolumeChange={setIdleVolume}
            onLoopChange={v => setLoop('idle', v)}
          />
          <BgmCard
            track="rolling"
            icon="sparkles"
            label="抽奖音乐"
            description="点击「开始」后，滚动抽取过程中播放"
            bgm={rollingBgm}
            volume={rollingVolume}
            loop={rollingLoop}
            onSelect={() => handleSelectAudio(setRollingBgm)}
            onRemove={() => setRollingBgm(null)}
            onVolumeChange={setRollingVolume}
            onLoopChange={v => setLoop('rolling', v)}
          />
          <BgmCard
            track="winner"
            icon="trophy"
            label="中奖音乐"
            description="中奖名单揭晓时播放的庆祝音乐"
            bgm={winnerBgm}
            volume={winnerVolume}
            loop={winnerLoop}
            onSelect={() => handleSelectAudio(setWinnerBgm)}
            onRemove={() => setWinnerBgm(null)}
            onVolumeChange={setWinnerVolume}
            onLoopChange={v => setLoop('winner', v)}
          />
        </div>
      )}

      <div className="ui-card p-5 text-sm ui-muted">
        <div className="flex items-center gap-2 font-medium mb-2" style={{ color: 'var(--text)' }}>
          <Icon name="info" size={16} /> 使用提示
        </div>
        <ul className="space-y-1.5 list-disc pl-5">
          <li>「循环」打开：该阶段持续多久就循环多久；关闭：播放一遍后安静，下次进入该阶段再从头播放。</li>
          <li>抽奖页右上角的喇叭按钮可随时一键静音。</li>
          <li>试听时可以直接拖动音量，再点一次方块按钮即可停止。</li>
          <li>支持 MP3、WAV、OGG、AAC、M4A、FLAC。</li>
        </ul>
      </div>
    </div>
  )
}
