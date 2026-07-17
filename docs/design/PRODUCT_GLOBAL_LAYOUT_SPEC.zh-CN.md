# 开赛了产品全局布局规范

| 字段         | 值                                                                  |
| ------------ | ------------------------------------------------------------------- |
| 设计方向     | 静稳棋室                                                            |
| 文档状态     | ACTIVE_IMPLEMENTATION_AUTHORITY                                     |
| 产品状态     | COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN                 |
| 产品基线     | COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN                 |
| 设计阶段门禁 | PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS（已完成） |
| 当前实施门禁 | PRODUCT_PAGE_DESIGN_DOCUMENTATION_READY_FOR_IMPLEMENTATION          |
| 视口原则     | 应用壳占满动态视口，body 不滚动                                     |
| 布局权威     | 本文件、src/styles/tokens.css、docs/ui/LAYOUT_SYSTEM_SPEC.md        |

## 1. 文档关系

本文件拥有应用壳、路由壳、页面壳、区域几何、滚动、分隔器、抽屉/sheet 占位和安全区。它不拥有控件视觉、状态文案、组件是否存在或具体页面业务。

- 总索引：[产品逐页 UI 设计索引](./PRODUCT_UI_DESIGN_INDEX.zh-CN.md)
- 视觉：[产品 UI 设计系统](./PRODUCT_UI_DESIGN_SYSTEM.zh-CN.md)
- 断点与页面折叠：[响应式规范](./PRODUCT_RESPONSIVE_SPEC.zh-CN.md)
- 交互与焦点：[全局交互规范](./PRODUCT_GLOBAL_INTERACTION_SPEC.zh-CN.md)
- 状态占位：[全局状态规范](./PRODUCT_GLOBAL_STATE_SPEC.zh-CN.md)
- 覆盖层：[共用覆盖层与对话框](./PRODUCT_COMMON_OVERLAYS_AND_DIALOGS_SPEC.zh-CN.md)
- 组件所有权：[组件责任规范](./PRODUCT_COMPONENT_RESPONSIBILITY_SPEC.zh-CN.md)
- 当前差异：[实施纠正清单](./PRODUCT_IMPLEMENTATION_CORRECTION_BACKLOG.zh-CN.md)

上游产品结构见[产品信息架构](../product/PRODUCT_INFORMATION_ARCHITECTURE.json)和[产品设计蓝图](../product/PRODUCT_DESIGN_BLUEPRINT.zh-CN.md)。

## 2. 分类

| 分类                | 布局含义                                         |
| ------------------- | ------------------------------------------------ |
| CURRENT_IMPLEMENTED | 当前 App、route、workspace 或 Token 已实现的几何 |
| APPROVED_TARGET     | 页面设计已经固定的组合，等待实现或纠正           |
| CONTRACT_BLOCKED    | 数据不足，保留布局位置但不得伪造内容             |
| OPEN_OWNER_DECISION | 几何需真实设备或所有者确认，页面只能保留符号变量 |
| PROHIBITED          | body 滚动、重复外壳、不可读缩小、未治理原始几何  |

## 3. 全局布局定律

1. html、body 和应用根不承担产品内容滚动。
2. AppShell 高度为 --workspace-viewport-h，当前值 100dvh；提供浏览器兼容回退时仍由应用根拥有视口。
3. AppShell、RouteShell、PageShell、Module 四层都声明固定区、弹性区和唯一滚动所有者。
4. 所有可收缩 Grid/Flex 子项设置 min-width: 0 和 min-height: 0。
5. 同一视觉列只有一个纵向滚动所有者；嵌套纵向滚动必须有独立任务边界并在页面规范明确。
6. Header、toolbar、filter summary、pagination、status bar 不随模块内容滚走。
7. Loading、empty、error、permission、blocked 和 stale 在所属模块内替换内容，不改变外壳轨道。
8. 棋盘宿主由消费页面测量；CanonicalChessBoard 不拥有页面、视口或相邻面板几何。
9. 场外大屏是独立 RouteShell，绝不复用 TeachingWorkspace 外壳。
10. 几何只能使用 src/styles/tokens.css 中现有 Token 或 CSS 的弹性关系；不得写未治理宽高常量。

## 4. 壳层级

### 4.1 结构

    html/body
    └─ AppShell：动态视口、overflow hidden
       └─ RouterView
          ├─ WorkspaceShell
          │  ├─ WorkspaceToolbar：固定
          │  └─ WorkspaceMain：弹性、无外层滚动
          ├─ ProductRouteShell
          │  ├─ RouteHeader：固定
          │  └─ RouteBody：弹性、模块滚动
          ├─ VenueDisplayShell：独立
          └─ LoginShell：独立

