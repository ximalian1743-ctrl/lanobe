# Changelog

> 本项目于 2026-04-16 完成 5 轮系统化产品化升级，共 50 项独立改动。

---

## 2026-04-16 · 5 轮产品化升级

### Round 5 — 实测驱动的问题修复（10 项 + 1 bonus）
**Commit:** `5aded84` — Azure Web App deploy ✓ (6m15s)

使用 Playwright 真实运行 + Gemini AI 真实调用暴露的问题。

1. **GuideModal 阻塞首次加载** — 测试证实 5/9 用例被它阻塞，移除 auto-popup
2. **Reader Guide 内容过期** — 引用了已删除的"底部 Controls"，重写匹配 MiniPlayer
3. **章节显示错误** — `currentIndex < chapters[0].index` 时错误取 `chapters[0]`，改为显示"前言"
4. **MiniPlayer `···` 展开按钮不直观** — 换成 `ChevronUp` + 描述性 tooltip
5. **aria-label 中英混用** — "add bookmark" / "note" 改为"加入书签" / "添加笔记"
6. **TopBar 进度文本 "1 / 5992·0%" 粘连** — 加空格 + 缩小字号
7. **Pager "第 1 / 120 页" 与顶栏进度冗余** — 降级为紧凑居中小提示
8. **长页面缺少返回顶部** — `ScrollToTopButton`（>600px 滚动后出现）
9. **新用户找不到 MiniPlayer** — 一次性 Toast 提示"右下角是悬浮播放器 · 点 ⌃ 展开"
10. **SiteFrame 标题 truncate 截断长书名** — 改为 `line-clamp-2`

**Bonus:** `aiService.parseJsonContent` 加 3 级 fallback（尾逗号 → 注释 → 转义换行），Gemini 返回 malformed JSON 时自动恢复。

**新增：** `ScrollToTopButton.tsx`

---

### Round 4 — 产品化 UI 大改（10 项）
**Commit:** `2fd1a83`

成熟阅读器产品（Apple Books / Kindle / 微信读书）视角的结构重构。

1. **沉浸阅读模式** — 向下滚隐藏 TopBar，向上滚恢复；多 100px 正文空间
2. **浮动 MiniPlayer** — 替代固定 Controls 底栏，右下角悬浮球
3. **SiteFrame Hero 精简** — 去装饰性 hero，改为 sticky 紧凑顶栏
4. **Chapters 侧边抽屉** — Modal → 左侧滑入抽屉（`drawerIn` 动画）
5. **双击手势** — 中间切换播放 / 左三分之一上一句 / 右三分之一下一句
6. **BottomSheet 替代中心 Modal** — Bookmarks / NoteEditor / WordLookup 统一底部滑出
7. **Settings 扁平化** — 即时保存，无冗余"保存"按钮
8. **Auto 主题** — `prefers-color-scheme` 自动跟随，加 matchMedia 监听
9. **进度条章节刻度** — 在轨道上显示章节边界 tick marks
10. **空状态重设计** — 📖 徽章 + 渐变背景 + 友好引导文案

**新增：** `BottomSheet.tsx` / `MiniPlayer.tsx`

---

### Round 3 — 问题修复（10 项）
**Commit:** `66dd154`

Round 1/2 实施后暴露的交互与设计问题。

1. Entry 点击强制自动播放 → 保留用户的播放/暂停意图
2. "进度已保存" Toast 过于嘈杂 → 移除
3. "正在生成音频" Toast 噪音 → 只在 >800ms 才弹，缓存命中静默
4. 划词误触发 → 60ms 去抖 + 最少 2 字
5. 听书模式打开自动播放 → 默认暂停，用户主动按开始
6. 注音两层开关反人类 → 合并为 `furiganaMode` 三选一（hidden / bracket / ruby）
7. 进度条太细难点击 → 8px 轨道 + 14px 拖动手柄 + 20px 触控区
8. TopBar 4 个按钮挤一起 → 分字号组 / 主题+书签组
9. 笔记内联预览永远展开 → 默认折叠为徽标，点击展开
10. 批量 AI 进度关 Modal 就消失 → 全局 `BatchProgressBanner`

