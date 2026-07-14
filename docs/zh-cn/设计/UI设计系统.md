> **非权威性阅读镜像提示**
> 本文档是原始文件 `docs/design/PRODUCT_UI_DESIGN_SYSTEM.zh-CN.md` 的中文阅读镜像，仅供人工浏览。产品、设计、架构与实现权威仍保留在原始源路径，请勿将本镜像作为实施或自动化编辑的依据。

# 开赛了产品 UI 设计系统

| 字段       | 值                                                        |
| ---------- | --------------------------------------------------------- |
| 设计方向   | 静稳棋室                                                  |
| 文档状态   | ACTIVE_IMPLEMENTATION_AUTHORITY                           |
| 产品状态   | COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN       |
| 页面门禁   | PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS |
| Token 权威 | src/styles/tokens.css                                     |
| 适用范围   | 全部产品页面、项目自有组件、棋盘、棋谱、分析与场外大屏    |

## 1. 文档关系与使用顺序

本文件只拥有视觉语言、现有 Token 的产品语义、控件外观、状态视觉和动效表达。它不创建新 Token，不改变产品能力，不把概念组件写成当前组件，也不关闭任何 OD。

实施时依次读取：

1. [产品逐页 UI 设计索引](UI设计索引.md)
2. 本文件
3. [全局布局规范](全局布局规范.md)
4. [响应式规范](响应式规范.md)
5. [全局交互规范](全局交互规范.md)
6. [全局状态规范](全局状态规范.md)
7. [组件责任规范](组件职责规范.md)
8. [Naive UI 映射](Naive%20UI映射.md)
9. [共用覆盖层与对话框](通用浮层与对话框规范.md)
10. [实施纠正清单](实现修正待办清单.md)
11. 目标[页面族规范](页面/统一工作区页规范.md)

上游权威为[产品设计蓝图](../产品/产品设计蓝图.md)、[主题规范](../../ui/THEME_SYSTEM_SPEC.md)、[页面样式规范](../../ui/PAGE_STYLE_SPEC.md)、[无障碍规范](../../ui/ACCESSIBILITY_SPEC.md)和[语义 Token 权威](../../architecture/SEMANTIC_TOKEN_REGISTRY_BASELINE.md)。

## 2. 能力分类

| 分类                | 本文件中的含义                                           |
| ------------------- | -------------------------------------------------------- |
| CURRENT_IMPLEMENTED | Token 或运行时所有者当前存在；只能按现有名称和值使用     |
| APPROVED_TARGET     | 产品视觉或组件表达已经确认，但仍需当前页面实现           |
| CONTRACT_BLOCKED    | 产品位置存在，但真实数据合同不足；只能设计真实不可用状态 |
| OPEN_OWNER_DECISION | 视觉起点受 OD 约束，不得转化为最终常量                   |
| PROHIBITED          | 第二套视觉系统、虚假能力或违反安全和可访问性的表达       |

## 3. 静稳棋室

静稳棋室把产品理解为教师与棋局长期共处的工作桌，而不是赛事后台、游戏大厅或营销仪表盘。

### 3.1 视觉原则

1. 棋盘主导。工作区中最强的面积、对比和几何稳定性属于棋盘；工具只在需要时出现。
2. 安静而非寡淡。背景和容器采用低噪声层级，状态色只承担语义，不铺满大面积。
3. 稳定而非僵硬。来源、主题、登录、加载和错误切换不改变外壳几何；动效只解释状态变化。
4. 任务优先。标题、当前来源、当前走法、只读状态和恢复动作优先于装饰、统计和技术信息。
5. 可信而非乐观。没有真实数据时显示空、阻断或错误，不以占位棋局、假进度、假在线或假时钟填充。
6. 远近兼容。教学屏强调棋盘与上下文并存；场外大屏强调观看距离和故障可辨识度。

### 3.2 禁止的视觉气质

- PROHIBITED：玻璃拟态、霓虹泛光、赌场或电竞皮肤、装饰性仪表盘、3D 棋盘优先、Hero 营销区。
- PROHIBITED：通过高饱和大面积背景表示普通选择、刷新或只读。
- PROHIBITED：用动画、闪烁或颜色单独表达连接、将军、错误、选中或完成。
- PROHIBITED：在场外大屏引入教学面板、分析轨道、编辑工具或密集后台控制台。

