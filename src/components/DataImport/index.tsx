import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmployeeStore } from '../../stores/employeeStore'
import { useThemeStore } from '../../stores/themeStore'
import { parseExcelFile, getExcelHeaders, autoDetectFieldMapping, convertToEmployees } from '../../utils/excelParser'
import { FieldMapping, DEFAULT_FIELD_MAPPING, Employee } from '../../types'
// uuid available if needed
import * as XLSX from 'xlsx'
import ImageCropper from '../ImageCropper'

interface ImportStats {
  total: number
  withPhoto: number
  withoutPhoto: number
  updated?: number
  added?: number
  isMerge?: boolean
}

export default function DataImport() {
  const { employees, setEmployees, addEmployee, updateEmployee, clearAll } = useEmployeeStore()
  const { theme } = useThemeStore()
  
  const [excelFile, setExcelFile] = useState<string | null>(null)
  const [photosFolder, setPhotosFolder] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>(DEFAULT_FIELD_MAPPING)
  const [excelData, setExcelData] = useState<any[]>([])
  const [photos, setPhotos] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [importStats, setImportStats] = useState<ImportStats | null>(null)
  
  // 员工管理相关状态
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [employeeForm, setEmployeeForm] = useState({ id: '', name: '', department: '', photoFile: '', photoData: '' })
  
  // 图片裁剪相关状态
  const [showCropper, setShowCropper] = useState(false)
  const [cropperImage, setCropperImage] = useState('')

  const isDark = theme.type !== 'minimal-light'
  const isChineseRed = theme.type === 'chinese-red'

  // 获取主题按钮样式
  const getPrimaryButtonClass = () => {
    if (isChineseRed) return 'bg-yellow-500 hover:bg-yellow-400 text-red-900'
    if (isDark) return 'bg-indigo-600 hover:bg-indigo-500 text-white'
    return 'bg-blue-600 hover:bg-blue-500 text-white'
  }

  // 下载 Excel 模板
  const handleDownloadTemplate = useCallback(() => {
    const templateData = [
      { '工号': 'EMP001', '姓名': '张三', '部门': '技术部', '照片文件名': 'zhangsan.jpg' },
      { '工号': 'EMP002', '姓名': '李四', '部门': '市场部', '照片文件名': 'lisi.jpg' },
      { '工号': 'EMP003', '姓名': '王五', '部门': '人事部', '照片文件名': 'wangwu.jpg' },
    ]
    
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    worksheet['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 20 }]
    
    // 添加说明行
    XLSX.utils.sheet_add_aoa(worksheet, [
      [''],
      ['【使用说明】'],
      ['1. 工号和姓名为必填项'],
      ['2. 照片文件名需与照片文件夹中的文件名一致（支持 jpg/png 格式）'],
      ['3. 如不填照片文件名，系统会尝试用工号或姓名匹配照片'],
      ['4. 导入时请先选择照片所在的文件夹'],
    ], { origin: 'A5' })
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '员工名单')
    
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = '员工名单模板.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  // 导出当前数据库
  const handleExportData = useCallback(() => {
    if (employees.length === 0) {
      alert('暂无数据可导出')
      return
    }

    const exportData = employees.map(emp => ({
      '工号': emp.id,
      '姓名': emp.name,
      '部门': emp.department,
      '照片文件名': emp.photoFile || '',
      '是否中奖': emp.isWinner ? '是' : '否',
      '中奖奖项ID': emp.prizeId || '',
    }))
    
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    worksheet['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 20 }]
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '员工名单')
    
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `员工名单_${new Date().toISOString().slice(0,10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }, [employees])

  // 选择 Excel 文件
  const handleSelectExcel = useCallback(async () => {
    try {
      const result = await window.electronAPI.selectExcel()
      if (result) {
        setExcelFile(result.name)
        const data = parseExcelFile(result.buffer)
        const hdrs = getExcelHeaders(result.buffer)
        setHeaders(hdrs)
        setExcelData(data)
        
        const autoMapping = autoDetectFieldMapping(hdrs)
        setFieldMapping(autoMapping)
      }
    } catch (error) {
      console.error('Failed to select Excel:', error)
    }
  }, [])

  // 选择照片文件夹
  const handleSelectPhotos = useCallback(async () => {
    try {
      setIsLoading(true)
      const folder = await window.electronAPI.selectPhotosFolder()
      if (folder) {
        setPhotosFolder(folder)
        const photoList = await window.electronAPI.readPhotos(folder)
        
        const photoMap = new Map<string, string>()
        photoList.forEach((p) => {
          photoMap.set(p.name.toLowerCase(), p.data)
          const nameWithoutExt = p.name.substring(0, p.name.lastIndexOf('.')).toLowerCase()
          photoMap.set(nameWithoutExt, p.data)
        })
        setPhotos(photoMap)
      }
    } catch (error) {
      console.error('Failed to select photos folder:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 处理导入数据（通用函数）
  const processImportData = useCallback(() => {
    const employeeList = convertToEmployees(excelData, fieldMapping)
    
    let withPhoto = 0
    let withoutPhoto = 0
    
    const employeesWithPhotos = employeeList.map((emp) => {
      const photoKey = emp.photoFile?.toLowerCase() || ''
      const idKey = emp.id?.toLowerCase() || ''
      const nameKey = emp.name?.toLowerCase() || ''
      
      let photoData = photos.get(photoKey) || 
                     photos.get(photoKey.replace(/\.[^/.]+$/, '')) ||
                     photos.get(idKey) ||
                     photos.get(nameKey)
      
      if (photoData) withPhoto++
      else withoutPhoto++
      
      return { ...emp, photoData }
    })

    return { employeesWithPhotos, withPhoto, withoutPhoto }
  }, [excelData, fieldMapping, photos])

  // 覆盖导入
  const handleImportReplace = useCallback(() => {
    if (excelData.length === 0) return

    if (employees.length > 0) {
      if (!confirm(`⚠️ 警告：当前已有 ${employees.length} 条员工数据！\n\n覆盖导入将删除所有现有数据，确定要继续吗？`)) {
        return
      }
    }

    const { employeesWithPhotos, withPhoto, withoutPhoto } = processImportData()
    setEmployees(employeesWithPhotos)
    setImportStats({ total: employeesWithPhotos.length, withPhoto, withoutPhoto })
    setExcelFile(null)
    setExcelData([])
    setHeaders([])
  }, [excelData, employees.length, processImportData, setEmployees])

  // 增量导入（合并）
  const handleImportMerge = useCallback(() => {
    if (excelData.length === 0) return

    const { employeesWithPhotos, withPhoto, withoutPhoto } = processImportData()
    
    // 合并逻辑：相同工号的更新，不同的新增
    const existingMap = new Map(employees.map(e => [e.id, e]))
    let updated = 0
    let added = 0

    employeesWithPhotos.forEach((newEmp) => {
      const existing = existingMap.get(newEmp.id)
      if (existing) {
        // 更新现有员工（保留中奖状态和照片）
        existingMap.set(newEmp.id, {
          ...existing,
          name: newEmp.name,
          department: newEmp.department,
          photoFile: newEmp.photoFile,
          photoData: newEmp.photoData || existing.photoData, // 保留旧照片如果新的没有
        })
        updated++
      } else {
        // 新增
        existingMap.set(newEmp.id, newEmp)
        added++
      }
    })

    const mergedList = Array.from(existingMap.values())
    setEmployees(mergedList)
    setImportStats({ 
      total: employeesWithPhotos.length, 
      withPhoto, 
      withoutPhoto,
      // @ts-ignore - 扩展属性
      updated,
      added,
      isMerge: true,
    })
    setExcelFile(null)
    setExcelData([])
    setHeaders([])
  }, [excelData, employees, processImportData, setEmployees])

  // 打开添加员工表单
  const handleAddEmployee = useCallback(() => {
    setEditingEmployee(null)
    setEmployeeForm({ id: '', name: '', department: '', photoFile: '', photoData: '' })
    setShowEmployeeForm(true)
  }, [])

  // 打开编辑员工表单
  const handleEditEmployee = useCallback((emp: Employee) => {
    setEditingEmployee(emp)
    setEmployeeForm({
      id: emp.id,
      name: emp.name,
      department: emp.department,
      photoFile: emp.photoFile,
      photoData: emp.photoData || '',
    })
    setShowEmployeeForm(true)
  }, [])

  // 删除员工
  const handleDeleteEmployee = useCallback((id: string) => {
    if (confirm('确定要删除这个员工吗？')) {
      const newList = employees.filter(e => e.id !== id)
      setEmployees(newList)
    }
  }, [employees, setEmployees])

  // 提交员工表单
  const handleSubmitEmployee = useCallback(async () => {
    if (!employeeForm.id || !employeeForm.name) {
      alert('工号和姓名为必填项')
      return
    }

    // 检查工号是否重复
    if (!editingEmployee && employees.some(e => e.id === employeeForm.id)) {
      alert('工号已存在')
      return
    }

    const newEmployee: Employee = {
      id: employeeForm.id,
      name: employeeForm.name,
      department: employeeForm.department,
      photoFile: employeeForm.photoFile,
      isWinner: editingEmployee?.isWinner || false,
      prizeId: editingEmployee?.prizeId,
      photoData: employeeForm.photoData || editingEmployee?.photoData,
    }

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, newEmployee)
    } else {
      addEmployee(newEmployee)
    }

    setShowEmployeeForm(false)
  }, [employeeForm, editingEmployee, employees, addEmployee, updateEmployee])

  // 为员工选择照片（打开裁剪器）
  const handleSelectEmployeePhoto = useCallback(async () => {
    const result = await window.electronAPI.selectImage()
    if (result) {
      setCropperImage(result.data)
      setShowCropper(true)
    }
  }, [])

  // 裁剪完成后的处理
  const handleCropConfirm = useCallback((croppedImage: string) => {
    setEmployeeForm((prev) => ({ ...prev, photoData: croppedImage }))
    setShowCropper(false)
    setCropperImage('')
  }, [])

  // 清除数据
  const handleClear = useCallback(() => {
    if (confirm('确定要清除所有员工数据吗？')) {
      clearAll()
      setExcelFile(null)
      setPhotosFolder(null)
      setHeaders([])
      setExcelData([])
      setPhotos(new Map())
      setImportStats(null)
    }
  }, [clearAll])

  return (
    <div className="space-y-6">
      {/* Excel 导入区 */}
      <div className={`rounded-xl p-6 relative z-10 ${
        isChineseRed 
          ? 'bg-gradient-to-br from-red-900/80 to-red-800/80 border-2 border-yellow-500/30' 
          : isDark ? 'bg-white/5' : 'bg-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            第一步：选择 Excel 名单
          </h3>
          <button
            onClick={handleDownloadTemplate}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${isChineseRed 
                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                : isDark 
                  ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }
            `}
          >
            📥 下载模板
          </button>
        </div>
        
        <div 
          onClick={handleSelectExcel}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-300 hover:scale-[1.02]
            ${isChineseRed 
              ? 'border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10'
              : isDark 
                ? 'border-white/20 hover:border-indigo-500 hover:bg-indigo-500/10' 
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            }
          `}
        >
          {excelFile ? (
            <div className="space-y-2">
              <div className="text-4xl">📊</div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{excelFile}</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                共 {excelData.length} 条数据，点击重新选择
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl">📁</div>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                点击选择 Excel 文件（.xlsx / .xls）
              </p>
            </div>
          )}
        </div>

        {/* 字段映射 */}
        <AnimatePresence>
          {headers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 grid grid-cols-2 gap-4"
            >
              {Object.entries(DEFAULT_FIELD_MAPPING).map(([key, label]) => (
                <div key={key}>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</label>
                  <select
                    value={fieldMapping[key as keyof FieldMapping]}
                    onChange={(e) => setFieldMapping({ ...fieldMapping, [key]: e.target.value })}
                    className={`
                      w-full px-3 py-2 rounded-lg outline-none transition-colors
                      ${isChineseRed
                        ? 'bg-red-900/50 text-white border border-yellow-500/30 focus:border-yellow-500'
                        : isDark 
                          ? 'bg-white/10 text-white border border-white/10 focus:border-indigo-500' 
                          : 'bg-white text-gray-800 border border-gray-200 focus:border-blue-500'
                      }
                    `}
                  >
                    <option value="">-- 请选择 --</option>
                    {headers.map((h) => (<option key={h} value={h}>{h}</option>))}
                  </select>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 照片导入区 */}
      <div className={`rounded-xl p-6 relative z-10 ${
        isChineseRed 
          ? 'bg-gradient-to-br from-red-900/80 to-red-800/80 border-2 border-yellow-500/30' 
          : isDark ? 'bg-white/5' : 'bg-gray-100'
      }`}>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          第二步：选择照片文件夹
        </h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          将员工照片放在一个文件夹中，照片文件名需与 Excel 中的「照片文件名」列一致
        </p>
        
        <div 
          onClick={handleSelectPhotos}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
            transition-all duration-300 hover:scale-[1.02]
            ${isChineseRed 
              ? 'border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10'
              : isDark 
                ? 'border-white/20 hover:border-indigo-500 hover:bg-indigo-500/10' 
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            }
          `}
        >
          {isLoading ? (
            <div className="space-y-2">
              <div className="animate-spin text-4xl">⏳</div>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>正在读取照片...</p>
            </div>
          ) : photosFolder ? (
            <div className="space-y-2">
              <div className="text-4xl">✅</div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                已加载 {Math.floor(photos.size / 2)} 张照片
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                点击重新选择文件夹
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl">📁</div>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>点击选择照片所在文件夹</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                支持 jpg/png/gif/webp 格式 · 可选步骤
              </p>
            </div>
          )}
        </div>

        {/* 匹配说明 */}
        <div className={`mt-3 p-3 rounded-lg text-xs ${isDark ? 'bg-white/5' : 'bg-gray-200/50'}`}>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            💡 <strong>照片匹配规则：</strong>按以下顺序尝试匹配：
          </p>
          <p className={`mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            1. Excel中的「照片文件名」→ 2. 工号 → 3. 姓名
          </p>
        </div>
      </div>

      {/* 导入按钮 */}
      {excelData.length > 0 && (
        <div className={`rounded-xl p-4 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
          <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            第三步：选择导入方式（共 {excelData.length} 条数据）
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleImportMerge}
              className={`
                flex-1 py-3 px-4 rounded-xl font-semibold transition-all
                ${isChineseRed
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : isDark 
                    ? 'bg-green-600 hover:bg-green-500 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }
              `}
            >
              ➕ 增量导入
              <span className="block text-xs font-normal opacity-80">合并新数据，保留现有</span>
            </button>
            <button
              onClick={handleImportReplace}
              className={`
                flex-1 py-3 px-4 rounded-xl font-semibold transition-all
                ${isDark
                  ? 'bg-orange-600 hover:bg-orange-500 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
                }
              `}
            >
              🔄 覆盖导入
              <span className="block text-xs font-normal opacity-80">清空后重新导入</span>
            </button>
          </div>
        </div>
      )}

      {/* 导入统计 */}
      <AnimatePresence>
        {importStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`rounded-xl p-6 ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">✅</div>
                <div>
                  <p className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                    {importStats.isMerge ? '增量导入成功！' : '导入成功！'}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                    {importStats.isMerge ? (
                      <>新增 {importStats.added} 人，更新 {importStats.updated} 人</>
                    ) : (
                      <>共 {importStats.total} 人</>
                    )}
                    {' · '}{importStats.withPhoto} 人有照片，{importStats.withoutPhoto} 人无照片
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportStats(null)}
                className={`text-xl hover:opacity-70 ${isDark ? 'text-green-400' : 'text-green-600'}`}
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 当前数据管理 */}
      <div className={`rounded-xl p-6 relative z-10 ${
        isChineseRed 
          ? 'bg-gradient-to-br from-red-900/80 to-red-800/80 border-2 border-yellow-500/30' 
          : isDark ? 'bg-white/5' : 'bg-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            员工数据管理
          </h3>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={handleAddEmployee}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${getPrimaryButtonClass()}`}
            >
              + 添加
            </button>
            {employees.length > 0 && (
              <>
                <button
                  onClick={handleExportData}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${isChineseRed 
                      ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                      : isDark 
                        ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }
                  `}
                >
                  📤 导出
                </button>
                <button
                  onClick={handleClear}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200'}
                  `}
                >
                  🗑️ 清空
                </button>
              </>
            )}
          </div>
        </div>
        
        {employees.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <div className="text-4xl mb-2">👥</div>
            <p>暂无员工数据</p>
            <p className="text-sm mt-1">可通过 Excel 导入或手动添加</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-auto rounded-lg">
            <table className="w-full text-sm">
              <thead className={`sticky top-0 ${isChineseRed ? 'bg-red-900' : isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                <tr>
                  <th className="px-3 py-2 text-left">照片</th>
                  <th className="px-3 py-2 text-left">工号</th>
                  <th className="px-3 py-2 text-left">姓名</th>
                  <th className="px-3 py-2 text-left">部门</th>
                  <th className="px-3 py-2 text-center">状态</th>
                  <th className="px-3 py-2 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr 
                    key={emp.id} 
                    className={`border-t ${isChineseRed ? 'border-yellow-500/20' : isDark ? 'border-white/10' : 'border-gray-200'}`}
                  >
                    <td className="px-3 py-2">
                      {emp.photoData ? (
                        <img src={emp.photoData} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                          ${isChineseRed ? 'bg-yellow-600' : isDark ? 'bg-indigo-600' : 'bg-blue-500'}`}>
                          {emp.name.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">{emp.id}</td>
                    <td className="px-3 py-2">{emp.name}</td>
                    <td className="px-3 py-2">{emp.department}</td>
                    <td className="px-3 py-2 text-center">
                      {emp.isWinner ? (
                        <span className="text-yellow-500">🏆</span>
                      ) : (
                        <span className="text-green-500">●</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => handleEditEmployee(emp)} className="px-2 hover:opacity-70">✏️</button>
                      <button onClick={() => handleDeleteEmployee(emp.id)} className="px-2 hover:opacity-70">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <p className={`text-sm mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          共 {employees.length} 人 · {employees.filter(e => e.isWinner).length} 人已中奖 · {employees.filter(e => !e.isWinner).length} 人可参与抽奖
        </p>
      </div>

      {/* 员工编辑弹窗 */}
      <AnimatePresence>
        {showEmployeeForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEmployeeForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-2xl mx-4 max-h-[90vh] overflow-auto ${isChineseRed ? 'bg-red-900' : isDark ? 'bg-slate-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {editingEmployee ? '编辑员工' : '添加员工'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>工号 *</label>
                  <input
                    type="text"
                    value={employeeForm.id}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, id: e.target.value })}
                    disabled={!!editingEmployee}
                    className={`
                      w-full px-4 py-3 rounded-xl outline-none transition-colors
                      ${editingEmployee ? 'opacity-50 cursor-not-allowed' : ''}
                      ${isChineseRed
                        ? 'bg-red-800/50 text-white border border-yellow-500/30 focus:border-yellow-500'
                        : isDark
                          ? 'bg-white/10 text-white border border-white/10 focus:border-indigo-500'
                          : 'bg-gray-100 text-gray-800 border border-gray-200 focus:border-blue-500'
                      }
                    `}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>姓名 *</label>
                  <input
                    type="text"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
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
                
                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>部门</label>
                  <input
                    type="text"
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
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

                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>照片（可选）</label>
                  <div 
                    onClick={handleSelectEmployeePhoto}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl cursor-pointer border-2 border-dashed transition-all
                      ${isChineseRed
                        ? 'border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10'
                        : isDark
                          ? 'border-white/20 hover:border-indigo-500 hover:bg-indigo-500/10'
                          : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                      }
                    `}
                  >
                    {employeeForm.photoData ? (
                      <img src={employeeForm.photoData} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/20" />
                    ) : (
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl
                        ${isChineseRed ? 'bg-yellow-500/20' : isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                        📷
                      </div>
                    )}
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {employeeForm.photoData ? '点击更换照片' : '点击上传照片'}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        支持裁剪调整，自动压缩
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEmployeeForm(false)}
                  className={`
                    flex-1 py-3 rounded-xl font-semibold transition-all
                    ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                  `}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitEmployee}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${getPrimaryButtonClass()}`}
                >
                  确定
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 图片裁剪器 */}
      <ImageCropper
        isOpen={showCropper}
        imageData={cropperImage}
        onConfirm={handleCropConfirm}
        onCancel={() => {
          setShowCropper(false)
          setCropperImage('')
        }}
        isDark={isDark}
        isChineseRed={isChineseRed}
      />
    </div>
  )
}
