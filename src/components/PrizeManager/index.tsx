import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrizeStore } from '../../stores/prizeStore'
import { useThemeStore } from '../../stores/themeStore'
import { Prize } from '../../types'

interface PrizeFormData {
  name: string
  count: number
  isTemporary: boolean
  includeWinners: boolean
  prizeImage?: string
  prizeImageName?: string
}

const defaultFormData: PrizeFormData = {
  name: '',
  count: 1,
  isTemporary: false,
  includeWinners: false,
}

export default function PrizeManager() {
  const { prizes, addPrize, updatePrize, deletePrize, resetAllPrizes } = usePrizeStore()
  const { theme } = useThemeStore()
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<PrizeFormData>(defaultFormData)
  
  const isDark = theme.type !== 'minimal-light'
  const isChineseRed = theme.type === 'chinese-red'

  // 获取主题按钮样式
  const getPrimaryButtonClass = () => {
    if (isChineseRed) return 'bg-yellow-500 hover:bg-yellow-400 text-red-900'
    if (isDark) return 'bg-indigo-600 hover:bg-indigo-500 text-white'
    return 'bg-blue-600 hover:bg-blue-500 text-white'
  }

  // 打开新增表单
  const handleAdd = useCallback(() => {
    setEditingId(null)
    setFormData(defaultFormData)
    setShowForm(true)
  }, [])

  // 打开编辑表单
  const handleEdit = useCallback((prize: Prize) => {
    setEditingId(prize.id)
    setFormData({
      name: prize.name,
      count: prize.count,
      isTemporary: prize.isTemporary,
      includeWinners: prize.includeWinners,
      prizeImage: prize.prizeImage,
      prizeImageName: prize.prizeImageName,
    })
    setShowForm(true)
  }, [])

  // 选择奖品图片
  const handleSelectImage = useCallback(async () => {
    const result = await window.electronAPI.selectImage()
    if (result) {
      setFormData((prev) => ({
        ...prev,
        prizeImage: result.data,
        prizeImageName: result.name,
      }))
    }
  }, [])

  // 提交表单
  const handleSubmit = useCallback(() => {
    if (!formData.name || formData.count < 1) return

    if (editingId) {
      updatePrize(editingId, formData)
    } else {
      addPrize(formData)
    }
    
    setShowForm(false)
    setFormData(defaultFormData)
  }, [formData, editingId, addPrize, updatePrize])

  // 删除奖项
  const handleDelete = useCallback((id: string) => {
    if (confirm('确定要删除这个奖项吗？')) {
      deletePrize(id)
    }
  }, [deletePrize])

  // 重置所有奖项
  const handleResetAll = useCallback(() => {
    if (confirm('确定要重置所有奖项的中奖记录吗？')) {
      resetAllPrizes()
    }
  }, [resetAllPrizes])

  return (
    <div className="space-y-6">
      {/* 奖项列表 */}
      <div className={`rounded-xl p-6 relative z-10 ${
        isChineseRed 
          ? 'bg-gradient-to-br from-red-900/80 to-red-800/80 border-2 border-yellow-500/30' 
          : isDark ? 'bg-white/5' : 'bg-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            奖项列表
          </h3>
          <div className="flex gap-2">
            {prizes.length > 0 && (
              <button
                onClick={handleResetAll}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${isDark
                    ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                    : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                  }
                `}
              >
                重置记录
              </button>
            )}
            <button
              onClick={handleAdd}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${getPrimaryButtonClass()}`}
            >
              + 添加奖项
            </button>
          </div>
        </div>

        {prizes.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <div className="text-4xl mb-2">🎁</div>
            <p>暂无奖项，请添加</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prizes.map((prize, index) => (
              <motion.div
                key={prize.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                  flex items-center gap-4 p-4 rounded-xl
                  ${isDark ? 'bg-white/5' : 'bg-white'}
                `}
              >
                {/* 序号 */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${isChineseRed ? 'bg-yellow-500 text-red-900' : isDark ? 'bg-indigo-600 text-white' : 'bg-blue-100 text-blue-600'}
                `}>
                  {index + 1}
                </div>

                {/* 奖品图片 */}
                {prize.prizeImage ? (
                  <img
                    src={prize.prizeImage}
                    alt={prize.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                    ${isDark ? 'bg-white/10' : 'bg-gray-100'}
                  `}>
                    🎁
                  </div>
                )}

                {/* 奖项信息 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {prize.name}
                    </span>
                    {prize.isTemporary && (
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full
                        ${isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}
                      `}>
                        临时
                      </span>
                    )}
                    {prize.includeWinners && (
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full
                        ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}
                      `}>
                        含已中奖
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    中奖人数: {prize.winners.length} / {prize.count}
                  </p>
                </div>

                {/* 进度条 */}
                <div className="w-32">
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <motion.div
                      className={`h-full ${
                        prize.winners.length >= prize.count
                          ? 'bg-green-500'
                          : isDark ? 'bg-indigo-500' : 'bg-blue-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(prize.winners.length / prize.count) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(prize)}
                    className={`
                      p-2 rounded-lg transition-all
                      ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}
                    `}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(prize.id)}
                    className={`
                      p-2 rounded-lg transition-all
                      ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-100'}
                    `}
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 新增/编辑表单弹窗 */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`
                w-full max-w-md p-6 rounded-2xl mx-4
                ${isChineseRed ? 'bg-red-900' : isDark ? 'bg-slate-800' : 'bg-white'}
              `}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {editingId ? '编辑奖项' : '添加奖项'}
              </h3>

              <div className="space-y-4">
                {/* 奖项名称 */}
                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    奖项名称
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如：一等奖、特等奖"
                    className={`
                      w-full px-4 py-3 rounded-xl outline-none transition-colors
                      ${isChineseRed
                        ? 'bg-red-800/50 text-white border border-yellow-500/30 focus:border-yellow-500'
                        : isDark
                          ? 'bg-white/10 text-white border border-white/10 focus:border-indigo-500'
                          : 'bg-gray-100 text-gray-800 border border-gray-200 focus:border-blue-500'
                      }
                    `}
                  />
                </div>

                {/* 中奖人数 */}
                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    中奖人数
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.count}
                    onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 1 })}
                    className={`
                      w-full px-4 py-3 rounded-xl outline-none transition-colors
                      ${isChineseRed
                        ? 'bg-red-800/50 text-white border border-yellow-500/30 focus:border-yellow-500'
                        : isDark
                          ? 'bg-white/10 text-white border border-white/10 focus:border-indigo-500'
                          : 'bg-gray-100 text-gray-800 border border-gray-200 focus:border-blue-500'
                      }
                    `}
                  />
                </div>

                {/* 奖品图片 */}
                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    奖品图片（可选）
                  </label>
                  <div
                    onClick={handleSelectImage}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl cursor-pointer border-2 border-dashed
                      transition-all hover:scale-[1.02]
                      ${isDark
                        ? 'border-white/20 hover:border-indigo-500'
                        : 'border-gray-200 hover:border-blue-500'
                      }
                    `}
                  >
                    {formData.prizeImage ? (
                      <>
                        <img
                          src={formData.prizeImage}
                          alt="奖品"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {formData.prizeImageName}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            点击更换图片
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className={`text-center w-full ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span className="text-2xl">🖼️</span>
                        <p className="text-sm mt-1">点击上传奖品图片</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 抽奖池选项 */}
                <div>
                  <label className={`flex items-center gap-3 cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={formData.includeWinners}
                      onChange={(e) => setFormData({ ...formData, includeWinners: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      包含已中奖人员（返场抽奖）
                    </span>
                  </label>
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className={`
                    flex-1 py-3 rounded-xl font-semibold transition-all
                    ${isDark
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }
                  `}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.name}
                  className={`
                    flex-1 py-3 rounded-xl font-semibold transition-all
                    ${!formData.name
                      ? 'bg-gray-500/50 cursor-not-allowed'
                      : getPrimaryButtonClass()
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
    </div>
  )
}
