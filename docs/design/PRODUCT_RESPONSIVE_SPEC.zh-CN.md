# 开赛了产品响应式规范

| 字段         | 值                                                                  |
| ------------ | ------------------------------------------------------------------- |
| 设计方向     | 静稳棋室                                                            |
| 文档状态     | ACTIVE_IMPLEMENTATION_AUTHORITY                                     |
| 产品状态     | COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN                 |
| 产品基线     | COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN                 |
| 设计阶段门禁 | PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS（已完成） |
| 当前实施门禁 | PRODUCT_PAGE_DESIGN_DOCUMENTATION_READY_FOR_IMPLEMENTATION          |
| 响应式原则   | 棋盘与任务优先，区域重组而非复制页面                                |
| 大屏原则     | 按可读性算法分页，不按像素密度塞满棋盘                              |

## 1. 文档关系

本文件拥有宽度档位、页面区域在各档位的显示/收起/drawer/sheet 顺序、触控和安全区，以及 1080p、4K、21:9 场外显示策略。

- 总索引：[产品逐页 UI 设计索引](./PRODUCT_UI_DESIGN_INDEX.zh-CN.md)
- 视觉：[产品 UI 设计系统](./PRODUCT_UI_DESIGN_SYSTEM.zh-CN.md)
- 几何与滚动：[全局布局规范](./PRODUCT_GLOBAL_LAYOUT_SPEC.zh-CN.md)
- 交互与焦点：[全局交互规范](./PRODUCT_GLOBAL_INTERACTION_SPEC.zh-CN.md)
- 状态：[全局状态规范](./PRODUCT_GLOBAL_STATE_SPEC.zh-CN.md)
- 覆盖层：[共用覆盖层与对话框](./PRODUCT_COMMON_OVERLAYS_AND_DIALOGS_SPEC.zh-CN.md)
- 组件：[组件责任规范](./PRODUCT_COMPONENT_RESPONSIBILITY_SPEC.zh-CN.md)
- 实现差异：[实施纠正清单](./PRODUCT_IMPLEMENTATION_CORRECTION_BACKLOG.zh-CN.md)

上游权威为[响应式屏幕规范](../ui/RESPONSIVE_SCREEN_SPEC.md)、[布局系统规范](../ui/LAYOUT_SYSTEM_SPEC.md)和[产品设计蓝图](../product/PRODUCT_DESIGN_BLUEPRINT.zh-CN.md)。

## 2. 分类

| 分类                | 响应式含义                                    |
| ------------------- | --------------------------------------------- |
| CURRENT_IMPLEMENTED | 当前媒体查询、Token 和组合已经存在            |
| APPROVED_TARGET     | 页面在该档位的最终组合已经确认，等待实现      |
| CONTRACT_BLOCKED    | 只定义状态和空间，不渲染无合同内容            |
| OPEN_OWNER_DECISION | 只记录 OD 与不可越过边界，不固定推荐值        |
| PROHIBITED          | 删除核心任务、body 滚动、复制页面或不可读缩小 |

## 3. Canonical 宽度档位

| 档位            | CSS 范围   | 当前 Token 边界                             | 主要设备语境     |
| --------------- | ---------- | ------------------------------------------- | ---------------- |
| Large desktop   | >1200px    | --workspace-bp-compact: 1200px              | 大桌面、教室主机 |
| Compact desktop | 901–1200px | 1200px 到 --workspace-bp-tablet: 900px 之间 | 小桌面、笔记本   |
| Tablet          | 561–900px  | 900px 到 --workspace-bp-mobile: 560px 之间  | 平板、窄窗口     |
| Narrow          | ≤560px     | --workspace-bp-mobile: 560px                | 手机、极窄窗口   |

边界规则：1200px 属于 Compact desktop，900px 属于 Tablet，560px 属于 Narrow。CSS 媒体查询重复这些现有值，因为自定义属性不能作为媒体查询操作数；不得建立第二套断点。

高度不足是独立条件。宽度不大于 900px 且高度不大于 560px 时，允许使用低高度横屏组合，但仍属于 Tablet/Narrow 语义，不新建第五档位。

## 4. 全局适配顺序

当空间不足时按以下顺序处理：

1. 保留页面身份、主任务、真实状态和恢复动作。
2. 保留完整正方形棋盘；消费方重新测量 board host。
3. 收起来源导航并提供 drawer 触发器。
4. 把右侧上下文改为 sheet/context switcher。
5. 把次级工具移入已有上下文或受治理 overflow menu。
6. 允许模块内部换行、列表化或分页。
7. 仍不足时减少同屏大屏棋盘数量并分页。

