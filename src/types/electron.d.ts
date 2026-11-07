// Electron API 类型声明
interface ElectronAPI {
  listDisplays: () => Promise<Array<{ id: number; label: string; isOperator: boolean }>>
  presentOnDisplay: (id: number) => Promise<void>
  openScreen: (id: number) => Promise<void>
  closeScreen: () => Promise<void>
  isScreenOpen: () => Promise<boolean>
  sendScreenMessage: (msg: unknown) => void
  onScreenMessage: (cb: (msg: unknown) => void) => () => void
  selectExcel: () => Promise<{
    path: string
    name: string
    buffer: ArrayBuffer
  } | null>
  
  selectPhotosFolder: () => Promise<string | null>
  
  readPhotos: (folderPath: string) => Promise<Array<{
    name: string
    data: string
  }>>
  
  selectImage: () => Promise<{
    name: string
    data: string
  } | null>
  
  selectAudio: () => Promise<{
    name: string
    data: string
  } | null>
  
  exportExcel: (data: ArrayBuffer, defaultName: string) => Promise<boolean>
  
  toggleFullscreen: () => Promise<boolean>
  
  isFullscreen: () => Promise<boolean>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