CURRENT_IMPLEMENTED：src/App.vue 已使用 --workspace-viewport-h、min-height: 0 和 overflow: hidden。每个页面根继续承担自己的布局合同。

### 4.2 AppShell

| 属性     | 合同                                |
| -------- | ----------------------------------- |
| 高度     | height: var(--workspace-viewport-h) |
| 最小尺寸 | min-width: 0；min-height: 0         |
| 滚动     | overflow: hidden                    |
| 背景     | --bg                                |
| 子级     | 只能有一个活动 RouterView 页面壳    |

AppShell 不拥有产品 header、modal、toast、Query 状态或页面内滚动。全局 provider 必须布局中性。

### 4.3 RouteShell

非工作区路由采用两行结构：

    RouteShell
    ├─ RouteHeader：auto，稳定
    └─ RouteBody：minmax(0, 1fr)

- RouteShell 高度使用 --workspace-viewport-h，不使用 min-height 造成 body 延长。
- RouteHeader 可使用 --brand-h 作为 APPROVED_TARGET 的稳定最小高度；当前 RouteHeader 仍为内容驱动。
- RouteHeader 内标题和全局动作在窄屏可换行，但换行后 RouteBody 仍只占剩余视口。
- --toolbar-h 当前为 0px 且没有当前布局所有权；不得作为隐藏 header/toolbar 的依据。

### 4.4 PageShell

每个页面规范必须列出：

1. 页面固定区。
2. 页面弹性区。
3. 每个模块的滚动所有者。
4. overlay 的触发器、焦点返回点和 scroll lock。
5. loading/error 时保留的轨道。
6. 各断点的折叠顺序。

## 5. 统一工作区几何

页面规范：[统一工作区](./pages/UNIFIED_WORKSPACE_PAGE_SPEC.zh-CN.md)。

### 5.1 纵向结构

    WorkspaceShell：--workspace-viewport-h
    ├─ WorkspaceToolbar：flex 0 0 auto，内容驱动
    └─ WorkspaceMain：flex 1 1 auto，min-height 0

CURRENT_IMPLEMENTED：WorkspaceToolbar 在顶部；工作区主布局不滚动。工具栏收起只改变工具栏内部，不改变 AppShell。

### 5.2 大桌面四列

宽度大于 1200px 时，CURRENT_IMPLEMENTED 的列从左到右为：

    [评价轨] [来源导航] [中央棋盘宿主] [右侧上下文]
    eval     list       minmax(0,1fr)   panel

| 区域       | 当前 Token                   | 当前值/关系               | 滚动                  |
| ---------- | ---------------------------- | ------------------------- | --------------------- |
| 评价轨     | --workspace-eval-w           | clamp(42px, 2.6vw, 64px)  | 不滚动                |
| 来源导航   | --workspace-list-w           | clamp(248px, 18vw, 380px) | list-inner 唯一滚动   |
| 来源收起   | --workspace-list-collapsed-w | 0px                       | 收起按钮仍可达        |
| 棋盘宿主   | minmax(0, 1fr)               | 吸收剩余宽度              | 不滚动                |
| 右侧上下文 | --workspace-panel-w          | clamp(336px, 24vw, 520px) | 当前 tab 内容唯一滚动 |

评价轨不是来源导航的一部分；它位于最左侧并与主棋盘同高。若分析因模式被禁止，轨道不得显示伪评价；页面规范决定隐藏轨道或呈现无评价的中性结构，且不得留下假数据。

### 5.3 紧凑桌面四列

宽度 901–1200px 使用：

| 区域       | Token                       | 当前值                    |
| ---------- | --------------------------- | ------------------------- |
| 评价轨     | --workspace-eval-w-compact  | 40px                      |
| 来源导航   | --workspace-list-w-compact  | clamp(208px, 17vw, 264px) |
| 棋盘宿主   | minmax(0, 1fr)              | 剩余空间                  |
| 右侧上下文 | --workspace-panel-w-compact | clamp(300px, 23vw, 360px) |

APPROVED_TARGET：内容压力首先允许用户收起来源导航；不得先缩小棋盘到无法完整显示或隐藏只读/错误状态。

### 5.4 平板和窄屏轨道

CURRENT_IMPLEMENTED 在宽度不大于 900px 时隐藏内联来源导航，并把评价轨、棋盘和右侧上下文改为：

    [评价轨 | 棋盘]
    [评价轨 | 右侧上下文]

