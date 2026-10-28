import { z } from 'zod'
import { db, importData } from '../db/database'
import { useThemeStore, THEME_PRESETS } from '../stores/themeStore'
import { useBgmStore } from '../stores/bgmStore'
import { useRigStore } from '../stores/rigStore'

const image = z.string().regex(/^data:image\/(png|jpeg|jpg|gif|webp|bmp);base64,/).optional()
const employee = z.object({
  id: z.string().trim().min(1), name: z.string(), department: z.string(), photoFile: z.string(),
  photoData: image, isWinner: z.boolean(), prizeId: z.string().optional(), winTime: z.number().finite().optional(),
  points: z.number().finite().nonnegative().optional(), weight: z.number().finite().min(1).max(100).optional(),
})
const prize = z.object({
  id: z.string().min(1), name: z.string().min(1), count: z.number().int().positive(),
  winners: z.array(z.string()), isTemporary: z.boolean(), includeWinners: z.boolean(),
  prizeImage: image, prizeImageName: z.string().optional(), order: z.number().int().nonnegative(),
})
const audio = z.object({ name: z.string(), data: z.string().regex(/^data:audio\/[\w.+-]+;base64,/) }).nullable()
export const backupSchema = z.object({
  format: z.literal('annual-lucky-draw'), version: z.literal(2),
  employees: z.array(employee), prizes: z.array(prize),
  settings: z.object({
    themeType: z.enum(['tech-dark', 'minimal-light', 'chinese-red']), background: image, logo: image,
    eventTitle: z.string().max(30),
    displayOptions: z.object({ showPhoto: z.boolean(), showId: z.boolean(), showName: z.boolean(), showDepartment: z.boolean() }),
    rotationSpeed: z.number().finite().min(0.5).max(6), drawMode: z.enum(['fair', 'weighted']),
  }),
  bgm: z.object({
    idleBgm: audio, rollingBgm: audio, winnerBgm: audio, bgmEnabled: z.boolean(),
    idleVolume: z.number().min(0).max(1), rollingVolume: z.number().min(0).max(1), winnerVolume: z.number().min(0).max(1),
  }),
  rig: z.object({ activated: z.boolean(), rigList: z.array(z.object({ prizeId: z.string(), employeeId: z.string() })) }),
}).superRefine((data, ctx) => {
  const ids = new Set(data.employees.map(e => e.id)), prizes = new Set(data.prizes.map(p => p.id))
  if (ids.size !== data.employees.length || prizes.size !== data.prizes.length) ctx.addIssue({ code: 'custom', message: '重复人员或奖项编号' })
  if (data.prizes.some(p => p.winners.length > p.count || new Set(p.winners).size !== p.winners.length || p.winners.some(id => !ids.has(id)))) ctx.addIssue({ code: 'custom', message: '中奖记录引用无效' })
  if (data.employees.some(e => e.prizeId && !prizes.has(e.prizeId))) ctx.addIssue({ code: 'custom', message: '人员引用的奖项不存在' })
  if (data.rig.rigList.some(r => !ids.has(r.employeeId) || !prizes.has(r.prizeId))) ctx.addIssue({ code: 'custom', message: '高级设置引用无效' })
})

async function embedImage(value?: string) {
  if (!value || value.startsWith('data:')) return value
  // Bundle-provided preset backgrounds must travel with the portable backup too.
  const response = await fetch(value)
  if (!response.ok) throw new Error('背景读取失败')
  const blob = await response.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob)
  })
}

export async function createBackup() {
  const t = useThemeStore.getState(), b = useBgmStore.getState(), r = useRigStore.getState()
  const data = await db.transaction('r', db.employees, db.prizes, async () => ({ employees: await db.employees.toArray(), prizes: await db.prizes.toArray() }))
  return backupSchema.parse({ format: 'annual-lucky-draw', version: 2, ...data,
    settings: { themeType: t.theme.type, background: await embedImage(t.theme.customBackground), logo: t.customAssets.logoImage,
      eventTitle: t.eventTitle, displayOptions: t.displayOptions, rotationSpeed: t.rotationSpeed, drawMode: t.drawMode },
    bgm: b, rig: r,
  })
}

export async function restoreBackup(input: unknown) {
  const data = backupSchema.parse(input)
  const s = data.settings
  const settings = {
    theme: { ...THEME_PRESETS[s.themeType], customBackground: s.background }, customAssets: { logoImage: s.logo },
    eventTitle: s.eventTitle, displayOptions: s.displayOptions, showWinnerAvatar: s.displayOptions.showPhoto,
    rotationSpeed: s.rotationSpeed, drawMode: s.drawMode,
  }
  const entries: [string, unknown][] = [['lottery-theme', settings], ['lottery-bgm', data.bgm], ['sys-render-cache-v3', data.rig]]
  const previous = entries.map(([key]) => [key, localStorage.getItem(key)] as const)
  try {
    // Quota errors occur before replacing the database. Restore previous settings on failure.
    for (const [key, state] of entries) localStorage.setItem(key, JSON.stringify({ state, version: 0 }))
    await importData(data)
  } catch (error) {
    for (const [key, value] of previous) { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value) }
    throw error
  }
}
