// 完整用户流程验收（打包版）：导入名单与照片 → 奖项 → 外观 → 音乐 → 抽奖 → 投大屏 → 加奖 →
// 历史 / 高级入口 → 轮盘 / 终极大奖 → 备份导出与恢复 → 清除记录。文件对话框在主进程中替换为测试文件。
// 用法：TEST_PROFILE=<隔离目录> FIXTURES=<临时目录> LOTTERY_EXE=release/win-unpacked/年会抽奖.exe node tests/user-journey.mjs
import { _electron as electron } from '@playwright/test'
import { resolve, join } from 'node:path'
import { mkdir, writeFile, rm, stat, readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'

for (const key of ['TEST_PROFILE', 'FIXTURES', 'LOTTERY_EXE']) if (!process.env[key]) throw new Error(`Set ${key}`)
const fx = resolve(process.env.FIXTURES)
await rm(fx, { recursive: true, force: true })
await mkdir(join(fx, 'photos'), { recursive: true })

// ---------- 测试素材 ----------
const N = 220
const rows = Array.from({ length: N }, (_, i) => ({
  工号: `E${String(i + 1).padStart(4, '0')}`, 姓名: `员工${i + 1}`, 部门: ['研发部', '市场部', '财务部'][i % 3],
  照片文件名: i < 24 ? `p${i + 1}.jpg` : '', 积分: i < 10 ? 10 + i : 0,
}))
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), '名单')
await writeFile(join(fx, 'names.xlsx'), XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
function wav(freq, secs = 4) {
  const sr = 8000, n = sr * secs, b = Buffer.alloc(44 + n * 2)
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16)
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34)
  b.write('data', 36); b.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(i / sr * freq * 6.283) * 2000), 44 + i * 2)
  return b
}
for (const [name, f] of [['idle.wav', 330], ['roll.wav', 440], ['win.wav', 660]]) await writeFile(join(fx, name), wav(f))

const app = await electron.launch({ executablePath: resolve(process.env.LOTTERY_EXE), args: [`--user-data-dir=${resolve(process.env.TEST_PROFILE)}`] })
const errors = []
const watch = page => {
  page.on('pageerror', e => errors.push(`[pageerror ${page.url().split('#')[1]}] ${e.message}`))
  page.on('console', m => { if (m.type() === 'error') errors.push(`[console ${page.url().split('#')[1]}] ${m.text()}`) })
  page.on('dialog', d => d.accept())
}
app.on('window', watch)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const step = name => console.log(`• ${name}`)

