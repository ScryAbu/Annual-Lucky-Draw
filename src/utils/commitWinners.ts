import { db } from '../db/database'
import { useEmployeeStore } from '../stores/employeeStore'
import { usePrizeStore } from '../stores/prizeStore'
import { Employee } from '../types'

export async function commitWinners(prizeId: string, winners: Employee[]) {
  const ids = winners.map(e => e.id)
  const time = Date.now()
  await db.transaction('rw', db.employees, db.prizes, async () => {
    const prize = await db.prizes.get(prizeId)
    if (!prize || !ids.length || new Set(ids).size !== ids.length || ids.length > prize.count - prize.winners.length) throw new Error('奖项名额已变化')
    const people = await db.employees.bulkGet(ids)
    if (people.some(e => !e || prize.winners.includes(e.id) || (!prize.includeWinners && e.isWinner))) throw new Error('参与资格已变化')
    await db.employees.bulkPut(people.map(e => ({ ...e!, isWinner: true, prizeId, winTime: time })))
    await db.prizes.put({ ...prize, winners: [...prize.winners, ...ids] })
  })
  await Promise.all([useEmployeeStore.getState().loadFromDB(), usePrizeStore.getState().loadFromDB()])
}
