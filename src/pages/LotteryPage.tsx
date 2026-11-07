import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import LotteryStage, { StagePrize } from '../components/LotteryStage'
import HistoryPanel from '../components/HistoryPanel'
import { useEmployeeStore } from '../stores/employeeStore'
import { usePrizeStore } from '../stores/prizeStore'
import { useThemeStore } from '../stores/themeStore'
import { useRigStore } from '../stores/rigStore'
import { useBgmStore } from '../stores/bgmStore'
import { useLotteryEngine } from '../hooks/useLotteryEngine'
import { useKeyboardControl } from '../hooks/useKeyboardControl'
import { useScreenOperator } from '../hooks/useScreenOperator'
import { eligibleEmployees } from '../utils/draw'
import { ScreenState } from '../utils/screenLink'
import { PresentationControls } from '../components/PresentationControls'
import { useBGM } from '../hooks/useBGM'
import { Icon } from '../components/ui/Icon'

const SCENE_EFFECTS = [
  ['sphere', '经典球体'],
  ['helix', '螺旋星环'],
  ['starfield', '全屏漫游'],
  ['matrix', '矩阵数据雨'],
] as const

/** 鼠标闲置一段时间后隐藏操作控件；移动鼠标立即恢复 */
function useIdleChrome(enabled: boolean, delay = 3000) {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    if (!enabled) { setHidden(false); return }
    let timer = 0
    // 有下拉菜单打开、或鼠标正停在控件上时不隐藏
    const hide = () => {
      if (document.querySelector('.ui-menu') || document.querySelector('.chrome-auto:hover')) schedule()
      else setHidden(true)
    }
    const schedule = () => { window.clearTimeout(timer); timer = window.setTimeout(hide, delay) }
    const wake = () => { setHidden(false); schedule() }
    schedule()
    window.addEventListener('mousemove', wake)
    window.addEventListener('mousedown', wake)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('mousemove', wake)
      window.removeEventListener('mousedown', wake)
    }
  }, [enabled, delay])
  return hidden
}

