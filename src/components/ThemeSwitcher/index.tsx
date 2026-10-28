import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '../../stores/themeStore'
import { ThemeType, SceneEffectType, DisplayOptions } from '../../types'
import { paintEmployeeCard } from '../../utils/display'

// 导入预设背景图
import bgNewyear from '../../assets/newyear.jpg'
import bgBack2 from '../../assets/back2.jpg'
import bgBack3 from '../../assets/back3.jpg'

// 预设背景选项（中国红主题专用）
const presetBackgrounds = [
  { id: 'newyear', name: '新年喜庆', src: bgNewyear },
  { id: 'back2', name: '新年祝福（带字）', src: bgBack2 },
  { id: 'back3', name: '红色简约', src: bgBack3 },
]

const sceneEffects: Array<{ type: SceneEffectType; icon: string; name: string; desc: string }> = [
  { type: 'sphere', icon: '🌐', name: '经典球体', desc: '黄金螺旋球体环绕旋转' },
  { type: 'helix', icon: '🪐', name: '螺旋星环', desc: '多层立体圆柱螺旋穿梭' },
  { type: 'starfield', icon: '🌌', name: '全屏漫游', desc: '全屏空间卡片自由飞舞' },
  { type: 'matrix', icon: '💻', name: '矩阵数据雨', desc: '多列交错下落瀑布流' },
]

const themes: Array<{
  type: ThemeType
  name: string
  description: string
  preview: {
    bg: string
    accent: string
    text: string
    decoration?: string
  }
}> = [
  {
    type: 'tech-dark',
    name: '深色科技',
    description: '科技公司、互联网企业',
    preview: {
      bg: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
      accent: 'bg-indigo-500',
      text: 'text-white',
    },
  },
  {
    type: 'minimal-light',
    name: '白色极简',
    description: '正式场合、专业会议',
    preview: {
      bg: 'bg-gradient-to-br from-gray-50 to-white',
      accent: 'bg-blue-500',
      text: 'text-gray-800',
    },
  },
  {
    type: 'chinese-red',
    name: '🏮 红色过年',
    description: '年会、春节活动 🧧',
    preview: {
      bg: 'bg-gradient-to-br from-red-800 via-red-700 to-red-800',
      accent: 'bg-yellow-400',
      text: 'text-yellow-100',
      decoration: 'chinese',
    },
  },
]

function createSampleAvatarImage(): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')
    if (ctx && typeof ctx.fillRect === 'function') {
      if (typeof ctx.createLinearGradient === 'function') {
        const g = ctx.createLinearGradient(0, 0, 256, 256)
        g.addColorStop(0, '#38bdf8')
        g.addColorStop(1, '#6366f1')
        ctx.fillStyle = g
      } else {
        ctx.fillStyle = '#38bdf8'
      }
      ctx.fillRect(0, 0, 256, 256)
      // 绘制简约人像剪影作为示例照片
      ctx.fillStyle = 'rgba(255,255,255,0.88)'
      if (typeof ctx.beginPath === 'function' && typeof ctx.arc === 'function' && typeof ctx.fill === 'function') {
        ctx.beginPath()
        ctx.arc(128, 92, 42, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(128, 224, 78, Math.PI, Math.PI * 2)
        ctx.fill()
      }
    }
    const img = new Image()
    img.onload = () => resolve(img)
    try {
      img.src = c.toDataURL('image/png')
    } catch {
      resolve(img)
    }
  })
}

function CardPreviewCanvas({
  options,
  primaryColor,
  withPhoto,
}: {
  options: DisplayOptions
  primaryColor: string
  withPhoto: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const sampleEmployee = {
      id: 'A0088',
      name: '张晓明',
      department: '产品研发部',
      photoFile: '',
      isWinner: false,
    }

    let cancelled = false
    paintEmployeeCard(ctx, sampleEmployee, options, primaryColor)

    if (withPhoto && options.showPhoto) {
      createSampleAvatarImage().then((img) => {
        if (!cancelled) paintEmployeeCard(ctx, sampleEmployee, options, primaryColor, img)
      })
    }

    return () => {
      cancelled = true
    }
  }, [options, primaryColor, withPhoto])

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={256}
      className="w-36 h-36 rounded-2xl shadow-lg"
    />
  )
}

