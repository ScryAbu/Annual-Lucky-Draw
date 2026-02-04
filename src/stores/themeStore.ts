import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ThemeType, ThemeConfig, CustomAssets } from '../types'

// 预设背景选项（中国红主题）
export const CHINESE_BACKGROUNDS = [
  { id: 'newyear', name: '新年喜庆', file: 'newyear.jpg' },
  { id: 'back2', name: '新年祝福', file: 'back2.jpg' },
  { id: 'back3', name: '红色简约', file: 'back3.jpg' },
]

// 预设主题配置
const THEME_PRESETS: Record<ThemeType, ThemeConfig> = {
  'tech-dark': {
    type: 'tech-dark',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      accent: '#22d3ee',
    },
    particleColor: '#6366f1',
  },
  'minimal-light': {
    type: 'minimal-light',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      accent: '#0ea5e9',
    },
    particleColor: '#3b82f6',
  },
  'chinese-red': {
    type: 'chinese-red',
    colors: {
      primary: '#dc2626',
      secondary: '#f59e0b',
      background: '#7f1d1d',
      surface: '#991b1b',
      text: '#fef2f2',
      accent: '#fbbf24',
    },
    particleColor: '#dc2626',
  },
}

interface ThemeState {
  theme: ThemeConfig
  customAssets: CustomAssets
  eventTitle: string
  selectedBgId: string  // 预设背景ID
  setTheme: (type: ThemeType) => void
  setCustomBackground: (base64: string | undefined) => void
  setLogoImage: (base64: string | undefined) => void
  setEventTitle: (title: string) => void
  setSelectedBgId: (id: string) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: THEME_PRESETS['tech-dark'],
      customAssets: {},
      eventTitle: '年会抽奖',
      selectedBgId: 'newyear',

      setTheme: (type) => {
        const currentCustomBg = get().theme.customBackground
        set({
          theme: {
            ...THEME_PRESETS[type],
            customBackground: currentCustomBg,
          },
        })
      },

      setCustomBackground: (base64) => {
        set((state) => ({
          theme: {
            ...state.theme,
            customBackground: base64,
          },
        }))
      },

      setLogoImage: (base64) => {
        set((state) => ({
          customAssets: {
            ...state.customAssets,
            logoImage: base64,
          },
        }))
      },

      setEventTitle: (title) => {
        set({ eventTitle: title })
      },

      setSelectedBgId: (id) => {
        set({ selectedBgId: id })
      },
    }),
    {
      name: 'lottery-theme',
    }
  )
)

export { THEME_PRESETS }
