# Codex 实施说明：CSE594 Assignment 1 最小完整实现

## 0. 目标与适用范围

接手当前 Lovable 前端，检查真实产物、补上真实数据保存、保守审阅 60 条文本、清理无用 Lovable 遗留，并完成 GitHub Pages 上线准备。A1-1 已完成，不处理。本项目是一次课程作业，不是通用标注平台。

**本文件完整替代 `Codex_CSE594_Assignment1_Implementation_Brief.md` 的实施规格。不要把两份文件的要求叠加。** 保留已经确定的逐条标注、Back/Next、Review 和编辑流程；不再默认要求自建 Worker/API、匿名凭证哈希、服务端任务分配、多对象任务模型、全局题组唯一约束或全栈本地数据库。

先检查实际代码和现有进度。若旧方案尚未实施，采用下述简化架构；若已有独立于 Lovable、能正确保存数据的后端，不要仅为更换技术名词而推倒重做、迁移数据库或删除数据。先比较剩余工作，保留更省事的可用实现。不能假装已经看过不存在的仓库、配置或云资源。

## 1. 教师真正要求什么

依据：用户提供的原始作业 PDF [A] 和贴出的 Piazza 教师答复 [P1–P3]。

| 明确要求 | 本项目应做到 |
| --- | --- |
| Emotion dataset 至少 50 条，涵盖 anger、fear、joy、love、sadness、surprise | 沿用已选的 60 条，不重新采样，不强制均分 |
| 说明清楚，每人标随机选择的 5 条 | 每条六选一，实际随机分配，不给所有人固定同一组 |
| 记录 “who labeled which tweet with which label” | 保存匿名 participant ID、五条 tweet ID、各自选择 |
| 同一个人 ideally 不关联多个 ID，允许不同实现 | 同浏览器保存并复用随机 ID，不做真实身份认证 |
| 需要能够保存用户交互的 backend | 使用真实、持久化的托管后端，不只保存 localStorage |
| 要部署可远程收集数据的网站 | 最终公网前端能写入在线数据库，评分时仍可用 |
| 自己至少测试一次，并提交 collected data 截图 | 从实际网页提交，在真实数据库核对并截图 |
| 提交代码及 GSI 可运行的说明 | 简短准确的 README、依赖锁文件和必要配置 |

Piazza 教师明确说：

> We are not going to assume they are coming back to the task again.

> you don't have to implement 2&3 you mentioned to earn full credit

这里的 2、3 指重复参与、跨轮排除已见 tweet，以及样本耗尽。因此不开发多轮任务、参与历史、跨轮去重或耗尽处理。

关于后端，教师的原话是：

> yes, it needs a backend to be able to save user interactions, however you want to implement it

**没有指定数据库产品、物理表数、API 数量、服务端抽样、自建认证、局部还是全栈本地运行。** 不把我们的技术选择写成教师硬性要求。托管后端不是 Qualtrics；PDF 的 survey-tool 扣分条款并不是对托管数据库的限制。

截止时间：2026 年 9 月 20 日 11:59 PM，Canvas 提交 ZIP。A1-2 的报告材料是在线链接和真实数据截图；最终 ZIP 还要附相关代码与运行说明。Assignment 3 会继续扩展，但这次不提前实现后续研究功能。[A]

## 2. 默认架构：静态前端 + 托管数据库 API

尚无可用后端时，默认采用：

```text
开发：localhost 上的现有 React 前端 → Supabase 托管 API → Supabase 数据库
上线：GitHub Pages 上的同一前端   → Supabase 托管 API → Supabase 数据库
```

GitHub Pages 是静态托管，不能自己运行数据库；但不等于还必须自建一个 API 服务。Supabase 自动提供可以从浏览器调用的 Data API。[S1][S2]

本方案不增加 Express、Cloudflare Worker、Edge Function 或第二套后端运行时。使用用户自己控制的 Supabase 项目，不重新连接 Lovable Cloud。数据操作集中在一个小模块，替换 mock 提交即可，不要重写良好的页面。

**开发方式的明确调整：** “先本地跑通”在本版建议方案中指前端先在 localhost 调试，并联调真实云数据库；不是无网络的全栈离线运行。这比旧版强制本地 API、本地数据库、云端数据库各走一遍更省事。若用户另行明确要求整套离线运行，需要先说明这一差别，不能把本方案说成已经满足全栈本地部署。