PROHIBITED：裁剪棋盘、删除返回/状态/重试、把控件缩到触控阈值以下、让 body 滚动、让核心动作只在 hover 中出现。

## 5. 统一工作区

页面规范：[统一工作区](./pages/UNIFIED_WORKSPACE_PAGE_SPEC.zh-CN.md)。

### 5.1 区域矩阵

| 档位            | 持续可见                                                       | 收起/Drawer/Sheet                              | 控件优先级                                  | 隐藏或延后                                      |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------- | ----------------------------------------------- |
| Large desktop   | 工具栏、评价轨（仅允许评价时）、来源导航、完整棋盘、右侧上下文 | 左右区可由用户收起；右侧内部可分隔棋谱/分析    | 来源、上/下步、翻转、当前状态、当前右侧任务 | 合同阻断来源只显示不可用节点                    |
| Compact desktop | 工具栏、评价轨（仅允许评价时）、棋盘、右侧上下文；来源默认可见 | 来源是第一个可收起区域；右侧保持可达           | 上/下步、翻转、来源摘要、只读/错误状态      | 对齐、批注颜色、低频面板设置进入受治理 overflow |
| Tablet          | 工具栏主动作、棋盘、允许时的评价轨、上下文触发器               | 来源为 drawer；右侧为下方 sheet/context region | 来源、上/下步、翻转、状态、棋谱/上下文切换  | 完整批注工具、分析设置、元信息编辑进入 sheet    |
| Narrow          | 页面身份/来源摘要、棋盘、核心导航、状态、来源和上下文触发器    | 来源 drawer；右侧全宽 sheet；工具栏按任务分组  | 上/下步、翻转、返回、只读/错误、当前走法    | 完整局面编辑受 OD-09；次级注释、对齐、设置延后  |

### 5.2 大桌面

- 列宽按 --workspace-eval-w、--workspace-list-w、minmax(0, 1fr)、--workspace-panel-w。
- 棋盘宿主吸收剩余空间，消费方测量；棋盘组件不控制页面列。
- 来源列表和右侧当前 tab 分别是两个独立任务区，各自只有一个滚动所有者。
- 工具栏可换组但不能把棋盘推到视口外；收起状态保留一个可达展开按钮。

### 5.3 紧凑桌面

- 使用 --workspace-eval-w-compact、--workspace-list-w-compact 和 --workspace-panel-w-compact。
- 若完整四列造成棋盘不可完整显示，先收起来源导航；不得先隐藏当前状态或只读门禁。
- 工具栏保留任务主链；批注色板、棋盘对齐和低频面板设置可进入 overflow，但必须保留键盘路径。
- 右侧上下文不得变为第二页面或独立路由。

### 5.4 平板

CURRENT_IMPLEMENTED：内联来源导航隐藏；评价轨与棋盘在上，右侧上下文在下，使用 --workspace-panel-row-min-tablet 和 --workspace-panel-row-fluid-tablet。

APPROVED_TARGET：

- 显示明确“来源”按钮打开 drawer，关闭后焦点返回按钮。
- 右侧以下方 sheet/context region 呈现；标题、当前 tab、关闭固定，内容体滚动。
- Sheet 关闭后棋盘获得剩余高度；重新打开恢复当前 tab，不假定未实现的跨设备持久化。
- 棋盘区水平内边距使用 --workspace-board-pad-x-tablet。
- 低高度横屏可使用“评价轨｜棋盘｜右侧上下文”，右侧宽度使用 --workspace-panel-w-compact。

### 5.5 窄屏

- 使用 --workspace-eval-w-mobile 和 --workspace-board-pad-x-mobile。
- 来源 drawer 与右侧 sheet 不能同时打开；切换时先关闭前一个并完成焦点返回。
- 核心走法导航在棋盘附近持续可达；输入聚焦时不劫持方向键。
- 棋谱、评论、笔记、批注、分析和信息通过一个上下文 switcher 进入同一 sheet。
- APPROVED_TARGET：导航和轻批注可用。
- OPEN_OWNER_DECISION：完整局面编辑范围由 OD-09 决定；不得把桌面 editor 简单压缩后宣称完成。
- AI 只在本地可分析内容中从 sheet 显式启动；进行中实时完全移除 AI 与评价。

### 5.6 工作区绝不可移除

- 页面/来源身份和返回路径。
- 完整正方形棋盘。
- 当前走法及上一步/下一步路径。
- 翻转或当前视角说明。
- 只读、错误、陈旧、断开、完成或合同阻断状态。
- 来源 drawer 触发器和右侧上下文触发器。
- 可见焦点、触控等价操作和减弱动效。

