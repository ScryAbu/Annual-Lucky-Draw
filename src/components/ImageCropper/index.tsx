import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ImageCropperProps {
  isOpen: boolean
  imageData: string
  onConfirm: (croppedImage: string) => void
  onCancel: () => void
  isDark?: boolean
  isChineseRed?: boolean
}

export default function ImageCropper({
  isOpen,
  imageData,
  onConfirm,
  onCancel,
  isDark = true,
  isChineseRed = false,
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)

  // 加载图片
  useEffect(() => {
    if (isOpen && imageData) {
      const img = new Image()
      img.onload = () => {
        imageRef.current = img
        setImageLoaded(true)
        // 重置状态
        setScale(1)
        setPosition({ x: 0, y: 0 })
      }
      img.src = imageData
    }
  }, [isOpen, imageData])

  // 绘制预览
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const img = imageRef.current

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 计算图片绘制尺寸
    const canvasSize = 300
    const imgAspect = img.width / img.height
    let drawWidth, drawHeight

    if (imgAspect > 1) {
      drawHeight = canvasSize * scale
      drawWidth = drawHeight * imgAspect
    } else {
      drawWidth = canvasSize * scale
      drawHeight = drawWidth / imgAspect
    }

    // 绘制图片（居中+偏移）
    const x = (canvasSize - drawWidth) / 2 + position.x
    const y = (canvasSize - drawHeight) / 2 + position.y
    ctx.drawImage(img, x, y, drawWidth, drawHeight)

    // 绘制裁剪框遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvasSize, canvasSize)
    
    // 裁剪圆形区域
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'

    // 绘制圆形边框
    ctx.strokeStyle = isChineseRed ? '#FFD700' : '#6366f1'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 20, 0, Math.PI * 2)
    ctx.stroke()

  }, [imageLoaded, scale, position, isChineseRed])

  // 鼠标拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }, [position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale((s) => Math.min(3, Math.max(0.5, s + delta)))
  }, [])

  // 确认裁剪
  const handleConfirm = useCallback(() => {
    if (!imageRef.current) return

    const img = imageRef.current
    const outputSize = 256 // 输出尺寸
    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = outputSize
    cropCanvas.height = outputSize
    const ctx = cropCanvas.getContext('2d')!

    // 计算裁剪区域
    const canvasSize = 300
    const cropRadius = canvasSize / 2 - 20
    const imgAspect = img.width / img.height
    let drawWidth, drawHeight

    if (imgAspect > 1) {
      drawHeight = canvasSize * scale
      drawWidth = drawHeight * imgAspect
    } else {
      drawWidth = canvasSize * scale
      drawHeight = drawWidth / imgAspect
    }

    // 源图片坐标
    const centerX = (canvasSize - drawWidth) / 2 + position.x + canvasSize / 2
    const centerY = (canvasSize - drawHeight) / 2 + position.y + canvasSize / 2

    // 映射回原图坐标
    const srcCenterX = ((centerX - ((canvasSize - drawWidth) / 2 + position.x)) / drawWidth) * img.width
    const srcCenterY = ((centerY - ((canvasSize - drawHeight) / 2 + position.y)) / drawHeight) * img.height
    const srcRadius = (cropRadius / drawWidth) * img.width

    // 圆形裁剪
    ctx.beginPath()
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2)
    ctx.clip()

    // 绘制
    const srcX = srcCenterX - srcRadius
    const srcY = srcCenterY - srcRadius
    const srcSize = srcRadius * 2
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, outputSize, outputSize)

    // 压缩并输出
    const quality = 0.8
    const result = cropCanvas.toDataURL('image/jpeg', quality)
    onConfirm(result)
  }, [scale, position, onConfirm])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`
              w-[400px] rounded-2xl p-6 shadow-2xl
              ${isChineseRed
                ? 'bg-gradient-to-br from-red-900 to-red-800 border-2 border-yellow-500/30'
                : isDark ? 'bg-slate-800' : 'bg-white'
              }
            `}
          >
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              调整头像
            </h3>

            {/* 裁剪区域 */}
            <div
              ref={containerRef}
              className="relative mx-auto mb-4 cursor-move select-none"
              style={{ width: 300, height: 300 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="rounded-xl"
              />
            </div>

            {/* 缩放控制 */}
            <div className="flex items-center gap-4 mb-6">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>缩放</span>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
              <span className={`text-sm w-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {Math.round(scale * 100)}%
              </span>
            </div>

            <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              提示：拖动图片调整位置，滚轮或滑块调整缩放
            </p>

            {/* 按钮 */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className={`
                  flex-1 py-2.5 rounded-xl font-medium transition-all
                  ${isDark
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className={`
                  flex-1 py-2.5 rounded-xl font-medium transition-all
                  ${isChineseRed
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-red-900 hover:from-yellow-400 hover:to-yellow-500'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
                  }
                `}
              >
                确认裁剪
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