**新增：** `BatchProgressBanner.tsx`

---

### Round 2 — 功能追加（10 项）
**Commit:** `f64218e`

让产品从"阅读器 demo"升级为"完整学习工具"。

1. **书签** — 阅读中点 📖 收藏，`BookmarksModal` 查看跳转
2. **笔记** — 点 📝 为任意 entry 添加笔记，内联预览
3. **阅读时长** — `useReadingTimer` 10s tick、idle-aware，Bookshelf 显示每卷时长
4. **主题切换** — dark / sepia / light，CSS `data-theme` 变量驱动
5. **划词查询** — 选中日文 → `WordLookupSheet` 聚合释义 + 全书搜索
6. **AI 批量讲解** — Chapters Modal 每章"讲解整章"按钮 + 并发队列 + 进度条
7. **听书模式** — `/lanobe/drive/:slug` 极简大字播放器，适合开车/通勤
8. **Ruby 注音渲染** — `漢[かん]` → `<ruby>漢<rt>かん</rt></ruby>` 浏览器原生 ruby
9. **AI 讲解存笔记** — AI Modal 加"保存为笔记"，结构化沉淀讲解
10. **全数据导出/导入** — JSON 备份包含：设置 / 进度 / 书签 / 笔记 / 时长 / AI 缓存

**新增：** `BookmarksModal.tsx` / `NoteEditorModal.tsx` / `WordLookupSheet.tsx` / `DataExportImportSection.tsx` / `DriveModePage.tsx` / `useReadingTimer.ts` / `lib/ruby.tsx`

---

### Round 1 — 阅读器 UX 改进（10 项）
**Commit:** `b0fc106`

基础阅读体验升级。

1. `ReaderTopBar` 顶栏常驻进度条（可点击/拖动跳转）+ 百分比
2. 当前章节名阅读中可见（不用查 Chapters Modal）
3. 进度保存 Toast 反馈（debounced 600ms）
4. Bookshelf 卷按钮显示"上次读到"彩点徽标
5. 左右滑动切换页（`useSwipe` hook，移动端手势）
6. Entry 点击即跳转（并自动播放 — Round 3 调整）
7. 字号快捷按钮 A- / A+（`readerFontScale` 0.85-1.4）
8. 单词表默认折叠（N 个词 → 点开，解决横向溢出）
9. Settings / Chapters / Guide Modal 支持 Esc + 背景点击关闭
10. 音频生成状态 Toast（"正在生成音频…" / "音频已就绪"）

**新增：** `Toast.tsx` / `ReaderTopBar.tsx` / `useSwipe.ts` / `useModalDismiss.ts`

---

## 2026-04-15 及更早 · 内容与基础底座

参见 git log 完整历史。关键里程碑：

- `735c494` — 8 卷《败犬女主太多了》完整 furigana + N3+ vocab 优化
- `7790654` — production-ready 文案重写
- `d77d55c` — TXT 上传、UI 动画、repo 维护
- `acd5ee0` — v1 reader UX upgrade 完成
- `4914b88` — 移动端播放 + reader controls 简化

---

## 测试与 CI

- **单元测试** — Node.js native test，2 项通过（textCleanup / furigana）
- **E2E 测试** — Playwright 1.58，3 项（bookshelf → reader / 移动端音频 / AI modal）
- **CI 流水线** — GitHub Actions：`test:local`（lint + build + smoke）→ Azure Web App 部署
- **部署目标** — Azure Web App `lanobe-jpe-764788`（Japan East），自定义域名 `ximalian.cc.cd`

## 项目统计

| 指标 | 值 |
|------|-----|
| 升级轮次 | 5 轮（Round 1-5） |
| 新增功能点 | 50 项 + 1 bonus |
| 新增组件 | 11 个（Toast / BottomSheet / MiniPlayer / ReaderTopBar / ScrollToTopButton / BatchProgressBanner / BookmarksModal / NoteEditorModal / WordLookupSheet / DataExportImportSection / DriveModePage） |
| 新增 hooks | 3 个（useSwipe / useModalDismiss / useReadingTimer） |
| 最新部署 | `5aded84` ✓ Azure Japan East |
