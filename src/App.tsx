import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import ConfigPage from './pages/ConfigPage'
const LotteryPage = lazy(() => import('./pages/LotteryPage'))
const PrizeWheelPage = lazy(() => import('./pages/PrizeWheelPage'))
const UltimatePrizePage = lazy(() => import('./pages/UltimatePrizePage'))
const ScreenPage = lazy(() => import('./pages/ScreenPage'))
import { useThemeStore } from './stores/themeStore'
import { useEmployeeStore } from './stores/employeeStore'
import { usePrizeStore } from './stores/prizeStore'

function PageLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center ui-page">
      <div className="flex items-center gap-3 ui-muted text-sm">
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        正在加载…
      </div>
    </div>
  )
}

function App() {
  const themeType = useThemeStore(s => s.theme.type)
  const { loadFromDB: loadEmployees } = useEmployeeStore()
  const { loadFromDB: loadPrizes } = usePrizeStore()

  // 应用启动时加载持久化数据
  useEffect(() => {
    loadEmployees()
    loadPrizes()
  }, [loadEmployees, loadPrizes])

  // 主题令牌挂在 <html> 上，弹窗、滚动条等也能拿到同一套颜色
  useEffect(() => {
    document.documentElement.dataset.theme = themeType
  }, [themeType])

  return (
    <div className="w-full h-full">
      <HashRouter>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<ConfigPage />} />
            <Route path="/lottery" element={<LotteryPage />} />
            <Route path="/prize-wheel" element={<PrizeWheelPage />} />
            <Route path="/ultimate" element={<UltimatePrizePage />} />
            <Route path="/screen" element={<ScreenPage />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </div>
  )
}

export default App
