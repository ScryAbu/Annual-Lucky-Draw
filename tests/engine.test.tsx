import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { act, renderHook, render, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { db } from '../src/db/database'
import { useLotteryEngine } from '../src/hooks/useLotteryEngine'
import LotteryPage from '../src/pages/LotteryPage'
import { useEmployeeStore } from '../src/stores/employeeStore'
import { usePrizeStore } from '../src/stores/prizeStore'
import { useLotteryStore } from '../src/stores/lotteryStore'
import { useRigStore } from '../src/stores/rigStore'
import { useThemeStore } from '../src/stores/themeStore'
import { commitWinners } from '../src/utils/commitWinners'
import { people, prize } from './fixtures'
vi.mock('../src/components/LotteryScene', () => ({ default: () => <div data-testid="scene" /> }))
vi.mock('../src/components/WinnerDisplay', () => ({ default: () => null }))
const employees = people(150)
beforeEach(async () => {
  await db.employees.clear(); await db.prizes.clear(); await db.employees.bulkPut(employees); await db.prizes.put(prize)
  useEmployeeStore.setState({ employees }); usePrizeStore.setState({ prizes: [prize], currentPrizeIndex: 0 })
  useLotteryStore.getState().reset(); useRigStore.getState().clearAll(); useThemeStore.getState().setDrawMode('fair')
})
afterEach(() => cleanup())
it('150 人抽 5 人：重复开始/停止只提交一次，场景和弹窗同源', async () => {
  const hook = renderHook(() => useLotteryEngine())
  act(() => { expect(hook.result.current.start(prize, 5)).toBe(true); expect(hook.result.current.start(prize, 5)).toBe(false) })
  const snapshot = hook.result.current.activeEmployees
  await act(async () => { await Promise.all([hook.result.current.stop(), hook.result.current.stop()]) })
  expect(hook.result.current.currentWinners).toHaveLength(5)
  expect(hook.result.current.activeEmployees).toBe(snapshot)
  const ids = hook.result.current.currentWinners.map(e => e.id)
  expect((await db.prizes.get('p'))?.winners).toEqual(ids)
  expect((await db.employees.toArray()).filter(e => e.isWinner).map(e => e.id).sort()).toEqual([...ids].sort())
  await waitFor(() => expect(hook.result.current.status).toBe('showing'), { timeout: 2500 })
  expect(hook.result.current.currentWinners.map(e => e.id)).toEqual(ids)
  act(() => hook.result.current.closeWinnerDisplay())
  expect(hook.result.current.status).toBe('idle')
})
it('超额提交原子失败，人员和奖项都不变化', async () => {
  await db.prizes.update('p', { count: 1 })
  await expect(commitWinners('p', employees.slice(0, 2))).rejects.toThrow()
  expect((await db.prizes.get('p'))?.winners).toEqual([])
  expect((await db.employees.toArray()).some(e => e.isWinner)).toBe(false)
})
it('存储失败不公布中奖结果，恢复到空闲', async () => {
  const hook = renderHook(() => useLotteryEngine())
  act(() => hook.result.current.start(prize, 1))
  await db.prizes.delete('p')
  await act(async () => { await hook.result.current.stop() })
  expect(hook.result.current.status).toBe('idle')
  expect(hook.result.current.currentWinners).toEqual([])
  expect(vi.mocked(alert)).toHaveBeenCalled()
})
it('抽奖大屏不展示概率/指定中奖提示，隐蔽入口仅在空闲时连点 5 次触发且抽奖开始即关闭', () => {
  useRigStore.getState().setActivated(true)
  useThemeStore.getState().setDrawMode('weighted')
  const { queryByText, getByText } = render(<MemoryRouter><LotteryPage /></MemoryRouter>)
  expect(queryByText(/指定中奖|权重抽奖|等概率抽奖/)).toBeNull()
  expect(queryByText('高级设置')).toBeNull()
  const trigger = getByText('可抽奖人数').parentElement!
  for (let i = 0; i < 4; i++) fireEvent.click(trigger)
  expect(queryByText('高级设置')).toBeNull()
  fireEvent.click(trigger)
  expect(getByText('高级设置')).toBeTruthy()
  fireEvent.click(getByText('开始'))
  expect(queryByText('高级设置')).toBeNull()
  for (let i = 0; i < 5; i++) fireEvent.click(trigger)
  expect(queryByText('高级设置')).toBeNull()
})
