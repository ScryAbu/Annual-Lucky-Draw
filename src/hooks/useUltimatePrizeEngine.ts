import { useCallback, useRef, useState, useEffect } from 'react'
import { useEmployeeStore } from '../stores/employeeStore'
import { usePrizeStore } from '../stores/prizeStore'
import { Employee, Prize } from '../types'
import { eligibleEmployees, randomUnit } from '../utils/draw'
import { commitWinners } from '../utils/commitWinners'

type Status = 'idle' | 'rolling' | 'stopping' | 'showing'
const weight = (e: Employee) => Number.isFinite(e.points) ? Math.max(0, e.points ?? 0) : 0
function weighted(pool: Employee[]) {
  let ticket = randomUnit() * pool.reduce((sum, e) => sum + weight(e), 0)
  return pool.find(e => (ticket -= weight(e)) < 0) ?? pool[pool.length - 1]
}
export function useUltimatePrizeEngine() {
  const [status, setStatus] = useState<Status>('idle')
  const lock = useRef<Status>('idle')
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [winner, setWinner] = useState<Employee | null>(null)
  const [rollingDisplay, setRollingDisplay] = useState<Employee | null>(null)
  const employees = useEmployeeStore(s => s.employees)
  const round = useRef<{ prize: Prize; pool: Employee[] }>()
  const interval = useRef<number>(), timer = useRef<number>()
  const mounted = useRef(true)
  const getEligiblePool = useCallback(() => employees.filter(e => weight(e) > 0), [employees])
  const getTotalWeight = useCallback(() => getEligiblePool().reduce((sum, e) => sum + weight(e), 0), [getEligiblePool])
  const getWinChance = useCallback((e: Employee) => getTotalWeight() ? weight(e) / getTotalWeight() : 0, [getTotalWeight])
  const startRolling = useCallback((requested: Prize) => {
    if (lock.current !== 'idle') return false
    const prize = usePrizeStore.getState().getPrizeById(requested.id)
    if (!prize || prize.winners.length >= prize.count) { alert('奖项已抽完'); return false }
    const pool = eligibleEmployees(useEmployeeStore.getState().employees, prize).filter(e => weight(e) > 0)
    if (!pool.length) { alert('没有符合本奖项资格且积分大于 0 的人员'); return false }
    round.current = { prize, pool }; lock.current = 'rolling'; setStatus('rolling'); setSelectedPrize(prize); setWinner(null)
    setRollingDisplay(weighted(pool))
    interval.current = window.setInterval(() => setRollingDisplay(weighted(pool)), 100)
    return true
  }, [])
  const stopRolling = useCallback(async () => {
    if (lock.current !== 'rolling' || !round.current) return
    lock.current = 'stopping'; setStatus('stopping'); window.clearInterval(interval.current)
    const { pool, prize } = round.current
    const drawn = weighted(pool)
    try {
      await commitWinners(prize.id, [drawn])
      if (!mounted.current) return
      setWinner(drawn); setRollingDisplay(drawn)
      timer.current = window.setTimeout(() => { lock.current = 'showing'; setStatus('showing') }, 600)
    } catch (error) { if (mounted.current) { lock.current = 'idle'; setStatus('idle'); alert(`保存失败：${String(error)}`) } }
  }, [])
  const closeResult = useCallback(() => {
    if (lock.current !== 'showing') return
    lock.current = 'idle'; setStatus('idle'); setSelectedPrize(null); setWinner(null); setRollingDisplay(null)
  }, [])
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; window.clearInterval(interval.current); window.clearTimeout(timer.current) }
  }, [])
  return { status, selectedPrize, winner, rollingDisplay, getEligiblePool, getTotalWeight, getWeight: weight, getWinChance, startRolling, stopRolling, closeResult }
}
