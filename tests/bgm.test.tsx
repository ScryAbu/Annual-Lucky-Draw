import { afterEach, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBGM, trackForStatus } from '../src/hooks/useBGM'
import { useBgmStore } from '../src/stores/bgmStore'
import { LotteryStatus } from '../src/types'

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

it('抽奖状态映射到曲目：揭晓前的减速阶段沿用抽奖音乐', () => {
  expect(trackForStatus('idle')).toBe('idle')
  expect(trackForStatus('rolling')).toBe('rolling')
  expect(trackForStatus('stopping')).toBe('rolling')
  expect(trackForStatus('showing')).toBe('winner')
})

it('多次抽奖：每次进入抽奖 / 中奖阶段都从头播放，并按设置循环', () => {
  vi.useFakeTimers()
  const plays: Array<{ src: string; time: number; loop: boolean }> = []
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
    plays.push({ src: this.src, time: this.currentTime, loop: this.loop })
    // 模拟播放了一段时间：如果下次不归零，就会从 42 秒处继续
    Object.defineProperty(this, 'currentTime', { value: 42, writable: true, configurable: true })
    return Promise.resolve()
  })
  useBgmStore.setState({
    bgmEnabled: true,
    idleBgm: { name: 'i', data: 'data:audio/wav;base64,aWRsZQ==' },
    rollingBgm: { name: 'r', data: 'data:audio/wav;base64,cm9sbA==' },
    winnerBgm: { name: 'w', data: 'data:audio/wav;base64,d2lu' },
    idleLoop: true, rollingLoop: true, winnerLoop: false,
  })

  const { rerender } = renderHook(({ status }: { status: LotteryStatus }) => useBGM(status), { initialProps: { status: 'idle' as LotteryStatus } })
  for (let round = 0; round < 2; round++) {
    for (const status of ['rolling', 'stopping', 'showing', 'idle'] as LotteryStatus[]) {
      rerender({ status })
      act(() => { vi.advanceTimersByTime(600) })
    }
  }

  const tracks = plays.map(p => p.src.split(',')[1])
  expect(tracks).toEqual(['aWRsZQ==', 'cm9sbA==', 'd2lu', 'aWRsZQ==', 'cm9sbA==', 'd2lu', 'aWRsZQ=='])
  expect(plays.every(p => p.time === 0)).toBe(true)
  expect(plays.filter(p => p.src.endsWith('d2lu')).every(p => p.loop === false)).toBe(true)
  expect(plays.filter(p => p.src.endsWith('cm9sbA==')).every(p => p.loop === true)).toBe(true)
})
