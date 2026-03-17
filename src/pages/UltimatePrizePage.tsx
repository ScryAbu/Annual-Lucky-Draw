import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePrizeStore } from '../stores/prizeStore'
import { useThemeStore } from '../stores/themeStore'
import { useUltimatePrizeEngine } from '../hooks/useUltimatePrizeEngine'
import { useKeyboardControl } from '../hooks/useKeyboardControl'
import { useBGM } from '../hooks/useBGM'
import { generateDefaultAvatar } from '../utils/imageLoader'

export default function UltimatePrizePage() {
  const navigate = useNavigate()
  const { prizes, getAvailablePrizes } = usePrizeStore()
  const { theme, customAssets, eventTitle } = useThemeStore()
  const {
    status,
    selectedPrize,
    winner,
    rollingDisplay,
    getEligiblePool,
    getTotalWeight,
    getWeight,
    getWinChance,
    startRolling,
    stopRolling,
    closeResult,
  } = useUltimatePrizeEngine()

  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('')

  const bgmStatus = status === 'rolling' ? 'rolling' : status === 'showing' ? 'showing' : status === 'stopping' ? 'stopping' : 'idle'
  useBGM(bgmStatus as 'idle' | 'rolling' | 'stopping' | 'showing')

  const isDark = theme.type !== 'minimal-light'
  const isChineseRed = theme.type === 'chinese-red'

  const availablePrizes = getAvailablePrizes()
  const eligiblePool = getEligiblePool()
  const totalWeight = getTotalWeight()

  useKeyboardControl({
    onSpace: () => {
      if (status === 'rolling') stopRolling()
      else if (status === 'idle' && selectedPrizeId) {
        const p = availablePrizes.find((x) => x.id === selectedPrizeId)
        if (p) startRolling(p)
      }
    },
    onEscape: () => {
      if (status === 'showing') closeResult()
      else navigate('/')
    },
    enabled: true,
  })

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

  const toggleFullscreen = useCallback(async () => {
    await window.electronAPI.toggleFullscreen()
  }, [])

  const handleStart = useCallback(() => {
    if (!selectedPrizeId) {
      alert('请先选择终极大奖')
      return
    }
    const p = availablePrizes.find((x) => x.id === selectedPrizeId)
    if (p) startRolling(p)
  }, [selectedPrizeId, availablePrizes, startRolling])

  const isRolling = status === 'rolling'
  const isStopping = status === 'stopping'
  const isShowing = status === 'showing'
  const displayEmployee = isShowing ? winner : rollingDisplay

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
      {theme.customBackground && <div className="absolute inset-0 bg-black/30" />}
      {isChineseRed && !theme.customBackground && (
        <>
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-700 z-10" />
          <div className="absolute top-4 left-8 text-4xl lantern z-10">🏮</div>
          <div className="absolute top-4 right-8 text-4xl lantern z-10">🏮</div>
          <div className="absolute bottom-4 left-4 text-3xl z-10">🧧</div>
          <div className="absolute bottom-4 right-4 text-3xl z-10">🧧</div>
        </>
      )}

      <header
        className={`
          absolute top-0 left-0 right-0 z-20
          flex items-center justify-between px-6 py-4
          ${isDark ? 'bg-black/20' : 'bg-white/20'}
          backdrop-blur-sm
        `}
      >
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
            <h1
              className={`
                text-xl font-bold
                ${isChineseRed ? 'text-yellow-100 drop-shadow-lg' : isDark ? 'text-white' : 'text-gray-800'}
              `}
            >
              {eventTitle ? `${eventTitle} · 终极大奖` : '终极大奖'}
            </h1>
          </div>
        </div>
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
      </header>

      <div className="absolute inset-0 flex flex-col items-center justify-center pt-20 pb-32">
        {/* 选择终极大奖 */}
        {status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl px-6"
          >
            <h2
              className={`
                text-2xl font-bold text-center mb-6
                ${isChineseRed ? 'text-yellow-400' : isDark ? 'text-white' : 'text-gray-800'}
              `}
            >
              🏆 选择终极大奖
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {availablePrizes.map((p) => (
                <motion.button
                  key={p.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedPrizeId(p.id)}
                  className={`
                    flex flex-col items-center p-4 rounded-xl border-2 transition-all
                    ${selectedPrizeId === p.id
                      ? isChineseRed
                        ? 'border-yellow-400 bg-yellow-500/20'
                        : 'border-indigo-500 bg-indigo-500/20'
                      : isDark
                        ? 'border-white/20 bg-white/5 hover:bg-white/10'
                        : 'border-gray-200 bg-white hover:bg-gray-50'}
                  `}
                >
                  {p.prizeImage ? (
                    <img src={p.prizeImage} alt="" className="w-16 h-16 object-contain mb-2" />
                  ) : (
                    <div className="text-4xl mb-2">🎁</div>
                  )}
                  <span className={`font-semibold text-center text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {p.name}
                  </span>
                  <span className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    剩余 {p.count - p.winners.length}/{p.count}
                  </span>
                </motion.button>
              ))}
            </div>
            <div
              className={`
                text-center rounded-xl p-4
                ${isDark ? 'bg-white/10' : 'bg-gray-100'}
              `}
            >
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                参与人数：<strong>{eligiblePool.length}</strong> 人（积分 &gt; 0） · 总权重：<strong>{totalWeight}</strong>
              </p>
              <p className={`mt-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                中奖概率 = 个人积分 ÷ 总权重（积分越高概率越大）
              </p>
            </div>

            {/* 参与名单与中奖概率，让权重一目了然 */}
            <div className={`mt-4 w-full max-w-2xl rounded-xl overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              <div className={`px-4 py-2 text-sm font-semibold ${isDark ? 'text-white bg-white/10' : 'text-gray-800 bg-gray-200'}`}>
                参与名单与中奖概率
              </div>
              <div className="max-h-48 overflow-y-auto">
                {eligiblePool
                  .slice()
                  .sort((a, b) => getWeight(b) - getWeight(a))
                  .map((emp) => {
                    const chance = getWinChance(emp)
                    const pct = (chance * 100).toFixed(1)
                    return (
                      <div
                        key={emp.id}
                        className={`
                          flex items-center justify-between px-4 py-2 text-sm
                          ${isDark ? 'border-b border-white/10' : 'border-b border-gray-200'}
                        `}
                      >
                        <span className={isDark ? 'text-white' : 'text-gray-800'}>{emp.name}</span>
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                          积分 <strong className={isDark ? 'text-yellow-400' : 'text-amber-600'}>{getWeight(emp)}</strong>
                          {' '}· 中奖概率 <strong className={isDark ? 'text-green-400' : 'text-green-600'}>{pct}%</strong>
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          </motion.div>
        )}

        {/* 滚动 / 结果展示 */}
        {(isRolling || isStopping || isShowing) && displayEmployee && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            {selectedPrize && (
              <div className={`text-xl font-bold mb-6 ${isChineseRed ? 'text-yellow-400' : isDark ? 'text-white' : 'text-gray-800'}`}>
                🎁 {selectedPrize.name}
              </div>
            )}
            <div
              className={`
                flex flex-col items-center p-8 rounded-2xl
                ${isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-gray-200 shadow-2xl'}
                ${isShowing ? 'ring-4 ring-yellow-400' : ''}
              `}
            >
              <img
                src={displayEmployee.photoData || generateDefaultAvatar(displayEmployee.name, theme.colors.primary)}
                alt={displayEmployee.name}
                className="w-32 h-32 rounded-full object-cover mb-4 ring-4 ring-white/30"
              />
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {displayEmployee.name}
              </div>
              <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {displayEmployee.department} · 积分 {(displayEmployee.points ?? 0)}
              </div>
            </div>
            {isShowing && winner && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`mt-6 text-xl font-semibold ${isChineseRed ? 'text-yellow-400' : isDark ? 'text-white' : 'text-gray-800'}`}
              >
                🎉 恭喜获得终极大奖！
              </motion.p>
            )}
          </motion.div>
        )}
      </div>

      <footer
        className={`
          absolute bottom-0 left-0 right-0 z-20
          flex items-center justify-center gap-8 px-6 py-6
          ${isDark ? 'bg-gradient-to-t from-black/60 to-transparent' : 'bg-gradient-to-t from-white/60 to-transparent'}
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={`text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <div className="text-lg font-semibold">
              {status === 'idle' && '请选择终极大奖并开始'}
              {isRolling && '按权重抽取中...'}
              {isStopping && '即将揭晓...'}
              {isShowing && '抽奖完成'}
            </div>
            <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              参与 {eligiblePool.length} 人 · 总权重 {totalWeight}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isRolling ? stopRolling : handleStart}
            disabled={status === 'idle' && (eligiblePool.length === 0 || availablePrizes.length === 0 || !selectedPrizeId)}
            className={`
              w-32 h-32 rounded-full font-bold text-xl flex items-center justify-center transition-all duration-300
              ${status === 'idle' && (eligiblePool.length === 0 || availablePrizes.length === 0 || !selectedPrizeId)
                ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                : isRolling
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                  : isShowing
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                    : isChineseRed
                      ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-red-900 shadow-lg shadow-yellow-500/50'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/50'}
            `}
          >
            {isRolling ? '停止' : isStopping ? '揭晓中...' : isShowing ? '继续' : '开始'}
          </motion.button>

          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {isRolling ? '按 空格键 停止' : '按 空格键 开始'}
          </p>
        </div>
      </footer>
    </div>
  )
}
