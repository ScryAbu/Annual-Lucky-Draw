import { useCallback, useRef, useEffect } from 'react'
import { useLotteryStore } from '../stores/lotteryStore'
import { useEmployeeStore } from '../stores/employeeStore'
import { usePrizeStore } from '../stores/prizeStore'
import { Employee, Prize } from '../types'

export function useLotteryEngine() {
  const {
    status,
    currentPrize,
    currentWinners,
    drawCount,
    setStatus,
    setCurrentPrize,
    setCurrentWinners,
    setRollingDisplays,
    startRolling,
    stopRolling,
    showWinners,
    reset,
  } = useLotteryStore()

  const { employees, markAsWinner, getAvailablePool } = useEmployeeStore()
  const { addWinner, getCurrentPrize, nextPrize } = usePrizeStore()

  const rollingIntervalRef = useRef<number | null>(null)
  const stopTimeoutRef = useRef<number | null>(null)

  // 获取当前可用的抽奖池
  const getPool = useCallback((prize: Prize): Employee[] => {
    return getAvailablePool(prize.includeWinners)
  }, [getAvailablePool])

  // 开始抽奖
  const start = useCallback((prize: Prize, count: number = 1) => {
    const pool = getPool(prize)
    
    if (pool.length === 0) {
      alert('抽奖池中没有可用人员！')
      return false
    }

    if (pool.length < count) {
      alert(`抽奖池中只有 ${pool.length} 人，无法抽取 ${count} 人！`)
      return false
    }

    startRolling(prize, count)

    // 开始滚动效果
    rollingIntervalRef.current = window.setInterval(() => {
      // 随机选取展示
      const shuffled = [...pool].sort(() => Math.random() - 0.5)
      setRollingDisplays(shuffled.slice(0, Math.min(count, 5)))
    }, 100)

    return true
  }, [getPool, startRolling, setRollingDisplays])

  // 停止抽奖
  const stop = useCallback(() => {
    if (status !== 'rolling' || !currentPrize) return

    // 清除滚动定时器
    if (rollingIntervalRef.current) {
      clearInterval(rollingIntervalRef.current)
      rollingIntervalRef.current = null
    }

    setStatus('stopping')

    // 从抽奖池中随机选取中奖者
    const pool = getPool(currentPrize)
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const winners = shuffled.slice(0, drawCount)

    // 延迟显示结果（模拟减速效果）
    stopTimeoutRef.current = window.setTimeout(() => {
      // 更新状态
      winners.forEach((winner) => {
        markAsWinner(winner.id, currentPrize.id)
        addWinner(currentPrize.id, winner.id)
      })

      stopRolling(winners)

      // 再延迟一下显示中奖弹窗
      setTimeout(() => {
        showWinners()
      }, 500)
    }, 1500)
  }, [status, currentPrize, drawCount, getPool, setStatus, markAsWinner, addWinner, stopRolling, showWinners])

  // 关闭中奖展示
  const closeWinnerDisplay = useCallback(() => {
    reset()
  }, [reset])

  // 切换开始/停止
  const toggle = useCallback((prize?: Prize, count: number = 1) => {
    if (status === 'idle') {
      const targetPrize = prize || getCurrentPrize()
      if (targetPrize) {
        const remaining = targetPrize.count - targetPrize.winners.length
        if (remaining > 0) {
          start(targetPrize, Math.min(remaining, count))
        }
      }
    } else if (status === 'rolling') {
      stop()
    } else if (status === 'showing') {
      closeWinnerDisplay()
    }
  }, [status, getCurrentPrize, start, stop, closeWinnerDisplay])

  // 清理
  useEffect(() => {
    return () => {
      if (rollingIntervalRef.current) {
        clearInterval(rollingIntervalRef.current)
      }
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current)
      }
    }
  }, [])

  return {
    status,
    currentPrize,
    currentWinners,
    drawCount,
    start,
    stop,
    toggle,
    closeWinnerDisplay,
    reset,
    setCurrentPrize,
  }
}
