import { expect, it } from 'vitest'
import { assignMissingIds } from '../src/utils/participants'
import { people } from './fixtures'

it('无工号的同名人员获得不同号码，增量导入不覆盖旧人员', () => {
  const incoming = people(2).map(e => ({ ...e, id: '', name: '同名' }))
  const first = assignMissingIds(incoming)
  expect(first.map(e => e.id)).toEqual(['N000001', 'N000002'])
  expect(assignMissingIds(incoming, first).map(e => e.id)).toEqual(['N000003', 'N000004'])
})
it('保留真实号码，避免与自动号码碰撞，拒绝重复输入', () => {
  expect(assignMissingIds([{ ...people(1)[0], id: '' }, { ...people(1)[0], id: 'N000001' }]).map(e => e.id)).toEqual(['N000002', 'N000001'])
  expect(() => assignMissingIds([people(1)[0], people(1)[0]])).toThrow('重复')
})
