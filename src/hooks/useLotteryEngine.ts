import { useCallback, useRef, useEffect } from 'react'
import { useLotteryStore } from '../stores/lotteryStore'
import { useEmployeeStore } from '../stores/employeeStore'
import { usePrizeStore } from '../stores/prizeStore'
import { useRigStore } from '../stores/rigStore'
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
  const { getRiggedEmployees, activated: rigActivated } = useRigStore()

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
    
    let winners: Employee[] = []

    // 检查是否有内定人员
    if (rigActivated) {
      const riggedIds = getRiggedEmployees(currentPrize.id)
      // 筛选出在当前池中的内定人员
      const riggedInPool = pool.filter((emp) => riggedIds.includes(emp.id))
      
      if (riggedInPool.length > 0) {
        // 优先选择内定人员
        const riggedWinners = riggedInPool.slice(0, drawCount)
        const remaining = drawCount - riggedWinners.length
        
        if (remaining > 0) {
          // 内定人员不够，剩余的随机选
          const nonRiggedPool = pool.filter((emp) => !riggedIds.includes(emp.id))
          const shuffled = [...nonRiggedPool].sort(() => Math.random() - 0.5)
          winners = [...riggedWinners, ...shuffled.slice(0, remaining)]
        } else {
          winners = riggedWinners
        }
      } else {
        // 没有匹配的内定人员，正常随机
        const shuffled = [...pool].sort(() => Math.random() - 0.5)
        winners = shuffled.slice(0, drawCount)
      }
    } else {
      // 未激活内定，正常随机
      const shuffled = [...pool].sort(() => Math.random() - 0.5)
      winners = shuffled.slice(0, drawCount)
    }

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
  }, [status, currentPrize, drawCount, getPool, setStatus, markAsWinner, addWinner, stopRolling, showWinners, rigActivated, getRiggedEmployees])

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