## 4. 唯一 Token 使用合同

CURRENT_IMPLEMENTED：src/styles/tokens.css 是唯一全局视觉值注册表。产品与功能代码只能消费其中现有 Token；不得在页面规范、功能样式、Naive UI 覆盖或内联样式中建立平行调色板、间距表、层级表或动效表。

- CSS 中使用 var(--token-name)。
- 项目文档可记录注册表中的原始值，用于核对；实现不得复制原始值。
- Naive UI 仅通过项目自有 provider/adapter 映射这些 Token。
- 棋盘的低级实例外观覆盖仍必须传入现有 Token 引用，不形成棋盘主题设置。
- 新视觉需求没有现有 Token 时，先登记[实施纠正清单](实现修正待办清单.md)，不得在本文件发明名称。

## 5. 主题与语义色

### 5.1 基础表面和文本

以下名称和值逐字来自当前注册表。

| 角色         | Token            | Light   | Dark    | 使用规则                 |
| ------------ | ---------------- | ------- | ------- | ------------------------ |
| 页面底色     | --bg             | #f4f6f4 | #0f1419 | 应用壳和非卡片背景       |
| 主表面       | --surface        | #ffffff | #181d24 | 面板、卡片、输入、对话框 |
| 次表面       | --surface-2      | #eef1ee | #20262e | 工具栏、次级按钮、分组   |
| 第三表面     | --surface-3      | #e6eae6 | #283038 | 更深一层的被动区域       |
| 分隔线       | --border         | #e2e6e2 | #2a323b | 普通边界                 |
| 强分隔线     | --border-strong  | #cfd5cf | #3b4651 | 输入、可操作边界         |
| 焦点边界     | --border-focus   | #1f9d57 | #36c177 | 与焦点环同时使用         |
| 主文本       | --text           | #161a17 | #e7edf1 | 标题、正文、关键值       |
| 次文本       | --text-2         | #2d342f | #c3ccd3 | 次级标题与说明           |
| 弱文本       | --text-muted     | #5d6760 | #8a96a0 | 元信息、辅助说明         |
| 极弱文本     | --text-faint     | #8a938c | #6a7680 | 占位和低优先信息         |
| 强调色上文本 | --text-on-accent | #ffffff | #0c130e | 仅用于强调色实底         |

### 5.2 品牌、操作和交互

| 角色       | Token              | Light                             | Dark                               | 使用规则                       |
| ---------- | ------------------ | --------------------------------- | ---------------------------------- | ------------------------------ |
| 主操作     | --accent           | #1f9d57                           | #36c177                            | 主按钮、当前标签、关键选择     |
| 强调深色   | --accent-strong    | #178048                           | #46cf85                            | 强调文本和明确状态             |
| 按压       | --accent-press     | #126539                           | #2aa566                            | 按压完成态，不长期停留         |
| 柔和强调   | --accent-soft      | #6fcc93                           | #3a7f56                            | 图形辅助，不代替文本           |
| 强调底     | --accent-bg        | #e7f5ec                           | #16311f                            | 选中、准备就绪、低强度强调     |
| 次强调底   | --accent-bg-2      | #d6eede                           | #1c3e28                            | 同组更深层级                   |
| 强调线     | --accent-line      | #b7e0c6                           | #2c5a3b                            | 选中边界、局部进度轨迹         |
| 品牌鼠尾草 | --brand-sage       | #86a665                           | #9cc07c                            | 克制的品牌辅助，不替代主操作   |
| 悬停底     | --state-hover-bg   | #ecf3ee                           | #232b34                            | 仅有指针悬停能力时使用         |
| 激活底     | --state-active-bg  | #e2efe6                           | #1c2c22                            | 按下或当前项                   |
| 焦点环     | --state-focus-ring | 0 0 0 3px rgba(31, 157, 87, 0.22) | 0 0 0 3px rgba(54, 193, 119, 0.30) | 所有可交互元素的唯一当前焦点环 |

焦点必须同时具备轮廓/边界和足够对比，不能只改变背景。--ring-accent 只是当前兼容别名，不是新实现首选。