export default function ThemeSwitcher() {
  const {
    theme,
    setTheme,
    setCustomBackground,
    setLogoImage,
    customAssets,
    eventTitle,
    setEventTitle,
    displayOptions,
    setDisplayOptions,
    rotationSpeed,
    setRotationSpeed,
    sphereScale,
    setSphereScale,
    sceneEffect,
    setSceneEffect,
  } = useThemeStore()
  const isDark = theme.type !== 'minimal-light'
  const isChineseRed = theme.type === 'chinese-red'
  
  // 选择自定义背景
  const handleSelectBackground = async () => {
    const result = await window.electronAPI.selectImage()
    if (result) {
      setCustomBackground(result.data)
    }
  }

  // 清除自定义背景
  const handleClearBackground = () => {
    setCustomBackground(undefined)
  }

  // 选择 Logo
  const handleSelectLogo = async () => {
    const result = await window.electronAPI.selectImage()
    if (result) {
      setLogoImage(result.data)
    }
  }

  // 清除 Logo
  const handleClearLogo = () => {
    setLogoImage(undefined)
  }

  return (
    <div className="space-y-6">
      {/* 主题选择 */}
      <div className={`rounded-xl p-6 relative z-10 ${
        isChineseRed 
          ? 'bg-gradient-to-br from-red-900/80 to-red-800/80 border-2 border-yellow-500/30' 
          : isDark ? 'bg-white/5' : 'bg-gray-100'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          选择主题风格
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          {themes.map((t) => (
            <motion.div
              key={t.type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTheme(t.type)}
              className={`
                relative cursor-pointer rounded-xl overflow-hidden
                ${theme.type === t.type 
                  ? isChineseRed 
                    ? 'ring-2 ring-offset-2 ring-yellow-500' 
                    : 'ring-2 ring-offset-2 ring-indigo-500' 
                  : ''
                }
              `}
            >
              {/* 预览区 */}
              <div className={`${t.preview.bg} p-4 h-32 flex flex-col justify-between relative overflow-hidden`}>
                {/* 中国红特殊装饰 */}
                {t.preview.decoration === 'chinese' && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>
                    <div className="absolute top-1 left-2 text-lg">🏮</div>
                    <div className="absolute top-1 right-2 text-lg">🏮</div>
                    <div className="absolute bottom-2 right-2 text-2xl opacity-30">福</div>
                  </>
                )}
                <div className="flex gap-1">
                  <div className={`w-2 h-2 rounded-full ${t.preview.accent}`}></div>
                  <div className={`w-2 h-2 rounded-full ${t.preview.accent} opacity-60`}></div>
                  <div className={`w-2 h-2 rounded-full ${t.preview.accent} opacity-30`}></div>
                </div>
                <div className="space-y-1">
                  <div className={`w-16 h-2 rounded ${t.preview.accent}`}></div>
                  <div className={`w-12 h-2 rounded ${t.preview.accent} opacity-50`}></div>
                </div>
              </div>
              
              {/* 标签 */}
              <div className={`p-3 ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {t.name}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t.description}
                </p>
              </div>

              {/* 选中标记 */}
              {theme.type === t.type && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-sm">✓</span>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* 预设背景选择（中国红主题） */}
      {isChineseRed && (
        <div className="rounded-xl p-6 relative z-10 bg-gradient-to-br from-red-900/80 to-red-800/80 border-2 border-yellow-500/30">
          <h3 className="text-lg font-semibold mb-4 text-white">
            选择过年背景
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            {presetBackgrounds.map((bg) => (
              <motion.div
                key={bg.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCustomBackground(bg.src)}
                className={`
                  relative cursor-pointer rounded-xl overflow-hidden
                  ${theme.customBackground === bg.src
                    ? 'ring-2 ring-offset-2 ring-yellow-500 ring-offset-red-900'
                    : 'ring-1 ring-yellow-500/20'
                  }
                `}
              >
                <img 
                  src={bg.src} 
                  alt={bg.name}
                  className="w-full h-24 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                  <p className="text-xs text-white text-center">{bg.name}</p>
                </div>
                {theme.customBackground === bg.src && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-red-900 text-xs font-bold">✓</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-yellow-200/60 mt-3">
            选择后会应用到抽奖页面背景，也可以在下方上传自己的背景
          </p>
        </div>
      )}

      {/* 自定义背景 */}
      <div className={`rounded-xl p-6 relative z-10 ${
        isChineseRed 
          ? 'bg-gradient-to-br from-red-900/80 to-red-800/80 border-2 border-yellow-500/30' 
          : isDark ? 'bg-white/5' : 'bg-gray-100'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {isChineseRed ? '或上传自定义背景' : '自定义背景图（可选）'}
        </h3>
        
        <div className="flex gap-4">
          <div
            onClick={handleSelectBackground}
            className={`
              flex-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
              transition-all hover:scale-[1.02]
              ${isChineseRed
                ? 'border-yellow-500/30 hover:border-yellow-500'
                : isDark
                  ? 'border-white/20 hover:border-indigo-500'
                  : 'border-gray-300 hover:border-blue-500'
              }
            `}
          >
            {theme.customBackground && !presetBackgrounds.some(bg => bg.src === theme.customBackground) ? (
              <div className="space-y-2">
                <img
                  src={theme.customBackground}
                  alt="自定义背景"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  点击更换背景图
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">🖼️</div>
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                  点击上传自定义背景
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  建议尺寸 1920×1080
                </p>
              </div>
            )}
          </div>

          {theme.customBackground && (
            <button
              onClick={handleClearBackground}
              className={`
                self-start px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${isDark
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
                }
              `}
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* 活动标题 */}
      <div className={`rounded-xl p-6 relative z-10 ${
        isChineseRed 
          ? 'bg-gradient-to-br from-red-900/80 to-red-800/80 border-2 border-yellow-500/30' 
          : isDark ? 'bg-white/5' : 'bg-gray-100'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          活动标题
        </h3>
        
        <div className="space-y-3">
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="请输入活动标题，如：XXX公司2026年会抽奖"
            maxLength={30}
            className={`
              w-full px-4 py-3 rounded-xl text-lg font-medium
              outline-none transition-all
              ${isChineseRed
                ? 'bg-red-950/50 border-2 border-yellow-500/30 text-yellow-100 placeholder:text-yellow-100/40 focus:border-yellow-500'
                : isDark
                  ? 'bg-slate-800 border border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-500'
                  : 'bg-white border border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-blue-500'
              }
            `}
          />
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            此标题将显示在抽奖页面顶部，与Logo一起展示（最多30字）
          </p>
        </div>
      </div>

      {/* 显示选项、3D 动效形态与名片实时预览 */}
      <div className={`rounded-xl p-6 relative z-10 ${
        isChineseRed 
          ? 'bg-gradient-to-br from-red-900/80 to-red-800/80 border-2 border-yellow-500/30' 
          : isDark ? 'bg-white/5' : 'bg-gray-100'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          显示选项与 3D 场景效果
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 左侧：字段开关、预设、尺寸与转速 */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                球体、号码卡片及中奖界面使用同一组显示选项：
              </p>
              <div className="flex flex-wrap gap-4">
                {([['showPhoto', '照片'], ['showName', '姓名'], ['showId', '工号 / 号码'], ['showDepartment', '部门']] as const).map(([key, label]) => (
                  <label
                    key={key}
                    className={`
                      flex gap-2 items-center px-3.5 py-2 rounded-xl cursor-pointer select-none transition-all
                      ${displayOptions[key]
                        ? isChineseRed
                          ? 'bg-yellow-500/25 border border-yellow-400/50 text-yellow-100'
                          : isDark
                            ? 'bg-indigo-500/25 border border-indigo-400/50 text-white'
                            : 'bg-blue-50 border border-blue-400 text-blue-800'
                        : isDark
                          ? 'bg-white/5 border border-white/10 text-gray-400'
                          : 'bg-white border border-gray-200 text-gray-600'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      className="rounded accent-indigo-500"
                      checked={displayOptions[key]}
                      onChange={e => setDisplayOptions({ [key]: e.target.checked })}
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
              {!Object.values(displayOptions).some(Boolean) && (
                <p role="alert" className="text-sm text-amber-400 mt-2">
                  请至少选择一项，避免显示空白卡片。
                </p>
              )}

              <div className="flex flex-wrap gap-2.5 mt-3">
                <button
                  onClick={() => setDisplayOptions({ showPhoto: false, showName: true, showId: false, showDepartment: false })}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isChineseRed
                      ? 'bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30'
                      : isDark
                        ? 'bg-white/10 text-gray-200 hover:bg-white/20'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  只显示姓名
                </button>
                <button
                  onClick={() => setDisplayOptions({ showPhoto: false, showName: false, showId: true, showDepartment: false })}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isChineseRed
                      ? 'bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30'
                      : isDark
                        ? 'bg-white/10 text-gray-200 hover:bg-white/20'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  只显示号码
                </button>
                <button
                  onClick={() => setDisplayOptions({ showPhoto: true, showName: true, showId: true, showDepartment: true })}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isChineseRed
                      ? 'bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30'
                      : isDark
                        ? 'bg-white/10 text-gray-200 hover:bg-white/20'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  全部显示
                </button>
              </div>
            </div>

            {/* 3D 抽奖动效形式 */}
            <div>
              <div className={`text-sm font-medium mb-2.5 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                3D 抽奖动效形式
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {sceneEffects.map(item => (
                  <button
                    key={item.type}
                    onClick={() => setSceneEffect(item.type)}
                    className={`p-3 rounded-xl text-left transition-all border ${
                      sceneEffect === item.type
                        ? isChineseRed
                          ? 'bg-yellow-500/25 border-yellow-400 text-yellow-100'
                          : isDark
                            ? 'bg-indigo-600/30 border-indigo-400 text-white'
                            : 'bg-blue-50 border-blue-500 text-blue-900'
                        : isDark
                          ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-lg mb-1">{item.icon} <span className="text-xs font-semibold">{item.name}</span></div>
                    <div className={`text-[11px] leading-tight ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 尺寸与旋转速度滑块 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className={`p-3.5 rounded-xl ${isDark ? 'bg-black/20' : 'bg-white'}`}>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  旋转速度：{rotationSpeed.toFixed(1)} 弧度/秒
                  <input
                    className="block w-full mt-2 accent-indigo-500"
                    type="range"
                    min="0.5"
                    max="6"
                    step="0.1"
                    value={rotationSpeed}
                    onChange={e => setRotationSpeed(Number(e.target.value))}
                  />
                </label>
              </div>

              <div className={`p-3.5 rounded-xl ${isDark ? 'bg-black/20' : 'bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    3D 球体与名片尺寸：{Math.round(sphereScale * 100)}%
                  </span>
                  <div className="flex gap-1">
                    {([['标准', 1.0], ['大屏', 1.25], ['巨幕', 1.55]] as const).map(([label, val]) => (
                      <button
                        key={label}
                        onClick={() => setSphereScale(val)}
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          Math.abs(sphereScale - val) < 0.05
                            ? 'bg-indigo-500 text-white'
                            : isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  aria-label="3D 球体与名片尺寸"
                  className="block w-full mt-2 accent-indigo-500"
                  type="range"
                  min="0.7"
                  max="2.0"
                  step="0.05"
                  value={sphereScale}
                  onChange={e => setSphereScale(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* 右侧：抽奖名片实时预览 */}
          <div className={`lg:col-span-5 rounded-xl p-4 ${isDark ? 'bg-black/25 border border-white/10' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                🪪 抽奖名片实时预览
              </span>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                与 3D 场景同源渲染
              </span>
            </div>
            <div className="flex items-center justify-around gap-4 py-2">
              <div className="flex flex-col items-center gap-2">
                <CardPreviewCanvas options={displayOptions} primaryColor={theme.colors.primary} withPhoto={false} />
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>文字名片效果</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <CardPreviewCanvas options={displayOptions} primaryColor={theme.colors.primary} withPhoto={true} />
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {displayOptions.showPhoto ? '带照片名片效果' : '已关闭照片显示'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 公司 Logo */}
      <div className={`rounded-xl p-6 relative z-10 ${
        isChineseRed 
          ? 'bg-gradient-to-br from-red-900/80 to-red-800/80 border-2 border-yellow-500/30' 
          : isDark ? 'bg-white/5' : 'bg-gray-100'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          公司 Logo（可选）
        </h3>
        
        <div className="flex gap-4">
          <div
            onClick={handleSelectLogo}
            className={`
              border-2 border-dashed rounded-xl p-6 cursor-pointer
              transition-all hover:scale-[1.02]
              ${isChineseRed
                ? 'border-yellow-500/30 hover:border-yellow-500'
                : isDark
                  ? 'border-white/20 hover:border-indigo-500'
                  : 'border-gray-300 hover:border-blue-500'
              }
            `}
          >
            {customAssets.logoImage ? (
              <img
                src={customAssets.logoImage}
                alt="公司 Logo"
                className="h-16 object-contain"
              />
            ) : (
              <div className="text-center space-y-2">
                <div className="text-3xl">🏢</div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  上传 Logo
                </p>
              </div>
            )}
          </div>

          {customAssets.logoImage && (
            <button
              onClick={handleClearLogo}
              className={`
                self-start px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${isDark
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
                }
              `}
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* 预览效果 */}
      <div className={`rounded-xl p-6 relative z-10 ${
        isChineseRed 
          ? 'bg-gradient-to-br from-red-900/80 to-red-800/80 border-2 border-yellow-500/30' 
          : isDark ? 'bg-white/5' : 'bg-gray-100'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          效果预览
        </h3>
        
        <div 
          className="relative rounded-xl overflow-hidden h-48"
          style={{
            backgroundImage: theme.customBackground ? `url(${theme.customBackground})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!theme.customBackground && (
            <div className={`absolute inset-0 ${
              theme.type === 'tech-dark' 
                ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
                : theme.type === 'chinese-red'
                  ? 'bg-gradient-to-br from-red-800 via-red-700 to-red-800'
                  : 'bg-gradient-to-br from-gray-50 to-white'
            }`} />
          )}
          
          {/* 背景遮罩 - 让文字更清晰 */}
          {theme.customBackground && (
            <div className="absolute inset-0 bg-black/30" />
          )}
          
          {/* 中国红主题装饰 */}
          {theme.type === 'chinese-red' && !theme.customBackground && (
            <>
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>
              <div className="absolute top-2 left-4 text-2xl lantern">🏮</div>
              <div className="absolute top-2 right-4 text-2xl lantern" style={{ animationDelay: '0.5s' }}>🏮</div>
              <div className="absolute bottom-2 left-4 text-xl">🧧</div>
              <div className="absolute bottom-2 right-4 text-xl">🧧</div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-bold text-yellow-500/10">福</div>
            </>
          )}
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex items-center gap-3 mb-2">
              {customAssets.logoImage && (
                <img
                  src={customAssets.logoImage}
                  alt="Logo"
                  className="h-8 object-contain"
                />
              )}
              <div 
                className={`text-2xl font-bold ${theme.customBackground ? 'text-white drop-shadow-lg' : ''}`}
                style={{ color: theme.customBackground ? undefined : theme.colors.text }}
              >
                {eventTitle || '年会抽奖'}
              </div>
            </div>
            <div 
              className={`text-sm ${theme.customBackground ? 'text-white/80' : 'opacity-70'}`}
              style={{ color: theme.customBackground ? undefined : theme.colors.text }}
            >
              当前主题：{themes.find(t => t.type === theme.type)?.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
