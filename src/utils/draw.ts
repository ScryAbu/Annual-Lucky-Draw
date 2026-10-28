import { Employee, Prize } from '../types'

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

export function spherePositions(count: number): [number, number, number][] {
  return Array.from({ length: count }, (_, i) => {
    // Midpoints avoid both poles and the count=1 division by zero.
    const y = 1 - 2 * (i + 0.5) / count
    const radius = Math.sqrt(1 - y * y) * 3
    const angle = Math.PI * (3 - Math.sqrt(5)) * i
    return [Math.cos(angle) * radius, y * 3, Math.sin(angle) * radius]
  })
}

export const SCENE_PAGE_SIZE = 180
export function scenePage<T>(people: T[], page: number): T[] {
  const pages = Math.max(1, Math.ceil(people.length / SCENE_PAGE_SIZE))
  return people.slice((page % pages) * SCENE_PAGE_SIZE, (page % pages + 1) * SCENE_PAGE_SIZE)
}