### 5.3 语义状态色

| 状态        | Token     | Light   | Dark    | 允许表达                           |
| ----------- | --------- | ------- | ------- | ---------------------------------- |
| 成功/就绪   | --success | #1f9d57 | #36c177 | 已保存、已连接且合同确认、操作完成 |
| 警告/陈旧   | --warning | #c47d10 | #e0a83a | 陈旧、资源提示、需要注意但可继续   |
| 错误/危险   | --danger  | #d23f3f | #e8635f | 失败、破坏性确认、无效输入         |
| 信息/连接中 | --info    | #2f76d6 | #5a9bf0 | 连接中、刷新中、中性说明           |

状态色必须与标题、正文、图形和动作共同出现。不可用、只读、权限不足和合同阻断不是单一颜色；它们由结构化状态内容定义。

## 6. 字体、棋谱和数字

### 6.1 字体家族

| Token       | 当前值                                                                                      | 用途                                                                               |
| ----------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| --font-sans | -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif | 产品标题、正文、控件、棋手与赛事名称、SAN/PGN 可读叙事                             |
| --font-mono | 'SF Mono', ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace                       | FEN、引擎主变化、技术性棋谱原文、稳定列宽的调试受控字段；普通用户界面不显示内部 ID |

### 6.2 字号

| Token     | 当前值                            | 产品角色                       |
| --------- | --------------------------------- | ------------------------------ |
| --fs-xs   | clamp(11px, 0.33vw + 7.4px, 16px) | 坐标、时间戳、辅助标签         |
| --fs-sm   | clamp(12px, 0.42vw + 7.2px, 18px) | 元信息、表头、辅助动作         |
| --fs-base | clamp(13px, 0.50vw + 7.2px, 20px) | 正文、输入、列表、棋谱默认字号 |
| --fs-lg   | clamp(15px, 0.67vw + 6.9px, 24px) | 模块标题、重要状态             |
| --fs-xl   | clamp(18px, 0.84vw + 8.5px, 30px) | 页面标题、赛事标题             |
| --fs-2xl  | clamp(22px, 1.15vw + 10px, 38px)  | 远距离大屏主标题或单局聚焦标题 |

正文必须使用 --fs-base；当前注册表没有 --fs-md。不得继续复制 PAGE_STYLE_SPEC.md 中的旧名称。

### 6.3 棋谱与数字排版

- 走法序号、棋钟、页码、评价值、百分比和台号使用 font-variant-numeric: tabular-nums。
- SAN 主线与变例使用 --font-sans，靠粗细、缩进、边界和当前项背景建立层级，不以不同字体制造噪声。
- FEN、引擎主变化和需要字符对齐的原始棋谱使用 --font-mono；必须允许换行或水平模块滚动，不撑宽页面。
- 棋手名、赛事名和 PGN 标签保持来源文本；不得强制全大写或截断后无可访问完整名称。
- 评价数值不得脱离方向、先手方/后手方语义和评价条共同出现。

## 7. 间距、圆角、阴影和控件几何

### 7.1 间距

| Token  | 当前值 | 典型角色                     |
| ------ | ------ | ---------------------------- |
| --s-1  | 4px    | 图标与短标签、紧凑组内距     |
| --s-2  | 8px    | 控件组、行内间距             |
| --s-3  | 12px   | 控件内边距、紧凑模块         |
| --s-4  | 16px   | 标准模块内边距               |
| --s-5  | 20px   | 卡片和页面内容               |
| --s-6  | 24px   | 大模块分隔                   |
| --s-8  | 32px   | 页面级分组                   |
| --s-10 | 40px   | 稀疏展示区；不得用于压缩棋盘 |

### 7.2 圆角

| Token    | 当前值 | 典型角色                         |
| -------- | ------ | -------------------------------- |
| --r-xs   | 6px    | 紧凑按钮、标签                   |
| --r-sm   | 8px    | 输入、常规按钮、标签页           |
| --r-md   | 12px   | 卡片、弹出层                     |
| --r-lg   | 16px   | 大卡片、对话框、棋盘方格         |
| --r-xl   | 24px   | 只用于大面积独立表面             |
| --r-full | 999px  | 状态点、胶囊标签；不用于所有按钮 |