export default function LotteryPage() {
  const navigate = useNavigate()
  const { employees } = useEmployeeStore()
  const { prizes, currentPrizeIndex, setCurrentPrizeIndex, addPrize } = usePrizeStore()
  const {
    theme,
    drawMode,
    setDrawMode,
    sceneEffect,
    setSceneEffect,
    sphereScale,
    setSphereScale,
  } = useThemeStore()
  const { bgmEnabled, setBgmEnabled } = useBgmStore()
  const [showSceneMenu, setShowSceneMenu] = useState(false)

  const {
    status,
    currentPrize,
    currentWinners,
    toggle,
    activeEmployees,
    closeWinnerDisplay,
  } = useLotteryEngine()

  useBGM(status)

  // 内定功能（隐蔽入口）
  const { activated: rigActivated, setActivated: setRigActivated, addRig, removeRig, getRiggedEmployees } = useRigStore()
  const [showRigPanel, setShowRigPanel] = useState(false)
  const rigClickCountRef = useRef(0)
  const rigClickTimerRef = useRef<number | null>(null)

  // 隐蔽入口：空闲时快速点击可抽奖人数区域 5 次
  const handleSecretClick = useCallback(() => {
    if (status !== 'idle') return
    rigClickCountRef.current += 1
    if (rigClickTimerRef.current) clearTimeout(rigClickTimerRef.current)
    if (rigClickCountRef.current >= 5) {
      rigClickCountRef.current = 0
      setShowRigPanel(true)
    } else {
      rigClickTimerRef.current = window.setTimeout(() => { rigClickCountRef.current = 0 }, 2000)
    }
  }, [status])

  const [showHistory, setShowHistory] = useState(false)
  const [showPrizeSelector, setShowPrizeSelector] = useState(false)
  const [showAddPrize, setShowAddPrize] = useState(false)
  const [tempPrize, setTempPrize] = useState({ name: '', count: 1, includeWinners: false })
  const [drawCount, setDrawCount] = useState(1)

  useEffect(() => {
    if (status !== 'idle') {
      setShowRigPanel(false)
      setShowSceneMenu(false)
      setShowPrizeSelector(false)
    }
  }, [status])

  useEffect(() => () => { if (rigClickTimerRef.current) clearTimeout(rigClickTimerRef.current) }, [])

  const selectedPrize = prizes[currentPrizeIndex]
  const availablePool = useMemo(() => selectedPrize ? eligibleEmployees(employees, selectedPrize) : employees, [employees, selectedPrize])
  const remainingCount = selectedPrize ? selectedPrize.count - selectedPrize.winners.length : 0
  const maxDrawCount = Math.min(remainingCount, availablePool.length, 30)
  const isCompleted = selectedPrize ? selectedPrize.winners.length >= selectedPrize.count : false

  useEffect(() => { if (status === 'idle') setDrawCount(count => Math.max(1, Math.min(count, maxDrawCount))) }, [maxDrawCount, status])

  const toggleFullscreen = useCallback(async () => {
    if (window.electronAPI) await window.electronAPI.toggleFullscreen()
    else if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  }, [])

  const handleToggle = useCallback(() => {
    if (selectedPrize) toggle(selectedPrize, drawCount)
  }, [selectedPrize, toggle, drawCount])

  const prevPrize = useCallback(() => {
    if (status === 'idle' && currentPrizeIndex > 0) setCurrentPrizeIndex(currentPrizeIndex - 1)
  }, [status, currentPrizeIndex, setCurrentPrizeIndex])
  const nextPrize = useCallback(() => {
    if (status === 'idle' && currentPrizeIndex < prizes.length - 1) setCurrentPrizeIndex(currentPrizeIndex + 1)
  }, [status, currentPrizeIndex, prizes.length, setCurrentPrizeIndex])

  const overlayOpen = showPrizeSelector || showAddPrize || showRigPanel || showHistory || showSceneMenu

  useKeyboardControl({
    onSpace: handleToggle,
    onEnter: handleToggle,
    onPageDown: handleToggle,
    onPageUp: handleToggle,
    onEscape: () => {
      if (status === 'showing') closeWinnerDisplay()
      else if (status === 'idle') navigate('/')
    },
    onLeft: prevPrize,
    onRight: nextPrize,
    onF11: toggleFullscreen,
    enabled: !overlayOpen,
  })

  // ===== 大屏同步 =====
  const sceneEmployees = status === 'idle' ? availablePool : activeEmployees
  const stagePrizeSource = prizes.find(p => p.id === (status === 'idle' ? selectedPrize?.id : currentPrize?.id ?? selectedPrize?.id))
  const stagePrize: StagePrize | null = useMemo(() => stagePrizeSource ? {
    id: stagePrizeSource.id,
    name: stagePrizeSource.name,
    count: stagePrizeSource.count,
    // 揭晓前不提前显示「已抽完」等结果信息
    won: status === 'idle' || status === 'showing' ? stagePrizeSource.winners.length : (currentPrize?.winners.length ?? stagePrizeSource.winners.length),
    prizeImage: stagePrizeSource.prizeImage,
  } : null, [stagePrizeSource, status, currentPrize])

  const screenState: ScreenState = useMemo(() => ({
    status,
    prize: stagePrize,
    poolIds: sceneEmployees.map(e => e.id),
    winners: currentWinners,
  }), [status, stagePrize, sceneEmployees, currentWinners])

  const screen = useScreenOperator(screenState, (code) => {
    if (overlayOpen) return
    if (['Space', 'Enter', 'NumpadEnter', 'PageDown', 'PageUp'].includes(code)) handleToggle()
    else if (code === 'Escape' && status === 'showing') closeWinnerDisplay()
    else if (code === 'ArrowLeft') prevPrize()
    else if (code === 'ArrowRight') nextPrize()
  })

  // 没开独立大屏时（单屏 / 镜像投屏），操作控件闲置 3 秒自动隐藏
  const chromeHidden = useIdleChrome(!screen.open && !overlayOpen)

  const handleAddTempPrize = useCallback(() => {
    if (!tempPrize.name || tempPrize.count < 1) return
    addPrize({ name: tempPrize.name, count: tempPrize.count, isTemporary: true, includeWinners: tempPrize.includeWinners })
    setTempPrize({ name: '', count: 1, includeWinners: false })
    setShowAddPrize(false)
    setCurrentPrizeIndex(prizes.length)
  }, [tempPrize, addPrize, prizes.length, setCurrentPrizeIndex])

  const idle = status === 'idle'
  const isChineseRed = theme.type === 'chinese-red'

  return (
    <div className={chromeHidden ? 'chrome-hidden' : ''}>
      <LotteryStage
        status={status}
        prize={stagePrize}
        sceneEmployees={sceneEmployees}
        totalPool={sceneEmployees.length}
        winners={currentWinners}
        onCloseWinner={closeWinnerDisplay}
      >
        {/* 顶部操作栏 */}
        <header className="chrome-auto absolute top-0 inset-x-0 z-20 flex items-start justify-between px-5 pt-5 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            <button type="button" disabled={!idle} onClick={() => navigate('/')} className="ui-btn ui-btn-icon stage-glass" title="返回设置（Esc）" aria-label="返回设置">
              <Icon name="arrow-left" />
            </button>
            {screen.open && (
              <span className="stage-glass rounded-xl h-10 px-3 text-xs flex items-center gap-2">
                <Icon name="cast" size={15} /> 观众大屏已同步
              </span>
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <div className="relative">
              <button type="button" onClick={() => setShowSceneMenu(!showSceneMenu)} disabled={!idle} className="ui-btn stage-glass" title="动效与尺寸">
                <Icon name="sliders" size={17} /> 动效
              </button>
              {showSceneMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowSceneMenu(false)} />
                  <div className="ui-menu absolute right-0 mt-2 w-72 p-4 z-30">
                    <div className="text-xs font-semibold ui-muted mb-2">3D 动效</div>
                    <div className="grid grid-cols-2 gap-1.5 mb-4">
                      {SCENE_EFFECTS.map(([key, label]) => (
                        <button key={key} type="button" onClick={() => setSceneEffect(key)} className={`ui-btn ui-btn-sm justify-start ${sceneEffect === key ? 'ui-btn-active' : ''}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="text-xs font-semibold ui-muted mb-2 flex justify-between">
                      <span>画面缩放</span>
                      <span className="tabular">{Math.round(sphereScale * 100)}%</span>
                    </div>
                    <input
                      type="range" min="0.7" max="2.0" step="0.05" value={sphereScale}
                      onChange={e => setSphereScale(Number(e.target.value))}
                      className="ui-range mb-3"
                      style={{ ['--fill' as string]: `${((sphereScale - 0.7) / 1.3) * 100}%` }}
                      aria-label="画面缩放"
                    />
                    <div className="flex gap-1">
                      {([['紧凑', 0.85], ['标准', 1.15], ['大屏', 1.4], ['巨幕', 1.75]] as const).map(([label, val]) => (
                        <button key={label} type="button" onClick={() => setSphereScale(val)} className={`ui-btn ui-btn-sm flex-1 ${Math.abs(sphereScale - val) < 0.06 ? 'ui-btn-active' : ''}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button type="button" disabled={!idle} onClick={() => setShowAddPrize(true)} className="ui-btn stage-glass">
              <Icon name="plus" size={17} /> 临时加奖
            </button>

            <PresentationControls link={screen} buttonClassName="stage-glass" />

            <button
              type="button"
              onClick={() => setBgmEnabled(!bgmEnabled)}
              className="ui-btn ui-btn-icon stage-glass"
              title={bgmEnabled ? '静音' : '打开音乐'}
              aria-label={bgmEnabled ? '静音' : '打开音乐'}
            >
              <Icon name={bgmEnabled ? 'volume' : 'volume-x'} />
            </button>
            <button type="button" onClick={toggleFullscreen} className="ui-btn ui-btn-icon stage-glass" title="全屏（F11）" aria-label="全屏">
              <Icon name="maximize" />
            </button>
          </div>
        </header>

        {/* 底部控制区 */}
        <footer className="absolute bottom-0 inset-x-0 z-20 px-5 pb-6 flex items-end justify-between gap-6 pointer-events-none">
          {/* 奖项选择 */}
          <div className="chrome-auto flex-1 flex justify-start pointer-events-auto relative">
            <button type="button" disabled={!idle} onClick={() => setShowPrizeSelector(!showPrizeSelector)} className="stage-glass rounded-2xl pl-2 pr-4 h-14 flex items-center gap-3 disabled:opacity-60">
              {selectedPrize?.prizeImage
                ? <img src={selectedPrize.prizeImage} alt="" className="w-10 h-10 rounded-xl object-cover" />
                : <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}><Icon name="gift" size={20} /></span>}
              <span className="text-left leading-tight">
                <span className="block font-semibold">{selectedPrize?.name || '请选择奖项'}</span>
                <span className="block text-xs opacity-60 tabular">
                  {selectedPrize ? `${selectedPrize.winners.length} / ${selectedPrize.count}${isCompleted ? ' · 已完成' : ''}` : '—'}
                </span>
              </span>
              <Icon name="chevron-down" size={16} className="opacity-60 ml-1" />
            </button>

            <AnimatePresence>
              {showPrizeSelector && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowPrizeSelector(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="ui-menu absolute bottom-16 left-0 w-80 p-1.5 z-30"
                  >
                    <div className="max-h-[60vh] overflow-y-auto">
                      {prizes.map((prize, index) => {
                        const completed = prize.winners.length >= prize.count
                        const active = index === currentPrizeIndex
                        return (
                          <button
                            key={prize.id}
                            type="button"
                            onClick={() => { setCurrentPrizeIndex(index); setShowPrizeSelector(false) }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${active ? '' : 'hover:bg-[var(--surface-2)]'} ${completed ? 'opacity-50' : ''}`}
                            style={active ? { background: 'var(--accent-soft)' } : undefined}
                          >
                            {prize.prizeImage
                              ? <img src={prize.prizeImage} alt="" className="w-9 h-9 rounded-lg object-cover" />
                              : <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-2)' }}><Icon name="gift" size={17} className="ui-muted" /></span>}
                            <span className="flex-1 min-w-0">
                              <span className="block truncate font-medium">{prize.name}{prize.isTemporary && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded ui-accent-text" style={{ background: "var(--accent-soft)" }}>加奖</span>}</span>
                              <span className="block text-xs ui-muted tabular">{prize.winners.length} / {prize.count}</span>
                            </span>
                            {completed && <Icon name="check" size={16} className="ui-accent-text" />}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* 中间：人数 + 开始按钮 */}
          <div className="flex flex-col items-center gap-3 pointer-events-auto">
            {!isCompleted && remainingCount > 1 && idle && (
              <div className="chrome-auto stage-glass rounded-full h-11 pl-4 pr-1.5 flex items-center gap-2">
                <span className="text-sm opacity-75">本次抽取</span>
                <button type="button" aria-label="减少一人" onClick={() => setDrawCount(Math.max(1, drawCount - 1))} disabled={drawCount <= 1} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-30">
                  <Icon name="minus" size={16} />
                </button>
                <input
                  type="number" aria-label="本次抽取人数" min="1" max={maxDrawCount}
                  className="w-12 text-center text-xl font-bold bg-transparent outline-none tabular [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  value={drawCount}
                  onChange={e => setDrawCount(Math.max(1, Math.min(maxDrawCount, Math.floor(Number(e.target.value)) || 1)))}
                />
                <button type="button" aria-label="增加一人" onClick={() => setDrawCount(Math.min(maxDrawCount, drawCount + 1))} disabled={drawCount >= maxDrawCount} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-30">
                  <Icon name="plus" size={16} />
                </button>
                <span className="text-sm opacity-75 pr-2">人</span>
              </div>
            )}

            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleToggle}
              disabled={!selectedPrize || isCompleted || status === 'stopping'}
              className="relative w-28 h-28 rounded-full font-bold text-xl tracking-[0.2em] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: status === 'rolling'
                  ? 'linear-gradient(135deg, #f43f5e, #e11d48)'
                  : isChineseRed
                    ? 'linear-gradient(135deg, #ffe08a, #f0a43a)'
                    : 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                color: status === 'rolling' ? '#fff' : isChineseRed ? '#4a0b10' : 'var(--accent-ink)',
                boxShadow: status === 'rolling'
                  ? '0 0 0 8px rgba(244,63,94,.18), 0 20px 50px -12px rgba(244,63,94,.8)'
                  : '0 0 0 8px var(--accent-soft), 0 20px 50px -14px var(--accent)',
              }}
            >
              {status === 'rolling' && <span className="absolute inset-0 rounded-full animate-ping bg-rose-500/30" />}
              <span className="relative pl-[0.2em]">
                {isCompleted ? '已抽完' : status === 'rolling' ? '停止' : status === 'stopping' ? '揭晓中' : '开始'}
              </span>
            </motion.button>

            <p className="chrome-auto text-xs opacity-60 flex items-center gap-1.5" style={{ color: theme.type === 'minimal-light' ? '#5f6578' : '#fff' }}>
              <span className="ui-kbd">空格</span> 开始 / 停止
              <span className="ui-kbd ml-2">←</span><span className="ui-kbd">→</span> 切换奖项
            </p>
          </div>

          {/* 右侧：可抽人数（隐蔽入口：快速点击 5 次） */}
          <div className="chrome-auto flex-1 flex justify-end pointer-events-auto">
            <div onClick={handleSecretClick} className="stage-glass rounded-2xl px-5 h-14 flex flex-col justify-center text-right cursor-default select-none">
              <div className="text-xl font-bold leading-none tabular">{availablePool.length}</div>
              <div className="text-xs opacity-60 mt-1">可抽奖人数</div>
            </div>
          </div>
        </footer>
      </LotteryStage>

      <div className={showHistory ? '' : 'chrome-auto'}>
        <HistoryPanel isOpen={showHistory} onToggle={() => setShowHistory(!showHistory)} />
      </div>

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
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="ui-menu w-full max-w-md p-6 mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-1">临时加奖</h3>
              <p className="text-sm ui-muted mb-5">新奖项会追加到奖项列表末尾，并立即切换过去。</p>

              <div className="space-y-4">
                <label className="block">
                  <span className="block text-sm ui-muted mb-1.5">奖项名称</span>
                  <input type="text" autoFocus value={tempPrize.name} onChange={(e) => setTempPrize({ ...tempPrize, name: e.target.value })} placeholder="如：老板大气奖" className="ui-input" />
                </label>
                <label className="block">
                  <span className="block text-sm ui-muted mb-1.5">中奖人数</span>
                  <input type="number" min="1" value={tempPrize.count} onChange={(e) => setTempPrize({ ...tempPrize, count: parseInt(e.target.value) || 1 })} className="ui-input" />
                </label>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm">包含已中奖人员（返场抽奖）</span>
                  <button type="button" role="switch" aria-checked={tempPrize.includeWinners} className="ui-switch" onClick={() => setTempPrize({ ...tempPrize, includeWinners: !tempPrize.includeWinners })} />
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowAddPrize(false)} className="ui-btn flex-1">取消</button>
                <button type="button" onClick={handleAddTempPrize} disabled={!tempPrize.name} className="ui-btn ui-btn-primary flex-1">确定</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 高级设置面板 */}
      {showRigPanel && status === 'idle' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowRigPanel(false)}>
          <div className="w-full max-w-2xl max-h-[80vh] bg-slate-900 text-white rounded-2xl shadow-2xl mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">⚙</span>
                <h3 className="text-white font-semibold">高级设置</h3>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-gray-500">启用定向分配</span>
                  <button
                    onClick={() => setRigActivated(!rigActivated)}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${rigActivated ? 'bg-green-500' : 'bg-white/20'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${rigActivated ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </label>
                <button onClick={() => setShowRigPanel(false)} className="text-gray-500 hover:text-white transition-colors text-lg">✕</button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-64px)] space-y-4">
              <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-white font-medium text-sm">抽奖采样模式</div>
                  <div className="text-xs text-gray-500 mt-0.5">开启权重抽取后，按名单管理中的系数分配中奖概率</div>
                </div>
                <select
                  className="bg-slate-800 text-white text-sm rounded-lg px-3 py-1.5 border border-white/10 outline-none"
                  value={drawMode}
                  onChange={(e) => setDrawMode(e.target.value as 'fair' | 'weighted')}
                >
                  <option value="fair">标准均匀</option>
                  <option value="weighted">系数加权</option>
                </select>
              </div>

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
                            <span className="text-xs text-gray-500">({prize.winners.length}/{prize.count})</span>
                          </div>
                          {riggedIds.length > 0 && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">已指定 {riggedIds.length} 人</span>
                          )}
                        </div>
                        {riggedEmps.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {riggedEmps.map((emp) => (
                              <span key={emp.id} className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded-lg">
                                {emp.name} ({emp.id})
                                <button onClick={() => removeRig(prize.id, emp.id)} className="hover:text-red-400 ml-1">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                        {riggedIds.length < (prize.count - prize.winners.length) && (
                          <RigEmployeeSearch
                            prizeId={prize.id}
                            employees={eligibleEmployees(employees, prize).filter((e) => !riggedIds.includes(e.id))}
                            onAdd={(empId) => addRig(prize.id, empId)}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 内定人员搜索选择子组件
function RigEmployeeSearch({
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
    ? employees.filter((e) => e.name.includes(search) || e.id.includes(search) || e.department.includes(search)).slice(0, 8)
    : []

  return (
    <div className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setShowDropdown(true) }}
        onFocus={() => setShowDropdown(true)}
        placeholder="搜索姓名、工号或部门..."
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 outline-none focus:border-indigo-500"
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 rounded-lg shadow-xl border border-white/10 max-h-48 overflow-y-auto z-10">
          {filtered.map((emp) => (
            <button
              key={emp.id}
              onClick={() => { onAdd(emp.id); setSearch(''); setShowDropdown(false) }}
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