## 6. 赛事列表

页面规范：[赛事列表](./pages/COMPETITION_LIST_PAGE_SPEC.zh-CN.md)。

| 档位            | 结构                                            | 筛选                 | 结果                 | 滚动         |
| --------------- | ----------------------------------------------- | -------------------- | -------------------- | ------------ |
| Large desktop   | RouteHeader + 横向筛选 + 表格 + 分页            | 全部当前公开筛选内联 | 宽表，稳定列         | ResultRegion |
| Compact desktop | RouteHeader + 可换行筛选 + 表格                 | 控件换行，不改变语义 | 可压缩列，名字换行   | ResultRegion |
| Tablet          | RouteHeader + 筛选摘要 + 结果列表/紧凑表        | 高级筛选进入 sheet   | 优先可扫描列表       | ResultRegion |
| Narrow          | 紧凑 header + 搜索 + 筛选按钮 + 卡片列表 + 分页 | 除搜索外进入 sheet   | 单列卡片，动作在末尾 | ResultRegion |

- 必保留：页面标题、搜索、当前筛选摘要、结果数量、加载/空/错误、分页和赛事详情入口。
- 不得把公开赛事空结果替换为样例赛事。
- Tablet/Narrow 的筛选 sheet 应用后返回触发器；清除筛选保留搜索焦点语义。
- 日期、状态、类型和分页只使用确认合同字段；无合同筛选不占位。

## 7. 赛事详情

页面规范：[赛事详情](./pages/COMPETITION_DETAIL_PAGE_SPEC.zh-CN.md)。

| 档位            | 持续可见                                  | 折叠方式                    | 对阵呈现               |
| --------------- | ----------------------------------------- | --------------------------- | ---------------------- |
| Large desktop   | 赛事摘要、组别、轮次、搜索、讲解/大屏动作 | 长摘要可折叠但标题/状态保留 | 团体聚合或个人台次表   |
| Compact desktop | 同上，控制区换行                          | 次级元信息折叠              | 紧凑表/列表            |
| Tablet          | 摘要、当前组别/轮次、主动作               | 组别和轮次使用受控选择层    | 单列可扫描列表         |
| Narrow          | 标题、状态、当前选择、进入讲解/大屏       | 详细摘要和筛选进入 sheet    | 单列卡片；展开团体单台 |

- 明确有效 URL 轮次始终优先。
- 讲解默认轮次与大屏/实时默认轮次是不同产品规则，响应式不得合并。
- 切换组别/轮次时结果区加载，header 和控制区保持几何。
- “进入讲解”创建类型化交接进入统一工作区；不在详情页嵌入第二棋盘。
- CONTRACT_BLOCKED 的单局回放/实时只显示真实不可用或登录状态。

## 8. 场外大屏

页面规范：[场外大屏](./pages/VENUE_DISPLAY_PAGE_SPEC.zh-CN.md)。

### 8.1 当前与目标

- CURRENT_IMPLEMENTED：公开赛事摘要、按 route/返回数据自动推导组别与轮次，以及一次最多读取 100 条并用无上限 auto-fit 排列的对阵卡片；当前没有可见组别/轮次选择器或分页。
- APPROVED_TARGET：合同就绪后的自适应多棋盘、固定聚焦、手动分页、可暂停轮播和每台故障状态。
- CONTRACT_BLOCKED：实时棋盘局面、批量订阅、权威棋钟、陈旧阈值。
- OPEN_OWNER_DECISION：OD-05、OD-06、OD-07、OD-08。

### 8.2 显示 profile

| Profile    | 设计策略                                                  | 不允许的推断                       |
| ---------- | --------------------------------------------------------- | ---------------------------------- |
| 1080p 16:9 | 倾向较少行，尽早分页；保留台号、棋手、结果/状态           | 不以蓝图推荐棋盘尺寸作为已确认阈值 |
| 4K 16:9    | 仍按 CSS 尺寸和观看距离评分；可枚举更多候选但先验收可读性 | 不因物理像素更多而自动增加棋盘     |
| 21:9       | 倾向增加列并比较信息区；单局聚焦保持棋盘正方形            | 不横向拉伸棋盘，不删除状态区       |

这些 profile 不取代算法。每次布局均根据 viewport、必需信息高度、棋盘数和聚焦状态计算。

### 8.3 多棋盘算法边界

    boardSize = min(cellWidth, cellHeight - requiredInfoHeight)

