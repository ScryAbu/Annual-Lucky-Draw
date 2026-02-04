# 年会大屏抽奖软件

一款适用于年会现场的大屏抽奖软件，支持 Excel 名单导入、3D 抽奖动效、多主题切换。

[English](./README.en.md) | 简体中文

<p align="center">
  <img src="https://img.shields.io/badge/Electron-28-47848F?logo=electron" alt="Electron" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-0.160-black?logo=three.js" alt="Three.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

## 功能特性

### 数据管理
- **Excel 名单导入** - 支持 .xlsx / .xls 文件，自动识别字段映射
- **增量/覆盖导入** - 可选择合并新数据或完全覆盖
- **照片智能匹配** - 按「照片文件名 → 工号 → 姓名」顺序自动匹配
- **头像裁切上传** - 内置图片裁切器，支持缩放、拖拽调整，裁切后自动压缩保存
- **名单导出** - 导出当前员工数据为 Excel（含中奖状态）
- **中奖名单导出** - 一键导出所有中奖记录到 Excel
- **一键清空** - 快速清除员工数据或重置抽奖记录

### 抽奖功能
- **3D 抽奖动效** - 基于 Three.js 的炫酷球体旋转效果
- **批量抽取** - 支持单次抽取 1~10 人
- **临时加奖** - 抽奖过程中可随时添加新奖项
- **返场抽奖** - 支持已中奖人员再次参与抽奖
- **断电保护** - 数据实时保存到 IndexedDB，异常关闭后可恢复

### 外观定制
- **三套主题风格** - 深色科技、白色极简、红色过年
- **过年背景切换** - 红色主题下提供 3 套精美新年背景可选
- **自定义背景** - 支持上传任意背景图（建议 1920×1080）
- **公司 Logo** - 上传 Logo 显示在抽奖页面顶部
- **活动标题自定义** - 设置年会活动名称（最多 30 字）

## 效果预览

| 深色科技主题 | 中国红主题 | 白色极简主题 |
|:---:|:---:|:---:|
| 🌑 现代科技风格 | 🏮 喜庆年会氛围 | ☀️ 简洁明亮风格 |

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/yourusername/Annual-Lucky-Draw.git

# 进入项目目录
cd Annual-Lucky-Draw

# 安装依赖
npm install
```

### 开发模式

```bash
npm run dev
```

### 打包构建

```bash
npm run build
```

构建完成后，安装包将生成在 `release` 目录下。

## 使用说明

### 1. 数据导入

1. 准备 Excel 文件，包含以下字段：
   - 工号（必填）
   - 姓名（必填）
   - 部门
   - 照片文件名

2. 准备照片文件夹，照片命名与 Excel 中的「照片文件名」或「工号」对应

3. 在配置页导入 Excel 和照片文件夹

4. 选择导入方式：
   - **增量导入**：合并新数据，保留现有数据
   - **覆盖导入**：清空后重新导入

5. 也可手动添加/编辑员工，上传照片时支持**裁切调整**

### 2. 奖项设置

1. 添加奖项，设置名称和中奖人数
2. 可选择上传奖品展示图片
3. 可设置是否包含已中奖人员（返场抽奖）

### 3. 外观设置

1. 选择主题风格（深色科技/白色极简/红色过年）
2. **红色过年主题**下可切换 3 套精美新年背景
3. 可上传自定义背景图（建议尺寸 1920×1080）
4. 可上传公司 Logo
5. 设置活动标题（如「XX公司2026年会抽奖」）

### 4. 开始抽奖

1. 点击「进入抽奖」按钮
2. 选择要抽取的奖项
3. 按空格键或点击开始按钮开始抽奖
4. 再次按空格键停止，显示中奖者

## 快捷键

| 按键 | 功能 |
|------|------|
| 空格 | 开始/停止抽奖 |
| ← / → | 切换奖项 |
| ESC | 关闭弹窗/返回 |
| F11 | 切换全屏 |

## 技术栈

| 分类 | 技术 |
|------|------|
| 前端框架 | React 18, TypeScript, Tailwind CSS |
| 3D 引擎 | Three.js, @react-three/fiber, @react-three/drei |
| 桌面端 | Electron 28, Vite 5 |
| 状态管理 | Zustand |
| 本地存储 | Dexie.js (IndexedDB) |
| 动画效果 | Framer Motion |
| 数据处理 | xlsx (SheetJS) |

## 项目结构

```
Annual-Lucky-Draw/
├── electron/           # Electron 主进程
│   ├── main.ts         # 主进程入口
│   └── preload.ts      # 预加载脚本
├── src/
│   ├── 3d/             # Three.js 3D 组件
│   ├── assets/         # 静态资源
│   ├── components/     # React 组件
│   │   ├── DataImport/     # Excel 和照片导入
│   │   ├── HistoryPanel/   # 抽奖历史记录
│   │   ├── ImageCropper/   # 图片裁剪工具
│   │   ├── LotteryScene/   # 3D 抽奖场景
│   │   ├── PrizeManager/   # 奖项配置
│   │   ├── ThemeSwitcher/  # 主题设置
│   │   └── WinnerDisplay/  # 中奖展示
│   ├── db/             # IndexedDB 数据库
│   ├── hooks/          # 自定义 React Hooks
│   ├── pages/          # 页面组件
│   ├── stores/         # Zustand 状态管理
│   ├── types/          # TypeScript 类型定义
│   └── utils/          # 工具函数
├── public/             # 公共静态文件
└── release/            # 打包输出
```

## 参与贡献

欢迎贡献代码！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m '添加某个特性'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 开源协议

本项目基于 MIT 协议开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 致谢

- [Three.js](https://threejs.org/) - 3D 图形库
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - React 的 Three.js 渲染器
- [Electron](https://www.electronjs.org/) - 桌面应用框架
- [Framer Motion](https://www.framer.com/motion/) - 动画库

---

<p align="center">用 ❤️ 为公司年会打造</p>
