# Agent 入口

- 本仓是离线抽奖桌面应用；用户说明见 README.md，根因与验收见 docs/lottery-2-validation.md。
- src/3d/LotterySphere.tsx 负责卡片与旋转；抽奖结果由 hooks 与 utils/commitWinners.ts 生成并保存，渲染层不得再次抽取。
- 人员 id 是持久身份及抽奖号码，不使用渲染下标；同名允许，重复 id 拒绝。
- 场景、中奖弹窗及两种附加模式共用 themeStore.displayOptions。
- 常规权重与终极大奖积分是不同配置；默认常规抽奖等概率，任何指定中奖状态必须在大屏明确显示。
- 抽奖中冻结人员池与规则；人员和奖项结果必须在同一个 IndexedDB 事务中保存。
- 照片解码完成前保留文字卡片；纹理在所属卡片卸载时释放，异步回调不得更新已卸载卡片。
- `npm run typecheck`、`npm test`、`npm run build:web` 是代码验证入口；桌面打包为 `npm run dist:win` / `npm run dist:mac`。
- 浏览器回归见 tests/browser-smoke.mjs，TEST_PROFILE 必须是登记过的隔离目录，不得使用个人浏览器配置。
- macOS 安装包在 macOS 构建；CI 产物未经签名/公证，不等同于已经过实机安装验收。
- 构建产物在 release/，不提交安装包、个人名单、照片、活动配置或本地浏览器资料。
- 媒体审查记录见 docs/security-media-review.json；仅按已目视核验的路径与 blob 哈希限定，不豁免新图片。
- 上游文档豁免：README.en.md、release-notes-v1.2.1.md、release-notes-v1.2.2.md 保留现有上游说明；新增技术文档只放 docs/。