| Token                              | 当前值 |
| ---------------------------------- | ------ |
| --workspace-eval-w-tablet          | 34px   |
| --workspace-panel-row-min-tablet   | 370px  |
| --workspace-panel-row-fluid-tablet | 42vh   |
| --workspace-board-pad-x-tablet     | 6px    |

宽度不大于 560px 时使用：

| Token                              | 当前值 |
| ---------------------------------- | ------ |
| --workspace-eval-w-mobile          | 30px   |
| --workspace-panel-row-min-mobile   | 360px  |
| --workspace-panel-row-fluid-mobile | 44vh   |
| --workspace-board-pad-x-mobile     | 4px    |

APPROVED_TARGET：

- 来源导航由受控 drawer 打开，不因 display:none 永久失去入口。
- 右侧上下文是可关闭的下方 sheet/context region；打开时使用对应 row Token，关闭时棋盘获得剩余空间。
- Sheet 标题、当前 tab 和关闭操作固定；只有内容体滚动。
- 完整移动端局面编辑仍为 OPEN_OWNER_DECISION（OD-09）；布局不得把它默认为可用。

低高度平板横屏可使用现有关系：

    [评价轨 | 棋盘 | 右侧上下文]

其中评价轨使用 --workspace-eval-w-tablet，右侧使用 --workspace-panel-w-compact。来源仍通过 drawer。

### 5.5 工作区内边距和边界

| Token                          | 当前值                  |
| ------------------------------ | ----------------------- |
| --workspace-board-pad-x        | clamp(6px, 0.7vw, 12px) |
| --workspace-board-pad-x-tablet | 6px                     |
| --workspace-board-pad-x-mobile | 4px                     |
| --workspace-board-pad-y        | 0px                     |
| --workspace-border-w           | 1px                     |

棋盘区域使用水平内边距 Token，纵向不增加未治理空间。来源和右侧上下文分别用 --border 和 --workspace-border-w 与棋盘区分。

## 6. 棋盘宿主测量合同

### 6.1 所有权

消费页面或 Workspace 的 board host 拥有可用空间和测量；CanonicalChessBoard 只填充宿主，并在组件内部拥有坐标槽、方格和 overlay。

    availableInline = boardHost.contentBoxInlineSize
    availableBlock  = boardHost.contentBoxBlockSize
    boardOuterSize  = min(availableInline, availableBlock)

坐标区域由棋盘内部的以下 Token 处理：

- --board-coordinate-gutter：clamp(38px, min(5.6cqw, 5.6cqh), 64px)
- --board-coordinate-gap：clamp(6px, min(0.8cqw, 0.8cqh), 10px)
- --board-coordinate-pad：clamp(6px, min(1cqw, 1cqh), 12px)

消费方不得再次扣减同一坐标槽，不得读取棋盘内部方格尺寸来反向控制页面，也不得创建第二个棋盘 ResizeObserver 所有者。

### 6.2 稳定条件

- 左右面板收起/展开后重新测量宿主，但不触发 body reflow。
- 加载、错误、只读、陈旧和重连提示位于棋盘模块的稳定状态槽，不覆盖或推离棋盘，除非页面规范明确保留固定高度。
- 棋盘始终正方形、完整可见；不足空间时先折叠上下文、再分页或打开 sheet，不裁剪棋盘。
- 单棋盘场外聚焦不拉伸棋盘；剩余空间用于棋手、状态和呼吸区。

## 7. 来源导航与收起控件

| Token                          | 当前值 | 责任           |
| ------------------------------ | ------ | -------------- |
| --workspace-list-handle-w      | 16px   | 当前收起柄宽度 |
| --workspace-list-handle-h      | 48px   | 当前收起柄高度 |
| --workspace-list-handle-offset | -16px  | 收起后外移关系 |
| --workspace-shell-z-raised     | 6      | 当前抬高层级   |

- 收起柄必须可聚焦、有展开/收起名称和 aria 状态。
- 来源内容由 list-inner 滚动；搜索、当前来源摘要和关键导入动作保持在固定区或 sticky 模块头。
- Drawer 模式打开后焦点进入标题或首个可操作项；关闭后回到来源触发器。
- 来源层级和右侧上下文不能共享一个 drawer，以免焦点和任务所有权混淆。

## 8. 右侧上下文和分隔器

### 8.1 宽度与纵向分区

桌面宽度使用 --workspace-panel-w 或 --workspace-panel-w-compact。右侧自身 overflow hidden；当前 tab 内容区承担唯一滚动。

