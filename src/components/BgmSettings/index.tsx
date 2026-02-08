import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { useBgmStore, BgmConfig } from '../../stores/bgmStore'
import { useThemeStore } from '../../stores/themeStore'

// 单个 BGM 配置卡片
function BgmCard({
  label,
  description,
  bgm,
  volume,
  onSelect,
  onRemove,
  onVolumeChange,
  isDark,
  isChineseRed,
}: {
  label: string
  description: string
  bgm: BgmConfig | null
  volume: number
  onSelect: () => void
  onRemove: () => void
  onVolumeChange: (v: number) => void
  isDark: boolean
  isChineseRed: boolean
}) {
  // 试听
  const handlePreview = useCallback(() => {
    if (!bgm) return
    const audio = new Audio(bgm.data)
    audio.volume = volume
    audio.play().catch(() => {})
    // 5秒后自动停止
    setTimeout(() => {
      audio.pause()
      audio.src = ''
    }, 5000)
  }, [bgm, volume])

  return (
    <div
      className={`
        rounded-xl p-5 transition-all
        ${isChineseRed
          ? 'bg-red-950/50 border border-yellow-500/20'
          : isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
        }
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {label}
          </h4>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {description}
          </p>
        </div>
      </div>

      {/* 文件选择区 */}
      <div className="flex items-center gap-3 mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelect}
          className={`
            flex-1 px-4 py-3 rounded-lg text-sm font-medium
            border-2 border-dashed transition-all text-center
            ${isChineseRed
              ? 'border-yellow-500/30 hover:border-yellow-500 text-yellow-200'
              : isDark
                ? 'border-white/20 hover:border-indigo-500 text-gray-300'
                : 'border-gray-300 hover:border-blue-500 text-gray-600'
            }
          `}
        >
          {bgm ? (
            <span className="flex items-center justify-center gap-2">
              <span>🎵</span>
              <span className="truncate max-w-[200px]">{bgm.name}</span>
            </span>
          ) : (
            <span>点击选择音频文件</span>
          )}
        </motion.button>

        {bgm && (
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePreview}
              className={`
                w-9 h-9 rounded-lg flex items-center justify-center text-lg
                ${isChineseRed
                  ? 'bg-yellow-500/20 hover:bg-yellow-500/30'
                  : isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'
                }
              `}
              title="试听"
            >
              ▶
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onRemove}
              className={`
                w-9 h-9 rounded-lg flex items-center justify-center text-lg
                ${isDark
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-red-100 text-red-500 hover:bg-red-200'
                }
              `}
              title="移除"
            >
              ✕
            </motion.button>
          </div>
        )}
      </div>

      {/* 音量调节 */}
      <div className="flex items-center gap-3">
        <span className={`text-xs whitespace-nowrap ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          🔈 音量
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(volume * 100)}
          onChange={(e) => onVolumeChange(parseInt(e.target.value) / 100)}
          className={`
            flex-1 h-2 rounded-full appearance-none cursor-pointer
            ${isChineseRed
              ? '[&::-webkit-slider-thumb]:bg-yellow-500'
              : isDark
                ? '[&::-webkit-slider-thumb]:bg-indigo-500'
                : '[&::-webkit-slider-thumb]:bg-blue-500'
            }
            ${isDark ? 'bg-white/20' : 'bg-gray-200'}
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
          `}
        />
        <span className={`text-xs w-10 text-right ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  )
}

export default function BgmSettings() {
  const {
    idleBgm, rollingBgm, winnerBgm,
    idleVolume, rollingVolume, winnerVolume,
    bgmEnabled,
    setIdleBgm, setRollingBgm, setWinnerBgm,
    setIdleVolume, setRollingVolume, setWinnerVolume,
    setBgmEnabled,
  } = useBgmStore()
  
  const { theme } = useThemeStore()
  const isDark = theme.type !== 'minimal-light'
  const isChineseRed = theme.type === 'chinese-red'

  // 选择音频文件
  const handleSelectAudio = useCallback(async (setter: (bgm: BgmConfig | null) => void) => {
    const result = await window.electronAPI.selectAudio()
    if (result) {
      setter({ name: result.name, data: result.data })
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* 全局开关 */}
      <div className={`rounded-xl p-6 relative z-10 ${
        isChineseRed
          ? 'bg-gradient-to-br from-red-900/80 to-red-800/80 border-2 border-yellow-500/30'
          : isDark ? 'bg-white/5' : 'bg-gray-100'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              背景音乐
            </h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              为抽奖过程的不同阶段设置背景音乐，支持 MP3、WAV、OGG 等格式
            </p>
          </div>
          
          {/* 开关 */}
          <button
            onClick={() => setBgmEnabled(!bgmEnabled)}
            className={`
              relative w-14 h-7 rounded-full transition-colors duration-300
              ${bgmEnabled
                ? isChineseRed ? 'bg-yellow-500' : 'bg-indigo-500'
                : isDark ? 'bg-white/20' : 'bg-gray-300'
              }
            `}
          >
            <div
              className={`
                absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md
                transition-transform duration-300
                ${bgmEnabled ? 'translate-x-7' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>
      </div>

      {/* BGM 配置卡片 */}
      {bgmEnabled && (
        <div className={`rounded-xl p-6 relative z-10 ${
          isChineseRed
            ? 'bg-gradient-to-br from-red-900/80 to-red-800/80 border-2 border-yellow-500/30'
            : isDark ? 'bg-white/5' : 'bg-gray-100'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            音乐配置
          </h3>
          
          <div className="space-y-4">
            <BgmCard
              label="🎶 待机音乐"
              description="进入抽奖页面后循环播放的背景音乐"
              bgm={idleBgm}
              volume={idleVolume}
              onSelect={() => handleSelectAudio(setIdleBgm)}
              onRemove={() => setIdleBgm(null)}
              onVolumeChange={setIdleVolume}
              isDark={isDark}
              isChineseRed={isChineseRed}
            />

            <BgmCard
              label="🥁 抽奖音乐"
              description="点击开始按钮后，滚动抽取过程中播放的音乐"
              bgm={rollingBgm}
              volume={rollingVolume}
              onSelect={() => handleSelectAudio(setRollingBgm)}
              onRemove={() => setRollingBgm(null)}
              onVolumeChange={setRollingVolume}
              isDark={isDark}
              isChineseRed={isChineseRed}
            />

            <BgmCard
              label="🎉 中奖音乐"
              description="中奖者揭晓时播放的庆祝音乐"
              bgm={winnerBgm}
              volume={winnerVolume}
              onSelect={() => handleSelectAudio(setWinnerBgm)}
              onRemove={() => setWinnerBgm(null)}
              onVolumeChange={setWinnerVolume}
              isDark={isDark}
              isChineseRed={isChineseRed}
            />
          </div>
        </div>
      )}

      {/* 使用提示 */}
      <div className={`rounded-xl p-5 relative z-10 ${
        isChineseRed
          ? 'bg-red-950/50 border border-yellow-500/10'
          : isDark ? 'bg-white/5' : 'bg-blue-50'
      }`}>
        <h4 className={`font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          💡 使用提示
        </h4>
        <ul className={`text-sm space-y-1.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          <li>• 待机音乐：进入抽奖页面后自动循环播放</li>
          <li>• 抽奖音乐：点击「开始」后替换待机音乐，营造紧张氛围</li>
          <li>• 中奖音乐：中奖名单揭晓时播放，建议选择欢快的音效</li>
          <li>• 每种音乐都可以独立设置音量，也可以只设置部分</li>
          <li>• 支持格式：MP3、WAV、OGG、AAC、M4A、FLAC</li>
        </ul>
      </div>
    </div>
  )
}
