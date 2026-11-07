import { ReactNode, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LotteryScene from './LotteryScene'
import WinnerDisplay from './WinnerDisplay'
import { useThemeStore } from '../stores/themeStore'
import { Employee, LotteryStatus, Prize } from '../types'

export interface StagePrize {
  id: string
  name: string
  count: number
  won: number
  prizeImage?: string
}

/**
 * 观众看到的抽奖画面：背景、标题、当前奖项、3D 场景、中奖弹窗。
 * 控制台页面和大屏窗口共用它，保证两边画面一致；操作按钮通过 children 叠加在上面。
 */
export default function LotteryStage({
  status,
  prize,
  sceneEmployees,
  totalPool,
  winners,
  onCloseWinner,
  children,
}: {
  status: LotteryStatus
  prize: StagePrize | null
  sceneEmployees: Employee[]
  totalPool: number
  winners: Employee[]
  onCloseWinner: () => void
  children?: ReactNode
}) {
  const { theme, customAssets, eventTitle } = useThemeStore()
  const isChineseRed = theme.type === 'chinese-red'
  const isLight = theme.type === 'minimal-light'

  const backgroundStyle = useMemo(() => {
    if (theme.customBackground) {
      return { backgroundImage: `url(${theme.customBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    }
    if (isChineseRed) return { background: 'radial-gradient(1200px 700px at 50% -10%, #b3242c 0%, #7a1016 45%, #3d070b 100%)' }
    if (isLight) return { background: 'radial-gradient(1200px 700px at 50% -10%, #ffffff 0%, #eef0f8 55%, #dfe3ef 100%)' }
    return { background: 'radial-gradient(1100px 700px at 50% 110%, rgba(124,108,255,.28) 0%, transparent 60%), radial-gradient(900px 600px at 0% 0%, rgba(34,211,238,.10) 0%, transparent 55%), #070815' }
  }, [theme.customBackground, isChineseRed, isLight])

  const winnerPrize: Prize | null = prize
    ? { id: prize.id, name: prize.name, count: prize.count, winners: [], isTemporary: false, includeWinners: false, prizeImage: prize.prizeImage, order: 0 }
    : null
  const completed = prize ? prize.won >= prize.count : false
  const titleColor = isChineseRed ? '#ffe2a3' : isLight ? '#141826' : '#ffffff'

  return (
    <div className="relative w-full h-screen overflow-hidden select-none" style={backgroundStyle}>
      {theme.customBackground && <div className="absolute inset-0 bg-black/25" />}

      {isChineseRed && !theme.customBackground && (
        <>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-700 via-yellow-300 to-yellow-700 z-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[320px] font-black text-yellow-400/[0.04] pointer-events-none">福</div>
        </>
      )}

      {/* 3D 场景 */}
      <div className="absolute inset-0 z-0">
        <LotteryScene
          employees={sceneEmployees}
          isRolling={status === 'rolling'}
          winners={winners}
          primaryColor={theme.colors.primary}
        />
      </div>

      {/* 观众信息：活动标题 + 当前奖项 */}
      <div className="absolute top-0 inset-x-0 z-10 pointer-events-none flex flex-col items-center pt-7 gap-3">
        <div className="flex items-center gap-3">
          {customAssets.logoImage && <img src={customAssets.logoImage} alt="" className="h-9 object-contain" />}
          <h1 className="text-2xl md:text-3xl font-bold tracking-[0.18em]" style={{ color: titleColor, textShadow: isLight ? 'none' : '0 2px 24px rgba(0,0,0,.45)' }}>
            {eventTitle || '年会抽奖'}
          </h1>
        </div>
        <AnimatePresence mode="wait">
          {prize && (
            <motion.div
              key={prize.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="stage-glass rounded-full pl-2 pr-5 py-1.5 flex items-center gap-3"
            >
              {prize.prizeImage
                ? <img src={prize.prizeImage} alt="" className="w-8 h-8 rounded-full object-cover bg-white/10" />
                : <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>奖</span>}
              <span className="text-lg font-semibold tracking-wide">{prize.name}</span>
              <span className="text-sm opacity-70 tabular">
                {status === 'rolling' || status === 'stopping' ? '抽奖中…' : completed ? '已抽完' : `剩余 ${prize.count - prize.won} 名`}
              </span>
              {totalPool > 0 && <span className="text-sm opacity-50 tabular">· {totalPool} 人参与</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {children}

      <WinnerDisplay
        winners={winners}
        prize={winnerPrize}
        isVisible={status === 'showing'}
        onClose={onCloseWinner}
        themeType={theme.type}
        primaryColor={theme.colors.primary}
      />
    </div>
  )
}
