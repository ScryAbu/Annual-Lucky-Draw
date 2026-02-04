# Annual Lucky Draw

A modern large-screen lottery application for annual company events, featuring stunning 3D visual effects, Excel import, and multiple theme options.

<p align="center">
  <img src="https://img.shields.io/badge/Electron-28-47848F?logo=electron" alt="Electron" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-0.160-black?logo=three.js" alt="Three.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

## Features

### Data Management
- **Excel Import** - Support .xlsx/.xls files with automatic field mapping
- **Incremental/Overwrite Import** - Choose to merge new data or replace entirely
- **Smart Photo Matching** - Auto-match by "Photo filename → Employee ID → Name"
- **Photo Cropping** - Built-in image cropper with zoom, drag adjustment, and auto-compression
- **Employee Export** - Export current employee data to Excel (including winner status)
- **Winner Export** - One-click export all winner records to Excel
- **One-click Clear** - Quickly clear employee data or reset lottery records

### Lottery Features
- **3D Lottery Effects** - Stunning 3D sphere rotation powered by Three.js
- **Batch Drawing** - Draw 1~10 winners at once
- **On-the-fly Prizes** - Add new prizes during the lottery session
- **Re-draw Support** - Allow previous winners to participate again
- **Crash Protection** - Real-time data persistence to IndexedDB with auto-recovery

### Appearance Customization
- **Three Theme Styles** - Dark Tech, Minimal Light, Chinese New Year Red
- **Preset Backgrounds** - 3 beautiful Chinese New Year backgrounds in red theme
- **Custom Background** - Upload any background image (recommended 1920×1080)
- **Company Logo** - Upload logo to display on lottery page header
- **Custom Event Title** - Set your event name (up to 30 characters)

## Screenshots

| Dark Tech Theme | Chinese Red Theme | Light Theme |
|:---:|:---:|:---:|
| 🌑 Modern tech style | 🏮 Festive celebration | ☀️ Clean minimal |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/Annual-Lucky-Draw.git

# Navigate to project directory
cd Annual-Lucky-Draw

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

The installer will be generated in the `release` directory.

## Usage Guide

### 1. Data Import

1. Prepare an Excel file with the following fields:
   - Employee ID (required)
   - Name (required)
   - Department
   - Photo filename

2. Prepare a photo folder with images named to match the "Photo filename" or "Employee ID" in Excel

3. Import Excel and photo folder on the configuration page

4. Choose import mode:
   - **Incremental Import**: Merge new data while keeping existing data
   - **Overwrite Import**: Clear all and reimport

5. You can also manually add/edit employees with **built-in photo cropping**

### 2. Prize Setup

1. Add prizes with name and winner count
2. Optionally upload prize display images
3. Configure whether to include previous winners (re-draw)

### 3. Theme Customization

1. Select theme style (Dark Tech / Minimal Light / Chinese Red)
2. In **Chinese Red theme**, switch between 3 preset Chinese New Year backgrounds
3. Upload custom background image (optional, recommended 1920×1080)
4. Upload company logo (optional)
5. Set event title (e.g., "XX Company 2026 Annual Gala")

### 4. Start Lottery

1. Click "Enter Lottery" button
2. Select the prize to draw
3. Press Space or click Start to begin
4. Press Space again to stop and reveal winners

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Start/Stop lottery |
| ← / → | Switch prizes |
| ESC | Close popup / Return |
| F11 | Toggle fullscreen |

## Tech Stack

| Category | Technologies |
|----------|-------------|
| Frontend | React 18, TypeScript, Tailwind CSS |
| 3D Engine | Three.js, @react-three/fiber, @react-three/drei |
| Desktop | Electron 28, Vite 5 |
| State | Zustand |
| Database | Dexie.js (IndexedDB) |
| Animation | Framer Motion |
| Data | xlsx (SheetJS) |

## Project Structure

```
Annual-Lucky-Draw/
├── electron/           # Electron main process
│   ├── main.ts         # Main entry
│   └── preload.ts      # Preload scripts
├── src/
│   ├── 3d/             # Three.js 3D components
│   ├── assets/         # Static assets
│   ├── components/     # React components
│   │   ├── DataImport/     # Excel & photo import
│   │   ├── HistoryPanel/   # Lottery history
│   │   ├── ImageCropper/   # Image cropping tool
│   │   ├── LotteryScene/   # 3D lottery scene
│   │   ├── PrizeManager/   # Prize configuration
│   │   ├── ThemeSwitcher/  # Theme settings
│   │   └── WinnerDisplay/  # Winner announcement
│   ├── db/             # IndexedDB database
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── stores/         # Zustand state stores
│   ├── types/          # TypeScript definitions
│   └── utils/          # Utility functions
├── public/             # Public static files
└── release/            # Build output
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Three.js](https://threejs.org/) - 3D graphics library
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - React renderer for Three.js
- [Electron](https://www.electronjs.org/) - Desktop application framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library

---

<p align="center">Made with ❤️ for company annual events</p>
