import { useCallback, useRef, useState, useEffect } from 'react'
import { useEmployeeStore } from '../stores/employeeStore'
import { usePrizeStore } from '../stores/prizeStore'
import { Employee, Prize } from '../types'

type UltimateStatus = 'idle' | 'rolling' | 'stopping' | 'showing'

export function useUltimatePrizeEngine() {
  const [status, setStatus] = useState<UltimateStatus>('idle')
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [winner, setWinner] = useState<Employee | null>(null)
  const [rollingDisplay, setRollingDisplay] = useState<Employee | null>(null)

  const { employees, markAsWinner } = useEmployeeStore()
  const { addWinner } = usePrizeStore()
  const rollingIntervalRef = useRef<number | null>(null)
  const selectedPrizeRef = useRef<Prize | null>(null)

  useEffect(() => {
    selectedPrizeRef.current = selectedPrize
  }, [selectedPrize])

  useEffect(() => {
    return () => {
      if (rollingIntervalRef.current) clearInterval(rollingIntervalRef.current)
    }
  }, [])

  // 确保积分为非负整数（避免 Excel/表单传入字符串或小数）
  const getWeight = useCallback((emp: Employee): number => {
    const p = emp.points
    if (p == null || p === '') return 0
    const n = Number(p)
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
  }, [])

  // 参与终极大奖的员工：积分 > 0
  const getEligiblePool = useCallback((): Employee[] => {
    return employees.filter((emp) => getWeight(emp) > 0)
  }, [employees, getWeight])

  // 总权重（整数，避免浮点误差）
  const getTotalWeight = useCallback((): number => {
    return getEligiblePool().reduce((sum, emp) => sum + getWeight(emp), 0)
  }, [getEligiblePool, getWeight])

  // 每人中奖概率（0~1），便于界面展示
  const getWinChance = useCallback((emp: Employee): number => {
    const total = getTotalWeight()
    if (total <= 0) return 0
    return getWeight(emp) / total
  }, [getTotalWeight, getWeight])

  // 按权重随机抽取一人（整数权重 + 整数随机，保证概率严格按权重）
  const drawWeighted = useCallback((pool: Employee[], totalWeight: number): Employee => {
    if (pool.length === 0) return pool[0] as never
    if (totalWeight <= 0) return pool[Math.floor(Math.random() * pool.length)]
    // [0, totalWeight) 的整数，保证每人区间长度 = 权重
    const r = Math.floor(Math.random() * totalWeight)
    let acc = 0
    for (const emp of pool) {
      const w = getWeight(emp)
      if (r < acc + w) return emp
      acc += w
    }
    return pool[pool.length - 1]
  }, [getWeight])

  const startRolling = useCallback((prize: Prize) => {
    const pool = getEligiblePool()
    const totalWeight = getTotalWeight()

    if (pool.length === 0) {
      alert('没有可参与终极大奖的员工！请先在员工数据管理中为员工设置积分（积分 > 0）。')
      return false
    }
    if (totalWeight <= 0) {
      alert('所有参与者的积分均为 0，无法按权重抽奖。请设置积分。')
      return false
    }

    setSelectedPrize(prize)
    setWinner(null)
    setStatus('rolling')

    // 滚动展示：按权重概率随机切换显示
    if (rollingIntervalRef.current) clearInterval(rollingIntervalRef.current)
    rollingIntervalRef.current = window.setInterval(() => {
      const drawn = drawWeighted(pool, totalWeight)
      setRollingDisplay(drawn)
    }, 80)
    return true
  }, [getEligiblePool, getTotalWeight, drawWeighted])

  const stopRolling = useCallback(() => {
    const prize = selectedPrizeRef.current
    if (status !== 'rolling' || !prize) return

    if (rollingIntervalRef.current) {
      clearInterval(rollingIntervalRef.current)
      rollingIntervalRef.current = null
    }

    setStatus('stopping')

    const pool = getEligiblePool()
    const totalWeight = getTotalWeight()
    const drawn = drawWeighted(pool, totalWeight)

    setWinner(drawn)
    setRollingDisplay(drawn)

    markAsWinner(drawn.id, prize.id)
    addWinner(prize.id, drawn.id)

    setTimeout(() => setStatus('showing'), 600)
  }, [status, getEligiblePool, getTotalWeight, drawWeighted, markAsWinner, addWinner])

  const closeResult = useCallback(() => {
    setStatus('idle')
    setSelectedPrize(null)
    setWinner(null)
    setRollingDisplay(null)
  }, [])

  return {
    status,
    selectedPrize,
    winner,
    rollingDisplay,
    getEligiblePool,
    getTotalWeight,
    getWeight,
    getWinChance,
    startRolling,
    stopRolling,
    closeResult,
  }
}
