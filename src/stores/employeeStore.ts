import { create } from 'zustand'
import { Employee } from '../types'
import { db } from '../db/database'

interface EmployeeState {
  employees: Employee[]
  isLoading: boolean
  
  // Actions
  setEmployees: (employees: Employee[]) => void
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
    set({ employees })
    get().saveToDB()
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

  clearAll: () => {
    set({ employees: [] })
    db.employees.clear()
  },

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
      await db.employees.clear()
      await db.employees.bulkAdd(employees)
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
