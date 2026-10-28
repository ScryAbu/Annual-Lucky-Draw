import { Employee } from '../types'

export function assignMissingIds(list: Employee[], existing: Employee[] = []): Employee[] {
  const supplied = list.map(e => e.id.trim()).filter(Boolean)
  if (new Set(supplied).size !== supplied.length) throw new Error('名单中存在重复工号 / 号码，请修正后导入')
  const used = new Set([...existing.map(e => e.id), ...supplied])
  let sequence = 1
  return list.map(employee => {
    if (employee.id.trim()) return { ...employee, id: employee.id.trim() }
    let id: string
    do { id = `N${String(sequence++).padStart(6, '0')}` } while (used.has(id))
    used.add(id)
    return { ...employee, id }
  })
}