不安装 Docker 或本地 PostgreSQL，不搭 Supabase 本地全栈，不维护云端/本地两套数据库实现。缺少云项目配置时，先完成前端审计、文本和清理等可执行工作，准确指出剩余账号配置，不能用 mock 冒充联调成功。

## 3. 身份、随机分配和页面状态

**身份：** 首次开始任务时用 `crypto.randomUUID()` 或同等随机 UUID 生成 participant ID，并写入项目专属 localStorage。以后在同浏览器复用。不要求输入姓名、邮箱或学号，不调用登录流程，不启用 Supabase Auth 来建立账号体系，也不另外创建 participant 身份表或凭证服务。

这个 ID 是浏览器层面的关联标识，不证明现实中的唯一身份；清除存储、换设备或多人共用浏览器是已知边界，不为此扩展追踪功能。

**分配：** 前端保留固定 60 条的无答案数据文件。新任务使用标准随机算法、不放回抽取 5 个不同 tweet ID，再保存顺序。不要按 emotion 分层分配，不要求五条类别平衡，不在每次渲染时抽题，不让所有任务重置成同一个固定 seed。

**重要区分：** Piazza 说第二个 participant 不应看到与第一个完全相同的一组；它没有指定跨用户全局唯一表或碰撞重试算法。本版采用“独立随机，而非给所有人固定五条”的实现解释，不额外维护全局已发题组。普通随机存在极小概率碰巧得到相同组合，不声称数学上绝不重复，也不声称教师已经确认这一概率性边界。对两个独立测试 participant 实际核对抽题；若后续教师明确要求全局绝不重复，再补充最小约束。

**状态：** 同轮的 ID、五条及顺序、已选答案和当前位置保存在浏览器草稿中。刷新、Back、Review 编辑不换题、不丢答案。真实提交使用新的项目状态 key，不把旧 Lovable preview 的 completed 当成已经入库，不自动上传旧模拟数据。

## 4. 只补全既定 UI/UX

流程：`说明 → 五条逐条标注 → Review → 必要时编辑并直接返回 Review → Submit → 后端确认 → 完成`。

保留 `1 of 5` 进度、清楚的英文说明、六类单选、Back/Next、无预选、未答不能继续、手机可用和基本键盘操作。六个选项采用同等视觉权重，不推荐答案、不按类别配情绪颜色。不要改掉已有的优秀设计。

提交中禁用重复点击；失败保留草稿并提供重试；仅在真实保存得到确认后显示 `Your 5 responses have been submitted.`。不能静默退回 mock。确认完成后在同浏览器保留完成状态，没有新一轮入口。

不要求服务器保存每一步草稿，不设置 start/resume、身份查询、任务分配、历史记录等独立 API。去掉 mock 的 Frontend preview 和浏览器本地保存提示，应发生在真实提交已接通之后。

## 5. 数据保存：优先一张提交表

采用一张 `submissions` 表即可。下面是建议结构，不是教师规定的 schema：

| 字段 | 用途 |
| --- | --- |
| `participant_id` | UUID，主键或唯一键，本项目一人一轮 |
| `answers` | 长度为 5 的 JSONB 数组，按显示顺序保存 `{tweet_id, selected_label}` |
| `dataset_version` | 简单固定版本字符串，对应当前冻结展示文本，不建版本管理系统 |
| `submitted_at` | 数据库生成的提交时间 |

一行 submission 包含五条标注，照样能回答谁给哪条 tweet 标了什么。**不要求数据库物理上必须出现五行。** 截图时在 Supabase 自带 SQL Editor 将数组展开成 `participant_id / tweet_id / selected_label / submitted_at` 五行，提供一条对应实际 schema 的查询即可，不创建公开查询视图或自己的后台页面。

保留基本正确性：恰好五个不同的有效 tweet ID、label 只能是六类之一、一次完整保存、不重复产生同轮数据。前端做完整性检查，数据库约束或一个很小的 SQL 校验函数防止明显无效 payload。60 条正文留在无答案静态文件里，不必另建 tweets、assignments、participants 等表。

