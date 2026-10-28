import { describe, expect, it } from 'vitest'
import { drawEmployees, eligibleEmployees, spherePositions, effectPositions, scenePage } from '../src/utils/draw'
import { displayLines, paintEmployeeCard } from '../src/utils/display'
import { convertToEmployees, parseExcelFile } from '../src/utils/excelParser'
import { DEFAULT_FIELD_MAPPING } from '../src/types'
import * as XLSX from 'xlsx'
import { people, prize } from './fixtures'

describe('抽奖、展示和导入', () => {
  for (const n of [0, 1, 2, 3, 60, 61, 100, 101, 150, 1000]) it(`${n} 人位置有限且顺序轮播覆盖每一人`, () => {
    const positions = spherePositions(n)
    expect(positions).toHaveLength(n)
    expect(positions.flat().every(Number.isFinite)).toBe(true)
    expect(positions.every(([x, , z]) => Math.hypot(x, z) > 0)).toBe(true)
    for (const effect of ['sphere', 'helix', 'starfield', 'matrix'] as const) {
      const effPos = effectPositions(n, effect, 1.35)
      expect(effPos).toHaveLength(n)
      expect(effPos.flat().every(Number.isFinite)).toBe(true)
    }
    const pool = people(n)
    expect(Array.from({ length: Math.ceil(n / 180) }, (_, page) => scenePage(pool, page)).flat()).toEqual(pool)
  })
  it('批量抽取无重复、不修改原池，拒绝越界', () => {
    const pool = people(150), snapshot = JSON.stringify(pool)
    expect(new Set(drawEmployees(pool, 150, false, () => 0.5).map(e => e.id)).size).toBe(150)
    expect(JSON.stringify(pool)).toBe(snapshot)
    for (const n of [0, -1, 151, NaN, 1.5]) expect(() => drawEmployees(pool, n)).toThrow()
  })
  it('公平模式忽略权重，权重模式遵循区间', () => {
    const pool = people(2); pool[0].weight = 3; pool[1].weight = 1
    const counts = [false, true].map(mode => Array.from({ length: 100 }, (_, i) => drawEmployees(pool, 1, mode, () => (i + 0.5) / 100)[0].id).filter(id => id === pool[0].id).length)
    expect(counts).toEqual([50, 75])
  })
  it('返场允许往届中奖者，同一奖项不重复', () => {
    const pool = people(3); pool[0].isWinner = true; pool[1].isWinner = true
    expect(eligibleEmployees(pool, { ...prize, winners: [pool[1].id] })).toEqual([pool[2]])
    expect(eligibleEmployees(pool, { ...prize, includeWinners: true, winners: [pool[1].id] })).toEqual([pool[0], pool[2]])
  })
  it('只姓名、只号码不泄漏其他字段，名片绘制输出对应文本', () => {
    const emp = people(1)[0]
    expect(displayLines(emp, { showId: false, showName: true, showDepartment: false, showPhoto: false })).toEqual(['参与者0'])
    expect(displayLines(emp, { showId: true, showName: false, showDepartment: false, showPhoto: false })).toEqual(['0001'])
    const drawnTexts: string[] = []
    const mockCtx = {
      beginPath() {}, roundRect() {}, fill() {}, stroke() {}, save() {}, restore() {}, clearRect() {},
      moveTo() {}, lineTo() {}, fillRect() {}, drawImage() {},
      createLinearGradient: () => ({ addColorStop() {} }),
      fillText: (text: string) => drawnTexts.push(text),
    } as unknown as CanvasRenderingContext2D
    paintEmployeeCard(mockCtx, emp, { showId: true, showName: true, showDepartment: false, showPhoto: false }, '#6366f1')
    expect(drawnTexts).toEqual(['0001', '参与者0'])
  })
  it('Excel 允许只姓名或只号码，保留格式化前导零', () => {
    const sheet = XLSX.utils.aoa_to_sheet([['工号', '姓名'], [1, ''], ['', '同名'], ['', '同名']]); sheet.A2.z = '0000'
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, '名单')
    const data = convertToEmployees(parseExcelFile(XLSX.write(book, { type: 'array', bookType: 'xlsx' })), DEFAULT_FIELD_MAPPING)
    expect(data.map(e => [e.id, e.name])).toEqual([['0001', ''], ['', '同名'], ['', '同名']])
  })
})
