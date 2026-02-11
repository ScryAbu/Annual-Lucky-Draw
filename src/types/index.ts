// 员工数据类型
export interface Employee {
  id: string           // 工号
  name: string         // 姓名
  department: string   // 部门
  photoFile: string    // 照片文件名
  photoData?: string   // Base64 图片数据（缓存）
  isWinner: boolean    // 是否已中奖
  prizeId?: string     // 中奖奖项ID
  winTime?: number     // 中奖时间戳
}

// 奖项类型
export interface Prize {
  id: string
  name: string           // 奖项名称
  count: number          // 中奖人数
  winners: string[]      // 已中奖员工ID列表
  isTemporary: boolean   // 是否为临时加奖
  includeWinners: boolean // 是否包含已中奖人员
  prizeImage?: string    // 奖品图片 Base64
  prizeImageName?: string // 原文件名
  order: number          // 排序顺序
}

// 主题类型
export type ThemeType = 'tech-dark' | 'minimal-light' | 'chinese-red'

// 显示信息控制选项
export interface DisplayOptions {
  showId: boolean    // 是否显示工号
  showDepartment: boolean  // 是否显示部门
  showName: boolean  // 是否显示姓名
}

// 主题配置
export interface ThemeConfig {
  type: ThemeType
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
    accent: string
  }
  particleColor: string
  customBackground?: string  // 自定义背景图 Base64
}

// 自定义素材
export interface CustomAssets {
  backgroundImage?: string  // 自定义背景
  logoImage?: string        // 公司 Logo
}

// 抽奖状态
export type LotteryStatus = 'idle' | 'rolling' | 'stopping' | 'showing'

// 抽奖引擎状态
export interface LotteryState {
  status: LotteryStatus
  currentPrize: Prize | null
  activePool: string[]       // 当前抽奖池（员工ID列表）
  currentWinners: Employee[] // 本轮中奖者
  rollingNames: string[]     // 滚动显示的名字
}

// Excel 导入的原始数据行
export interface ExcelRow {
  [key: string]: string | number | undefined
}

// 字段映射配置
export interface FieldMapping {
  id: string         // 工号字段名
  name: string       // 姓名字段名
  department: string // 部门字段名
  photoFile: string  // 照片文件名字段名
}

// IPC 通道名称
export const IPC_CHANNELS = {
  SELECT_EXCEL: 'select-excel',
  SELECT_PHOTOS_FOLDER: 'select-photos-folder',
  READ_FILE: 'read-file',
  READ_PHOTOS: 'read-photos',
  EXPORT_EXCEL: 'export-excel',
  SELECT_IMAGE: 'select-image',
} as const

// 默认字段映射
export const DEFAULT_FIELD_MAPPING: FieldMapping = {
  id: '工号',
  name: '姓名',
  department: '部门',
  photoFile: '照片文件名',
}