优先使用托管 Data API 的普通写入及数据库约束。**仅在处理完整校验和相同 payload 重试确有必要时，允许一个小型 SQL 提交函数**，仍使用平台自动提供的 API，不因此搭建新的服务。函数不得公开返回他人的数据；有提升权限的函数必须限制用途、权限和 search path。[S6]

首次点击 Submit 后保留该次提交快照，重试沿用同一 ID 和同一份内容。使用唯一键避免重复写入，不默认采用会覆盖已有回答的 upsert。若需要幂等返回，只确认同一份 payload 已保存；不同内容冲突不能伪报成功。网络结果不确定时保留答案并说明状态，不要求为这个边界搭建完整身份/任务恢复系统。

## 6. 不能省掉的最小数据保护

开启 RLS 并显式配置必要的数据库权限。普通网页访客只应能提交通过校验的数据，不能读取所有结果、更新已有结果或删除记录。没有登录的请求使用 Supabase 的 `anon` 数据库角色；这不同于启用 Supabase Auth 的匿名用户。[S3]

前端只使用公开用途的项目 URL 与 publishable key。管理员 secret key、旧 service_role key、数据库密码不能放进前端、`VITE_*` 或 GitHub。公开 key 不是保密凭证，数据访问靠数据库权限控制。[S4]

使用仅写入权限时，不要为方便展示而链式调用返回全部行的 `.select()`，也不要为了消除权限报错开放整张表读取。[S7]

一个不做登录的公开匿名提交入口不能证明真实身份，也不能保证不受垃圾提交影响。本次不开发防作弊、防刷和身份验证平台；但权限隔离、合理 payload 大小限制和不公开结果仍要落实。原始标签、真实 participant 数据及密钥不进入前端 bundle 或公开仓库。

## 7. 保留用户另外要求的文本与清理工作

**60 条文本：** 读取实际 `emotion_assignment_random_60.csv`，核验数量、稳定 ID 和六类覆盖，保持已定样本与 `tweet_001` 至 `tweet_060` 的映射。逐条审阅大小写、明确的拼写/撇号/标点和轻微语法问题；保留原文、展示版与简短修改理由，可集中在一个文件中。

不依据 ground truth 改写，不补缺失事实或上下文，不改变否定、情绪强度和口语语气。片段或歧义保守保留，不换样本。这个预处理是用户要求，不是教师明确批准；README 如实说明。发布前固定展示文本，不建文本版本表、任务快照系统或动态改写功能。不强制复现 Parquet 采样或字节级哈希。

**Lovable 清理：** 先检查 Git 状态并备份，保留用户修改和有用历史。解除当前项目的旧 remote/tracking，核对平台侧项目同步是否另需断开，未能核实时明确说明。不要直接删 `.git`、远程仓库或用户其他项目的 App 授权。

移除实际存在且无用的 logo、favicon、Edit with Lovable 链接、模板 metadata、旧 URL、专用开发依赖和废弃运行时请求。保留正常依赖、必要许可证和需求文档。先核验再清理，不按关键词批量删除。

## 8. 实施顺序与交付

先运行现有前端并走一次流程，找出真实缺口，随后直接修改，不停在长篇计划。

接着完成文本审阅和无用遗留清理；准备一个数据库 schema/权限 SQL 文件、集中式提交模块和 `.env.example`。用户在自己的 Supabase 项目运行 SQL，并配置项目 URL 和 publishable key 后，从 localhost 真正提交一次，到云数据库核对五条标注。这是云后端联调，不是本地数据库测试。

云服务账号、项目创建、公开仓库和部署需要核对真实账户与授权。不要杜撰项目 ID、用户名或上线 URL，不自行购买付费套餐。

本地前端与真实数据保存通过后，准备 `CSE594-Ruiqi-Chen-Assignment1` 的 GitHub Pages；项目显示名可以保留 `CSE594-Ruiqi Chen-Assignment1`。使用真实 owner，Vite 配置正确的 repository base；只发布静态构建产物，不发布原始答案、数据库导出或私密配置。[S1][S5]

从最终 Pages 地址再做一次完整任务，在云数据库核对后保留截图。**localhost 联调成功不能代替公网验收。** 用 Supabase 自带管理工具查看结果，不开发管理员 dashboard。

