import * as XLSX from 'xlsx'
import { Employee, FieldMapping, DEFAULT_FIELD_MAPPING, ExcelRow } from '../types'

// 解析 Excel 文件
export const parseExcelFile = (buffer: ArrayBuffer): ExcelRow[] => {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  
  // 转换为 JSON，使用第一行作为表头
  const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
    defval: '',
  })
  
  return data
}

// 获取 Excel 表头
export const getExcelHeaders = (buffer: ArrayBuffer): string[] => {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  
  // 获取范围
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  const headers: string[] = []
  
  // 读取第一行作为表头
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col })
    const cell = worksheet[cellAddress]
    headers.push(cell ? String(cell.v) : `Column${col + 1}`)
  }
  
  return headers
}

// 自动检测字段映射
export const autoDetectFieldMapping = (headers: string[]): FieldMapping => {
  const mapping: FieldMapping = { ...DEFAULT_FIELD_MAPPING }
  
  const patterns = {
    id: ['工号', '员工号', '编号', 'id', 'ID', '工号ID'],
    name: ['姓名', '名字', '员工姓名', 'name', 'Name'],
    department: ['部门', '所属部门', '部门名称', 'dept', 'department'],
    photoFile: ['照片', '照片文件名', '头像', 'photo', 'avatar', '图片'],
  }
  
  for (const [field, keywords] of Object.entries(patterns)) {
    const found = headers.find((h) =>
      keywords.some((k) => h.toLowerCase().includes(k.toLowerCase()))
    )
    if (found) {
      mapping[field as keyof FieldMapping] = found
    }
  }
  
  return mapping
}

// 将 Excel 数据转换为员工数据
export const convertToEmployees = (
  data: ExcelRow[],
  mapping: FieldMapping
): Employee[] => {
  return data
    .filter((row) => row[mapping.id] && row[mapping.name]) // 过滤无效行
    .map((row) => ({
      id: String(row[mapping.id] || ''),
      name: String(row[mapping.name] || ''),
      department: String(row[mapping.department] || ''),
      photoFile: String(row[mapping.photoFile] || ''),
      isWinner: false,
    }))
}

// 导出中奖结果为 Excel
export const exportWinnersToExcel = (
  winners: Array<{
    prize: string
    id: string
    name: string
    department: string
    winTime: string
  }>
): ArrayBuffer => {
  const worksheet = XLSX.utils.json_to_sheet(winners, {
    header: ['prize', 'id', 'name', 'department', 'winTime'],
  })
  
  // 设置列宽
  worksheet['!cols'] = [
    { wch: 15 }, // 奖项
    { wch: 12 }, // 工号
    { wch: 12 }, // 姓名
    { wch: 20 }, // 部门
    { wch: 20 }, // 中奖时间
  ]
  
  // 修改表头
  worksheet['A1'] = { v: '奖项', t: 's' }
  worksheet['B1'] = { v: '工号', t: 's' }
  worksheet['C1'] = { v: '姓名', t: 's' }
  worksheet['D1'] = { v: '部门', t: 's' }
  worksheet['E1'] = { v: '中奖时间', t: 's' }
  
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '中奖名单')
  
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
}
