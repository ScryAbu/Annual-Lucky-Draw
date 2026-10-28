import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

// Run against `npm run dev:web -- --host 127.0.0.1 --port 5178`.
// TEST_PROFILE must point to a registered disposable directory, never a personal profile.
if (!process.env.TEST_PROFILE) throw new Error('Set TEST_PROFILE to an isolated test directory')
const context = await chromium.launchPersistentContext(process.env.TEST_PROFILE, {
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true, viewport: { width: 1920, height: 1080 },
})
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('dialog', dialog => dialog.dismiss())
await page.addInitScript(() => {
  window.textureStats = { created: 0, deleted: 0 }
  for (const Class of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!Class) continue
    for (const [method, counter] of [['createTexture', 'created'], ['deleteTexture', 'deleted']]) {
      const original = Class.prototype[method]
      Class.prototype[method] = function (...args) { window.textureStats[counter]++; return original.apply(this, args) }
    }
  }
})
const evidence = 'docs/verification'
await mkdir(evidence, { recursive: true })
try {
  await page.goto('http://127.0.0.1:5178')
  await page.waitForSelector('header')
  await page.evaluate(async () => {
    const { db } = await import('/src/db/database.ts')
    const { useEmployeeStore } = await import('/src/stores/employeeStore.ts')
    const { usePrizeStore } = await import('/src/stores/prizeStore.ts')
    const { useThemeStore } = await import('/src/stores/themeStore.ts')
    const { useRigStore } = await import('/src/stores/rigStore.ts')
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 96
    const ctx = canvas.getContext('2d')
    const employees = Array.from({ length: 150 }, (_, i) => {
      ctx.fillStyle = `hsl(${i * 17 % 360} 60% 40%)`; ctx.fillRect(0, 0, 96, 96)
      ctx.fillStyle = 'white'; ctx.font = '30px sans-serif'; ctx.fillText(String(i + 1), 15, 55)
      return { id: String(i + 1).padStart(4, '0'), name: `嘉宾${i + 1}`, department: '测试部门', photoFile: '', photoData: canvas.toDataURL(), isWinner: false }
    })
    const prizes = [{ id: 'smoke', name: '幸运嘉宾', count: 30, winners: [], includeWinners: false, isTemporary: false, order: 0 }]
    await db.transaction('rw', db.employees, db.prizes, async () => {
      await db.employees.clear(); await db.prizes.clear(); await db.employees.bulkPut(employees); await db.prizes.bulkPut(prizes)
    })
    await useEmployeeStore.getState().loadFromDB(); await usePrizeStore.getState().loadFromDB()
    useRigStore.getState().clearAll()
    useThemeStore.getState().setDisplayOptions({ showId: true, showName: true, showDepartment: false, showPhoto: true })
    useThemeStore.getState().setEventTitle('抽奖 2.0 · 150 人验证')
    location.hash = '/lottery'
  })
  await page.getByRole('button', { name: '开始', exact: true }).waitFor()
  await page.waitForFunction(() => window.textureStats.created >= 150)
  await page.waitForTimeout(500)
  await page.getByRole('spinbutton').fill('5')
  await page.getByRole('spinbutton').blur()
  await page.keyboard.press('Space')
  await page.getByRole('button', { name: '停止', exact: true }).waitFor()
  const initial = await page.evaluate(() => ({ ...window.textureStats }))
  await page.waitForTimeout(6000)
  const rolling = await page.evaluate(() => ({ ...window.textureStats }))
  assert.ok(initial.created >= 150, 'All 150 card textures must actually reach WebGL')
  assert.equal(rolling.created, initial.created, 'Rolling must not allocate new textures')
  assert.equal(rolling.deleted, initial.deleted, 'Rolling must not repeatedly unmount cards')
  await page.screenshot({ path: `${evidence}/150-rolling.png` })
  await page.keyboard.press('Space')
  await page.getByText('🎉 幸运嘉宾 🎉').waitFor()
  const result = await page.evaluate(async () => {
    const { useLotteryStore } = await import('/src/stores/lotteryStore.ts')
    const { db } = await import('/src/db/database.ts')
    return { shown: useLotteryStore.getState().currentWinners.map(e => e.id), saved: (await db.prizes.get('smoke')).winners }
  })
  assert.equal(result.shown.length, 5)
  assert.deepEqual(result.shown, result.saved)
  assert.equal(await page.getByText('测试部门', { exact: true }).count(), 0)
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${evidence}/winners-five.png` })
  await page.keyboard.press('Space')
  await page.evaluate(async () => {
    const { useThemeStore } = await import('/src/stores/themeStore.ts')
    useThemeStore.getState().setDisplayOptions({ showId: true, showName: false, showDepartment: false, showPhoto: false })
  })
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.getByRole('button', { name: '停止', exact: true }).click()
  await page.getByText('🎉 幸运嘉宾 🎉').waitFor()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${evidence}/numbers-only.png` })
  assert.equal(await page.locator('h3').filter({ hasText: /嘉宾\d/ }).count(), 0)
  assert.deepEqual(errors, [])
  await page.keyboard.press('Space')
  await page.evaluate(async () => {
    const { useEmployeeStore } = await import('/src/stores/employeeStore.ts')
    useEmployeeStore.setState({ employees: useEmployeeStore.getState().employees.slice(0, 3).map(e => ({ ...e, isWinner: false })) })
  })
  const positions = () => page.evaluate(async () => {
    const fiberURL = performance.getEntriesByType('resource').find(e => e.name.includes('/@react-three_fiber.js?'))?.name
    if (!fiberURL) throw new Error('R3F module URL missing')
    const { _roots } = await import(fiberURL)
    const root = [..._roots.values()][0].store.getState(), positions = []
    root.scene.traverse(o => { if (o.isSprite) positions.push(o.getWorldPosition(o.position.clone()).toArray()) })
    return positions
  })
  await page.waitForTimeout(300)
  const before = await positions()
  await page.waitForTimeout(1200)
  const after = await positions()
  assert.equal(before.length, 3)
  assert.ok(before.every((p, i) => p.some((n, axis) => Math.abs(n - after[i][axis]) > 0.01)), 'Every small-pool card must move')
  await page.screenshot({ path: `${evidence}/three-people.png` })
  assert.deepEqual(errors, [])
  const report = { smallPoolMovement: { before, after }, scenario: '150 synthetic photo participants, keyboard batch=5, numbers-only second round', initial, rolling, result, pageErrors: errors }
  await writeFile(`${evidence}/browser-smoke.json`, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report))
} catch (error) {
  await page.screenshot({ path: `${evidence}/failure.png` }); console.error(page.url(), (await page.locator('body').innerText()).slice(0, 1200)); throw error
} finally { await context.close() }
