// 双窗口投屏检查：打开大屏窗口，确认大屏只含抽奖画面、状态同步、
// 大屏按键回传控制台、关闭后窗口回收。
// 打包版：TEST_PROFILE=<隔离目录> LOTTERY_EXE=release/win-unpacked/年会抽奖.exe node tests/electron-screen-check.mjs
// 开发版：先 `vite --mode web --port 5173` 与 `vite build`，不设 LOTTERY_EXE 即可
import { _electron as electron } from '@playwright/test'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

if (!process.env.TEST_PROFILE) throw new Error('Set TEST_PROFILE to an isolated directory')
const profileArg = `--user-data-dir=${resolve(process.env.TEST_PROFILE)}`
const app = await electron.launch(process.env.LOTTERY_EXE
  ? { executablePath: resolve(process.env.LOTTERY_EXE), args: [profileArg] }
  : { executablePath: resolve('node_modules/electron/dist/electron.exe'), args: ['.', profileArg] })
const sleep = ms => new Promise(r => setTimeout(r, ms))
try {
  const main = await app.firstWindow()
  await main.getByRole('button', { name: /人员名单/ }).waitFor({ timeout: 60000 })
  await main.evaluate(async () => {
    const open = indexedDB.open('LotteryDB')
    await new Promise(r => { open.onsuccess = r })
    const db = open.result
    const tx = db.transaction(['employees', 'prizes'], 'readwrite')
    tx.objectStore('employees').clear(); tx.objectStore('prizes').clear()
    for (let i = 0; i < 40; i++) tx.objectStore('employees').put({ id: String(100 + i), name: `员工${i}`, department: '测试部', photoFile: '', isWinner: false })
    tx.objectStore('prizes').put({ id: 'p1', name: '幸运嘉宾', count: 3, winners: [], isTemporary: false, includeWinners: false, order: 0 })
    await new Promise(r => { tx.oncomplete = r })
    db.close()
  })
  await main.evaluate(() => { location.hash = '#/lottery'; location.reload() })
  await main.getByRole('button', { name: '开始', exact: true }).waitFor({ timeout: 30000 })

  const displays = await main.evaluate(() => window.electronAPI.listDisplays())
  assert.ok(displays.length >= 1)
  await main.evaluate(id => window.electronAPI.openScreen(id), displays[0].id)
  await sleep(500)
  const screen = app.windows().find(w => w.url().includes('#/screen'))
  assert.ok(screen, '大屏窗口未打开')
  await screen.getByText('幸运嘉宾').first().waitFor({ timeout: 30000 })
  const screenText = await screen.evaluate(() => document.body.innerText)
  for (const control of ['临时加奖', '投大屏', '可抽奖人数', '开始']) assert.ok(!screenText.includes(control), `大屏不应出现「${control}」`)
  assert.equal(await main.evaluate(() => document.hasFocus()), true, '焦点应留在控制台')
  assert.ok(await main.getByText('观众大屏已同步').isVisible())

  await main.keyboard.press('Space')
  await screen.getByText('抽奖中…').waitFor({ timeout: 10000 })
  await screen.keyboard.press('Space') // 翻页笔按在大屏上 → 转发给控制台停止
  await screen.getByRole('heading', { name: '幸运嘉宾' }).waitFor({ timeout: 15000 })
  await main.getByRole('heading', { name: '幸运嘉宾' }).waitFor({ timeout: 5000 })
  await screen.keyboard.press('Escape')
  await main.getByRole('button', { name: '开始', exact: true }).waitFor({ timeout: 10000 })

  await main.evaluate(() => window.electronAPI.closeScreen())
  await sleep(800)
  assert.equal(app.windows().filter(w => w.url().includes('#/screen')).length, 0, '大屏窗口应已关闭')
  assert.equal(await main.evaluate(() => window.electronAPI.isScreenOpen()), false)
  console.log('electron screen check passed', JSON.stringify(displays))
} finally {
  await app.close()
}