当分析区显示时：

- 棋谱区与分析区最小高度均受 --workspace-right-pane-min-h（180px）保护。
- 分隔器高度为 --workspace-splitter-h（12px）。
- 当前右侧棋谱高度来自实例级 --workspace-right-pgn-h；其持久化所有者是 rightPgnHeightPx，不是全局 Token。
- 未出现分析区时，棋谱区获得全部弹性高度。

### 8.2 分隔器

| Token                              | 当前值 |
| ---------------------------------- | ------ |
| --workspace-splitter-h             | 12px   |
| --workspace-splitter-hit-offset    | -5px   |
| --workspace-splitter-grip-w        | 44px   |
| --workspace-splitter-grip-w-active | 64px   |
| --workspace-splitter-grip-h        | 3px    |

- 分隔器有 separator 语义、当前值、最小/最大值和键盘方向键操作。
- 指针捕获期间不选择文本，不改变 body 滚动。
- 触控命中区包含 hit offset，但视觉 grip 不必放大。
- 调整不得让任一区域低于 --workspace-right-pane-min-h。
- 平板/窄屏 sheet 中若不同时显示棋谱与分析，则不呈现无意义的分隔器。

## 9. 滚动所有权矩阵

| 表面         | 固定区                                | 唯一滚动区                         | PROHIBITED                      |
| ------------ | ------------------------------------- | ---------------------------------- | ------------------------------- |
| 统一工作区   | WorkspaceToolbar、棋盘                | 左来源 list-inner；右当前 tab 内容 | body、棋盘、同列双滚动          |
| 赛事列表     | RouteHeader、筛选摘要、分页槽         | 结果表/列表                        | 页面 body、表格内再嵌套列表滚动 |
| 赛事详情     | RouteHeader、赛事摘要、组别/轮次控制  | 对阵列表                           | 每轮次各自纵向滚动              |
| 当前公开大屏 | RouteHeader/显示上下文、组别/轮次控制 | 无滚动的全对阵自适应网格           | body、网格、教学 shell 滚动     |
| 登录         | 页面背景                              | login-surface 在高度不足时唯一滚动 | 卡片内部和页面同时滚动          |
| 设置         | Sheet/Dialog header 与 footer         | 设置内容体                         | 每个设置组独立滚动              |
| 兼容/不可用  | RouteHeader                           | 状态内容仅在高度不足时滚动         | 空白页面或自动跳转循环          |

滚动区统一使用 scrollbar-gutter: stable。隐藏滚动条时仍保留几何和键盘/触控滚动能力。

## 10. 赛事列表页面几何

页面规范：[赛事列表](./pages/COMPETITION_LIST_PAGE_SPEC.zh-CN.md)。

    ProductRouteShell
    ├─ RouteHeader：固定
    └─ RouteBody
       ├─ FilterRegion：固定或可折叠
       ├─ ResultMeta：固定
       ├─ ResultRegion：唯一滚动
       └─ PaginationRegion：固定

- RouteBody 使用 minmax(0, 1fr)，不通过 min-height 延长 body。
- 桌面筛选使用弹性 Grid；控件高度使用 --control-h-sm 或 --control-h。
- 结果表和列表共用同一内容轨道，状态替换不移动筛选和分页。
- Tablet/Narrow 由筛选 summary 打开 sheet；应用或清除后返回触发器。
- 表格横向滚动只能属于 ResultRegion；窄屏优先改为字段明确的列表，而非让整个页面横向滚动。

## 11. 赛事详情页面几何

页面规范：[赛事详情](./pages/COMPETITION_DETAIL_PAGE_SPEC.zh-CN.md)。

    ProductRouteShell
    ├─ RouteHeader：固定
    └─ RouteBody
       ├─ EventSummary：稳定
       ├─ GroupRoundControls：稳定
       ├─ PairingSearchAndActions：稳定
       ├─ PairingRegion：唯一滚动
       └─ Pagination/Handoff：稳定

- 赛事摘要、讲解交接和大屏入口不随对阵列表滚走。
- 组别切换保留赛事筛选，清除失效轮次/台次；轨道高度不因当前值长短跳动。
- 团体对阵展开在 PairingRegion 内完成，不产生第二纵向滚动条。
- Loading/error/empty 只替换 PairingRegion 或明确受影响模块。

## 12. 独立场外大屏几何

