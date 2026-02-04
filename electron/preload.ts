import { contextBridge, ipcRenderer } from 'electron'

// 定义暴露给渲染进程的 API
const electronAPI = {
  // 选择 Excel 文件
  selectExcel: (): Promise<{
    path: string
    name: string
    buffer: ArrayBuffer
  } | null> => ipcRenderer.invoke('select-excel'),
  
  // 选择照片文件夹
  selectPhotosFolder: (): Promise<string | null> => 
    ipcRenderer.invoke('select-photos-folder'),
  
  // 读取照片文件夹
  readPhotos: (folderPath: string): Promise<Array<{
    name: string
    data: string
  }>> => ipcRenderer.invoke('read-photos', folderPath),
  
  // 选择单张图片
  selectImage: (): Promise<{
    name: string
    data: string
  } | null> => ipcRenderer.invoke('select-image'),
  
  // 导出 Excel
  exportExcel: (data: ArrayBuffer, defaultName: string): Promise<boolean> =>
    ipcRenderer.invoke('export-excel', data, defaultName),
  
  // 切换全屏
  toggleFullscreen: (): Promise<boolean> =>
    ipcRenderer.invoke('toggle-fullscreen'),
  
  // 获取全屏状态
  isFullscreen: (): Promise<boolean> =>
    ipcRenderer.invoke('is-fullscreen'),
}

// 将 API 暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// TypeScript 类型声明
export type ElectronAPI = typeof electronAPI
