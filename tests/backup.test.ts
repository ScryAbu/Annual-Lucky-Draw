import { beforeEach, expect, it, vi } from 'vitest'
import { backupSchema, createBackup, restoreBackup } from '../src/utils/backup'
import { db } from '../src/db/database'
import { useThemeStore } from '../src/stores/themeStore'
import { useRigStore } from '../src/stores/rigStore'
import { people, prize } from './fixtures'

beforeEach(async () => {
  localStorage.clear(); useRigStore.getState().clearAll()
  useThemeStore.getState().setCustomBackground(undefined)
  await db.employees.clear(); await db.prizes.clear()
  await db.employees.bulkPut(people(3)); await db.prizes.put(prize)
})
it('导出与导入往返保留名单、照片、权重、奖项和显示设置', async () => {
  const photo = 'data:image/png;base64,iVBORw0KGgo='
  await db.employees.update('0001', { photoData: photo, weight: 5 })
  useThemeStore.getState().setDisplayOptions({ showPhoto: false, showDepartment: false, showId: false, showName: true })
  const backup = await createBackup()
  await db.employees.clear()
  await restoreBackup(JSON.parse(JSON.stringify(backup)))
  expect(await db.employees.toArray()).toEqual(backup.employees)
  expect(await db.prizes.toArray()).toEqual(backup.prizes)
  expect(JSON.parse(localStorage.getItem('lottery-theme')!).state.displayOptions).toEqual(backup.settings.displayOptions)
  expect(JSON.stringify(backup)).not.toContain('setDisplayOptions')
})
it('拒绝损坏版本、重复 ID、无效中奖引用、非法图片 URL，不覆盖现有数据', async () => {
  const backup = await createBackup()
  const invalid = [
    { ...backup, version: 99 },
    { ...backup, employees: [...backup.employees, backup.employees[0]] },
    { ...backup, prizes: [{ ...prize, winners: ['missing'] }] },
    { ...backup, employees: [{ ...backup.employees[0], photoData: 'https://example.com/photo.jpg' }] },
  ]
  for (const item of invalid) { expect(backupSchema.safeParse(item).success).toBe(false); await expect(restoreBackup(item)).rejects.toThrow() }
  expect(await db.employees.count()).toBe(3)
})
it('数据库写入失败回退所有设置及旧数据库', async () => {
  const backup = await createBackup()
  localStorage.setItem('lottery-theme', 'old-settings')
  const failure = vi.spyOn(db.employees, 'bulkAdd').mockRejectedValueOnce(new Error('disk failure'))
  await expect(restoreBackup(backup)).rejects.toThrow('disk failure')
  failure.mockRestore()
  expect(localStorage.getItem('lottery-theme')).toBe('old-settings')
  expect(await db.employees.count()).toBe(3)
})
it('1.x 关闭头像设置可迁移到统一显示选项', async () => {
  localStorage.setItem('lottery-theme', JSON.stringify({ state: { showWinnerAvatar: false }, version: 0 }))
  await useThemeStore.persist.rehydrate()
  expect(useThemeStore.getState().displayOptions.showPhoto).toBe(false)
})
