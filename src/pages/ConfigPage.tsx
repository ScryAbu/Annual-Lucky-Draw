import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DataImport from '../components/DataImport'
import PrizeManager from '../components/PrizeManager'
import ThemeSwitcher from '../components/ThemeSwitcher'
import BackupSettings from '../components/BackupSettings'
import BgmSettings from '../components/BgmSettings'
import { useEmployeeStore } from '../stores/employeeStore'
import { usePrizeStore } from '../stores/prizeStore'
import { useThemeStore } from '../stores/themeStore'
import { Icon, IconName } from '../components/ui/Icon'

type TabType = 'import' | 'prizes' | 'theme' | 'bgm' | 'backup'

const tabs: Array<{ id: TabType; label: string; icon: IconName }> = [
  { id: 'import', label: '人员名单', icon: 'users' },
  { id: 'prizes', label: '奖项设置', icon: 'gift' },
  { id: 'theme', label: '外观设置', icon: 'palette' },
  { id: 'bgm', label: '音效设置', icon: 'music' },
  { id: 'backup', label: '配置迁移', icon: 'save' },
]

export default function ConfigPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('import')
  const { employees, resetAllWinners, getWinners } = useEmployeeStore()
  const { prizes, resetAllPrizes } = usePrizeStore()
  const { customAssets, eventTitle } = useThemeStore()

  const canStart = employees.length > 0 && prizes.length > 0
  const winnersCount = getWinners().length
  const canStartUltimate = prizes.length > 0 && employees.some((e) => (e.points ?? 0) > 0)

  const handleStartUltimate = () => {
    if (canStartUltimate) navigate('/ultimate')
    else if (prizes.length === 0) alert('请先添加至少一个奖项作为终极大奖')
    else alert('请先在「人员名单」→ 员工数据管理中为员工设置积分（积分 > 0 方可参与终极大奖）')
  }

  const handleResetLottery = useCallback(() => {
    if (confirm('确定要清除所有抽奖记录吗？\n\n这将重置所有中奖者状态，但不会删除员工和奖项数据。')) {
      resetAllWinners()
      resetAllPrizes()
      alert('抽奖记录已清除！')
    }
  }, [resetAllWinners, resetAllPrizes])

  const hint = employees.length === 0 ? '先导入人员名单' : prizes.length === 0 ? '再添加至少一个奖项' : ''

  return (
    <div className="min-h-screen ui-page">
      {/* 顶栏 */}
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg) 78%, transparent)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {customAssets.logoImage ? (
              <img src={customAssets.logoImage} alt="Logo" className="h-8 object-contain" />
            ) : (
              <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', color: 'var(--accent-ink)' }}>
                <Icon name="sparkles" size={18} />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="font-bold leading-tight truncate">{eventTitle || '年会抽奖'}</h1>
              <p className="text-xs ui-muted tabular flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: employees.length ? 'var(--ok)' : 'var(--subtle)' }} />{employees.length} 人</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: prizes.length ? 'var(--ok)' : 'var(--subtle)' }} />{prizes.length} 个奖项</span>
                {winnersCount > 0 && <span>已中奖 {winnersCount} 人</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {winnersCount > 0 && (
              <button type="button" onClick={handleResetLottery} className="ui-btn ui-btn-ghost" title="清除所有抽奖记录">
                <Icon name="reset" size={16} /> 清除记录
              </button>
            )}
            <button type="button" onClick={() => canStart && navigate('/prize-wheel')} disabled={!canStart} className="ui-btn">
              <Icon name="wheel" size={16} /> 轮盘抽奖
            </button>
            <button type="button" onClick={handleStartUltimate} disabled={!prizes.length} className="ui-btn">
              <Icon name="trophy" size={16} /> 终极大奖
            </button>
            <button type="button" onClick={() => canStart && navigate('/lottery')} disabled={!canStart} className="ui-btn ui-btn-primary px-5">
              <Icon name="sparkles" size={16} /> 进入抽奖
            </button>
          </div>
        </div>

        {/* 分段导航 */}
        <nav className="max-w-6xl mx-auto px-6 pb-3">
          <div className="inline-flex p-1 rounded-2xl gap-1" style={{ background: 'var(--surface-2)' }}>
            {tabs.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative h-9 px-4 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${active ? '' : 'ui-muted hover:text-[var(--text)]'}`}
                >
                  {active && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'var(--surface-solid)', boxShadow: '0 1px 2px rgba(0,0,0,.12), 0 0 0 1px var(--border)' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Icon name={tab.icon} size={16} className={active ? 'ui-accent-text' : ''} />
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      {hint && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="rounded-2xl px-4 py-3 text-sm flex items-center gap-3" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}>
            <Icon name="info" size={18} />
            开始抽奖前：{hint}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-6 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
          >
            {activeTab === 'import' && <DataImport />}
            {activeTab === 'prizes' && <PrizeManager />}
            {activeTab === 'theme' && <ThemeSwitcher />}
            {activeTab === 'bgm' && <BgmSettings />}
            {activeTab === 'backup' && <BackupSettings />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
