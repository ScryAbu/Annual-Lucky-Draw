import { create } from 'zustand'
import { Employee } from '../types'
import { db } from '../db/database'
import { usePrizeStore } from './prizeStore'

interface EmployeeState {
  employees: Employee[]
  isLoading: boolean
  
  // Actions
  setEmployees: (employees: Employee[]) => boolean
  addEmployee: (employee: Employee) => void
  updateEmployee: (id: string, data: Partial<Employee>) => void
  markAsWinner: (id: string, prizeId: string) => void
  resetAllWinners: () => void
  clearAll: () => void
  loadFromDB: () => Promise<void>
  saveToDB: () => Promise<void>
  
  // Getters
  getAvailablePool: (includeWinners?: boolean) => Employee[]
  getWinners: () => Employee[]
  getEmployeeById: (id: string) => Employee | undefined
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  isLoading: false,

  setEmployees: (employees) => {
    if (new Set(employees.map(e => e.id)).size !== employees.length) { alert('存在重复工号 / 号码，请修改后导入'); return false }
    const ids = new Set(employees.map(e => e.id))
    if (usePrizeStore.getState().prizes.some(p => p.winners.some(id => !ids.has(id)))) { alert('请先在配置页清除抽奖记录，再覆盖或删除中奖人员'); return false }
    set({ employees })
    get().saveToDB()
    return true
  },

  addEmployee: (employee) => {
    set((state) => ({
      employees: [...state.employees, employee],
    }))
    get().saveToDB()
  },

  updateEmployee: (id, data) => {
    set((state) => ({
      employees: state.employees.map((emp) =>
        emp.id === id ? { ...emp, ...data } : emp
      ),
    }))
    get().saveToDB()
  },

  markAsWinner: (id, prizeId) => {
    set((state) => ({
      employees: state.employees.map((emp) =>
        emp.id === id
          ? { ...emp, isWinner: true, prizeId, winTime: Date.now() }
          : emp
      ),
    }))
    get().saveToDB()
  },

  resetAllWinners: () => {
    set((state) => ({
      employees: state.employees.map((emp) => ({
        ...emp,
        isWinner: false,
        prizeId: undefined,
        winTime: undefined,
      })),
    }))
    get().saveToDB()
  },

  clearAll: () => { get().setEmployees([]) },

  loadFromDB: async () => {
    set({ isLoading: true })
    try {
      const employees = await db.employees.toArray()
      set({ employees, isLoading: false })
    } catch (error) {
      console.error('Failed to load employees from DB:', error)
      set({ isLoading: false })
    }
  },

  saveToDB: async () => {
    try {
      const { employees } = get()
      await db.transaction('rw', db.employees, async () => {
        await db.employees.clear()
        await db.employees.bulkPut(employees)
      })
    } catch (error) {
      console.error('Failed to save employees to DB:', error)
    }
  },

  getAvailablePool: (includeWinners = false) => {
    const { employees } = get()
    if (includeWinners) {
      return employees
    }
    return employees.filter((emp) => !emp.isWinner)
  },

  getWinners: () => {
    const { employees } = get()
    return employees
      .filter((emp) => emp.isWinner)
      .sort((a, b) => (b.winTime || 0) - (a.winTime || 0))
  },

  getEmployeeById: (id) => {
    const { employees } = get()
    return employees.find((emp) => emp.id === id)
  },
}))
