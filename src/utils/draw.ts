import { Employee, Prize, SceneEffectType } from '../types'

export function eligibleEmployees(employees: Employee[], prize: Prize): Employee[] {
  const previous = new Set(prize.winners)
  return employees.filter(e => !previous.has(e.id) && (prize.includeWinners || !e.isWinner))
}

export function randomUnit(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296
}

// Sampling without replacement. Every draw removes exactly one entry.
export function drawEmployees(pool: Employee[], count: number, weighted = false, random = randomUnit): Employee[] {
  if (!Number.isInteger(count) || count < 1 || count > pool.length) throw new Error('抽取人数超出可用人数')
  if (new Set(pool.map(e => e.id)).size !== pool.length) throw new Error('名单包含重复编号')
  const remaining = [...pool]
  const winners: Employee[] = []
  for (let n = 0; n < count; n++) {
    const weights = remaining.map(e => weighted ? Math.max(1, Math.min(100, e.weight ?? 1)) : 1)
    const total = weights.reduce((a, b) => a + b, 0)
    let ticket = random() * total
    let index = weights.length - 1
    for (let i = 0; i < weights.length; i++) {
      ticket -= weights[i]
      if (ticket < 0) { index = i; break }
    }
    winners.push(remaining.splice(index, 1)[0])
  }
  return winners
}

export function spherePositions(count: number, scale = 1): [number, number, number][] {
  const rBase = 3 * scale
  return Array.from({ length: count }, (_, i) => {
    // Midpoints avoid both poles and the count=1 division by zero.
    const y = 1 - 2 * (i + 0.5) / count
    const radius = Math.sqrt(1 - y * y) * rBase
    const angle = Math.PI * (3 - Math.sqrt(5)) * i
    return [Math.cos(angle) * radius, y * rBase, Math.sin(angle) * radius]
  })
}

export function effectPositions(count: number, effect: SceneEffectType = 'sphere', scale = 1): [number, number, number][] {
  if (count <= 0) return []
  if (effect === 'sphere') return spherePositions(count, scale)
  if (effect === 'helix') {
    const radius = 3.2 * scale
    const height = 5.2 * scale
    const turns = Math.max(2, Math.min(6, Math.ceil(count / 18)))
    return Array.from({ length: count }, (_, i) => {
      const t = (i + 0.5) / count
      const angle = t * Math.PI * 2 * turns + (i % 2) * 0.35
      const y = (0.5 - t) * height
      return [Math.cos(angle) * radius, y, Math.sin(angle) * radius]
    })
  }
  if (effect === 'matrix') {
    const cols = Math.max(1, Math.min(count, Math.ceil(Math.sqrt(count * 1.8))))
    const rows = Math.max(1, Math.ceil(count / cols))
    const width = 9.0 * scale
    const height = 5.6 * scale
    return Array.from({ length: count }, (_, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = cols === 1 ? 0 : (col / (cols - 1) - 0.5) * width
      const colPhase = ((col * 7 + 3) % 11) / 11
      const y = (((0.5 - (row + 0.5) / rows) + colPhase * 0.35 + 0.5) % 1 - 0.5) * height
      const z = (((i * 5 + col * 3) % 9) / 4 - 1) * 1.2 * scale
      return [x, y, z]
    })
  }
  // starfield (全屏漫游)
  const golden = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: count }, (_, i) => {
    const u = ((i * 0.61803398875 + 0.17) % 1) - 0.5
    const v = ((i * 0.38196601125 + 0.43) % 1) - 0.5
    const w = ((Math.sin(i * golden + 1.1) + 1) * 0.5) - 0.5
    return [u * 9.6 * scale, v * 5.6 * scale, w * 5.2 * scale]
  })
}

export const SCENE_PAGE_SIZE = 180
export function scenePage<T>(people: T[], page: number): T[] {
  const pages = Math.max(1, Math.ceil(people.length / SCENE_PAGE_SIZE))
  return people.slice((page % pages) * SCENE_PAGE_SIZE, (page % pages + 1) * SCENE_PAGE_SIZE)
}
