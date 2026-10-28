import { afterEach, beforeEach, expect, it } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { db } from '../src/db/database'
import { useEmployeeStore } from '../src/stores/employeeStore'
import { usePrizeStore } from '../src/stores/prizeStore'
import { useUltimatePrizeEngine } from '../src/hooks/useUltimatePrizeEngine'
import { usePrizeWheelEngine } from '../src/hooks/usePrizeWheelEngine'
import { people, prize } from './fixtures'
beforeEach(async () => {
  await db.employees.clear(); await db.prizes.clear()
  const employees = people(3).map(e => ({ ...e, points: 1 }))
  await db.employees.bulkPut(employees); await db.prizes.put(prize)
  useEmployeeStore.setState({ employees }); usePrizeStore.setState({ prizes: [prize] })
})
afterEach(() => cleanup())
it('终极大奖重复停止不重复写入，停下的人员就是结果', async () => {
  const hook = renderHook(() => useUltimatePrizeEngine())
  act(() => { expect(hook.result.current.startRolling(prize)).toBe(true); expect(hook.result.current.startRolling(prize)).toBe(false) })
  await act(async () => { await Promise.all([hook.result.current.stopRolling(), hook.result.current.stopRolling()]) })
  expect(hook.result.current.rollingDisplay?.id).toBe(hook.result.current.winner?.id)
  expect((await db.prizes.get(prize.id))?.winners).toEqual([hook.result.current.winner?.id])
  await waitFor(() => expect(hook.result.current.status).toBe('showing'))
})
it('轮盘的最终指针、奖品及保存结果一致，开始与停止有重复操作保护', async () => {
  const hook = renderHook(() => usePrizeWheelEngine())
  act(() => hook.result.current.selectEmployee(people(1)[0]))
  act(() => { expect(hook.result.current.startSelectPrize()).toBe(true); expect(hook.result.current.startSelectPrize()).toBe(false) })
  act(() => { hook.result.current.stopSelectPrize(); hook.result.current.stopSelectPrize() })
  await waitFor(() => expect(hook.result.current.status).toBe('showing'), { timeout: 6000 })
  expect(hook.result.current.availablePrizes[hook.result.current.currentPrizeIndex].id).toBe(hook.result.current.selectedPrize?.id)
  expect((await db.prizes.get(prize.id))?.winners).toEqual([people(1)[0].id])
}, 8000)
