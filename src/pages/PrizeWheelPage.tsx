import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEmployeeStore } from '../stores/employeeStore'
import { usePrizeStore } from '../stores/prizeStore'
import { useThemeStore } from '../stores/themeStore'
import { usePrizeWheelEngine } from '../hooks/usePrizeWheelEngine'
import { useKeyboardControl } from '../hooks/useKeyboardControl'
import { useBGM } from '../hooks/useBGM'
import { generateDefaultAvatar } from '../utils/imageLoader'

export default function PrizeWheelPage() {
  const navigate = useNavigate()
  const { getAvailablePool } = useEmployeeStore()
  const { getAvailablePrizes } = usePrizeStore()
  const { theme, customAssets, eventTitle } = useThemeStore()
  
  const {
    status,
    selectedEmployee,
    selectedPrize,
    currentPrizeIndex,
    isDecelerating,
    availablePrizes,
    selectEmployee,
    startSelectPrize,
    stopSelectPrize,
    closeResult,
  } = usePrizeWheelEngine()

  const [showEmployeeSelector, setShowEmployeeSelector] = useState(true)
  const prizeContainerRef = useRef<HTMLDivElement>(null)

  // BGM 集成
  const bgmStatus = status === 'rolling-prize' 
    ? 'rolling' 
    : status === 'showing' 
      ? 'showing' 
      : status === 'stopping'
        ? 'stopping'
        : 'idle'
  useBGM(bgmStatus as 'idle' | 'rolling' | 'stopping' | 'showing')

  const isDark = theme.type !== 'minimal-light'
  const isChineseRed = theme.type === 'chinese-red'

  // 获取可用员工和奖品数量
  const availableEmployees = getAvailablePool(false)
  const currentAvailablePrizes = availablePrizes.length > 0 ? availablePrizes : getAvailablePrizes()

  // 快捷键控制
  useKeyboardControl({
    onSpace: () => {
      if (status === 'rolling-prize') {
        stopSelectPrize()
      } else if (status === 'idle' && selectedEmployee) {
        startSelectPrize()
      }
    },
    onEscape: () => {
      if (status === 'showing') {
        closeResult()
      } else {
        navigate('/')
      }
    },
    enabled: true,
  })

  // 获取背景样式
  const backgroundStyle = useMemo(() => {
    if (theme.customBackground) {
      return {
        backgroundImage: `url(${theme.customBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    return {}
  }, [theme.customBackground])

  // 切换全屏
  const toggleFullscreen = useCallback(async () => {
    await window.electronAPI.toggleFullscreen()
  }, [])

  // 处理员工选择
  const handleSelectEmployee = useCallback((employee: typeof availableEmployees[0]) => {
    selectEmployee(employee)
    setShowEmployeeSelector(false)
  }, [selectEmployee])

  // 开始抽奖
  const handleStart = useCallback(() => {
    if (!selectedEmployee) {
      setShowEmployeeSelector(true)
      return
    }
    if (currentAvailablePrizes.length === 0) {
      alert('没有可用的奖品！')
      return
    }
    startSelectPrize()
  }, [selectedEmployee, currentAvailablePrizes.length, startSelectPrize])

  const isRollingPrize = status === 'rolling-prize'
  const isStopping = status === 'stopping'
  const isShowing = status === 'showing'

  // 自动滚动到当前选中的奖品
  useEffect(() => {
    if (prizeContainerRef.current && (isRollingPrize || isDecelerating)) {
      const prizeWidth = 196 // 180px + 16px gap
      const container = prizeContainerRef.current.parentElement
      if (container) {
        const scrollLeft = currentPrizeIndex * prizeWidth - container.offsetWidth / 2 + prizeWidth / 2
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: isDecelerating ? 'smooth' : 'auto'
        })
      }
    }
  }, [currentPrizeIndex, isRollingPrize, isDecelerating])

  return (
    <div 
      className={`
        relative w-full h-screen overflow-hidden
        ${!theme.customBackground && (
          isDark && !isChineseRed
            ? 'bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900'
            : isChineseRed
              ? 'chinese-theme-bg'
              : 'bg-gradient-to-br from-gray-50 to-white'
        )}
      `}
      style={backgroundStyle}
    >
      {/* 背景遮罩（自定义背景时添加） */}
      {theme.customBackground && (
        <div className="absolute inset-0 bg-black/30" />
      )}
      
      {/* 中国红主题装饰 */}
      {isChineseRed && !theme.customBackground && (
        <>
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-700 z-10"></div>
          <div className="absolute top-4 left-8 text-4xl lantern z-10">🏮</div>
          <div className="absolute top-4 left-20 text-3xl lantern z-10" style={{ animationDelay: '0.3s' }}>🏮</div>
          <div className="absolute top-4 right-8 text-4xl lantern z-10" style={{ animationDelay: '0.5s' }}>🏮</div>
          <div className="absolute top-4 right-20 text-3xl lantern z-10" style={{ animationDelay: '0.8s' }}>🏮</div>
          <div className="absolute bottom-4 left-4 text-3xl z-10">🧧</div>
          <div className="absolute bottom-4 right-4 text-3xl z-10">🧧</div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[300px] font-bold text-yellow-500/5 pointer-events-none select-none">福</div>
        </>
      )}

      {/* 顶部栏 */}
      <header className={`
        absolute top-0 left-0 right-0 z-20
        flex items-center justify-between px-6 py-4
        ${isDark ? 'bg-black/20' : 'bg-white/20'}
        backdrop-blur-sm
      `}>
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/')}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-gray-800 hover:bg-black/20'}
            `}
          >
            ←
          </motion.button>
          
          <div className="flex items-center gap-3">
            {customAssets.logoImage && (
              <img src={customAssets.logoImage} alt="Logo" className="h-8 object-contain" />
            )}
            <h1 className={`
              text-xl font-bold
              ${isChineseRed 
                ? 'text-yellow-100 drop-shadow-lg' 
                : isDark ? 'text-white' : 'text-gray-800'
              }
            `}>
              {eventTitle || '轮盘抽奖'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFullscreen}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-gray-800 hover:bg-black/20'}
            `}
          >
            ⛶
          </motion.button>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-20 pb-32">
        {/* 员工选择区域 */}
        {showEmployeeSelector && !selectedEmployee && status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl px-6 mb-8"
          >
            <h2 className={`
              text-2xl font-bold text-center mb-6
              ${isChineseRed ? 'text-yellow-400' : isDark ? 'text-white' : 'text-gray-800'}
            `}>
              👤 请选择抽奖人
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[400px] overflow-y-auto">
              {availableEmployees.map((emp) => (
                <motion.button
                  key={emp.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectEmployee(emp)}
                  className={`
                    flex flex-col items-center p-4 rounded-xl
                    ${isDark ? 'bg-white/10 border border-white/20 hover:bg-white/20' : 'bg-white border border-gray-200 hover:bg-gray-50 shadow-lg'}
                    transition-all
                  `}
                >
                  <img
                    src={emp.photoData || generateDefaultAvatar(emp.name, theme.colors.primary)}
                    alt={emp.name}
                    className="w-16 h-16 rounded-full object-cover mb-2"
                  />
                  <div className={`text-sm font-semibold text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {emp.name}
                  </div>
                  <div className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {emp.department}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 已选中的员工显示 */}
        {selectedEmployee && !isRollingPrize && !isStopping && !isShowing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <div className={`
              flex flex-col items-center p-6 rounded-xl
              ${isDark ? 'bg-indigo-600/80 border-2 border-indigo-400' : 'bg-blue-500/80 border-2 border-blue-400'}
            `}>
              <img
                src={selectedEmployee.photoData || generateDefaultAvatar(selectedEmployee.name, theme.colors.primary)}
                alt={selectedEmployee.name}
                className="w-24 h-24 rounded-full object-cover mb-3 ring-4 ring-yellow-400"
              />
              <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-white'}`}>
                {selectedEmployee.name}
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-200'}`}>
                {selectedEmployee.department}
              </div>
            </div>
          </motion.div>
        )}

        {/* 奖品轮盘区域 */}
        {(isRollingPrize || isStopping || isShowing) && currentAvailablePrizes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl px-6"
          >
            <h2 className={`
              text-2xl font-bold text-center mb-6
              ${isChineseRed ? 'text-yellow-400' : isDark ? 'text-white' : 'text-gray-800'}
            `}>
              {isRollingPrize ? '🎁 正在抽奖...' : isStopping ? '⏳ 即将停止...' : '🎉 抽奖完成'}
            </h2>
            
            {/* 奖品平铺展示 */}
            <div className="relative overflow-x-auto overflow-y-visible scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div 
                ref={prizeContainerRef}
                className="flex gap-4 pb-4" 
                style={{ width: 'max-content' }}
              >
                {currentAvailablePrizes.map((prize, index) => (
                  <div
                    key={prize.id}
                    className={`
                      flex-shrink-0 flex flex-col items-center p-6 rounded-xl w-[180px]
                      ${isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-gray-200 shadow-lg'}
                      ${index === currentPrizeIndex && (isRollingPrize || isDecelerating)
                        ? 'ring-4 ring-yellow-400 scale-105 z-10'
                        : index === currentPrizeIndex && isShowing
                          ? 'ring-4 ring-green-400 scale-105 z-10'
                          : ''
                      }
                      transition-all duration-200
                    `}
                  >
                    {prize.prizeImage ? (
                      <img
                        src={prize.prizeImage}
                        alt={prize.name}
                        className="w-24 h-24 object-contain mb-3"
                      />
                    ) : (
                      <div className="text-6xl mb-3">🎁</div>
                    )}
                    <div className={`text-lg font-bold text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {prize.name}
                    </div>
                    <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      剩余: {prize.count - prize.winners.length} / {prize.count}
                    </div>
                  </div>
                ))}
              </div>

              {/* 移动选择框指示器 */}
              {(isRollingPrize || isDecelerating || isShowing) && (
                <motion.div
                  className={`
                    absolute top-0 bottom-4 border-4 rounded-xl pointer-events-none z-20
                    ${isChineseRed ? 'border-yellow-400' : isShowing ? 'border-green-400' : 'border-yellow-400'}
                    shadow-lg
                  `}
                  style={{
                    width: '180px',
                    left: `${currentPrizeIndex * 196}px`, // 180px + 16px gap
                    transition: isDecelerating || isShowing ? 'left 0.3s ease-out' : 'left 0.05s linear',
                  }}
                  animate={isShowing ? {} : {
                    boxShadow: [
                      '0 0 20px rgba(250, 204, 21, 0.5)',
                      '0 0 40px rgba(250, 204, 21, 0.8)',
                      '0 0 20px rgba(250, 204, 21, 0.5)',
                    ],
                  }}
                  transition={isShowing ? {} : {
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* 结果显示 */}
        {isShowing && selectedEmployee && selectedPrize && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 text-center"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`
                inline-block px-8 py-6 rounded-2xl
                ${isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-gray-200 shadow-2xl'}
              `}
            >
              <div className={`text-3xl font-bold mb-4 ${isChineseRed ? 'text-yellow-400' : isDark ? 'text-white' : 'text-gray-800'}`}>
                🎉 恭喜 {selectedEmployee.name} 🎉
              </div>
              <div className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                获得 {selectedPrize.name}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* 底部控制栏 */}
      <footer className={`
        absolute bottom-0 left-0 right-0 z-20
        flex items-center justify-center gap-8 px-6 py-6
        ${isDark ? 'bg-gradient-to-t from-black/60 to-transparent' : 'bg-gradient-to-t from-white/60 to-transparent'}
      `}>
        <div className="flex flex-col items-center gap-4">
          {/* 状态信息 */}
          <div className={`text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <div className="text-lg font-semibold">
              {!selectedEmployee && '请先选择抽奖人'}
              {selectedEmployee && status === 'idle' && '准备开始抽奖'}
              {isRollingPrize && '正在抽奖...'}
              {isStopping && '即将停止...'}
              {isShowing && '抽奖完成'}
            </div>
            <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              可用人员: {availableEmployees.length} | 可用奖品: {currentAvailablePrizes.length}
            </div>
          </div>

          {/* 开始/停止按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isRollingPrize ? stopSelectPrize : handleStart}
            disabled={(!selectedEmployee && status === 'idle') || currentAvailablePrizes.length === 0}
            className={`
              w-32 h-32 rounded-full font-bold text-xl
              flex items-center justify-center
              transition-all duration-300
              ${(!selectedEmployee || currentAvailablePrizes.length === 0) && status === 'idle'
                ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                : isRollingPrize
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                  : isShowing
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                    : isChineseRed
                      ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-red-900 shadow-lg shadow-yellow-500/50'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
              }
            `}
          >
            {isRollingPrize ? '停止' : isStopping ? '停止中...' : isShowing ? '继续' : '开始'}
          </motion.button>

          {/* 快捷键提示 */}
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {isRollingPrize ? '按 空格键 停止' : selectedEmployee ? '按 空格键 开始' : '请先选择抽奖人'}
          </p>
        </div>
      </footer>
    </div>
  )
}
