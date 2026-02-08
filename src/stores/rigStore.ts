import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 内定管理 Store
 * 使用独立的 localStorage key，不会出现在常规数据中
 * key 名称伪装为系统缓存
 */

interface RigEntry {
  prizeId: string      // 奖项ID
  employeeId: string   // 内定员工ID
}

interface RigState {
  // 内定列表
  rigList: RigEntry[]
  // 是否已激活（需要通过暗门开启）
  activated: boolean

  // Actions
  addRig: (prizeId: string, employeeId: string) => void
  removeRig: (prizeId: string, employeeId: string) => void
  clearRigsForPrize: (prizeId: string) => void
  clearAll: () => void
  setActivated: (activated: boolean) => void
  
  // Getters
  getRiggedEmployees: (prizeId: string) => string[]
  hasRig: (prizeId: string) => boolean
}

export const useRigStore = create<RigState>()(
  persist(
    (set, get) => ({
      rigList: [],
      activated: false,

      addRig: (prizeId, employeeId) => {
        const { rigList } = get()
        // 避免重复
        if (rigList.some((r) => r.prizeId === prizeId && r.employeeId === employeeId)) {
          return
        }
        set({ rigList: [...rigList, { prizeId, employeeId }] })
      },

      removeRig: (prizeId, employeeId) => {
        set((state) => ({
          rigList: state.rigList.filter(
            (r) => !(r.prizeId === prizeId && r.employeeId === employeeId)
          ),
        }))
      },

      clearRigsForPrize: (prizeId) => {
        set((state) => ({
          rigList: state.rigList.filter((r) => r.prizeId !== prizeId),
        }))
      },

      clearAll: () => {
        set({ rigList: [], activated: false })
      },

      setActivated: (activated) => {
        set({ activated })
      },

      getRiggedEmployees: (prizeId) => {
        const { rigList } = get()
        return rigList.filter((r) => r.prizeId === prizeId).map((r) => r.employeeId)
      },

      hasRig: (prizeId) => {
        const { rigList } = get()
        return rigList.some((r) => r.prizeId === prizeId)
      },
    }),
    {
      name: 'sys-render-cache-v3', // 伪装成系统缓存的 key
    }
  )
)