### 7.3 阴影

| Token       | Light 当前值                                                         | Dark 当前值                                                   | 层级                     |
| ----------- | -------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------ |
| --shadow-xs | 0 1px 2px rgba(20, 35, 25, 0.05)                                     | 0 1px 2px rgba(0, 0, 0, 0.35)                                 | 可点击行、轻微分离       |
| --shadow-sm | 0 1px 3px rgba(20, 35, 25, 0.07), 0 1px 2px rgba(20, 35, 25, 0.04)   | 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)    | 棋盘实例、卡片           |
| --shadow-md | 0 4px 12px rgba(20, 35, 25, 0.08), 0 1px 3px rgba(20, 35, 25, 0.05)  | 0 4px 12px rgba(0, 0, 0, 0.45), 0 1px 3px rgba(0, 0, 0, 0.35) | 菜单、popover            |
| --shadow-lg | 0 12px 32px rgba(20, 35, 25, 0.12), 0 4px 8px rgba(20, 35, 25, 0.06) | 0 12px 32px rgba(0, 0, 0, 0.55), 0 4px 8px rgba(0, 0, 0, 0.4) | 对话框、抽屉、拖放确认层 |

阴影不表达选中、错误或权限；这些状态必须使用边界、文字和状态结构。

### 7.4 控件几何

| Token                        | 当前值                          | 规则                           |
| ---------------------------- | ------------------------------- | ------------------------------ |
| --control-h                  | clamp(38px, 0.8vw + 26px, 52px) | 表单主控件、主按钮             |
| --control-h-sm               | clamp(30px, 0.6vw + 22px, 42px) | 工具栏、分页、紧凑控件         |
| --board-touch-target-min     | 44px                            | 触控最小目标                   |
| --workspace-border-w         | 1px                             | 当前标准边界                   |
| --workspace-disabled-opacity | 0.5                             | 当前禁用态透明度；仍需可读标签 |

粗指针环境中，可操作目标的最小宽高不得小于 --board-touch-target-min。禁用态保留标签和原因；仅降低透明度不足以说明权限或合同阻断。

## 8. 信息层级与容器

| 层级              | 表面        | 文本                  | 边界/阴影                   |
| ----------------- | ----------- | --------------------- | --------------------------- |
| L0 应用底         | --bg        | --text                | 无阴影                      |
| L1 稳定区域       | --surface   | --text                | --border                    |
| L2 工具和次级分组 | --surface-2 | --text / --text-muted | --border 或 --border-strong |
| L3 当前选择       | --accent-bg | --accent-strong       | --accent-line               |
| L4 浮层           | --surface   | --text                | --border + --shadow-md      |
| L5 模态/抽屉      | --surface   | --text                | --border + --shadow-lg      |

一个视觉列最多有一个持续滚动表面。卡片不是默认布局原语；只有需要独立选择、状态或分组时使用卡片，连续棋谱、赛事表格和树保持连续扫描。

## 9. 基础控件规范

### 9.1 按钮

| 类型     | Token 组合                                         | 使用                               |
| -------- | -------------------------------------------------- | ---------------------------------- |
| 主按钮   | --accent / --text-on-accent / --accent-press       | 每个局部任务最多一个主动作         |
| 次按钮   | --surface-2 / --text / --border-strong             | 常规操作                           |
| 轻按钮   | 透明或 --surface / --text-muted / --state-hover-bg | 低优先动作                         |
| 选中切换 | --accent-bg / --accent-strong / --accent-line      | aria-pressed=true                  |
| 危险按钮 | --danger 与清晰危险文案                            | 只在确认上下文；不得把整个区域染红 |

- 加载时保持原宽度和标签语义，使用 aria-busy；不得因 spinner 改变几何。
- 图标按钮必须有可访问名称；核心操作在首次出现处优先保留文字。
- 禁用按钮不得承担合同阻断说明；应改用可读状态区或附加原因。

### 9.2 输入、搜索和选择器