try {
  const main = await app.firstWindow()
  watch(main)
  await main.getByRole('button', { name: /人员名单/ }).waitFor({ timeout: 60000 })

  // 照片：在渲染进程画 24 张 1200×1500 的大图写入照片文件夹（模拟原片）
  const photos = await main.evaluate(n => Array.from({ length: n }, (_, i) => {
    const c = document.createElement('canvas'); c.width = 1200; c.height = 1500
    const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 1200, 1500)
    g.addColorStop(0, `hsl(${i * 37 % 360},70%,60%)`); g.addColorStop(1, `hsl(${(i * 37 + 140) % 360},60%,25%)`)
    x.fillStyle = g; x.fillRect(0, 0, 1200, 1500)
    for (let k = 0; k < 400; k++) { x.fillStyle = `hsla(${(k * 13) % 360},80%,60%,.5)`; x.fillRect((k * 97) % 1200, (k * 53) % 1500, 40, 40) }
    return c.toDataURL('image/jpeg', 0.95).split(',')[1]
  }), 24)
  await Promise.all(photos.map((b64, i) => writeFile(join(fx, 'photos', `p${i + 1}.jpg`), Buffer.from(b64, 'base64'))))
  const rawPhotoSize = (await stat(join(fx, 'photos', 'p1.jpg'))).size

  // 主进程：文件对话框改为返回测试素材
  await app.evaluate(({ dialog }, fx) => {
    const audios = ['idle.wav', 'roll.wav', 'win.wav']; let a = 0
    dialog.showOpenDialog = async (_w, opts) => {
      const t = (opts ?? _w).title
      if (t === '选择 Excel 文件') return { canceled: false, filePaths: [`${fx}\\names.xlsx`] }
      if (t === '选择照片文件夹') return { canceled: false, filePaths: [`${fx}\\photos`] }
      if (t === '选择音频文件') return { canceled: false, filePaths: [`${fx}\\${audios[a++ % 3]}`] }
      if (t === '选择图片') return { canceled: false, filePaths: [`${fx}\\photos\\p1.jpg`] }
      return { canceled: true, filePaths: [] }
    }
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: `${fx}\\export.xlsx` })
  }, fx)
  // 下载（导出名单 / 导出配置）：用户端会弹系统保存框，这里直接存到素材目录
  await app.evaluate(({ session }, fx) => {
    session.defaultSession.on('will-download', (_e, item) => {
      const name = item.getFilename().endsWith('.json') ? 'backup.json' : 'export.xlsx'
      item.setSavePath(`${fx}\\${name}`)
    })
  }, fx)
  const waitFile = async (p, timeout = 20000) => {
    const t0 = Date.now()
    for (;;) {
      try { const s = await stat(p); if (s.size > 0) { await sleep(300); return } } catch { /* 还没写好 */ }
      if (Date.now() - t0 > timeout) throw new Error(`下载超时：${p}`)
      await sleep(200)
    }
  }

  step('空状态提示')
  await main.getByText('开始抽奖前：先导入人员名单').waitFor()
  assert.ok(await main.getByRole('button', { name: '进入抽奖' }).isDisabled())

  step('导入 Excel + 照片文件夹（覆盖导入）')
  await main.getByText('点击选择 Excel 文件（.xlsx / .xls）').click()
  await main.getByText('点击选择照片所在文件夹').click()
  await sleep(3000)
  await main.getByRole('button', { name: /覆盖导入/ }).click()
  await main.getByText('导入成功！').waitFor({ timeout: 20000 })
  await main.getByText(`${N} 人`, { exact: true }).waitFor()
  const stored = await main.evaluate(async () => {
    const open = indexedDB.open('LotteryDB'); await new Promise(r => { open.onsuccess = r })
    const q = open.result.transaction('employees').objectStore('employees').getAll()
    await new Promise(r => { q.onsuccess = r }); open.result.close()
    const withPhoto = q.result.filter(e => e.photoData)
    return { count: q.result.length, withPhoto: withPhoto.length, maxPhoto: Math.max(...withPhoto.map(e => e.photoData.length)), points: q.result.filter(e => e.points > 0).length }
  })
  assert.equal(stored.count, N); assert.equal(stored.withPhoto, 24); assert.equal(stored.points, 10)
  assert.ok(stored.maxPhoto < rawPhotoSize, `照片应被压缩：${stored.maxPhoto} vs 原图 ${rawPhotoSize}`)
  console.log(`  照片原图 ${(rawPhotoSize / 1024).toFixed(0)}KB → 入库 ${(stored.maxPhoto * 0.75 / 1024).toFixed(0)}KB`)

  step('导出名单 Excel')
  await main.getByRole('button', { name: /导出/ }).first().click()
  await waitFile(join(fx, 'export.xlsx'))
  const exported = XLSX.read(await readFile(join(fx, 'export.xlsx')))
  assert.equal(XLSX.utils.sheet_to_json(exported.Sheets[exported.SheetNames[0]]).length, N)

  step('奖项设置：添加两个奖项')
  await main.getByRole('button', { name: /奖项设置/ }).click()
  for (const [name, count] of [['一等奖', '3'], ['特等奖', '1']]) {
    await main.getByRole('button', { name: /添加奖项/ }).click()
    await main.getByPlaceholder('如：一等奖、特等奖').fill(name)
    const num = main.locator('input[type=number]').first()
    await num.fill(count)
    await main.getByRole('button', { name: '确定', exact: true }).click()
    await main.getByText(name, { exact: true }).first().waitFor()
  }
  await main.getByText('2 个奖项').waitFor()

  step('外观：标题、显示预设、主题切换')
  await main.getByRole('button', { name: /外观设置/ }).click()
  await main.getByPlaceholder(/请输入活动标题/).fill('测试年会')
  await main.getByText('只显示姓名', { exact: true }).click()
  await main.getByText('全部显示', { exact: true }).click()
  await main.getByRole('heading', { name: '测试年会' }).waitFor()

  step('音效：选三段音乐、循环开关、试听开/停')
  await main.getByRole('button', { name: /音效设置/ }).click()
  for (let i = 0; i < 3; i++) await main.getByRole('button', { name: /选择音频文件/ }).first().click()
  await main.getByText('win.wav').waitFor()
  await main.getByRole('switch', { name: '中奖音乐循环播放' }).click()
  assert.equal(await main.getByRole('switch', { name: '中奖音乐循环播放' }).getAttribute('aria-checked'), 'true')
  await main.getByRole('button', { name: '试听' }).first().click()
  await main.getByRole('button', { name: '停止试听' }).waitFor()
  await main.getByRole('button', { name: '停止试听' }).click()
  assert.equal(await main.getByRole('button', { name: '停止试听' }).count(), 0)

  step('进入抽奖，投到第二块屏（无第二块屏时用主屏）')
  await main.getByRole('button', { name: '进入抽奖' }).click()
  await main.getByRole('button', { name: '开始', exact: true }).waitFor({ timeout: 30000 })
  const displays = await main.evaluate(() => window.electronAPI.listDisplays())
  const target = displays.find(d => !d.isOperator) ?? displays[0]
  await main.mouse.move(400, 300)
  await main.getByRole('button', { name: /投大屏/ }).click()
  await main.getByRole('button', { name: new RegExp(target.label.slice(0, 6)) }).click()
  await sleep(1500)
  const screen = app.windows().find(w => w.url().includes('#/screen'))
  assert.ok(screen, '大屏窗口未打开')
  await screen.getByRole('heading', { name: '测试年会' }).waitFor({ timeout: 20000 })
  await screen.getByText('一等奖').first().waitFor()
  const screenText = await screen.evaluate(() => document.body.innerText)
  for (const c of ['临时加奖', '投大屏', '可抽奖人数', '动效']) assert.ok(!screenText.includes(c), `大屏出现了控件「${c}」`)

  step('一等奖一次抽 3 人：空格开始 / 停止（空格在刚点过的按钮上也不应误触）')
  await main.getByRole('button', { name: '静音' }).click() // 焦点停在静音按钮上
  await main.getByRole('button', { name: '打开音乐' }).click()
  await main.getByRole('spinbutton', { name: '本次抽取人数' }).fill('3')
  await main.locator('body').click({ position: { x: 700, y: 400 } })
  await main.getByRole('button', { name: '静音' }).focus()
  await main.keyboard.press('Space')
  await main.getByRole('button', { name: '停止', exact: true }).waitFor()
  assert.equal(await main.getByRole('button', { name: '静音' }).count(), 1, '空格不应触发聚焦按钮（静音）')
  await screen.getByText('抽奖中…').waitFor()
  await sleep(1500)
  await main.keyboard.press('Space')
  await screen.getByRole('heading', { name: '一等奖' }).waitFor({ timeout: 15000 })
  await main.getByRole('heading', { name: '一等奖' }).waitFor()
  const winnersOnScreen = await screen.locator('h3').allTextContents()
  const winnersOnMain = await main.locator('h3').allTextContents()
  assert.equal(winnersOnScreen.length, 3); assert.deepEqual(winnersOnScreen, winnersOnMain)
  console.log(`  中奖：${winnersOnScreen.join('、')}`)
  await screen.keyboard.press('PageDown') // 翻页笔按在大屏上关闭弹窗
  await main.getByRole('button', { name: '已抽完' }).waitFor({ timeout: 10000 })
  await screen.getByText('已抽完').waitFor()

  step('→ 切到特等奖，大屏同步；大屏上用翻页笔完成一轮')
  await main.keyboard.press('ArrowRight')
  await screen.getByText('特等奖').first().waitFor()
  await screen.keyboard.press('PageDown')
  await screen.getByText('抽奖中…').waitFor()
  await sleep(1200)
  await screen.keyboard.press('PageDown')
  await screen.getByRole('heading', { name: '特等奖' }).waitFor({ timeout: 15000 })
  await screen.keyboard.press('Escape')
  await main.getByRole('button', { name: '已抽完' }).waitFor({ timeout: 10000 })

  step('临时加奖')
  await main.mouse.move(500, 300)
  await main.getByRole('button', { name: /临时加奖/ }).click()
  await main.getByPlaceholder('如：老板大气奖').fill('老板加奖')
  await main.getByRole('button', { name: '确定' }).click()
  await screen.getByText('老板加奖').first().waitFor()
  await main.getByRole('button', { name: '开始', exact: true }).waitFor()

  step('中奖记录面板 & 隐蔽高级入口')
  await main.mouse.move(500, 310)
  await main.getByText(/中奖记录/).first().click()
  await main.getByText('员工', { exact: false }).first().waitFor()
  await main.getByText(/中奖记录/).first().click()
  for (let i = 0; i < 5; i++) await main.getByText('可抽奖人数').click()
  await main.getByText('高级设置').waitFor()
  await main.keyboard.press('Escape')
  await main.mouse.click(20, 20)
  assert.equal(await main.getByText('高级设置').count(), 0)

  step('静音、全屏按钮')
  await main.mouse.move(500, 300)
  await main.getByRole('button', { name: '静音' }).click()
  await main.getByRole('button', { name: '打开音乐' }).click()

  step('回到设置页改主题 → 大屏同步主题')
  await main.keyboard.press('Escape')
  await main.getByRole('button', { name: /外观设置/ }).waitFor()
  await main.getByRole('button', { name: /外观设置/ }).click()
  await main.getByText('红色过年').first().click()
  await sleep(800)
  assert.equal(await screen.evaluate(() => document.documentElement.dataset.theme), 'chinese-red')
  await main.getByText('深色科技').first().click()

  step('直接关闭大屏窗口 → 控制台状态复位')
  await screen.close()
  await sleep(500)
  assert.equal(await main.evaluate(() => window.electronAPI.isScreenOpen()), false)

  step('轮盘抽奖页')
  await main.getByRole('button', { name: /轮盘抽奖/ }).click()
  await main.getByText(/开始|请先选择抽奖人/).first().waitFor({ timeout: 20000 })
  await sleep(1500)
  await main.keyboard.press('Escape')
  await main.goto(main.url().split('#')[0] + '#/')

  step('终极大奖页：抽一轮')
  await main.getByRole('button', { name: /终极大奖/ }).waitFor()
  await main.getByRole('button', { name: /终极大奖/ }).click()
  await main.getByRole('button', { name: '开始', exact: true }).waitFor({ timeout: 20000 })
  await main.keyboard.press('Space'); await sleep(1500); await main.keyboard.press('Space')
  await main.getByRole('button', { name: '继续' }).waitFor({ timeout: 15000 })
  await main.goto(main.url().split('#')[0] + '#/')

  step('备份导出 → 清除记录 → 导入恢复')
  await main.getByRole('button', { name: /配置迁移/ }).click()
  await main.getByRole('button', { name: '导出完整配置' }).click()
  const backupPath = join(fx, 'backup.json')
  await waitFile(backupPath)
  const before = await main.getByText(/已中奖 \d+ 人/).textContent()
  await main.getByRole('button', { name: /清除记录/ }).click()
  await sleep(800)
  assert.equal(await main.getByText(/已中奖 \d+ 人/).count(), 0)
  await main.locator('input[type=file][accept=".json"]').setInputFiles(backupPath)
  await main.waitForEvent('load', { timeout: 20000 }).catch(() => {})
  await main.getByText(/已中奖 \d+ 人/).waitFor({ timeout: 20000 })
  assert.equal(await main.getByText(/已中奖 \d+ 人/).textContent(), before)
  console.log(`  恢复后：${before}`)

  const real = errors.filter(e => !/Autofill|DevTools|Electron Security Warning|THREE\.WebGLRenderer: Context Lost/.test(e))
  if (real.length) { console.log('页面错误：\n' + real.join('\n')); process.exitCode = 1 }
  else console.log('用户流程验收通过，无页面错误')
} finally {
  await app.close()
}