页面规范：[场外大屏](./pages/VENUE_DISPLAY_PAGE_SPEC.zh-CN.md)。

    VenueDisplayShell
    ├─ DisplayContext：赛事、组别、轮次、更新时间
    ├─ DisplayControls：组别、显式轮次覆盖
    └─ DisplayStage：minmax(0, 1fr)
       └─ AdaptiveAllPairingGrid（CURRENT_IMPLEMENTED 几何，CONTRACT_BLOCKED 实时棋盘数据）

- VenueDisplayShell 使用同一 --workspace-viewport-h 和全局 Token，但不导入 WorkspaceToolbar、来源导航、右侧棋谱、分析或编辑区。
- CURRENT_IMPLEMENTED 枚举 `1..pairingCount` 列，以舞台实测宽高、Token 间距与选手头部高度最大化正方棋盘；同分先减少空格，再降低宽高失真。
- 所选轮次全部对阵按来源顺序在一个视口中同时存在；等列、等行、等棋盘几何，不分页、不轮播、不聚焦覆盖、不隐藏溢出。
- 不存在真实权威 FEN 时保留同尺寸合同阻断棋盘舞台，绝不渲染默认起始局面。
- OD-05 未关闭前不声明最终最小/首选棋盘尺寸；OD-06 未关闭前，当前全局 Token 间距仍是可审查的临时值而非最终设备常量。

## 13. 登录与设置几何

### 13.1 登录

页面规范：[登录](./pages/LOGIN_PAGE_SPEC.zh-CN.md)。

- LoginShell 高度为 --workspace-viewport-h，背景 --bg。
- LoginSurface 是高度不足时的唯一滚动区，并尊重 safe area。
- LoginCard 使用 --surface、--r-lg、--shadow-lg 和 --s-5/--s-6 形成稳定表单。
- 标题、账号、密码、显示密码、错误、提交和安全返回顺序固定。
- 提交 loading/error 不改变卡片宽度或把返回动作推出视口。

### 13.2 设置

页面规范：[设置表面](./pages/SETTINGS_SURFACE_SPEC.zh-CN.md)。

- 设置不新增路由；由受治理 drawer、sheet 或 dialog 承载。
- Header 和 footer 固定，内容体唯一滚动。
- 当前只允许实际有所有者的 themeMode 和工作区布局成为 CURRENT_IMPLEMENTED。
- 棋盘外观、语言、声音、AI 默认等为 APPROVED_TARGET 或 OPEN_OWNER_DECISION，不占用已实现设置的假表单空间。

## 14. 兼容与不可用表面

页面规范：[兼容入口与不可用表面](./pages/COMPATIBILITY_AND_UNAVAILABLE_SURFACES_SPEC.zh-CN.md)。

- 兼容路由只显示交接进度或真实不可用状态。
- 成功交接进入同一 routerPath / 工作区；不创建第二 WorkspaceShell。
- 状态区居中于 RouteBody 的可用空间；标题、解释、恢复动作保持稳定。
- 自动跳转不得形成循环；失败时页面仍有返回赛事、工作区或登录的可达动作。

## 15. Drawer、Sheet、Dialog 和 Popover 空间合同

行为和视觉分别引用[共用覆盖层与对话框](./PRODUCT_COMMON_OVERLAYS_AND_DIALOGS_SPEC.zh-CN.md)和[产品 UI 设计系统](./PRODUCT_UI_DESIGN_SYSTEM.zh-CN.md)。

### 15.1 共同结构

    OverlayRoot
    ├─ Backdrop：锁定下层滚动
    └─ Surface
       ├─ Header：固定
       ├─ Body：minmax(0,1fr)，唯一滚动
       └─ Footer：固定（需要动作时）

- Surface 尊重 env(safe-area-inset-top/right/bottom/left)。
- Drawer 从来源触发器一侧进入；sheet 从上下文区进入；不得用同一覆盖层混合来源和右侧任务。
- Dialog 只用于确认、登录恢复、导入摘要或必须聚焦的短任务。
- Popover 只用于短菜单、短说明和局部选择，不承载长表单、棋谱或错误恢复。
- 当前注册表没有通用 overlay z-index Token；必须由项目自有 overlay adapter 的单一堆叠所有者处理，不得在页面写原始 z-index。

## 16. 安全区和视口变化

- AppShell 使用动态视口高度；移动浏览器栏变化只改变 AppShell，不产生 body 滚动。
- 顶部固定区增加 env(safe-area-inset-top)，底部动作区增加 env(safe-area-inset-bottom)。
- 左右 drawer 分别考虑 left/right safe area。
- 虚拟键盘出现时，活动输入和错误仍在 LoginSurface 或 overlay body 的滚动可视范围内；棋盘不承担表单滚动。
- 横竖屏切换终止旧几何动效，重新测量 board host，并把焦点保持在等价控件或当前棋盘。