- 高度使用 --control-h；紧凑筛选可用 --control-h-sm。
- 背景 --surface，文本 --text，占位 --text-faint，边界 --border-strong。
- focus-visible 同时使用 --border-focus 和 --state-focus-ring。
- 错误使用 --danger 边界、错误正文和恢复说明；成功不常驻占位。
- 搜索提交和清除分别可达；清除后焦点留在输入。
- 选择器显示当前值、展开状态和标签；未知、失效或合同阻断值不得伪装成首项。
- 组合筛选在窄屏进入受控 sheet，应用后返回触发器；详见[响应式规范](响应式规范.md)。

### 9.3 标签页、菜单和树

- 标签页当前项：--accent-strong 文本、--accent-line 或 --accent 指示、aria-selected=true。
- 菜单当前项：--accent-bg、--accent-strong；悬停仅用 --state-hover-bg。
- 树使用层级缩进、展开按钮和当前项三种独立信号；展开不等于选中。
- 来源树按“赛事 → 组别 → 轮次 → 对阵/台次”或“教学集合 → 棋局”组织，不显示协议或设备秘密。
- 右侧标签页在只读实时上下文中移除编辑和分析入口，不以禁用标签制造误导。

### 9.4 标签、徽标和状态点

- 普通分类使用 --surface-2、--text-2、--border。
- 当前/成功使用 --accent-bg、--accent-strong、--accent-line。
- 陈旧使用 --warning；错误/断开使用 --danger；连接中使用 --info。
- 每个徽标包含文字；状态点只作冗余视觉。
- “只读”“本地副本”“合同阻断”“权限不足”使用完整产品文案，不简写为技术码。

### 9.5 警报、进度和反馈

- 模块内 alert 由标题、影响范围、保留内容说明和一个首要恢复动作组成。
- 进度条轨道使用 --surface-3 或 --border，完成段使用 --accent；失败不把已完成部分回退。
- AI 进度同时显示范围、已完成/总数、百分比、当前步骤和取消；进行中实时上下文不得出现。
- 刷新使用保留内容的内联状态，不覆盖列表或棋盘；刷新失败转陈旧并提供重试。
- toast 不承担权限、合同阻断、未保存确认或长期错误；这些状态留在所属模块或对话框。

## 10. 数据密集组件

### 10.1 表格

- 表头固定在表格所属滚动区，不固定到 body。
- 表头使用 --surface-2、--fs-sm、--text-muted；正文使用 --fs-base、--text。
- 行分隔使用 --border；选中行使用 --accent-bg 与明确当前标记。
- 数字列使用 tabular-nums；棋手名和赛事名允许换行。
- 表格空、加载、权限和错误占据同一内容区域，不改变过滤器和分页位置。
- 窄屏不强制保留宽表；页面规范决定转为可扫描列表，但字段语义和操作顺序保持一致。

### 10.2 列表与树

- 列表项必须有清晰主文本、次信息、状态和可选动作区。
- 当前棋局、当前轮次和当前台次分别标识，不以同一种“选中”混淆层级。
- 拖拽排序提供键盘上移/下移；拖动时保持原占位几何。
- 长列表在有运行时证据前不引入虚拟化或重依赖。

### 10.3 分页

- 页码、上一页、下一页和总量位于所属模块稳定区。
- 禁用边界页保留几何；当前页使用 --accent-bg、--accent-strong。
- 筛选改变时页码重置必须可预测；后台刷新不重置用户当前页。
- 大屏分页与赛事列表分页是不同产品行为；大屏还需暂停、聚焦和恢复页上下文。

## 11. 覆盖层组件外观

抽屉、sheet、dialog、popover 的行为由[共用覆盖层与对话框](通用浮层与对话框规范.md)和[全局交互规范](全局交互规范.md)拥有。

- Drawer/sheet：--surface、--border、--shadow-lg；标题和关闭动作固定，内容区独立滚动。
- Dialog：--surface、--r-lg、--shadow-lg；危险确认明确对象和不可逆影响。
- Popover/menu：--surface、--r-md、--shadow-md；不得承载长表单或关键错误。
- Backdrop 仅使用已有、明确由对应运行时所有的遮罩 Token；不得在页面内创建半透明黑色。
- 覆盖层打开时锁定其下层滚动，关闭后恢复触发器焦点。

## 12. 棋盘、棋谱、批注和分析

