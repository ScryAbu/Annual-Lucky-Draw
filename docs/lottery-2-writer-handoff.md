# 抽奖 2.0：README 与 Release 编写交接

本文是给接手文档 Agent 的事实材料，不是最终 README 或已发布的 Release。状态快照日期：2026-10-28。后续发布状态以 GitHub 实时记录为准；功能事实以所列提交的代码和验证证据为准。

## 可直接复制给下一个 Agent 的任务

> 请在 `C:\Users\29241\Project\personal\Annual-Lucky-Draw` 阅读 AGENTS.md、docs/lottery-2-writer-handoff.md 和 docs/lottery-2-validation.md，基于现有抽奖 2.0 实现重写面向普通用户的 README，并在 docs/ 下准备 v2.0.0 Release 文案。覆盖年会、婚礼及纯号码场景，说明下载平台选择、导入名单、字段开关、投屏、权重、配置迁移及升级注意事项。README 已有技术初稿，README.en.md 尚未同步，请明确处理范围。使用现有合成测试截图，区分已验证和未验证能力，不把 Actions 临时产物写成永久发布地址。先核对 PR #3 的最新状态；编写材料本身不代表要求合并 PR、推送标签或发布 Release。交付修改文件和可直接粘贴的 Release 草稿。

## 代码与发布身份

