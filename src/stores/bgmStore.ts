import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// BGM 配置项
export interface BgmConfig {
  name: string       // 文件名
  data: string       // Base64 音频数据
}

interface BgmState {
  // 三种 BGM 配置
  idleBgm: BgmConfig | null        // 待机背景音乐（进入抽奖页面即播放）
  rollingBgm: BgmConfig | null     // 滚动抽奖时的音乐
  winnerBgm: BgmConfig | null      // 中奖揭晓时的音乐

  // 音量设置 (0-1)
  idleVolume: number
  rollingVolume: number
  winnerVolume: number

  // 全局开关
  bgmEnabled: boolean

  // Actions
  setIdleBgm: (bgm: BgmConfig | null) => void
  setRollingBgm: (bgm: BgmConfig | null) => void
  setWinnerBgm: (bgm: BgmConfig | null) => void
  setIdleVolume: (volume: number) => void
  setRollingVolume: (volume: number) => void
  setWinnerVolume: (volume: number) => void
  setBgmEnabled: (enabled: boolean) => void
}

export const useBgmStore = create<BgmState>()(
  persist(
    (set) => ({
      idleBgm: null,
      rollingBgm: null,
      winnerBgm: null,
      idleVolume: 0.5,
      rollingVolume: 0.7,
      winnerVolume: 0.8,
      bgmEnabled: true,

      setIdleBgm: (bgm) => set({ idleBgm: bgm }),
      setRollingBgm: (bgm) => set({ rollingBgm: bgm }),
      setWinnerBgm: (bgm) => set({ winnerBgm: bgm }),
      setIdleVolume: (volume) => set({ idleVolume: volume }),
      setRollingVolume: (volume) => set({ rollingVolume: volume }),
      setWinnerVolume: (volume) => set({ winnerVolume: volume }),
      setBgmEnabled: (enabled) => set({ bgmEnabled: enabled }),
    }),
    {
      name: 'lottery-bgm',
    }
  )
)