### 12.1 棋盘

CURRENT_IMPLEMENTED 的基础棋盘角色：

| 角色                 | Token                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 浅格/深格            | --cg-square-light / --cg-square-dark                                                                               |
| 浅格坐标/深格坐标    | --cg-coord-light / --cg-coord-dark                                                                                 |
| 上一步/选中/悬停     | --cg-overlay-lastmove / --cg-overlay-selected / --cg-overlay-hover                                                 |
| 可落子/不可落子/将军 | --cg-overlay-drop-ok / --cg-overlay-drop-bad / --cg-overlay-check                                                  |
| 走法提示             | --cg-hint-fill / --cg-hint-stroke / --cg-hint-capture-fill                                                         |
| 选中环               | --cg-select-ring                                                                                                   |
| 坐标区域             | --board-coordinate-gutter / --board-coordinate-gap / --board-coordinate-pad                                        |
| 坐标文字             | --board-coordinate-font-size / --board-coordinate-font-weight / --board-coordinate-color / --board-coordinate-halo |
| 外框                 | --board-frame-radius / --board-square-radius / --board-instance-shadow                                             |

棋盘外观不随普通 UI 明暗主题自动换一套未确认棋盘主题。只读棋盘保留走法导航、翻转、最后一步、将军和文本状态，但移除走子、编辑、批注写入和 AI。

### 12.2 批注

| Token             | 当前值  |
| ----------------- | ------- |
| --cg-arrow-red    | #FF2828 |
| --cg-arrow-green  | #61ED00 |
| --cg-arrow-yellow | #FFC81F |
| --cg-arrow-orange | #FA810B |
| --cg-arrow-purple | #6F2EE2 |
| --cg-arrow-black  | #333333 |

线宽与透明度只使用 --annotation-arrow-width、--annotation-square-width、--annotation-arrow-opacity、--annotation-square-opacity、--annotation-highlight-opacity 和 --annotation-style-solid。颜色选择必须有文字名称和选中状态，不依赖色块本身。

### 12.3 棋谱与回放

- 当前节点使用 --accent-bg、--accent-strong 和 aria-selected。
- 主线、变例、评论和 NAG 保持可扫描层级；NAG 同时提供符号和可访问名称。
- CONTRACT_BLOCKED 的回放只显示不可用/登录/权限状态，不显示虚构走法。
- 远端回放保持只读；只有显式“导入到分析”创建本地副本后出现编辑与 AI。
- 无效替换若保留上一份有效 PGN，必须明确标记“仍显示上次可信内容”，不得假装已切换成功。

### 12.4 AI 与评价

- AI 默认关闭；启动是显式主动作，进行中提供取消。
- 评价条使用 --eval-black、--eval-white、--eval-neutral、--analysis-rail-dark-fill 和 --analysis-rail-light-fill。
- --eval-advantage-line 当前值语法异常，未经纠正不得作为可用 Token。
- 候选线使用 --font-mono 或对齐数字，仍以产品文字说明深度/完成状态。
- 进行中实时、权限不足、资源策略禁止时完全移除启动入口，不渲染假禁用分析结果。

## 13. 赛事、实时与场外大屏

### 13.1 赛事

- 赛事列表与详情使用稳定 route header、筛选区、结果区和分页区。
- 团体对阵先呈现队伍聚合并展开单台；个人赛直接呈现台次。
- 当前、进行中、已结束、未开始都必须以文本和图形共同表达。
- 只有确认字段进入 UI；头像失败使用本地回退并保留几何。

### 13.2 实时状态

| 状态   | 视觉角色                       | 必需内容                       |
| ------ | ------------------------------ | ------------------------------ |
| 未连接 | --text-muted / --border        | 状态、可用动作                 |
| 连接中 | --info                         | 状态、取消或返回；无假百分比   |
| 实时   | --success                      | “实时”、最后确认更新时间       |
| 陈旧   | --warning                      | “陈旧”、最后可信时间、重试     |
| 重连中 | --info + 保留数据              | “重连中”、仍显示的可信快照说明 |
| 已断开 | --danger                       | “已断开”、最后可信内容、重连   |
| 已完成 | --success 或 --text-2          | 结果、完成、可用的显式导入动作 |
| 不可用 | --text-muted / --border-strong | 原因和返回/登录/重试           |

