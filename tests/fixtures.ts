import { Employee, Prize } from '../src/types'
export const people = (count: number): Employee[] => Array.from({ length: count }, (_, i) => ({
  id: String(i + 1).padStart(4, '0'), name: `参与者${i}`, department: '研发', photoFile: '', isWinner: false,
}))
export const prize: Prize = { id: 'p', name: '一等奖', count: 30, winners: [], includeWinners: false, isTemporary: false, order: 0 }
