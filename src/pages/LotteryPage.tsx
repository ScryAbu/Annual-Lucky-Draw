import { useState, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import LotteryScene from '../components/LotteryScene'
import WinnerDisplay from '../components/WinnerDisplay'
import HistoryPanel from '../components/HistoryPanel'
import { useEmployeeStore } from '../stores/employeeStore'
import { usePrizeStore } from '../stores/prizeStore'
import { useThemeStore } from '../stores/themeStore'
import { useRigStore } from '../stores/rigStore'
import { useLotteryEngine } from '../hooks/useLotteryEngine'
import { useKeyboardControl } from '../hooks/useKeyboardControl'
import { useBGM } from '../hooks/useBGM'
import { Prize } from '../types'

export default function LotteryPage() {
  const navigate = useNavigate()
  const { employees, getAvailablePool } = useEmployeeStore()
  const { prizes, currentPrizeIndex, setCurrentPrizeIndex } = usePrizeStore()
  const { theme, customAssets, eventTitle } = useThemeStore()
  
  const {
    status,
    currentPrize,
    currentWinners,
    toggle,
    closeWinnerDisplay,
    start,
  } = useLotteryEngine()

  // BGM 集成
  useBGM(status)

  // 内定功能
  const { activated: rigActivated, setActivated: setRigActivated, addRig, removeRig, getRiggedEmployees } = useRigStore()
  const [showRigPanel, setShowRigPanel] = useState(false)
  const rigClickCountRef = useRef(0)
  const rigClickTimerRef = useRef<number | null>(null)

  const [showHistory, setShowHistory] = useState(false)
  const [showPrizeSelector, setShowPrizeSelector] = useState(false)
  const [showAddPrize, setShowAddPrize] = useState(false)
  const [tempPrize, setTempPrize] = useState({ name: '', count: 1, includeWinners: false })
  const [drawCount, setDrawCount] = useState(1) // 一次抽取人数
  
  const isDark = theme.type !== 'minimal-light'
  const isChineseRed = theme.type === 'chinese-red'

  // 隐蔽入口：快速点击可抽奖人数区域 5 次
  const handleSecretClick = useCallback(() => {
    rigClickCountRef.current += 1
    
    if (rigClickTimerRef.current) {
      clearTimeout(rigClickTimerRef.current)
    }
    
    if (rigClickCountRef.current >= 5) {
      rigClickCountRef.current = 0
      setShowRigPanel(true)
    } else {
      rigClickTimerRef.current = window.setTimeout(() => {
        rigClickCountRef.current = 0
      }, 2000)
    }
  }, [])

  // 当前选中的奖项
  const selectedPrize = prizes[currentPrizeIndex]
  const availablePool = getAvailablePool(selectedPrize?.includeWinners)
  
  // 计算剩余可抽人数
  const remainingCount = selectedPrize 
    ? selectedPrize.count - selectedPrize.winners.length 
    : 0
  
  // 最大可抽人数（取剩余人数和可用池的较小值）
  const maxDrawCount = Math.min(remainingCount, availablePool.length, 10) // 最多一次抽10人

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

  // 快捷键控制
  useKeyboardControl({
    onSpace: () => {
      if (selectedPrize) {
        toggle(selectedPrize)
      }
    },
    onEscape: () => {
      if (status === 'showing') {
        closeWinnerDisplay()
      } else {
        navigate('/')
      }
    },
    onLeft: () => {
      if (status === 'idle' && currentPrizeIndex > 0) {
        setCurrentPrizeIndex(currentPrizeIndex - 1)
      }
    },
    onRight: () => {
      if (status === 'idle' && currentPrizeIndex < prizes.length - 1) {
        setCurrentPrizeIndex(currentPrizeIndex + 1)
      }
    },
    onF11: toggleFullscreen,
    enabled: !showPrizeSelector && !showAddPrize,
  })

  // 开始/停止抽奖
  const handleToggle = useCallback(() => {
    if (selectedPrize) {
      toggle(selectedPrize, drawCount)
    }
  }, [selectedPrize, toggle, drawCount])

  // 临时加奖
  const { addPrize } = usePrizeStore()
  const handleAddTempPrize = useCallback(() => {
    if (!tempPrize.name || tempPrize.count < 1) return
    
    addPrize({
      name: tempPrize.name,
      count: tempPrize.count,
      isTemporary: true,
      includeWinners: tempPrize.includeWinners,
    })
    
    setTempPrize({ name: '', count: 1, includeWinners: false })
    setShowAddPrize(false)
    
    // 切换到新加的奖项
    setCurrentPrizeIndex(prizes.length)
  }, [tempPrize, addPrize, prizes.length, setCurrentPrizeIndex])

  // 计算奖项进度
  const prizeProgress = selectedPrize
    ? `${selectedPrize.winners.length} / ${selectedPrize.count}`
    : '0 / 0'
  const isCompleted = selectedPrize 
    ? selectedPrize.winners.length >= selectedPrize.count 
    : false

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
          {/* 顶部金边 */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-700 z-10"></div>
          {/* 灯笼 */}
          <div className="absolute top-4 left-8 text-4xl lantern z-10">🏮</div>
          <div className="absolute top-4 left-20 text-3xl lantern z-10" style={{ animationDelay: '0.3s' }}>🏮</div>
          <div className="absolute top-4 right-8 text-4xl lantern z-10" style={{ animationDelay: '0.5s' }}>🏮</div>
          <div className="absolute top-4 right-20 text-3xl lantern z-10" style={{ animationDelay: '0.8s' }}>🏮</div>
          {/* 角落装饰 */}
          <div className="absolute bottom-4 left-4 text-3xl z-10">🧧</div>
          <div className="absolute bottom-4 right-4 text-3xl z-10">🧧</div>
          {/* 福字水印 */}
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
          {/* 返回按钮 */}
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
          
          {/* Logo + 活动标题 */}
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
              {eventTitle || '年会抽奖'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 临时加奖按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddPrize(true)}
            className={`
              px-4 py-2 rounded-xl font-medium
              ${isDark 
                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }
            `}
          >
            + 临时加奖
          </motion.button>

          {/* 全屏按钮 */}
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

      {/* 3D 抽奖场景 */}
      <div className="absolute inset-0 z-0">
        <LotteryScene
          employees={availablePool}
          isRolling={status === 'rolling'}
          winners={currentWinners}
          primaryColor={theme.colors.primary}
        />
      </div>

      {/* 底部控制栏 */}
      <footer className={`
        absolute bottom-0 left-0 right-0 z-20
        flex items-end justify-center gap-8 px-6 py-6
        ${isDark ? 'bg-gradient-to-t from-black/60 to-transparent' : 'bg-gradient-to-t from-white/60 to-transparent'}
      `}>
        {/* 奖项选择器 */}
        <div className="flex-1 flex justify-start">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowPrizeSelector(!showPrizeSelector)}
            className={`
              px-6 py-3 rounded-xl flex items-center gap-3
              ${isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-gray-800'}
              backdrop-blur-sm
            `}
          >
            {selectedPrize?.prizeImage && (
              <img src={selectedPrize.prizeImage} alt="" className="w-8 h-8 object-contain" />
            )}
            <span className="font-semibold">{selectedPrize?.name || '请选择奖项'}</span>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              ▼
            </span>
          </motion.button>

          {/* 奖项下拉菜单 */}
          <AnimatePresence>
            {showPrizeSelector && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`
                  absolute bottom-24 left-6 w-72
                  ${isDark ? 'bg-slate-800' : 'bg-white'}
                  rounded-xl shadow-2xl overflow-hidden
                `}
              >
                {prizes.map((prize, index) => {
                  const completed = prize.winners.length >= prize.count
                  return (
                    <button
                      key={prize.id}
                      onClick={() => {
                        setCurrentPrizeIndex(index)
                        setShowPrizeSelector(false)
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3
                        ${index === currentPrizeIndex 
                          ? isDark ? 'bg-indigo-600' : 'bg-blue-500 text-white'
                          : isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                        }
                        ${completed ? 'opacity-50' : ''}
                      `}
                    >
                      {prize.prizeImage ? (
                        <img src={prize.prizeImage} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-2xl">🎁</span>
                      )}
                      <div className="flex-1 text-left">
                        <div className={isDark ? 'text-white' : 'text-gray-800'}>{prize.name}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {prize.winners.length} / {prize.count}
                          {completed && ' ✓'}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 中间：抽奖按钮 */}
        <div className="flex flex-col items-center gap-3">
          {/* 进度显示 */}
          <div className={`text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <div className="text-lg font-semibold">{selectedPrize?.name}</div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {prizeProgress}
              {isCompleted && (
                <span className="ml-2 text-green-500">已完成</span>
              )}
            </div>
          </div>

          {/* 抽取人数选择器 */}
          {!isCompleted && remainingCount > 1 && status === 'idle' && (
            <div className={`
              flex items-center gap-3 px-4 py-2 rounded-xl
              ${isChineseRed 
                ? 'bg-red-900/80 border border-yellow-500/30' 
                : isDark ? 'bg-white/10' : 'bg-black/10'
              }
              backdrop-blur-sm
            `}>
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                本次抽取
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDrawCount(Math.max(1, drawCount - 1))}
                  disabled={drawCount <= 1}
                  className={`
                    w-8 h-8 rounded-lg font-bold text-lg
                    ${drawCount <= 1 
                      ? 'opacity-30 cursor-not-allowed' 
                      : isChineseRed
                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                        : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                    }
                  `}
                >
                  -
                </button>
                <span className={`
                  w-12 text-center text-xl font-bold
                  ${isChineseRed ? 'text-yellow-400' : isDark ? 'text-white' : 'text-gray-800'}
                `}>
                  {drawCount}
                </span>
                <button
                  onClick={() => setDrawCount(Math.min(maxDrawCount, drawCount + 1))}
                  disabled={drawCount >= maxDrawCount}
                  className={`
                    w-8 h-8 rounded-lg font-bold text-lg
                    ${drawCount >= maxDrawCount 
                      ? 'opacity-30 cursor-not-allowed' 
                      : isChineseRed
                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                        : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                    }
                  `}
                >
                  +
                </button>
              </div>
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                人
              </span>
            </div>
          )}

          {/* 开始/停止按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
            disabled={!selectedPrize || isCompleted}
            className={`
              w-32 h-32 rounded-full font-bold text-xl
              flex items-center justify-center
              transition-all duration-300
              ${!selectedPrize || isCompleted
                ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                : status === 'rolling'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                  : isChineseRed
                    ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-red-900 shadow-lg shadow-yellow-500/50'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
              }
            `}
          >
            {status === 'rolling' ? '停止' : status === 'stopping' ? '抽取中...' : '开始'}
          </motion.button>

          {/* 快捷键提示 */}
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            按 空格键 开始/停止
          </p>
        </div>

        {/* 右侧：人数显示（隐蔽入口：快速点击 5 次打开内定面板） */}
        <div className="flex-1 flex justify-end">
          <div 
            onClick={handleSecretClick}
            className={`
              px-6 py-3 rounded-xl cursor-default select-none
              ${isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-gray-800'}
              backdrop-blur-sm text-center
            `}
          >
            <div className="text-2xl font-bold">{availablePool.length}</div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              可抽奖人数
            </div>
          </div>
        </div>
      </footer>

      {/* 中奖展示弹窗 */}
      <WinnerDisplay
        winners={currentWinners}
        prize={currentPrize}
        isVisible={status === 'showing'}
        onClose={closeWinnerDisplay}
        themeType={theme.type}
        primaryColor={theme.colors.primary}
      />

      {/* 历史记录面板 */}
      <HistoryPanel
        isOpen={showHistory}
        onToggle={() => setShowHistory(!showHistory)}
      />

      {/* 临时加奖弹窗 */}
      <AnimatePresence>
        {showAddPrize && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddPrize(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`
                w-full max-w-md p-6 rounded-2xl mx-4
                ${isDark ? 'bg-slate-800' : 'bg-white'}
              `}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                临时加奖
              </h3>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    奖项名称
                  </label>
                  <input
                    type="text"
                    value={tempPrize.name}
                    onChange={(e) => setTempPrize({ ...tempPrize, name: e.target.value })}
                    placeholder="如：老板大气奖"
                    className={`
                      w-full px-4 py-3 rounded-xl outline-none
                      ${isDark
                        ? 'bg-white/10 text-white border border-white/10 focus:border-indigo-500'
                        : 'bg-gray-100 text-gray-800 border border-gray-200 focus:border-blue-500'
                      }
                    `}
                  />
                </div>

                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    中奖人数
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tempPrize.count}
                    onChange={(e) => setTempPrize({ ...tempPrize, count: parseInt(e.target.value) || 1 })}
                    className={`
                      w-full px-4 py-3 rounded-xl outline-none
                      ${isDark
                        ? 'bg-white/10 text-white border border-white/10 focus:border-indigo-500'
                        : 'bg-gray-100 text-gray-800 border border-gray-200 focus:border-blue-500'
                      }
                    `}
                  />
                </div>

                <div>
                  <label className={`flex items-center gap-3 cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={tempPrize.includeWinners}
                      onChange={(e) => setTempPrize({ ...tempPrize, includeWinners: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      包含已中奖人员（返场抽奖）
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddPrize(false)}
                  className={`
                    flex-1 py-3 rounded-xl font-semibold
                    ${isDark
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }
                  `}
                >
                  取消
                </button>
                <button
                  onClick={handleAddTempPrize}
                  disabled={!tempPrize.name}
                  className={`
                    flex-1 py-3 rounded-xl font-semibold
                    ${!tempPrize.name
                      ? 'bg-gray-500/50 cursor-not-allowed'
                      : isDark
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                    }
                  `}
                >
                  确定
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 内定面板（伪装为系统诊断工具） */}
      <AnimatePresence>
        {showRigPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowRigPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl max-h-[80vh] bg-slate-900 rounded-2xl shadow-2xl mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 标题栏 - 伪装 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">⚙</span>
                  <h3 className="text-white font-semibold">高级设置</h3>
                </div>
                <div className="flex items-center gap-3">
                  {/* 激活开关 */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-gray-500">启用</span>
                    <button
                      onClick={() => setRigActivated(!rigActivated)}
                      className={`
                        relative w-10 h-5 rounded-full transition-colors duration-300
                        ${rigActivated ? 'bg-green-500' : 'bg-white/20'}
                      `}
                    >
                      <div
                        className={`
                          absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md
                          transition-transform duration-300
                          ${rigActivated ? 'translate-x-5' : 'translate-x-0.5'}
                        `}
                      />
                    </button>
                  </label>
                  <button
                    onClick={() => setShowRigPanel(false)}
                    className="text-gray-500 hover:text-white transition-colors text-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-64px)]">
                {/* 奖项选择 + 搜索员工 */}
                {prizes.length > 0 && (
                  <div className="space-y-4">
                    {prizes.map((prize) => {
                      const riggedIds = getRiggedEmployees(prize.id)
                      const riggedEmps = employees.filter((e) => riggedIds.includes(e.id))
                      
                      return (
                        <div key={prize.id} className="bg-white/5 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{prize.name}</span>
                              <span className="text-xs text-gray-500">
                                ({prize.winners.length}/{prize.count})
                              </span>
                            </div>
                            {riggedIds.length > 0 && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                已指定 {riggedIds.length} 人
                              </span>
                            )}
                          </div>

                          {/* 已内定人员 */}
                          {riggedEmps.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {riggedEmps.map((emp) => (
                                <span
                                  key={emp.id}
                                  className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded-lg"
                                >
                                  {emp.name} ({emp.id})
                                  <button
                                    onClick={() => removeRig(prize.id, emp.id)}
                                    className="hover:text-red-400 ml-1"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* 添加人员 */}
                          {riggedIds.length < (prize.count - prize.winners.length) && (
                            <RigEmployeeSearch
                              prizeId={prize.id}
                              employees={employees.filter(
                                (e) => !e.isWinner && !riggedIds.includes(e.id)
                              )}
                              onAdd={(empId) => addRig(prize.id, empId)}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 内定人员搜索选择子组件
function RigEmployeeSearch({
  prizeId,
  employees,
  onAdd,
}: {
  prizeId: string
  employees: Array<{ id: string; name: string; department: string }>
  onAdd: (empId: string) => void
}) {
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const filtered = search.trim()
    ? employees.filter(
        (e) =>
          e.name.includes(search) ||
          e.id.includes(search) ||
          e.department.includes(search)
      ).slice(0, 8)
    : []

  return (
    <div className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setShowDropdown(true)
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder="搜索姓名、工号或部门..."
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 outline-none focus:border-indigo-500"
      />
      
      {showDropdown && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 rounded-lg shadow-xl border border-white/10 max-h-48 overflow-y-auto z-10">
          {filtered.map((emp) => (
            <button
              key={emp.id}
              onClick={() => {
                onAdd(emp.id)
                setSearch('')
                setShowDropdown(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 text-left"
            >
              <div>
                <span className="text-white text-sm">{emp.name}</span>
                <span className="text-gray-500 text-xs ml-2">{emp.id}</span>
              </div>
              <span className="text-gray-600 text-xs ml-auto">{emp.department}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