陈旧阈值和棋钟插值均为 OPEN_OWNER_DECISION（OD-07），不得用颜色或客户端计时伪造。

### 13.3 场外大屏

- CURRENT_IMPLEMENTED：独立公开对阵展示，只有真实赛事、组别、轮次和对阵数据。
- APPROVED_TARGET：合同就绪后的多棋盘网格、分页、单局聚焦、暂停/继续和故障排序。
- CONTRACT_BLOCKED：实时棋盘局面、批量订阅、权威时钟和实时新鲜度。
- OPEN_OWNER_DECISION：OD-05、OD-06、OD-07、OD-08。
- PROHIBITED：教学棋谱面板、AI、评价、编辑工具、来源批注、管理后台和不可读的无限缩小。

## 14. 全局状态组件

所有状态均由所属模块占位，保持最终内容几何。

| 状态                    | 结构                             | 首要动作                   |
| ----------------------- | -------------------------------- | -------------------------- |
| Loading                 | 与最终内容同几何的骨架、标题保持 | 无或取消                   |
| Refreshing              | 保留旧内容，局部刷新标识         | 可取消/保持浏览            |
| Empty                   | 真实空结果、当前筛选摘要         | 清除筛选或导入             |
| Error                   | 发生了什么、影响范围、保留内容   | 重试                       |
| Authentication required | 保护能力说明、安全返回           | 登录                       |
| Permission denied       | 身份有效但无权限                 | 返回公开表面               |
| Contract blocked        | 当前版本不可用、不得伪请求       | 返回或查看可用入口         |
| Read-only               | 来源只读、允许的导航/导入范围    | 显式导入副本（仅合同允许） |
| Stale                   | 保留最后可信内容和时间           | 重试/重连                  |
| Reconnecting            | 保留可信内容、连接动作           | 取消/返回                  |
| Disconnected            | 最后可信内容、断开说明           | 重连                       |
| Completed               | 结果和完成状态                   | 回放/导入（仅合同允许）    |

更详细的转换和文案唯一由[全局状态规范](全局状态规范.md)拥有。

## 15. 焦点、无障碍和减弱动效

- 全部 canonical surfaces 目标为 WCAG 2.1 AA。
- 每个交互元素有可访问名称、可见焦点和键盘路径。
- focus-visible 使用 --state-focus-ring；不得继续新增 --focus-ring 一类平行名称。
- 状态、选中、走法提示和批注不能只靠颜色。
- dialog、drawer、sheet 捕获焦点，Escape 关闭，关闭后返回触发器；有未保存破坏性编辑时先确认。
- 棋盘提供当前局面、焦点格、棋子、最后一步、轮到谁和将军状态的文本信息。
- live region 只播报关键连接和新走法，不重复刷新整个列表。
- prefers-reduced-motion 下取消棋子旅行、弹性、路径、自动平移和闪烁；直接到最终状态。
- 大屏轮播可暂停；减弱动效下不自动平移视图，手动翻页仍可用。

## 16. 动效 Token 与所有权

CURRENT_IMPLEMENTED 的工作区动效只使用：

- --workspace-motion-duration-fast、--workspace-motion-duration-base、--workspace-motion-duration-panel、--workspace-motion-duration-shell、--workspace-motion-duration-analysis、--workspace-motion-duration-progress
- --workspace-motion-stagger-panel、--workspace-motion-distance-panel
- --workspace-motion-press-scale、--workspace-motion-board-scale、--workspace-motion-overlay-scale
- --workspace-motion-ease-standard、--workspace-motion-ease-enter、--workspace-motion-ease-state、--workspace-motion-ease-progress
- 棋盘专属 --board-motion-_、--board-promotion-_、--board-radial-_、--board-editor-intro-_ Token

GSAP 只拥有呈现。Vue 生命周期拥有创建、打断和清理；模式、局面、方向、尺寸或减弱动效变化时旧 tween 必须被终止或协调。动效被跳过、打断或禁用时，最终棋局和 UI 状态必须完全正确。

## 17. 当前别名与缺陷登记