| 项目 | 值 |
|---|---|
| 仓库 | https://github.com/ScryAbu/Annual-Lucky-Draw |
| 工作目录 | `C:\Users\29241\Project\personal\Annual-Lucky-Draw` |
| 开发分支 | `feature/lottery-2`，已推送并跟踪远端 |
| 原版基线 | `a2691597e502099f493539e7ac41a9b93a3a8bee`，原包版本 1.2.2 |
| 实现提交 | `3a5b524`：抽奖、渲染、显示、迁移和跨平台构建 |
| 已验证代码头 | `690a6c3756f5608e760aa5301b959ff41ac564dc`：补充精确媒体哈希审查记录 |
| 新包版本 | `package.json` / 锁文件：2.0.0 |
| PR | [#3](https://github.com/ScryAbu/Annual-Lucky-Draw/pull/3)，核查时 open、未合并、非 draft |
| 问题 | [Issue #2](https://github.com/ScryAbu/Annual-Lucky-Draw/issues/2)，核查时 open、0 评论、无关闭时间；PR 含 `Fixes #2` |

目前没有为本次 2.0 发布正式标签或 GitHub Release。不要把 PR 的临时 merge commit 字段当成“已合并”。本文后续文档改动也不能倒推为安装包包含了这些改动。

## 最值得向用户说明的变化

重点是解决大量头像闪烁、动画与中奖结果不一致，并补齐真实活动所需的投屏、显示控制和配置搬家。已有的三种抽奖模式、主题、音乐、Excel 导入等是延续能力，不应全部宣传为首次新增。

| 用户反馈 | 2.0 实际行为 | 主要代码入口 |
|---|---|---|
| 1. 动画与实际中奖人不符 | 开始冻结本轮名单，停止时只抽一次；场景、弹窗和保存记录使用同一组结果 | `src/hooks/useLotteryEngine.ts`、`src/utils/commitWinners.ts` |
| 2. 投大屏、转速、3 人上下不动 | 选择已连接显示器并移动当前窗口、全屏；转速 0.5–6 弧度/秒；小人数分布避开旋转轴两极 | `src/components/PresentationControls.tsx`、`electron/main.ts`、`src/utils/draw.ts` |
| 3. 大名单显示不全 | 180 人以内全部呈现；更多人员每 8 秒按固定顺序分页。全体符合资格者始终参与抽奖 | `src/3d/LotterySphere.tsx`、`src/utils/draw.ts` |
| 4. 工号非必填 | 姓名或号码至少一项；缺号码自动生成独立号码，同名不合并 | `src/utils/participants.ts`、`src/components/DataImport/index.tsx` |
| 5. 框内数字误导 | 卡片显示实际人员号码，不再使用渲染下标 | `src/3d/LotterySphere.tsx`、`src/utils/display.ts` |
| 6. 同时隐藏照片与部门 | 照片、姓名、号码、部门独立开关；提供只姓名和只号码预设 | `src/stores/themeStore.ts`、`src/components/ThemeSwitcher/index.tsx` |
| 7. 调整中奖概率 | 默认等概率；人员编辑支持优先级系数 1–100，在抽奖页待机隐蔽入口（连点“可抽奖人数”5 次）开启加权或定向设置，抽奖大屏不暴露提示 | `src/utils/draw.ts`、`src/pages/LotteryPage.tsx`、`src/components/DataImport/index.tsx` |
| 8. 保存配置换电脑 | 完整活动 JSON 导出/导入，含照片、奖项、中奖记录、主题和媒体等；校验和失败回退 | `src/utils/backup.ts`、`src/components/BackupSettings.tsx` |
| 9. 苹果安装包 | macOS CI 已生成 Intel x64 与 Apple Silicon arm64 的 DMG、ZIP | `electron-builder.json`、`.github/workflows/build.yml` |
| 10. 150 人闪烁 | 名单稳定、文字占位、单卡纹理复用、取消异步回调并释放纹理 | `src/3d/LotterySphere.tsx`、`src/hooks/useLotteryEngine.ts` |
| 11. 纯号码抽奖 | 支持只有号码的 Excel 或手动人员；只号码预设；保留文本或数字格式中的前导零 | `src/utils/excelParser.ts`、`src/utils/participants.ts` |
| 12. 中奖页工号部门关不掉 | 场景与三个模式的人员展示统一使用字段设置 | `src/components/WinnerDisplay/index.tsx`、`src/components/ParticipantInfo.tsx` |

其他修正：空格键遵循本次人数；防止重复开始/停止；常规单次抽取 1–30 人且不超过有效名单和剩余名额；人员及奖项在同一 Dexie 事务保存，失败不揭晓；允许返场也不会同一奖项重复中奖；历史记录按奖项获奖列表保留返场记录；删除已关联中奖人员前要求清理记录。附加模式的相关实现见 `src/hooks/usePrizeWheelEngine.ts`、`src/hooks/useUltimatePrizeEngine.ts`。

代码整理还包括模式页面延迟加载、Electron `webSecurity` 开启和文件缓冲区切片修正。技术栈为 React 18、Three.js 0.160 系列、React Three Fiber 8、Electron 28、TypeScript、Zustand、Dexie；精确版本以锁文件为准。

## 闪烁根因与最小修复口径

旧抽奖 hook 每 100ms 更新未被球体使用的 `rollingDisplays`，整库订阅带动页面更新；页面每次过滤出新名单数组；球体对超过 60 人的数组重新随机排序并截取 60 人。因此卡片约每秒 10 次换成员、卸载再挂载，而照片卡片在异步加载完成前返回空，直接造成消失、闪现和跳位。

旧纹理缺少释放，晚到的图片回调也未清理，另有透明平面参与深度写入的排序风险。透明排序是附加风险，不能写成已经证明的唯一根因；也不能写“Three.js 最多支持 100 人”。实际触发分支是超过 60 人。

最小补丁范围：稳定可用池引用、去掉无效高频状态更新、固定展示成员、照片加载前显示文字、取消卸载后的回调并释放纹理。2.0 在此基础上使用面向相机的不透明 Sprite，每卡一张 CanvasTexture，图片完成后绘制到同一画布；绑定 map 后更新材质，避免初次空 map 导致白卡。动画按帧间隔计算转速。

详细推导、原版定位和现场复现步骤请直接引用 [根因与验收](lottery-2-validation.md)，不必在 README 复制整篇技术分析。

## 使用与迁移中不能省略的信息

- 推荐顺序：数据导入 → 奖项设置 → 外观设置 → 开始抽奖。投屏入口为“投大屏”，活动备份入口为“配置迁移”。
- 只姓名适合婚礼；只号码支持姓名为空。Excel 要保留 `0001` 等号码，可用文本或 `0000` 等显示格式。
- 无号码自动生成如 `N000001` 的唯一标识；再次无号码导入会作为新人员追加。要更新原人员需保留号码；重复号码拒绝导入。
- 人员权重表示相对权重，首抽概率为个人权重除以总权重；批量逐次无放回抽取。权重 100 不表示必中或固定 100% 概率。
- 常规权重与终极大奖积分不同。原有指定中奖配置会保留，并与常规权重开关一同收起至抽奖页待机状态的隐蔽入口（连续点击右下角“可抽奖人数”卡片 5 次打开“高级设置”），开始抽奖后自动关闭且不可触发，大屏全程不展示任何概率或内定文字提示。
- 投屏使用一个抽奖窗口：连接 HDMI 或由操作系统建立无线投屏后再选择屏幕。不是应用内无线串流、远程网页直播或独立主持人控制台。
- 复制安装包不会复制活动数据。人员与奖项保存在本机 IndexedDB，部分外观与音频使用 localStorage；跨电脑应导出完整 JSON。
- JSON 含照片、名单、中奖记录、主题、Logo、背景、音乐、权重及指定中奖设置；导入前备份当前活动。导入有 100 MB 文件上限，本地存储配额可能更小；超限或校验失败应拒绝并回退，不能承诺任意体积的音乐都可迁移。
- 对于从 1.x 升级的说明，可写“保留旧设置迁移逻辑，升级前备份”；不能写“所有历史版本均已实机无损升级验收”。

## 已完成验证与证据

| 验证 | 可引用结论 | 证据 |
|---|---|---|
| 自动检查 | 本地及 Windows/macOS CI 的类型检查、27 项 Vitest、生产构建通过 | `tests/`，下方工作流链接 |
| 场景资源回归 | 150 张卡片经 10 次新数组重渲染仍复用纹理，卸载释放 150 张纹理 | `tests/scene.test.tsx` |
| Chrome 实际 GPU | 1920×1080、150 张合成照片，约 6 秒滚动前后创建数均 154、删除数均 0；154 含渲染器基础纹理 | [browser-smoke.json](verification/browser-smoke.json)、`tests/browser-smoke.mjs` |
| 结果一致性 | 键盘抽 5 人，显示号码与持久化号码逐项一致；无未捕获页面异常 | 同上 |
| 字段与少人数 | 关闭部门、只号码生效；3 人各自的世界坐标发生变化（该坐标检查在待机旋转阶段） | 同上 |
| Windows 打包程序 | 隔离数据目录、隐藏窗口启动成功，版本 2.0.0、packaged=true、webSecurity=true；显示器 API 返回 1 屏 | [windows-smoke.json](verification/windows-smoke.json)、`tests/electron-smoke.mjs` |
| 历史安全审查 | 全历史审查通过；媒体例外绑定经过目视检查的精确路径与 blob 哈希 | [security-media-review.json](security-media-review.json) |

测试还覆盖 0/1/2/3/60/61/100/101/150/1000 人的分布和分页、抽取区间、无重复、同名与缺工号、前导零、操作锁、持久化失败、备份与回退、两种附加模式。1000 人是逻辑覆盖，不能改写为“1000 张头像同时显示的 GPU 性能测试”。

尚未完成的现场验证：连续滚动 60 秒与重复 10 轮、物理外接屏、Mac Intel/Apple Silicon 实机安装、旧版到新版真实配置目录的安装升级。Windows 已验证解包程序启动，未运行安装器覆盖用户真实资料。没有全硬件无闪烁、固定 60 FPS 或大规模长时间压力测试结论。

### 可复用截图

均为合成测试数据，可直接使用；README 在根目录引用时使用 `docs/verification/文件名`。

| 图片 | 建议图注 / 能证明的内容 |
|---|---|
| [150-rolling.png](verification/150-rolling.png) | 150 人照片球体展示；静态截图本身不证明没有闪烁，配合资源记录使用 |
| [winners-five.png](verification/winners-five.png) | 一次抽取 5 人的中奖结果 |
| [numbers-only.png](verification/numbers-only.png) | 纯号码展示，不显示姓名、照片及部门 |
| [three-people.png](verification/three-people.png) | 少人数场景；运动结论来自坐标记录 |
| [windows-packaged.png](verification/windows-packaged.png) | Windows 打包程序界面 |

这些是验收素材，不是新设计的宣传图。不要把合成头像或号码说成真实活动案例。

## 构建与下载材料

两组工作流均已在上一轮核验 Windows/macOS 成功，构建代码头为上列 `690a6c3`：

- [推送构建 40624715219](https://github.com/ScryAbu/Annual-Lucky-Draw/actions/runs/40624715219)
- [PR 构建 40624878338](https://github.com/ScryAbu/Annual-Lucky-Draw/actions/runs/40624878338)

2026-10-28 再次查询推送构建的产物，均未过期：

| 产物 | 获取入口 | 到期时间（UTC） |
|---|---|---|
| Windows x64 NSIS | [desktop-windows-latest](https://github.com/ScryAbu/Annual-Lucky-Draw/actions/runs/40624715219/artifacts/12789300716) | 2026-11-11 03:08:19 |
| Mac x64/arm64 DMG、ZIP | [desktop-macos-14](https://github.com/ScryAbu/Annual-Lucky-Draw/actions/runs/40624715219/artifacts/12788553540) | 2026-11-11 03:08:38 |

Actions 产物保留 14 天，下载通常需要 GitHub 登录。这些链接不能当作正式 Release 永久下载链接。正式上传后再填写真实资产 URL。

包名与选择：

- Windows 64 位：`年会抽奖-2.0.0-Setup.exe`。
- Intel Mac：`Annual-Lucky-Draw-2.0.0-x64.dmg` / `.zip`。
- Apple Silicon Mac：`Annual-Lucky-Draw-2.0.0-arm64.dmg` / `.zip`。
- Mac 未签名、未公证；Windows 本地验收包未签名。未完成签名时不要承诺无系统安全提示。
- Linux 仅保留 AppImage 配置，未构建、未验收，不列为本次已交付平台。没有手机安装包。

本地交付目录为 `C:\Users\29241\Project\personal\Annual-Lucky-Draw\release`，已被 Git 忽略。包含 Windows 安装包、`win-unpacked/年会抽奖.exe`、`SHA256SUMS.txt`、`ci-verification.json`。远程写作 Agent 看不到这些本地文件时，使用 Actions 链接和仓库内证据；不要把本机路径写成公开下载地址。

校验值务必区分：

```text
本地 Windows 安装器本身（本次再次计算核验）：
0469979319276dddff8d74660c428863c7696f81e363e7098c93e78a2bb15b5d

GitHub Windows artifact 归档 digest（不是内部 exe 的 SHA256）：
d15237d12a2e3e2d77127ad8059bcb36757dafa7a1e11dd80f3658b49acfbab9

GitHub Mac artifact 归档 digest（不是各个 dmg/zip 的 SHA256）：
099c24e1dea3dad5140f7ede9d1d82cc84aaca71078c29a2b47df5132e8e327b
```

正式发布时应对实际上传的每个资产重新计算 SHA256；不能用本地安装器的哈希替代 CI 产出的同名 exe。

## 重跑入口与编写建议

Node.js 22 LTS；安装依赖使用锁文件。构建命令：

```sh
npm ci
npm run typecheck
npm test
npm run build:web
npm run dist:win
# 在 macOS 上：
npm run dist:mac
```

Windows 无符号链接权限时，先构建网页，再生成未签名验收包：

```sh
npx electron-builder --win --publish never --config.win.signAndEditExecutable=false
```

浏览器与桌面检查入口是 `node tests/browser-smoke.mjs`、`node tests/electron-smoke.mjs`。浏览器需先运行 `npm run dev:web -- --host 127.0.0.1 --port 5178 --strictPort`。隔离 TEST_PROFILE、TEMP、TMP 目录须按工作区规则在 D:/TEMP 登记；详细步骤见验证文档，不要复用个人配置目录。

README 建议按“用途 → 下载与平台 → 快速开始 → 常用设置 → 配置迁移 → 开发 → 验证边界”组织；Release 草稿按“大量头像与结果一致性修复 → 用户需求新增 → 数据与升级说明 → 资产 → 已知限制”组织。突出实际使用行为，技术根因用链接承接。

现有 `README.md` 是实现阶段的技术初稿；`README.en.md` 与旧 `release-notes-v1.2.1.md`、`release-notes-v1.2.2.md` 是保留的上游资料。不要把旧版发布说明改写成 2.0 历史。新草稿放 `docs/`，避免增加根目录入口文档。

发布前尚需核对最终提交和 PR 合并状态、按最终代码完成必要验证、决定签名与实机验收安排、创建对应 annotated tag、上传最终资产及其校验文件。这些属于实际发布工作，当前交接没有执行。文案可先准备，尚未完成的步骤保持待办，不写成已完成。