## 17. 状态几何

| 状态      | 占位规则                                                       |
| --------- | -------------------------------------------------------------- |
| 首次加载  | 骨架占据最终模块内容轨道；固定 header/filter/pagination 不移动 |
| 后台刷新  | 保留旧内容；刷新标识位于模块 header/status slot                |
| 空        | 与结果区同高的空状态，不吞掉筛选和清除动作                     |
| 错误      | 替换受影响内容区；不扩展页面高度                               |
| 认证/权限 | 在保护模块或受治理 overlay 中处理；公开页面其余区域保留        |
| 合同阻断  | 保留入口位置和解释，不保留假内容卡                             |
| 陈旧/重连 | 保留最后可信内容，状态槽高度固定                               |
| 完成      | 保留结果和下一步动作；不自动变成可编辑布局                     |

## 18. 响应式摘要

详细合同见[响应式规范](./PRODUCT_RESPONSIVE_SPEC.zh-CN.md)。

| 档位            | 范围       | 布局摘要                                      |
| --------------- | ---------- | --------------------------------------------- |
| Large desktop   | >1200px    | 工作区四列；赛事宽布局                        |
| Compact desktop | 901–1200px | 紧凑四列，来源优先可收起                      |
| Tablet          | 561–900px  | 棋盘主导；来源 drawer；右上下文受控下方 sheet |
| Narrow          | ≤560px     | 单任务、棋盘优先；来源 drawer；右上下文 sheet |

CSS 媒体查询使用与 --workspace-bp-compact、--workspace-bp-tablet、--workspace-bp-mobile 相同的当前值，因为自定义属性不能直接作为媒体查询操作数。

## 19. PROHIBITED

- html/body 或 AppShell 的产品内容滚动。
- 页面根使用 min-height 把动态视口撑长并产生 body scroll。
- 同一视觉列中的嵌套纵向滚动。
- 通过固定原始 px 宽高绕过现有 Token。
- 棋盘组件读取/修改页面轨道，或消费方重复拥有棋盘内部坐标几何。
- 收起面板后没有可达恢复按钮。
- Loading/error 时移动 header、筛选、分页、棋盘或主要动作。
- 场外大屏导入 TeachingWorkspace，或把教学断点直接当大屏布局算法。
- 把 OD-05/OD-06 推荐值写成 CSS 常量、Token 或验收阈值。
- Overlay 自建 z-index、背景锁定或焦点逻辑。

## 20. 页面引用

- [登录页](./pages/LOGIN_PAGE_SPEC.zh-CN.md)
- [统一工作区](./pages/UNIFIED_WORKSPACE_PAGE_SPEC.zh-CN.md)
- [赛事列表](./pages/COMPETITION_LIST_PAGE_SPEC.zh-CN.md)
- [赛事详情](./pages/COMPETITION_DETAIL_PAGE_SPEC.zh-CN.md)
- [场外大屏](./pages/VENUE_DISPLAY_PAGE_SPEC.zh-CN.md)
- [设置表面](./pages/SETTINGS_SURFACE_SPEC.zh-CN.md)
- [兼容入口与不可用表面](./pages/COMPATIBILITY_AND_UNAVAILABLE_SURFACES_SPEC.zh-CN.md)

## 21. 实施验收

1. 每个页面根都有 App/Route/Page/Module 布局合同和唯一滚动所有者。
2. html、body、AppShell 不滚动；所有弹性子项具备 min-width/min-height 0。
3. 大桌面与紧凑桌面工作区使用现有列 Token；平板/窄屏有来源 drawer 和上下文 sheet 恢复路径。
4. 消费方拥有 board host 测量，棋盘始终完整正方形且不重复扣减坐标槽。
5. 右侧分隔器遵守最小高度、键盘和触控合同。
6. 赛事、详情、登录、兼容和大屏各有独立壳，不复制工作区。
7. Loading、refresh、empty、error、auth、permission、blocked、stale 和 completed 不改变外壳轨道。
8. Safe area、虚拟键盘、横竖屏和低高度横屏均有明确所有权。
9. OD-05、OD-06、OD-09 保持 OPEN；没有推荐值进入运行时常量。
10. 通过布局静态检查、Token 治理、Stylelint、类型检查、生产构建及页面窄浏览器验收。