Supabase 当前免费档列明一周不活跃后会暂停项目。部署前复核当前政策，并在提交至评分期间检查项目仍可读写；不承诺免费档永久在线，不自动加保活系统，也不为了回避这个问题偷偷升级付费。[S8] 若实际已有更省事且满足评分期可用性的后端，优先保留。

最少交付：可运行源码、必要 SQL/配置和依赖锁文件、README、一个 60 条文本审阅文件。README 合并运行步骤、数据库截图查询、部署状态和实测结果，不再要求额外的长篇 HANDOFF 或多个重复方案文档。

## 9. 验收只覆盖这次任务

| 验收 | 需要实际看到的结果 |
| --- | --- |
| 样本与文本 | 固定 60 条，ID 关联未变，审阅记录完整，前端无 ground truth |
| 新任务与刷新 | 五条不重复，正常随机；同浏览器 ID、题组和草稿保持 |
| 两个独立浏览器上下文 | 独立 ID，实际重新抽样，不是固定五条或固定重置 seed |
| 逐条与 Review | 未答不能继续，Back 保留，编辑后直接回 Review |
| 提交与失败 | 等待真实结果，失败保留；同一提交重试不覆盖或增加另一轮 |
| 实际数据库 | 一次真实提交对应恰好五条正确的 ID/label，可展开截图 |
| 最小权限 | 网页角色不能读取全表、更新或删除已存结果，管理员密钥未泄露 |
| 构建与公网 | 手机及键盘基本可用；Pages 子路径正常；线上也能真正保存 |

复用已有测试工具；手工端到端测试加少量关键测试即可。不要要求强制随机碰撞、并发 Start、跨身份任务夺取、复杂超时状态机、完整故障注入或大型测试平台。

未执行的检查如实写未执行。不要拿按钮成功文案、模拟数据或静态代码审查替代数据库核验。不删除已有有效数据来让测试方便。

## 10. 不继续增加的功能

不增加账号/登录/邮箱验证、跨设备身份、浏览器指纹、重复参与、历史记录、跨轮去重、样本耗尽、管理员 dashboard、统计分析、实验管理、在线题库编辑、AI 推荐、得分或答案反馈、额外 emotion、confidence、自由文本理由、计时器、注意力题、营销页、第三方 analytics、A1-1 展示或 Assignment 2/3 功能。

**完成标准：公开可用 + 持久化后端 + 稳定浏览器 ID + 真正随机分配 + 清楚的五题交互 + 正确数据与截图。** 不以“完善”为由扩展范围。

## 资料依据

- [A] 用户上传 `HAI FA26 Assignment 1 Instruction.pdf`：第 1 页 A1-2；第 2 页数据、界面、测试、提交与 rubric。
- [P1] 用户贴出的 Piazza `A1-2 Requirements Clarification` 教师回复。关于稳定 ID 用词是 ideally；明确不要求原提问的 2、3。
- [P2] 用户贴出的 Piazza `About Assignment 1 interface link` 教师回复：要部署可远程收集数据的网站。
- [P3] 用户贴出的 Piazza `A1-2: Cloud database requirement` 教师回复：需要保存交互的 backend，方式不限。
- [S1] GitHub Pages 官方说明：`https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages`
- [S2] Supabase Data API，支持浏览器直接调用：`https://supabase.com/docs/guides/api`
- [S3] Supabase RLS、grants、anon 角色：`https://supabase.com/docs/guides/database/postgres/row-level-security`
- [S4] Supabase 公开 key 与管理员 key：`https://supabase.com/docs/guides/getting-started/api-keys`
- [S5] Vite GitHub Pages 部署与 base：`https://vite.dev/guide/static-deploy.html`
- [S6] Supabase SQL functions：`https://supabase.com/docs/guides/database/functions`
- [S7] Supabase insert 默认不返回行：`https://supabase.com/docs/reference/javascript/insert`
- [S8] Supabase 当前免费档与暂停政策：`https://supabase.com/pricing`

平台资料查阅日期为 2026-09-14。平台方案是实施建议，不是教师指定技术。执行时核对实际版本与项目状态。
