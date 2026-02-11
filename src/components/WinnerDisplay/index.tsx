import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { Employee, Prize, ThemeType } from '../../types'

import { useThemeStore } from '../../stores/themeStore'

interface WinnerDisplayProps {
  winners: Employee[]
  prize: Prize | null
  isVisible: boolean
  onClose: () => void
  themeType: ThemeType
  primaryColor: string
}

export default function WinnerDisplay({
  winners,
  prize,
  isVisible,
  onClose,
  themeType,
  primaryColor,
}: WinnerDisplayProps) {
  // 初始化粒子引擎
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    })
  }, [])

  const { displayOptions } = useThemeStore()
  const isDark = themeType !== 'minimal-light'
  const isChineseRed = themeType === 'chinese-red'

  // 粒子配置
  const particlesOptions = {
    particles: {
      number: {
        value: 100,
        density: {
          enable: true,
        },
      },
      color: {
        value: isChineseRed 
          ? ['#fbbf24', '#f59e0b', '#dc2626'] 
          : ['#6366f1', '#8b5cf6', '#22d3ee'],
      },
      shape: {
        type: isChineseRed ? ['circle', 'star'] : ['circle'],
      },
      opacity: {
        value: { min: 0.3, max: 0.8 },
        animation: {
          enable: true,
          speed: 1,
        },
      },
      size: {
        value: { min: 2, max: 6 },
      },
      move: {
        enable: true,
        speed: 2,
        direction: 'none' as const,
        random: true,
        outModes: {
          default: 'out' as const,
        },
      },
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: 'repulse',
        },
      },
    },
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* 背景遮罩 */}
          <div className={`absolute inset-0 ${
            isDark ? 'bg-black/80' : 'bg-white/90'
          } backdrop-blur-md`} />

          {/* 粒子效果 */}
          <Particles
            className="absolute inset-0"
            options={particlesOptions}
          />

          {/* 内容 */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="relative z-10 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 奖项名称 */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              {prize?.prizeImage && (
                <motion.img
                  src={prize.prizeImage}
                  alt={prize.name}
                  className="w-24 h-24 mx-auto mb-4 object-contain"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                />
              )}
              <h2 
                className={`text-4xl font-bold ${
                  isChineseRed ? 'text-yellow-400' : isDark ? 'text-white' : 'text-gray-800'
                }`}
                style={{
                  textShadow: isDark ? '0 0 20px rgba(99, 102, 241, 0.5)' : 'none',
                }}
              >
                🎉 {prize?.name} 🎉
              </h2>
            </motion.div>

            {/* 中奖者展示 */}
            <div className="flex flex-wrap justify-center gap-4 p-4 max-w-6xl">
              {winners.map((winner, index) => (
                <motion.div
                  key={winner.id}
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className={`
                    flex flex-col items-center p-4 rounded-2xl
                    ${isDark 
                      ? 'bg-white/10 border border-white/20' 
                      : 'bg-white border border-gray-200 shadow-xl'
                    }
                    min-w-[200px] max-w-[280px] flex-1
                    sm:min-w-[180px]
                    md:min-w-[200px]
                  `}
                  style={{
                    boxShadow: isDark ? `0 0 30px ${primaryColor}40` : undefined,
                  }}
                >
                  {/* 照片 */}
                  {winners.length <= 10 ? (
                    <motion.div
                      className={`
                        w-24 h-24 rounded-full overflow-hidden mb-3
                        border-4
                        ${isChineseRed 
                          ? 'border-yellow-400' 
                          : isDark ? 'border-indigo-500' : 'border-blue-500'
                        }
                      `}
                      animate={{
                        boxShadow: [
                          `0 0 20px ${primaryColor}40`,
                          `0 0 40px ${primaryColor}60`,
                          `0 0 20px ${primaryColor}40`,
                        ],
                      }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      {winner.photoData ? (
                        <img
                          src={winner.photoData}
                          alt={winner.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div 
                          className={`w-full h-full flex items-center justify-center text-4xl font-bold
                            ${isChineseRed 
                              ? 'bg-yellow-500 text-red-900' 
                              : isDark 
                                ? 'bg-indigo-500 text-white' 
                                : 'bg-blue-500 text-white'
                            }
                          `}
                        >
                          {winner.name.charAt(0)}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    winner.photoData && (
                      <motion.div
                        className={`
                          w-24 h-24 rounded-full overflow-hidden mb-3
                          border-4
                          ${isChineseRed 
                            ? 'border-yellow-400' 
                            : isDark ? 'border-indigo-500' : 'border-blue-500'
                          }
                        `}
                        animate={{
                          boxShadow: [
                            `0 0 20px ${primaryColor}40`,
                            `0 0 40px ${primaryColor}60`,
                            `0 0 20px ${primaryColor}40`,
                          ],
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <img
                          src={winner.photoData}
                          alt={winner.name}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    )
                  )}

                  {/* 姓名 */}
                  {displayOptions.showName && winner.name && (
                    <h3 className={`text-xl font-bold mb-2 text-center ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                      {winner.name}
                    </h3>
                  )}

                  {/* 工号和部门 */}
                  <div className={`text-sm space-y-1 text-center ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {displayOptions.showId && winner.id && (
                      <p className="truncate max-w-[160px]">工号：{winner.id}</p>
                    )}
                    {displayOptions.showDepartment && winner.department && (
                      <p className="truncate max-w-[160px]" title={winner.department}>
                        部门：{winner.department}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 关闭提示 */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className={`mt-8 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
            >
              按 空格键 或 点击任意处 继续
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
