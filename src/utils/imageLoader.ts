// 将文件转换为 Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 将 ArrayBuffer 转换为 Base64
export const arrayBufferToBase64 = (buffer: ArrayBuffer, mimeType: string): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return `data:${mimeType};base64,${btoa(binary)}`
}

// 压缩图片
export const compressImage = (
  base64: string,
  maxWidth: number = 200,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)
      
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = base64
  })
}

// 预加载图片
export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// 批量预加载图片
export const preloadImages = async (sources: string[]): Promise<void> => {
  await Promise.all(sources.map((src) => preloadImage(src).catch(() => null)))
}

// 获取图片的 MIME 类型
export const getImageMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
  }
  return mimeTypes[ext || ''] || 'image/jpeg'
}

// 生成默认头像（首字母）
export const generateDefaultAvatar = (name: string, bgColor: string = '#6366f1'): string => {
  const canvas = document.createElement('canvas')
  canvas.width = 200
  canvas.height = 200
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  
  // 背景
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, 200, 200)
  
  // 文字
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 80px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  const initial = name.charAt(0).toUpperCase()
  ctx.fillText(initial, 100, 100)
  
  return canvas.toDataURL('image/png')
}
