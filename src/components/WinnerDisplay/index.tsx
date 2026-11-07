import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { Employee, Prize, ThemeType } from '../../types'
import { useThemeStore } from '../../stores/themeStore'
import { generateDefaultAvatar } from '../../utils/imageLoader'

interface WinnerDisplayProps {
  winners: Employee[]
  prize: Prize | null
  isVisible: boolean
  onClose: () => void
  themeType: ThemeType
  primaryColor: string
  showAvatar?: boolean
}

let particlesReady: Promise<void> | null = null

export default function WinnerDisplay({
  winners,
  prize,
  isVisible,
  onClose,
  themeType,
  primaryColor,
  showAvatar = true,
}: WinnerDisplayProps) {
  const options = useThemeStore(s => s.displayOptions)
  useEffect(() => {
    particlesReady ??= initParticlesEngine(async (engine) => { await loadSlim(engine) })
  }, [])

  const isLight = themeType === 'minimal-light'
  const isChineseRed = themeType === 'chinese-red'
  const colors = isChineseRed ? ['#ffd77a', '#f6c453', '#ff7a59', '#ffffff'] : isLight ? ['#4f46e5', '#22d3ee', '#f59e0b', '#ec4899'] : ['#a78bfa', '#7c6cff', '#22d3ee', '#f9d77e']

  const particlesOptions = useMemo(() => ({
    fullScreen: { enable: false },
    particles: {
      number: { value: 90, density: { enable: true } },
      color: { value: colors },
      shape: { type: ['circle', 'square', 'star'] },
      opacity: { value: { min: 0.4, max: 0.9 } },
      size: { value: { min: 2, max: 5 } },
      rotate: { value: { min: 0, max: 360 }, animation: { enable: true, speed: 15 } },
      move: { enable: true, speed: { min: 1, max: 3 }, direction: 'bottom' as const, straight: false, outModes: { default: 'out' as const } },
      wobble: { enable: true, distance: 12, speed: 8 },
    },
  }), [colors.join()]) // eslint-disable-line react-hooks/exhaustive-deps

  const n = winners.length
  const size = n <= 3 ? 'lg' : n <= 8 ? 'md' : n <= 15 ? 'sm' : 'xs'
  const card = {
    lg: { w: 'w-60', photo: 'w-40 h-40', name: 'text-4xl', id: 'text-xl', gap: 'gap-8' },
    md: { w: 'w-48', photo: 'w-28 h-28', name: 'text-2xl', id: 'text-base', gap: 'gap-6' },
    sm: { w: 'w-40', photo: 'w-20 h-20', name: 'text-xl', id: 'text-sm', gap: 'gap-4' },
    xs: { w: 'w-32', photo: 'w-14 h-14', name: 'text-lg', id: 'text-xs', gap: 'gap-3' },
  }[size]

  const accent = isChineseRed ? '#f6c453' : primaryColor
  const titleGradient = isChineseRed
    ? 'linear-gradient(180deg, #fff3c4 0%, #f6c453 55%, #d68b1f 100%)'
    : isLight ? 'linear-gradient(90deg, #4338ca, #7c3aed)' : 'linear-gradient(180deg, #ffffff 0%, #c9c2ff 100%)'

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <div
            className="absolute inset-0 backdrop-blur-xl"
            style={{
              background: isLight
                ? 'radial-gradient(900px 600px at 50% 40%, rgba(255,255,255,.92), rgba(238,240,248,.96))'
                : isChineseRed
                  ? 'radial-gradient(900px 600px at 50% 40%, rgba(150,22,30,.86), rgba(40,4,8,.94))'
                  : 'radial-gradient(900px 600px at 50% 40%, rgba(40,30,90,.82), rgba(5,6,16,.94))',
            }}
          />
          <Particles id="winner-confetti" className="absolute inset-0" options={particlesOptions} />

          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 180 }}
            className="relative z-10 text-center max-h-[90vh] overflow-y-auto px-6 py-4 w-full max-w-7xl"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.12 }} className="mb-10">
              <div className={`text-base tracking-[0.5em] mb-3 ${isLight ? 'text-gray-500' : 'text-white/60'}`}>恭 喜 获 得</div>
              <div className="flex items-center justify-center gap-4">
                {prize?.prizeImage && (
                  <motion.img
                    src={prize.prizeImage}
                    alt=""
                    className="w-20 h-20 object-contain drop-shadow-xl"
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  />
                )}
                <h2
                  className="text-5xl md:text-6xl font-black tracking-wider"
                  style={{ backgroundImage: titleGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: isLight ? 'none' : 'drop-shadow(0 6px 30px rgba(0,0,0,.35))' }}
                >
                  {prize?.name}
                </h2>
              </div>
            </motion.div>

            <div className={`flex flex-wrap justify-center ${card.gap}`}>
              {winners.map((winner, index) => (
                <motion.div
                  key={winner.id}
                  initial={{ y: 40, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + Math.min(index, 20) * 0.06, type: 'spring', damping: 18 }}
                  className={`${card.w} relative flex flex-col items-center rounded-3xl px-4 pt-6 pb-5 overflow-hidden`}
                  style={{
                    background: isLight ? '#ffffff' : 'linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.04))',
                    border: `1px solid ${isLight ? '#e5e7ef' : 'rgba(255,255,255,.16)'}`,
                    boxShadow: isLight ? '0 20px 40px -24px rgba(20,24,38,.35)' : `0 24px 60px -30px ${accent}, inset 0 1px 0 rgba(255,255,255,.12)`,
                  }}
                >
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
                  {showAvatar && options.showPhoto && (
                    <div className={`${card.photo} rounded-full overflow-hidden mb-4 p-[3px]`} style={{ background: `conic-gradient(from 180deg, ${accent}, #ffffff, ${accent})` }}>
                      <img
                        src={winner.photoData || generateDefaultAvatar(winner.name || winner.id, primaryColor)}
                        alt={winner.name}
                        className="w-full h-full rounded-full object-cover"
                        style={{ background: isLight ? '#fff' : '#111' }}
                      />
                    </div>
                  )}
                  {options.showName && (
                    <h3 className={`${card.name} font-bold leading-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>{winner.name}</h3>
                  )}
                  {options.showId && (
                    <p className={`${options.showName ? card.id : 'text-5xl'} font-semibold tabular mt-1.5 ${options.showName ? (isLight ? 'text-gray-500' : 'text-white/70') : isLight ? 'text-gray-900' : 'text-white'}`}>
                      {winner.id}
                    </p>
                  )}
                  {options.showDepartment && winner.department && (
                    <p className={`text-xs mt-2 px-2.5 py-1 rounded-full ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-white/75'}`}>{winner.department}</p>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className={`mt-10 text-sm ${isLight ? 'text-gray-400' : 'text-white/40'}`}
            >
              按空格键或点击空白处继续
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
