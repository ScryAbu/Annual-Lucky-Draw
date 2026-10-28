import { useCallback, useRef, useEffect, useState } from 'react'
import { commitWinners } from '../utils/commitWinners'
import { randomUnit } from '../utils/draw'
import { usePrizeStore } from '../stores/prizeStore'
import { Employee, Prize } from '../types'

type WheelStatus = 'idle' | 'selecting-employee' | 'rolling-prize' | 'stopping' | 'showing'

export function usePrizeWheelEngine() {
  const [status, setStatus] = useState<WheelStatus>('idle')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0) // 当前选择框位置
  const [isDecelerating, setIsDecelerating] = useState(false) // 是否正在减速

  const { getAvailablePrizes } = usePrizeStore()

  const lock = useRef(false)
  const mounted = useRef(true)
  const resultTimeoutRef = useRef<number>()
  const prizeIntervalRef = useRef<number | null>(null)
  const decelerateTimeoutRef = useRef<number | null>(null)
  const selectedEmployeeRef = useRef<Employee | null>(null)
  const availablePrizesRef = useRef<Prize[]>([])
  const currentIndexRef = useRef<number>(0)


  // 手动选择员工
  const selectEmployee = useCallback((employee: Employee) => {
    setSelectedEmployee(employee)
    selectedEmployeeRef.current = employee
    setStatus('idle') // 选择完员工后回到idle，等待开始抽奖
  }, [])

  // 开始选择奖品（轮盘滚动）
  const startSelectPrize = useCallback(() => {
    if (lock.current) return false
    if (!selectedEmployeeRef.current) {
      alert('请先选择抽奖人！')
      return false
    }

    const availablePrizes = getAvailablePrizes()
    if (availablePrizes.length === 0) {
      alert('没有可用的奖品！')
      return false
    }

    lock.current = true
    availablePrizesRef.current = availablePrizes
    setStatus('rolling-prize')
    setIsDecelerating(false)
    currentIndexRef.current = 0
    setCurrentPrizeIndex(0)
    setSelectedPrize(null)

    // 快速移动选择框
    const speed = 50 // 初始速度（毫秒）

    prizeIntervalRef.current = window.setInterval(() => {
      currentIndexRef.current = (currentIndexRef.current + 1) % availablePrizes.length
      setCurrentPrizeIndex(currentIndexRef.current)
    }, speed)

    return true
  }, [getAvailablePrizes])

  // 停止选择奖品（带惯性效果）
  const stopSelectPrize = useCallback(() => {
    if (status !== 'rolling-prize' || decelerateTimeoutRef.current !== null) return

    setIsDecelerating(true)
    setStatus('stopping')

    // 清除快速滚动定时器
    if (prizeIntervalRef.current) {
      clearInterval(prizeIntervalRef.current)
      prizeIntervalRef.current = null
    }

    const availablePrizes = availablePrizesRef.current
    if (availablePrizes.length === 0) return

    // 惯性减速：逐渐减慢速度，随机移动几格后停止
    let speed = 100 // 开始减速时的速度
    let stepsRemaining = Math.floor(randomUnit() * 5) + 3 // 随机移动3-7格

    const decelerate = async () => {
      if (stepsRemaining <= 0) {
        // 停止，确定最终奖品
        const finalIndex = currentIndexRef.current
        const finalPrize = availablePrizes[finalIndex]
        setSelectedPrize(finalPrize)
        setCurrentPrizeIndex(finalIndex)

        const currentEmployee = selectedEmployeeRef.current
        try {
          if (!currentEmployee) throw new Error('人员未选择')
          await commitWinners(finalPrize.id, [currentEmployee])
          if (!mounted.current) return
          resultTimeoutRef.current = window.setTimeout(() => { setStatus('showing'); setIsDecelerating(false) }, 500)
        } catch (error) {
          if (mounted.current) { lock.current = false; decelerateTimeoutRef.current = null; setStatus('idle'); setIsDecelerating(false); alert(`保存失败：${String(error)}`) }
        }
        return
      }

      // 移动到下一个
      currentIndexRef.current = (currentIndexRef.current + 1) % availablePrizes.length
      setCurrentPrizeIndex(currentIndexRef.current)
      stepsRemaining--

      // 逐渐减慢速度
      speed = Math.min(speed * 1.3, 500) // 速度逐渐变慢，最多500ms

      decelerateTimeoutRef.current = window.setTimeout(decelerate, speed)
    }

    // 开始减速
    decelerateTimeoutRef.current = window.setTimeout(decelerate, speed)
  }, [status])

  // 关闭结果展示
  const closeResult = useCallback(() => {
    lock.current = false
    decelerateTimeoutRef.current = null
    availablePrizesRef.current = []
    setStatus('idle')
    setSelectedEmployee(null)
    selectedEmployeeRef.current = null
    setSelectedPrize(null)
    currentIndexRef.current = 0
    setCurrentPrizeIndex(0)
    setIsDecelerating(false)
  }, [])

  // 重置
  const reset = useCallback(() => {
    lock.current = false
    window.clearTimeout(resultTimeoutRef.current)
    if (prizeIntervalRef.current) {
      clearInterval(prizeIntervalRef.current)
      prizeIntervalRef.current = null
    }
    if (decelerateTimeoutRef.current) {
      clearTimeout(decelerateTimeoutRef.current)
      decelerateTimeoutRef.current = null
    }
    setStatus('idle')
    setSelectedEmployee(null)
    selectedEmployeeRef.current = null
    setSelectedPrize(null)
    currentIndexRef.current = 0
    setCurrentPrizeIndex(0)
    setIsDecelerating(false)
  }, [])

  // 清理
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      window.clearTimeout(resultTimeoutRef.current)
      if (prizeIntervalRef.current) {
        clearInterval(prizeIntervalRef.current)
      }
      if (decelerateTimeoutRef.current) {
        clearTimeout(decelerateTimeoutRef.current)
      }
    }
  }, [])

  return {
    status,
    selectedEmployee,
    selectedPrize,
    currentPrizeIndex,
    isDecelerating,
    availablePrizes: availablePrizesRef.current,
    selectEmployee,
    startSelectPrize,
    stopSelectPrize,
    closeResult,
    reset,
  }
}