- 在评分前淘汰低于 confirmed minimumBoardSize 的候选。
- 全部候选淘汰时减少每页棋盘数并重新枚举。
- OD-05 未关闭前，minimumBoardSize 和 preferredBoardSize 只保留符号变量。
- OD-06 未关闭前，safeMargin、cellGap 和 rotationDuration 只保留符号变量。
- 三棋盘可评估一格为明确赛事摘要的 2×2 候选，但不能牺牲确认的最小可读尺寸。
- 固定棋局进入单局聚焦；退出恢复原页、排序和轮播计时。
- 异常或固定页面不应被自动轮播跳过；具体停留仍受 OD-06。

### 8.4 控件优先级

1. 当前赛事/组别/轮次和更新时间。
2. 页码、上一页、下一页、暂停/继续。
3. 固定/退出聚焦。
4. 棋盘集合和排序。
5. 次级显示偏好。

Narrow 操作员控制进入 sheet，但观众主舞台持续可见。任何 profile 都不得出现教学棋谱、AI、评价、编辑、来源批注或写回。

### 8.5 大屏绝不可移除

- 赛事、组别、轮次上下文。
- 台号、双方姓名、结果/状态。
- 分页位置和手动翻页。
- 每台不可用、断线、陈旧、完成状态。
- 暂停自动轮播与退出聚焦。
- 最后可信内容说明；时钟只在合同确认后出现。

## 9. 登录

页面规范：[登录](./pages/LOGIN_PAGE_SPEC.zh-CN.md)。

| 档位                  | 组合                                                |
| --------------------- | --------------------------------------------------- |
| Large/Compact desktop | 登录卡位于可用视口中心，保留安全返回                |
| Tablet                | 卡片宽度由可用 inline size 约束，背景不滚动         |
| Narrow                | 单列全宽安全内距；LoginSurface 在键盘出现时唯一滚动 |

- 账号、密码、显示密码、错误、提交和返回顺序不变。
- 粗指针目标至少为 --board-touch-target-min。
- 提交中不改变按钮宽度；错误出现不把返回或提交推出视口。
- 关闭虚拟键盘后焦点仍在原字段或错误摘要指定位置。

## 10. 设置

页面规范：[设置表面](./pages/SETTINGS_SURFACE_SPEC.zh-CN.md)。

| 档位            | 承载                                   |
| --------------- | -------------------------------------- |
| Large desktop   | 受治理 drawer 或 dialog；内容体滚动    |
| Compact desktop | Drawer；固定 header/footer             |
| Tablet/Narrow   | 全宽或近全宽 sheet；安全区内单列设置组 |

- CURRENT_IMPLEMENTED 仅指 Theme/Workspace Store 已拥有 `themeMode` 和批准的布局字段；当前没有可见设置表面。
- APPROVED_TARGET 的棋盘外观、语言、声音、无障碍和 AI 默认必须标明未实现所有者。
- OD-03、OD-04、OD-11 不因窄屏默认控件而关闭。
- 设置关闭后焦点返回原入口；不新增独立路由。

## 11. 兼容与不可用表面

页面规范：[兼容入口与不可用表面](./pages/COMPATIBILITY_AND_UNAVAILABLE_SURFACES_SPEC.zh-CN.md)。

- 所有档位保持一个状态标题、一段产品解释和一组恢复动作。
- 成功交接进入统一工作区；不在兼容页嵌入棋盘。
- Narrow 下动作垂直排列且满足触控尺寸。
- 加载中保持返回动作；跳转失败转真实不可用，不循环重试。
- 技术细节、凭据、端点、主题和内部 ID 永不显示。

## 12. Drawer、Sheet 与焦点

- Drawer/sheet 打开后焦点进入标题或首个可操作项；Tab 不离开表面。
- Escape 关闭；关闭后回到触发器。
- 来源 drawer 和右侧上下文 sheet 不同时打开。
- 方向或档位变化时，如果内联区域已经可见，则关闭相应 overlay，并把焦点移到等价内联控件。
- 下层模块锁定滚动，body 始终不滚动。
- 触发器持续可见且有 aria-expanded、aria-controls 和清晰名称。

## 13. 触控、键盘和安全区

- 粗指针可操作目标至少为 --board-touch-target-min。
- Hover 只增强，不承载发现。
- 拖拽批注、排序和 splitter 都有点击/键盘替代。
- 输入聚焦时不劫持方向键；棋盘与走法导航的方向键优先级由[全局交互规范](./PRODUCT_GLOBAL_INTERACTION_SPEC.zh-CN.md)唯一规定。
- 顶部、底部和左右固定/overlay 区分别使用 env(safe-area-inset-*)。
- 竖横屏切换终止旧动效、重新测量 board host、保留当前任务和焦点语义。
- prefers-reduced-motion 下 drawer/sheet 直接到最终状态，大屏不自动平移；手动翻页仍可用。

