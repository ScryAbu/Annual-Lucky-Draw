import { _electron as electron } from '@playwright/test'
import { resolve } from 'node:path'
import { writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

if (!process.env.TEST_PROFILE) throw new Error('Set TEST_PROFILE to an isolated, registered directory')
const profile = resolve(process.env.TEST_PROFILE)
const app = await electron.launch({
  executablePath: resolve('release/win-unpacked/年会抽奖.exe'),
  args: ['--smoke-test', `--user-data-dir=${profile}`],
})
try {
  const window = await app.firstWindow()
  const errors = []
  window.on('pageerror', e => errors.push(e.message))
  await window.getByRole('button', { name: /数据导入/ }).waitFor()
  const info = await app.evaluate(({ app, BrowserWindow }) => ({
    packaged: app.isPackaged, version: app.getVersion(), userData: app.getPath('userData'),
    visible: BrowserWindow.getAllWindows()[0].isVisible(),
    webSecurity: BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences().webSecurity,
  }))
  assert.equal(info.packaged, true)
  assert.equal(info.version, '2.0.0')
  assert.equal(info.userData.toLowerCase(), profile.toLowerCase())
  assert.equal(info.visible, false)
  assert.equal(info.webSecurity, true)
  const displays = await window.evaluate(() => window.electronAPI.listDisplays())
  assert.ok(displays.length >= 1)
  await window.getByRole('button', { name: /外观设置/ }).click()
  await window.getByText('只显示姓名', { exact: true }).waitFor()
  await window.getByText('只显示姓名', { exact: true }).click()
  await window.getByRole('button', { name: /配置迁移/ }).click()
  await window.getByText('导出完整配置', { exact: true }).waitFor()
  assert.deepEqual(errors, [])
  await window.screenshot({ path: 'docs/verification/windows-packaged.png' })
  const report = { packaged: info.packaged, version: info.version, isolatedProfile: true, hiddenWindow: !info.visible, webSecurity: info.webSecurity, displayCount: displays.length, pageErrors: errors }
  await writeFile('docs/verification/windows-smoke.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report))
} finally { await app.close() }
