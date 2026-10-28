import { useCallback, useRef, useEffect, useState } from 'react'
import { useLotteryStore } from '../stores/lotteryStore'
import { useEmployeeStore } from '../stores/employeeStore'
import { usePrizeStore } from '../stores/prizeStore'
import { useRigStore } from '../stores/rigStore'
import { useThemeStore } from '../stores/themeStore'
import { Employee, Prize } from '../types'
import { drawEmployees, eligibleEmployees } from '../utils/draw'
import { commitWinners } from '../utils/commitWinners'

export function useLotteryEngine() {
  const state = useLotteryStore()
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([])
  const round = useRef<{ pool: Employee[]; prize: Prize; count: number; weighted: boolean; rigged: string[] } | null>(null)
  const timer = useRef<number>()
  const mounted = useRef(true)
  const start = useCallback((prize: Prize, count = 1) => {
    if (useLotteryStore.getState().status !== 'idle') return false
    const current = usePrizeStore.getState().getPrizeById(prize.id)
    if (!current) return false
    const pool = eligibleEmployees(useEmployeeStore.getState().employees, current)
    if (!Number.isInteger(count) || count < 1 || count > Math.min(pool.length, current.count - current.winners.length, 30)) {
      alert('抽取人数必须为 1–30，且不能超过剩余名额或可抽人数'); return false
    }
    const rig = useRigStore.getState()
    round.current = { pool, prize: current, count, weighted: useThemeStore.getState().drawMode === 'weighted', rigged: rig.activated ? rig.getRiggedEmployees(current.id) : [] }
    setActiveEmployees(pool)
    useLotteryStore.getState().startRolling(current, count)
    return true
  }, [])
  const stop = useCallback(async () => {
    const store = useLotteryStore.getState()
    if (store.status !== 'rolling' || !round.current) return
    const { pool, prize, count, weighted, rigged } = round.current
    store.setStatus('stopping') // Synchronous lock: repeated clicks cannot draw twice.
    const preset = pool.filter(e => rigged.includes(e.id)).slice(0, count)
    const others = pool.filter(e => !preset.some(p => p.id === e.id))
    const winners = [...preset, ...(count > preset.length ? drawEmployees(others, count - preset.length, weighted) : [])]
    try {
      // Persist both tables atomically before revealing this exact result.
      await commitWinners(prize.id, winners)
      if (!mounted.current) return
      store.stopRolling(winners)
      timer.current = window.setTimeout(() => useLotteryStore.getState().showWinners(), 1500)
    } catch (error) {
      if (mounted.current) { store.reset(); alert(`结果未保存，请重试：${String(error)}`) }
    }
  }, [])
  const closeWinnerDisplay = useCallback(() => {
    if (useLotteryStore.getState().status !== 'showing') return
    window.clearTimeout(timer.current)
    round.current = null
    useLotteryStore.getState().reset()
    setActiveEmployees([])
  }, [])
  const toggle = useCallback((prize?: Prize, count = 1) => {
    const status = useLotteryStore.getState().status
    if (status === 'idle') { const target = prize || usePrizeStore.getState().getCurrentPrize(); if (target) start(target, count) }
    else if (status === 'rolling') void stop()
    else if (status === 'showing') closeWinnerDisplay()
  }, [start, stop, closeWinnerDisplay])
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; window.clearTimeout(timer.current); useLotteryStore.getState().reset() }
  }, [])
  return { ...state, activeEmployees, start, stop, toggle, closeWinnerDisplay }
}
