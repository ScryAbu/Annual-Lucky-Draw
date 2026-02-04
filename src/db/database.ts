import Dexie, { Table } from 'dexie'
import { Employee, Prize } from '../types'

class LotteryDatabase extends Dexie {
  employees!: Table<Employee, string>
  prizes!: Table<Prize, string>

  constructor() {
    super('LotteryDB')
    
    this.version(1).stores({
      employees: 'id, name, department, isWinner, prizeId',
      prizes: 'id, name, order',
    })
  }
}

export const db = new LotteryDatabase()

// 清除所有数据
export const clearAllData = async () => {
  await db.employees.clear()
  await db.prizes.clear()
}

// 导出数据用于备份
export const exportData = async () => {
  const employees = await db.employees.toArray()
  const prizes = await db.prizes.toArray()
  return { employees, prizes }
}

// 导入备份数据
export const importData = async (data: { employees: Employee[]; prizes: Prize[] }) => {
  await db.transaction('rw', db.employees, db.prizes, async () => {
    await db.employees.clear()
    await db.prizes.clear()
    await db.employees.bulkAdd(data.employees)
    await db.prizes.bulkAdd(data.prizes)
  })
}
