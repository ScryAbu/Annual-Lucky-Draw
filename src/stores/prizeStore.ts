import { create } from 'zustand'
import { Prize } from '../types'
import { db } from '../db/database'
import { v4 as uuidv4 } from 'uuid'

interface PrizeState {
  prizes: Prize[]
  currentPrizeIndex: number
  isLoading: boolean
  
  // Actions
  addPrize: (prize: Omit<Prize, 'id' | 'winners' | 'order'>) => void
  updatePrize: (id: string, data: Partial<Prize>) => void
  deletePrize: (id: string) => void
  addWinner: (prizeId: string, employeeId: string) => void
  batchImportPrizes: (prizeList: Array<Omit<Prize, 'id' | 'winners' | 'order'>>, mode?: 'append' | 'replace') => void
  reorderPrizes: (startIndex: number, endIndex: number) => void
  setCurrentPrizeIndex: (index: number) => void
  nextPrize: () => void
  resetAllPrizes: () => void
  clearAll: () => void
  loadFromDB: () => Promise<void>
  saveToDB: () => Promise<void>
  
  // Getters
  getCurrentPrize: () => Prize | null
  getPrizeById: (id: string) => Prize | undefined
  getCompletedPrizes: () => Prize[]
  getPendingPrizes: () => Prize[]
  getAvailablePrizes: () => Prize[]  // 获取还有剩余名额的奖品
}

export const usePrizeStore = create<PrizeState>((set, get) => ({
  prizes: [],
  currentPrizeIndex: 0,
  isLoading: false,

  addPrize: (prizeData) => {
    const { prizes } = get()
    const newPrize: Prize = {
      ...prizeData,
      id: uuidv4(),
      winners: [],
      order: prizes.length,
    }
    set({ prizes: [...prizes, newPrize] })
    get().saveToDB()
  },

  updatePrize: (id, data) => {
    set((state) => ({
      prizes: state.prizes.map((prize) =>
        prize.id === id ? { ...prize, ...data } : prize
      ),
    }))
    get().saveToDB()
  },

  deletePrize: (id) => {
    set((state) => ({
      prizes: state.prizes
        .filter((prize) => prize.id !== id)
        .map((prize, index) => ({ ...prize, order: index })),
    }))
    get().saveToDB()
  },

  addWinner: (prizeId, employeeId) => {
    set((state) => ({
      prizes: state.prizes.map((prize) =>
        prize.id === prizeId
          ? { ...prize, winners: [...prize.winners, employeeId] }
          : prize
      ),
    }))
    get().saveToDB()
  },

  batchImportPrizes: (prizeList, mode = 'append') => {
    if (prizeList.length === 0) return

    set((state) => {
      const basePrizes = mode === 'replace' ? [] : state.prizes
      const startOrder = basePrizes.length
      const importedPrizes: Prize[] = prizeList.map((prizeData, index) => ({
        ...prizeData,
        id: uuidv4(),
        winners: [],
        order: startOrder + index,
      }))

      const nextPrizes = [...basePrizes, ...importedPrizes]
      return {
        prizes: nextPrizes,
        currentPrizeIndex: Math.min(state.currentPrizeIndex, Math.max(nextPrizes.length - 1, 0)),
      }
    })

    get().saveToDB()
  },

  reorderPrizes: (startIndex, endIndex) => {
    const { prizes } = get()
    const result = Array.from(prizes)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    
    const reordered = result.map((prize, index) => ({
      ...prize,
      order: index,
    }))
    
    set({ prizes: reordered })
    get().saveToDB()
  },

  setCurrentPrizeIndex: (index) => {
    set({ currentPrizeIndex: index })
  },

  nextPrize: () => {
    const { currentPrizeIndex, prizes } = get()
    if (currentPrizeIndex < prizes.length - 1) {
      set({ currentPrizeIndex: currentPrizeIndex + 1 })
    }
  },

  resetAllPrizes: () => {
    set((state) => ({
      prizes: state.prizes.map((prize) => ({ ...prize, winners: [] })),
      currentPrizeIndex: 0,
    }))
    get().saveToDB()
  },

  clearAll: () => {
    set({ prizes: [], currentPrizeIndex: 0 })
    db.prizes.clear()
  },

  loadFromDB: async () => {
    set({ isLoading: true })
    try {
      const prizes = await db.prizes.orderBy('order').toArray()
      set({ prizes, isLoading: false })
    } catch (error) {
      console.error('Failed to load prizes from DB:', error)
      set({ isLoading: false })
    }
  },

  saveToDB: async () => {
    try {
      const { prizes } = get()
      await db.prizes.clear()
      await db.prizes.bulkAdd(prizes)
    } catch (error) {
      console.error('Failed to save prizes to DB:', error)
    }
  },

  getCurrentPrize: () => {
    const { prizes, currentPrizeIndex } = get()
    return prizes[currentPrizeIndex] || null
  },

  getPrizeById: (id) => {
    const { prizes } = get()
    return prizes.find((prize) => prize.id === id)
  },

  getCompletedPrizes: () => {
    const { prizes } = get()
    return prizes.filter((prize) => prize.winners.length >= prize.count)
  },

  getPendingPrizes: () => {
    const { prizes } = get()
    return prizes.filter((prize) => prize.winners.length < prize.count)
  },

  getAvailablePrizes: () => {
    const { prizes } = get()
    return prizes.filter((prize) => prize.winners.length < prize.count)
  },
}))
