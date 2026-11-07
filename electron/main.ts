import { app, BrowserWindow, ipcMain, dialog, screen } from 'electron'
import { join } from 'path'
import { readFile, readdir } from 'fs/promises'
import { writeFileSync } from 'fs'

// 开发环境判断
const smokeTest = process.argv.includes('--smoke-test')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      // 允许 file:// 协议加载 ES modules（本地桌面应用安全）
      webSecurity: true,
    },
    frame: true,
    show: false,
    backgroundColor: '#0f172a',
  })

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    if (!smokeTest) mainWindow?.show()
  })

  // 加载页面
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // 调试模式：按 Ctrl+Shift+I 打开 DevTools
    mainWindow.webContents.on('before-input-event', (_event, input) => {
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        mainWindow?.webContents.openDevTools()
      }
    })
    
    // 生产环境加载打包后的文件
    const appPath = app.getAppPath()
    const indexPath = join(appPath, 'dist', 'index.html')
    mainWindow.loadFile(indexPath)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    screenWindow?.close()
  })
}

// 应用准备就绪
app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭时退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ==================== IPC 处理 ====================

// 选择 Excel 文件
ipcMain.handle('select-excel', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '选择 Excel 文件',
    filters: [
      { name: 'Excel 文件', extensions: ['xlsx', 'xls'] },
    ],
    properties: ['openFile'],
  })
  
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  
  const filePath = result.filePaths[0]
  const buffer = await readFile(filePath)
  
  return {
    path: filePath,
    name: filePath.split(/[\\/]/).pop(),
    buffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  }
})

// 选择照片文件夹
ipcMain.handle('select-photos-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '选择照片文件夹',
    properties: ['openDirectory'],
  })
  
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  
  return result.filePaths[0]
})

// 读取文件夹中的照片
ipcMain.handle('read-photos', async (_event, folderPath: string) => {
  try {
    const files = await readdir(folderPath)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    
    const photos: Array<{ name: string; data: string }> = []
    
    for (const file of files) {
      const ext = file.substring(file.lastIndexOf('.')).toLowerCase()
      if (imageExtensions.includes(ext)) {
        const filePath = join(folderPath, file)
        const buffer = await readFile(filePath)
        const base64 = buffer.toString('base64')
        const mimeType = ext === '.png' ? 'image/png' : 
                        ext === '.gif' ? 'image/gif' : 
                        ext === '.webp' ? 'image/webp' : 
                        'image/jpeg'
        
        photos.push({
          name: file,
          data: `data:${mimeType};base64,${base64}`,
        })
      }
    }
    
    return photos
  } catch (error) {
    console.error('Failed to read photos:', error)
    return []
  }
})

// 选择单张图片
ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '选择图片',
    filters: [
      { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
    ],
    properties: ['openFile'],
  })
  
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  
  const filePath = result.filePaths[0]
  const buffer = await readFile(filePath)
  const fileName = filePath.split(/[\\/]/).pop() || ''
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
  const mimeType = ext === '.png' ? 'image/png' : 
                  ext === '.gif' ? 'image/gif' : 
                  ext === '.webp' ? 'image/webp' : 
                  'image/jpeg'
  
  return {
    name: fileName,
    data: `data:${mimeType};base64,${buffer.toString('base64')}`,
  }
})

// 导出 Excel 文件
ipcMain.handle('export-excel', async (_event, data: ArrayBuffer, defaultName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: '导出中奖名单',
    defaultPath: defaultName,
    filters: [
      { name: 'Excel 文件', extensions: ['xlsx'] },
    ],
  })
  
  if (result.canceled || !result.filePath) {
    return false
  }
  
  try {
    writeFileSync(result.filePath, Buffer.from(data))
    return true
  } catch (error) {
    console.error('Failed to export Excel:', error)
    return false
  }
})

