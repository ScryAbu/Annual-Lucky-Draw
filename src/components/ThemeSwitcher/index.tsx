import { motion } from 'framer-motion'
import { useThemeStore } from '../../stores/themeStore'
import { ThemeType } from '../../types'

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

export default function ThemeSwitcher() {
  const {
    theme,
    setTheme,
    setCustomBackground,
    setLogoImage,
    customAssets,
    eventTitle,
    setEventTitle,
    showWinnerAvatar,
    setShowWinnerAvatar,
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

      {/* 显示选项 */}
      <div className={`rounded-xl p-6 relative z-10 ${
        isChineseRed 
          ? 'bg-gradient-to-br from-red-900/80 to-red-800/80 border-2 border-yellow-500/30' 
          : isDark ? 'bg-white/5' : 'bg-gray-100'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          显示选项
        </h3>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showWinnerAvatar}
            onChange={(e) => setShowWinnerAvatar(e.target.checked)}
            className="w-5 h-5 rounded mt-0.5"
          />
          <div>
            <p className={isDark ? 'text-gray-200' : 'text-gray-700'}>中奖弹窗显示头像</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              关闭后只显示姓名与部门，不再显示默认头像占位
            </p>
          </div>
        </label>
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