## 14. 页面族不可删除矩阵

| 页面族      | 任何档位都必须保留                                    |
| ----------- | ----------------------------------------------------- |
| 统一工作区  | 棋盘、来源/返回、走法导航、状态、上下文入口           |
| 赛事列表    | 页面身份、搜索/筛选入口、真实结果状态、分页、详情入口 |
| 赛事详情    | 赛事身份、当前组别/轮次、对阵状态、讲解/大屏入口      |
| 场外大屏    | 赛事上下文、台号/棋手/结果状态、分页、暂停/聚焦退出   |
| 登录        | 安全返回、账号、密码、提交、错误                      |
| 设置        | 设置标题、当前值、保存/重置语义、关闭                 |
| 兼容/不可用 | 页面身份、真实状态、返回/登录/重试                    |

## 15. OD 依赖

| OD    | 响应式影响               | 固定边界                   |
| ----- | ------------------------ | -------------------------- |
| OD-05 | 大屏最小/首选棋盘尺寸    | 不满足确认阈值时必须分页   |
| OD-06 | 大屏边距、间距、轮播时间 | 不可无限缩小；轮播可暂停   |
| OD-07 | 陈旧阈值和棋钟插值       | 客户端不得自定             |
| OD-08 | 匿名实时大屏范围         | 当前仅公开对阵组合可匿名   |
| OD-09 | 手机完整编辑范围         | 导航和轻批注不等于完整编辑 |
| OD-10 | 导出/打印                | 不在窄屏自动增加导出入口   |
| OD-11 | 音效默认                 | 响应式不改变默认状态       |

所有 OD 保持 OPEN_OWNER_DECISION。

## 16. PROHIBITED

- 建立除 1200/900/560 之外的平行产品断点体系。
- 把 Tablet/Narrow 实现为第二套组件或第二工作区。
- body 滚动、页面横向滚动、同一列嵌套纵向滚动。
- 隐藏核心状态、返回、重试、登录或焦点恢复。
- 通过缩小触控目标换取一行工具栏。
- 将桌面完整 editor 压缩到手机并据此关闭 OD-09。
- 将 1080p、4K 或 21:9 直接映射成固定棋盘数。
- 将 OD-05/OD-06 推荐值写成媒体查询、Token、常量或验收阈值。
- 在无实时合同的 profile 中渲染棋盘局面、时钟或新鲜度。
- 场外大屏复用教学断点、右侧面板或分析 UI。

## 17. 页面引用

- [登录页](./pages/LOGIN_PAGE_SPEC.zh-CN.md)
- [统一工作区](./pages/UNIFIED_WORKSPACE_PAGE_SPEC.zh-CN.md)
- [赛事列表](./pages/COMPETITION_LIST_PAGE_SPEC.zh-CN.md)
- [赛事详情](./pages/COMPETITION_DETAIL_PAGE_SPEC.zh-CN.md)
- [场外大屏](./pages/VENUE_DISPLAY_PAGE_SPEC.zh-CN.md)
- [设置表面](./pages/SETTINGS_SURFACE_SPEC.zh-CN.md)
- [兼容入口与不可用表面](./pages/COMPATIBILITY_AND_UNAVAILABLE_SURFACES_SPEC.zh-CN.md)

## 18. 实施验收

1. 四个宽度档位和边界值与现有 Token 一致，没有第二套产品断点。
2. 每个页面族在四档中明确持续可见、折叠、drawer/sheet、隐藏/延后和滚动所有者。
3. 棋盘宿主始终由消费页面测量；棋盘完整、正方形且主导。
4. 核心控制、状态、返回、重试和焦点路径在任何档位不丢失。
5. 粗指针、安全区、虚拟键盘、横竖屏、低高度横屏和减弱动效均可用。
6. 1080p、4K、21:9 按算法与观看距离处理，不固定棋盘数。
7. CURRENT_IMPLEMENTED、APPROVED_TARGET、CONTRACT_BLOCKED、OPEN_OWNER_DECISION 和 PROHIBITED 没有混写。
8. OD-05、OD-06、OD-09 未关闭，推荐显示值没有变成常量。
9. 进行中实时没有 AI、评价、编辑或来源写回；无合同大屏没有假棋盘/时钟。
10. 可见实现完成目标路由的非空 DOM、无 Vite overlay/console 破坏错误、键盘焦点、触控和真实交互状态变化验收。
