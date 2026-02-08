import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmployeeStore } from '../../stores/employeeStore'
import { usePrizeStore } from '../../stores/prizeStore'
import { useThemeStore } from '../../stores/themeStore'
import { exportWinnersToExcel } from '../../utils/excelParser'

interface HistoryPanelProps {
  isOpen: boolean
  onToggle: () => void
}

export default function HistoryPanel({ isOpen, onToggle }: HistoryPanelProps) {
  const { getWinners } = useEmployeeStore()
  const { prizes, getPrizeById } = usePrizeStore()
  const { theme } = useThemeStore()
  
  const [isExporting, setIsExporting] = useState(false)
  
  const isDark = theme.type !== 'minimal-light'
  const winners = getWinners()

  // 导出中奖名单
  const handleExport = useCallback(async () => {
    if (winners.length === 0) return

    setIsExporting(true)
    try {
      const exportData = winners.map((winner) => {
        const prize = winner.prizeId ? getPrizeById(winner.prizeId) : null
        return {
          prize: prize?.name || '未知奖项',
          id: winner.id,
          name: winner.name,
          department: winner.department,
          winTime: winner.winTime 
            ? new Date(winner.winTime).toLocaleString('zh-CN')
            : '',
        }
      })

      const buffer = exportWinnersToExcel(exportData)
      const now = new Date().toISOString().slice(0, 10)
      const success = await window.electronAPI.exportExcel(buffer, `中奖名单_${now}.xlsx`)
      
      if (success) {
        alert('导出成功！')
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('导出失败，请重试')
    } finally {
      setIsExporting(false)
    }
  }, [winners, getPrizeById])

  // 按奖项分组
  const groupedWinners = prizes.map((prize) => ({
    prize,
    winners: winners.filter((w) => w.prizeId === prize.id),
  })).filter((g) => g.winners.length > 0)

  return (
    <>
      {/* 切换按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className={`
          fixed right-4 top-1/2 -translate-y-1/2 z-40
          px-2 py-4 rounded-l-xl
          ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'}
          ${isOpen ? 'translate-x-80' : ''}
          transition-transform duration-300
        `}
      >
        <span className="writing-vertical">
          {isOpen ? '▶' : '◀'} 中奖记录 ({winners.length})
        </span>
      </motion.button>

      {/* 侧边栏 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className={`
              fixed right-0 top-0 bottom-0 w-80 z-30
              ${isDark ? 'bg-slate-900/95' : 'bg-white/95'}
              backdrop-blur-md border-l
              ${isDark ? 'border-white/10' : 'border-gray-200'}
              flex flex-col
            `}
          >
            {/* 标题栏 */}
            <div className={`
              flex items-center justify-between px-4 py-4 border-b
              ${isDark ? 'border-white/10' : 'border-gray-200'}
            `}>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                中奖记录
              </h3>
              <button
                onClick={handleExport}
                disabled={winners.length === 0 || isExporting}
                className={`
                  px-3 py-1 rounded-lg text-sm font-medium transition-all
                  ${winners.length === 0 || isExporting
                    ? 'bg-gray-500/30 text-gray-500 cursor-not-allowed'
                    : isDark
                      ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }
                `}
              >
                {isExporting ? '导出中...' : '导出 Excel'}
              </button>
            </div>

            {/* 列表 */}
            <div className="flex-1 overflow-auto p-4">
              {winners.length === 0 ? (
                <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <div className="text-4xl mb-2">🎯</div>
                  <p>暂无中奖记录</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedWinners.map(({ prize, winners: prizeWinners }) => (
                    <div key={prize.id}>
                      <div className="flex items-center gap-2 mb-3">
                        {prize.prizeImage && (
                          <img
                            src={prize.prizeImage}
                            alt={prize.name}
                            className="w-6 h-6 object-contain"
                          />
                        )}
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {prize.name}
                        </h4>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          ({prizeWinners.length}/{prize.count})
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {prizeWinners.map((winner) => (
                          <motion.div
                            key={winner.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`
                              flex items-center gap-3 p-3 rounded-xl
                              ${isDark ? 'bg-white/5' : 'bg-gray-50'}
                            `}
                          >
                            {/* 头像 */}
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300">
                              {winner.photoData ? (
                                <img
                                  src={winner.photoData}
                                  alt={winner.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className={`
                                  w-full h-full flex items-center justify-center
                                  text-white font-bold
                                  ${isDark ? 'bg-indigo-600' : 'bg-blue-500'}
                                `}>
                                  {winner.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            
                            {/* 信息 */}
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {winner.name}
                              </p>
                              <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {winner.id} · {winner.department}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
