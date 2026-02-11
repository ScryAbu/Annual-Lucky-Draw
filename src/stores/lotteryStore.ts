import { create } from 'zustand'
import { LotteryStatus, Employee, Prize } from '../types'

interface LotteryState {
  status: LotteryStatus
  currentPrize: Prize | null
  currentWinners: Employee[]
  rollingDisplays: Employee[]  // 滚动中显示的员工
  drawCount: number  // 本次抽取人数
  
  // Actions
  setStatus: (status: LotteryStatus) => void
  setCurrentPrize: (prize: Prize | null) => void
  setCurrentWinners: (winners: Employee[]) => void
  setRollingDisplays: (employees: Employee[]) => void
  setDrawCount: (count: number) => void
  startRolling: (prize: Prize, drawCount: number) => void
  stopRolling: (winners: Employee[]) => void
  showWinners: () => void
  reset: () => void
}

export const useLotteryStore = create<LotteryState>((set) => ({
  status: 'idle',
  currentPrize: null,
  currentWinners: [],
  rollingDisplays: [],
  drawCount: 1,

  setStatus: (status) => set({ status }),
  
  setCurrentPrize: (prize) => set({ currentPrize: prize }),
  
  setCurrentWinners: (winners) => set({ currentWinners: winners }),
  
  setRollingDisplays: (employees) => set({ rollingDisplays: employees }),
  
  setDrawCount: (count) => set({ drawCount: count }),

  startRolling: (prize, drawCount) => {
    set({
      status: 'rolling',
      currentPrize: prize,
      drawCount,
      currentWinners: [],
    })
  },

  stopRolling: (winners) => {
    set({
      status: 'stopping',
      currentWinners: winners,
    })
  },

  showWinners: () => {
    set({ status: 'showing' })
  },

  reset: () => {
    set({
      status: 'idle',
      currentPrize: null,
      currentWinners: [],
      rollingDisplays: [],
      // 不再重置drawCount，保持用户设置的值
    })
  },
}))