本节是 CURRENT_IMPLEMENTED 事实，不在本文件发明修复名；修复所有权见[实施纠正清单](实现修正待办清单.md)。

### 17.1 兼容别名

| 别名          | 当前映射                | 当前注册表备注 |
| ------------- | ----------------------- | -------------- |
| --hover       | var(--state-hover-bg)   | 当前消费者为零 |
| --active-bg   | var(--state-active-bg)  | 当前消费者为零 |
| --ring-accent | var(--state-focus-ring) | 当前消费者为零 |

新实现直接使用 canonical state Token，不扩大兼容别名消费面。

### 17.2 当前运行时未定义引用

| 未定义引用                    | 当前位置                                        |
| ----------------------------- | ----------------------------------------------- |
| --fs-md                       | WorkspaceRightPanel.vue；AnalysisPanel.vue 两处 |
| --text-inverse                | LoginView.vue                                   |
| --workspace-focus-ring-width  | LoginView.vue                                   |
| --focus-ring                  | LoginView.vue                                   |
| --workspace-focus-ring-offset | LoginView.vue                                   |

--workspace-right-pgn-h 和 --pgn-indent-depth 是由各自运行时所有者写入的实例级自定义属性，不是全局 Token 缺失。

### 17.3 当前文档引用但注册表未定义

PAGE_STYLE_SPEC.md 仍引用 --fs-md、--input-bg、--state-disabled-bg、--state-disabled-text、--card-bg 和 --card-border。页面实现不得照抄这些名称；在上游权威纠正前只使用本文件列出的现有 Token。

### 17.4 注册表内部异常

- --eval-advantage-line 当前值包含无法作为合法视觉值解释的 “with” 片段；未纠正前禁止消费。
- 注册表注释指向当前不存在的 docs/architecture/CANONICAL_TOKEN_THEME_INVENTORY.json；该注释不是新的权威来源。
- --toolbar-h 当前值为 0px，且当前 WorkspaceToolbar 采用内容驱动高度；不得把该值解释为“隐藏工具栏”的产品决定。

## 18. PROHIBITED 清单

- 原始颜色、阴影、圆角、间距、z-index、动效时间或平行 CSS 变量。
- Tailwind/第二套 Token、功能局部调色板、直接 Naive UI 主题值。
- 未定义 Token、兼容别名扩散、语法异常 Token 的新消费。
- 假骨架成功、假棋局、假在线、假时钟、假 AI 进度或 silent fallback。
- 正常用户界面中的 API、DTO、Axios、MQTT、凭据、主题名或内部错误码。
- 进行中实时的 AI、评价、编辑、变例、来源批注或写回。
- 场外大屏中的教学工作区、分析面板、棋谱编辑和管理后台。
- 自动开启 AI、不可暂停轮播、绕过 prefers-reduced-motion 的动效。
- 只有悬停、只有颜色、只有拖拽或焦点不可见的核心操作。

## 19. 页面引用

- [登录页](页面/登录页规范.md)
- [统一工作区](页面/统一工作区页规范.md)
- [赛事列表](页面/比赛列表页规范.md)
- [赛事详情](页面/比赛详情页规范.md)
- [场外大屏](页面/赛场展示页规范.md)
- [设置表面](页面/设置界面规范.md)
- [兼容入口与不可用表面](页面/兼容性与不可用界面规范.md)

## 20. 实施验收

1. 页面使用的每个视觉值都能解析到 src/styles/tokens.css 中的现有名称。
2. 正文使用 --fs-base，不出现新的 --fs-md 消费。
3. Light、Dark、System 启动和切换无闪烁；状态在两主题下均可读。
4. 焦点、键盘、触控、对比度、状态冗余和减弱动效符合本文件。
5. 加载、刷新、空、错误、认证、权限、阻断、只读、陈旧、重连、断开和完成状态保留模块几何。
6. 棋盘、棋谱、批注、AI、赛事、回放、实时和大屏遵守当前/目标/阻断边界。
7. 兼容别名和缺陷只登记，不被新页面扩散或“顺手修复”为未批准名称。
8. 通过 Token 治理、Stylelint、静态检查、类型检查、生产构建；可见实现再完成目标页面的窄浏览器验收。
