import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import ConfigPage from './pages/ConfigPage'
import LotteryPage from './pages/LotteryPage'
import { useThemeStore } from './stores/themeStore'
import { useEmployeeStore } from './stores/employeeStore'
import { usePrizeStore } from './stores/prizeStore'

function App() {
  const { theme } = useThemeStore()
  const { loadFromDB: loadEmployees } = useEmployeeStore()
  const { loadFromDB: loadPrizes } = usePrizeStore()

  // 应用启动时加载持久化数据
  useEffect(() => {
    loadEmployees()
    loadPrizes()
  }, [loadEmployees, loadPrizes])

  // 根据主题设置背景色
  const getThemeClass = () => {
    switch (theme.type) {
      case 'tech-dark':
        return 'bg-tech-background text-tech-text'
      case 'minimal-light':
        return 'bg-minimal-background text-minimal-text'
      case 'chinese-red':
        return 'bg-chinese-background text-chinese-text'
      default:
        return 'bg-tech-background text-tech-text'
    }
  }

  return (
    <div className={`w-full h-full theme-transition ${getThemeClass()}`}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<ConfigPage />} />
          <Route path="/lottery" element={<LotteryPage />} />
        </Routes>
      </HashRouter>
    </div>
  )
}

export default App
