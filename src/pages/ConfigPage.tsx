import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DataImport from '../components/DataImport'
import PrizeManager from '../components/PrizeManager'
import ThemeSwitcher from '../components/ThemeSwitcher'
import BgmSettings from '../components/BgmSettings'
import { useEmployeeStore } from '../stores/employeeStore'
import { usePrizeStore } from '../stores/prizeStore'
import { useThemeStore } from '../stores/themeStore'

type TabType = 'import' | 'prizes' | 'theme' | 'bgm'

const tabs: Array<{ id: TabType; label: string; icon: string }> = [
  { id: 'import', label: '数据导入', icon: '📊' },
  { id: 'prizes', label: '奖项设置', icon: '🎁' },
  { id: 'theme', label: '外观设置', icon: '🎨' },
  { id: 'bgm', label: '音效设置', icon: '🎵' },
]

export default function ConfigPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('import')
  const { employees, resetAllWinners, getWinners } = useEmployeeStore()
  const { prizes, resetAllPrizes } = usePrizeStore()
  const { theme, customAssets } = useThemeStore()
  
  const isDark = theme.type !== 'minimal-light'
  const isChineseRed = theme.type === 'chinese-red'

  // 检查是否可以开始抽奖
  const canStart = employees.length > 0 && prizes.length > 0
  
  // 获取中奖人数
  const winnersCount = getWinners().length

  // 进入抽奖页面
  const handleStart = () => {
    if (canStart) {
      navigate('/lottery')
    }
  }

  // 进入轮盘抽奖页面
  const handleStartWheel = () => {
    if (canStart) {
      navigate('/prize-wheel')
    }
  }

  // 终极大奖：需有奖品且至少有一人积分 > 0
  const canStartUltimate = prizes.length > 0 && employees.some((e) => (e.points ?? 0) > 0)
  const handleStartUltimate = () => {
    if (canStartUltimate) {
      navigate('/ultimate')
    } else if (prizes.length === 0) {
      alert('请先添加至少一个奖项作为终极大奖')
    } else {
      alert('请先在「数据导入」→ 员工数据管理中为员工设置积分（积分 > 0 方可参与终极大奖）')
    }
  }

  // 清除所有抽奖记录
  const handleResetLottery = useCallback(() => {
    if (confirm('确定要清除所有抽奖记录吗？\n\n这将重置所有中奖者状态，但不会删除员工和奖项数据。')) {
      resetAllWinners()
      resetAllPrizes()
      alert('抽奖记录已清除！')
    }
  }, [resetAllWinners, resetAllPrizes])

  // 根据主题获取背景类
  const getBackgroundClass = () => {
    switch (theme.type) {
      case 'chinese-red':
        return 'chinese-theme-bg fu-watermark'
      case 'minimal-light':
        return 'bg-minimal-background'
      default:
        return 'bg-tech-background'
    }
  }


  return (
    <div className={`min-h-screen overflow-auto ${getBackgroundClass()}`}>
      {/* 顶部标题栏 */}
      <header className={`
        sticky top-0 z-40 px-6 py-4 relative
        ${isChineseRed 
          ? 'bg-gradient-to-r from-red-900 via-red-800 to-red-900 border-b-2 border-yellow-500/50' 
          : isDark ? 'bg-slate-900/80 border-b border-white/10' : 'bg-white/80 border-b border-gray-200'
        }
        backdrop-blur-md
      `}>
        {/* 中国风顶部装饰 */}
        {isChineseRed && (
          <>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>
            <div className="absolute left-4 top-2 text-2xl lantern">🏮</div>
            <div className="absolute right-4 top-2 text-2xl lantern" style={{ animationDelay: '0.5s' }}>🏮</div>
          </>
        )}
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {customAssets.logoImage ? (
              <img src={customAssets.logoImage} alt="Logo" className="h-8 object-contain" />
            ) : (
              <span className="text-2xl">🎰</span>
            )}
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              年会抽奖系统
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 状态指示 */}
            <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="flex items-center gap-1">
                <span className={employees.length > 0 ? 'text-green-500' : 'text-gray-400'}>●</span>
                {employees.length} 人
              </span>
              <span className="flex items-center gap-1">
                <span className={prizes.length > 0 ? 'text-green-500' : 'text-gray-400'}>●</span>
                {prizes.length} 奖项
              </span>
              {winnersCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="text-yellow-500">🏆</span>
                  {winnersCount} 中奖
                </span>
              )}
            </div>

            {/* 清除抽奖记录按钮 */}
            {winnersCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleResetLottery}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${isDark
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }
                `}
              >
                🔄 清除记录
              </motion.button>
            )}

            {/* 开始按钮组 */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: canStart ? 1.05 : 1 }}
                whileTap={{ scale: canStart ? 0.95 : 1 }}
                onClick={handleStart}
                disabled={!canStart}
                className={`
                  px-6 py-2 rounded-xl font-semibold transition-all
                  ${canStart
                    ? isChineseRed
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-red-900 shadow-lg shadow-yellow-500/30'
                      : isDark
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-500/30 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                进入抽奖 →
              </motion.button>
              
              <motion.button
                whileHover={{ scale: canStart ? 1.05 : 1 }}
                whileTap={{ scale: canStart ? 0.95 : 1 }}
                onClick={handleStartWheel}
                disabled={!canStart}
                className={`
                  px-6 py-2 rounded-xl font-semibold transition-all
                  ${canStart
                    ? isChineseRed
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-yellow-100 shadow-lg shadow-orange-500/30'
                      : isDark
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/30'
                    : 'bg-gray-500/30 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                🎡 轮盘抽奖
              </motion.button>

              <motion.button
                whileHover={{ scale: canStartUltimate ? 1.05 : 1 }}
                whileTap={{ scale: canStartUltimate ? 0.95 : 1 }}
                onClick={handleStartUltimate}
                disabled={!canStartUltimate}
                className={`
                  px-6 py-2 rounded-xl font-semibold transition-all
                  ${canStartUltimate
                    ? isChineseRed
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-yellow-100 shadow-lg shadow-amber-500/30'
                      : isDark
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-gray-500/30 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                🏆 终极大奖
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab 导航 */}
      <div className={`
        sticky top-[73px] z-30 px-6 relative
        ${isChineseRed 
          ? 'bg-gradient-to-r from-red-900/95 via-red-800/95 to-red-900/95 border-b-2 border-yellow-500/30' 
          : isDark ? 'bg-slate-900/80 border-b border-white/10' : 'bg-white/80 border-b border-gray-200'
        }
        backdrop-blur-md
      `}>
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-6 py-4 font-medium transition-colors
                  ${activeTab === tab.id
                    ? isDark ? 'text-white' : 'text-gray-800'
                    : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </span>
                
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className={`
                      absolute bottom-0 left-0 right-0 h-0.5
                      ${isChineseRed ? 'bg-yellow-500' : isDark ? 'bg-indigo-500' : 'bg-blue-500'}
                    `}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'import' && <DataImport />}
            {activeTab === 'prizes' && <PrizeManager />}
            {activeTab === 'theme' && <ThemeSwitcher />}
            {activeTab === 'bgm' && <BgmSettings />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 底部提示 */}
      {!canStart && (
        <div className={`
          fixed bottom-0 left-0 right-0 px-6 py-4
          ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}
          border-t
          ${isDark ? 'border-orange-500/30' : 'border-orange-200'}
        `}>
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <p className={isDark ? 'text-orange-300' : 'text-orange-700'}>
              {employees.length === 0 && '请先导入员工名单'}
              {employees.length > 0 && prizes.length === 0 && '请添加至少一个奖项'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