// 选择音频文件
ipcMain.handle('select-audio', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '选择音频文件',
    filters: [
      { name: '音频文件', extensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'] },
    ],
    properties: ['openFile'],
  })
  
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  
  const filePath = result.filePaths[0]
  const buffer = await readFile(filePath)
  const fileName = filePath.split(/[\\/]/).pop() || ''
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
  
  const mimeMap: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.aac': 'audio/aac',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',
  }
  const mimeType = mimeMap[ext] || 'audio/mpeg'
  
  return {
    name: fileName,
    data: `data:${mimeType};base64,${buffer.toString('base64')}`,
  }
})

// 切换全屏
ipcMain.handle('toggle-fullscreen', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) ?? mainWindow
  if (win) {
    win.setFullScreen(!win.isFullScreen())
    return win.isFullScreen()
  }
  return false
})

// 获取全屏状态
ipcMain.handle('is-fullscreen', () => {
  return mainWindow?.isFullScreen() || false
})

// ==================== 大屏（观众）窗口 ====================
// 抽奖引擎只在主控窗口运行；大屏窗口只渲染主控窗口推送来的状态，绝不自行抽取。
// 大屏上收到的按键（例如翻页笔）转发回主控窗口处理。
let screenWindow: BrowserWindow | null = null

function displayLabel(display: Electron.Display, index: number) {
  const tags = [
    display.id === screen.getPrimaryDisplay().id ? '主屏' : '',
    mainWindow && screen.getDisplayMatching(mainWindow.getBounds()).id === display.id ? '控制台所在' : '',
  ].filter(Boolean).join(' · ')
  return `${display.label || `显示器 ${index + 1}`}（${display.size.width}×${display.size.height}）${tags ? ` · ${tags}` : ''}`
}

function notifyScreenStatus() {
  mainWindow?.webContents.send('screen-msg', { type: 'status', open: Boolean(screenWindow) })
}

ipcMain.handle('list-displays', () => screen.getAllDisplays().map((display, index) => ({
  id: display.id,
  label: displayLabel(display, index),
  isOperator: Boolean(mainWindow && screen.getDisplayMatching(mainWindow.getBounds()).id === display.id),
})))

ipcMain.handle('screen-open', async (_event, id: number) => {
  const display = screen.getAllDisplays().find(item => item.id === id)
  if (!display || !mainWindow) throw new Error('显示器不可用')
  if (!screenWindow) {
    screenWindow = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      show: false,
      backgroundColor: '#000000',
      autoHideMenuBar: true,
      title: '抽奖大屏',
      webPreferences: {
        preload: join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
      },
    })
    screenWindow.on('closed', () => { screenWindow = null; notifyScreenStatus() })
    if (isDev) await screenWindow.loadURL('http://localhost:5173/#/screen')
    else await screenWindow.loadFile(join(app.getAppPath(), 'dist', 'index.html'), { hash: '/screen' })
  } else if (screenWindow.isFullScreen()) {
    const win = screenWindow
    await new Promise<void>(resolve => { win.once('leave-full-screen', () => resolve()); win.setFullScreen(false) })
  }
  screenWindow.setBounds(display.bounds)
  screenWindow.showInactive()
  screenWindow.setFullScreen(true)
  // 焦点留在控制台，键盘和鼠标操作仍在笔记本上进行
  mainWindow.focus()
  notifyScreenStatus()
})

// 轮盘 / 终极大奖页面：把整个窗口移到所选显示器并全屏
ipcMain.handle('present-on-display', async (_event, id: number) => {
  const display = screen.getAllDisplays().find(item => item.id === id)
  const win = mainWindow
  if (!display || !win) throw new Error('显示器不可用')
  if (win.isFullScreen()) {
    await new Promise<void>(resolve => { win.once('leave-full-screen', () => resolve()); win.setFullScreen(false) })
  }
  win.setBounds(display.bounds)
  win.setFullScreen(true)
  win.focus()
})

ipcMain.handle('screen-close', () => {
  screenWindow?.close()
})

ipcMain.handle('screen-is-open', () => Boolean(screenWindow))

ipcMain.on('screen-relay', (event, msg: unknown) => {
  const fromScreen = screenWindow && event.sender === screenWindow.webContents
  const target = fromScreen ? mainWindow : screenWindow
  target?.webContents.send('screen-msg', msg)
})
