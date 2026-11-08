# Agent 入口

- 本仓是离线抽奖桌面应用；用户说明见 README.md，根因与验收见 docs/lottery-2-validation.md。
- README 与发布说明编写材料见 docs/lottery-2-writer-handoff.md；发布状态使用其中链接核查 GitHub 实时记录。
- src/3d/LotterySphere.tsx 负责卡片与旋转；抽奖结果由 hooks 与 utils/commitWinners.ts 生成并保存，渲染层不得再次抽取。
- 人员 id 是持久身份及抽奖号码，不使用渲染下标；同名允许，重复 id 拒绝。
- 场景、中奖弹窗及两种附加模式共用 themeStore.displayOptions。
- 投大屏：常规抽奖页在所选显示器另开无边框全屏窗口（路由 `#/screen`，ScreenPage）。抽取只在控制台窗口进行，经 utils/screenLink.ts（Electron IPC 转发 / 网页版 BroadcastChannel）把 ScreenState 推给大屏；大屏按键转发回控制台。观众画面统一由 components/LotteryStage.tsx 渲染。双窗口回归：tests/electron-screen-check.mjs。
- 背景音乐每次进入阶段都从头播放（hooks/useBGM.ts），循环与否由 bgmStore 的 *Loop 决定；场景照片经 utils/photoCache.ts 解码缓存并在换页前预载，避免整屏闪纯色底卡。
- 常规权重与终极大奖积分是不同配置；常规权重与内定设置使用隐蔽入口触发，抽奖大屏不展示概率或内定提示。
- 抽奖中冻结人员池与规则；人员和奖项结果必须在同一个 IndexedDB 事务中保存。
- 照片解码完成前保留文字卡片；纹理在所属卡片卸载时释放，异步回调不得更新已卸载卡片。
- `npm run typecheck`、`npm test`、`npm run build:web` 是代码验证入口；桌面打包为 `npm run dist:win` / `npm run dist:mac`。
- 完整用户流程验收（打包版，文件对话框替换为测试素材）：tests/user-journey.mjs，需 TEST_PROFILE、FIXTURES、LOTTERY_EXE。
- 发版：CI（.github/workflows/build.yml，windows-latest + macos-15）在推送后产出两端安装包，用 `gh run download` 取 macOS 产物上传 Release；`gh` 访问 API 需走代理 127.0.0.1:7897；Release 附件名必须是英文（GitHub 会删掉中文字符）。
- 浏览器回归见 tests/browser-smoke.mjs，TEST_PROFILE 必须是登记过的隔离目录，不得使用个人浏览器配置。
- macOS 安装包在 macOS 构建；CI 产物未经签名/公证，不等同于已经过实机安装验收。
- 构建产物在 release/，不提交安装包、个人名单、照片、活动配置或本地浏览器资料。
- 媒体审查记录见 docs/security-media-review.json；仅按已目视核验的路径与 blob 哈希限定，不豁免新图片。
- 上游文档豁免：README.en.md、release-notes-v1.2.1.md、release-notes-v1.2.2.md 保留现有上游说明；新增技术文档只放 docs/。
