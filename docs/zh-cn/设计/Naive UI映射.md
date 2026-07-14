# 产品 Naive UI 映射

## 1. 文档定位

本文把通用界面责任映射到 Naive UI 候选组件，同时明确项目层仍须保留的行为。Naive UI 是实现工具，不是产品组件、Token、信息架构或交互权威。

- 总入口：[产品 UI 设计索引](./PRODUCT_UI_DESIGN_INDEX.zh-CN.md)
- Token 与视觉角色：[产品 UI 设计系统](./PRODUCT_UI_DESIGN_SYSTEM.zh-CN.md)
- 组件所有权：[产品组件责任规范](./PRODUCT_COMPONENT_RESPONSIBILITY_SPEC.zh-CN.md)
- 交互和焦点：[产品全局交互规范](./PRODUCT_GLOBAL_INTERACTION_SPEC.zh-CN.md)
- 状态表达：[产品全局状态规范](./PRODUCT_GLOBAL_STATE_SPEC.zh-CN.md)
- 公共覆盖层：[产品公共覆盖层与对话框规范](./PRODUCT_COMMON_OVERLAYS_AND_DIALOGS_SPEC.zh-CN.md)
- 当前缺口：[产品实现纠正清单](./PRODUCT_IMPLEMENTATION_CORRECTION_BACKLOG.zh-CN.md)

候选映射均为 `APPROVED_TARGET`，除非明确写为 `CURRENT_IMPLEMENTED`。候选组件名不表示当前页面已经使用它。

## 2. 当前事实

当前 Naive UI 只出现在项目自有提供层：

- `src/app/providers/AppProviders.vue`：`NConfigProvider`、`NGlobalStyle`；
- `src/app/providers/naiveTheme.ts`：light 使用默认主题，dark 使用 `darkTheme`；
- `src/app/providers/naiveThemeOverrides.ts`：把 Naive UI common、Button、Card、Dialog、Dropdown、Input、Menu、Modal、Popover、Slider、Switch、Tabs 映射到项目 Token。

当前页面、表单、表格、状态面板、抽屉和对话框没有直接使用 Naive UI。后续使用必须通过项目自有适配器；页面不得直接建立第二 `NConfigProvider` 或在 props 中写平行颜色值。

## 3. 通用责任映射矩阵

| 通用责任               | 是否适用 / 状态         | Naive UI 候选                              | 项目自有适配器                                   | Token 映射                                                                     | 键盘与焦点                                                            | 产品层必须保留的行为 / 不采用时理由                                                          |
| ---------------------- | ----------------------- | ------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 主、次、文字、危险按钮 | 适用，`APPROVED_TARGET` | `NButton`、`NButtonGroup`                  | `ProductButton`（概念）                          | accent、surface、danger、border、`--control-h*`、`--r-*`、`--state-focus-ring` | 原生 Enter/Space；busy 时保留焦点；危险确认不默认聚焦。               | 动作优先级、权限分类、busy 结果、返回焦点由产品层决定。棋盘局部按钮可保持项目自有实现。      |
| 文本、密码、数字输入   | 适用                    | `NInput`、`NInputNumber`                   | `ProductField` / `ProductPasswordField`（概念）  | surface、surface-2、text、text-faint、border-focus、focus ring、control height | label 必须显式关联；错误后聚焦首个无效字段；密码显示按钮可键盘操作。  | 输入清洗、账号安全、日期/轮次领域校验留在产品层。                                            |
| 表单与字段错误         | 适用                    | `NForm`、`NFormItem`                       | `ProductForm`（概念）                            | typography、spacing、danger、control geometry                                  | Enter 提交按页面规则；错误摘要和首错焦点由适配器统一。                | 不把后端原始错误直接交给 Naive UI；产品层映射中文状态。                                      |
| 搜索框                 | 适用                    | `NInput`（clearable）                      | `ProductSearchField`（概念）                     | Input Token + text-muted                                                       | Escape 是否清空由页面定义；提交后结果标题或状态公告，不强制移焦。     | URL 已应用值、草稿值、防抖/提交、查询取消由页面层持有。                                      |
| 单选选择器             | 适用                    | `NSelect`、小集合可用 `NRadioGroup`        | `ProductSelect`（概念）                          | surface、border、accent、control height、popover shadow                        | 方向键、Home/End、Escape 和选择后焦点由底层提供；标签仍由产品层提供。 | 组别/轮次默认策略、不可用原因、URL 同步不放入 adapter。                                      |
| 日期筛选               | 条件适用                | `NDatePicker`                              | `ProductDateFilter`（概念）                      | Input/Popover/common Token                                                     | 弹层焦点、Escape、日期键盘选择；关闭回到触发器。                      | 当前 API 只确认 month/year；不得在合同未确认时发明日期范围字段。                             |
| Checkbox / Radio       | 适用                    | `NCheckbox`、`NRadio`、对应 Group          | `ProductChoiceField`（概念）                     | accent、text、border-focus、control geometry                                   | 原生 Space、方向键组行为和可见焦点。                                  | 棋盘易位权利等领域含义留在项目自有编辑器。                                                   |
| 开关                   | 适用设置项              | `NSwitch`                                  | `ProductSwitch`（概念）                          | Switch override、accent、surface-2、focus ring                                 | Space 切换；状态名不能只靠颜色。                                      | 只有立即生效且可逆的偏好使用；危险动作禁止伪装成开关。                                       |
| 滑杆                   | 条件适用设置项          | `NSlider`                                  | `ProductSlider`（概念）                          | Slider override、accent、surface-2、focus ring                                 | 方向键步进、值文本和重置动作。                                        | 棋盘尺寸/展示间距若受 `OD-05/06` 未决，不得提前暴露为已实现设置。                            |
| Tabs                   | 简单内容分区适用        | `NTabs`、`NTabPane`                        | `ProductTabs`（概念）                            | Tabs override、surface、accent、border                                         | roving tabindex、方向键、Home/End、激活面板关联；切换保留合理焦点。   | 工作区仍拥有 section 权限、滚动和模式默认项；不得由 Naive UI 保存业务状态。                  |
| 顶部/上下文菜单        | 适用                    | `NMenu`、`NDropdown`                       | `ProductMenu`（概念）                            | Menu/Dropdown override、surface、accent、shadow                                | 方向键、Escape、关闭返回触发器；禁用项说明可感知。                    | 产品导航层级和来源树不由通用 Menu 决定。                                                     |
| 标签与状态徽标         | 适用                    | `NTag`                                     | `ProductStatusTag`（概念）                       | success/warning/danger/info、surface、text；禁止自带随机色                     | 标签不可作为唯一状态说明；不可聚焦的标签不模拟按钮。                  | 赛事/直播状态中文术语和 stale 规则由产品层提供。过度 pill 化为禁止样式。                     |
| Alert / 区域状态条     | 适用                    | `NAlert`                                   | `ProductStateBanner`（概念）                     | semantic status、surface、border、spacing                                      | alert/status live 等级由状态分类决定；可操作时进入正常 Tab 顺序。     | 保留 last trusted 数据、重试资格和几何由页面层决定。                                         |
| 进度                   | 适用                    | `NProgress`                                | `ProductProgress`（概念）                        | accent、surface-2、typography；不加装饰渐变                                    | determinate 值需可访问名称；indeterminate 只公告开始/结束。           | PGN 导入和 AI 进度真实性由领域 owner 保证；禁止伪造百分比。                                  |
| Spinner                | 仅短时局部等待适用      | `NSpin`                                    | `ProductBusyIndicator`（概念）                   | accent、text-muted、spacing                                                    | 不反复公告动画帧；容器使用 `aria-busy`。                              | 不替代 retained refresh、empty、error 或 contract-blocked 状态。                             |
| Skeleton               | 条件适用                | `NSkeleton`                                | `ProductSkeleton`（概念）                        | surface-2、surface-3、radius                                                   | aria-hidden；另有简洁加载文字供辅助技术。                             | 只在真实几何已知时使用；不可伪造赛事卡片内容。工作区棋盘不使用假棋局 skeleton。              |
| Empty                  | 适用                    | `NEmpty`                                   | `ProductEmptyState`（概念）                      | text-muted、spacing、surface                                                   | 标题可被状态区引用；首要恢复动作进入焦点顺序。                        | 中文原因和动作由页面提供；搜索无结果与源为空必须区分。                                       |
| 完整错误 / 不可用      | 适用                    | `NResult` 或 `NAlert`                      | `ProductUnavailableState`（概念）                | danger/warning/info、surface、text                                             | 路由级状态把标题设为初始焦点；动作后返回可预测位置。                  | 登录需要、权限、合同未就绪、无效入口必须是不同产品状态；不暴露协议。                         |
| 普通卡片 / 分组容器    | 谨慎适用                | `NCard`                                    | `ProductSection`（概念）                         | Card override、surface、border、radius、shadow-xs/sm                           | 标题层级由页面提供；不可点击 card 不进入 Tab 顺序。                   | 禁止 KPI 卡片墙、浮夸阴影和把每个文本块卡片化。                                              |
| 赛事数据表             | 适用                    | `NDataTable`                               | `CompetitionDataTable`（概念）                   | surface、surface-2、border、text、control height                               | 列标题、行主动作、排序说明；刷新不丢当前焦点。                        | 列定义、URL 分页、retained refresh、窄屏替代列表由产品层拥有。                               |
| 简单列表               | 适用                    | `NList`、`NListItem`                       | `ProductList`（概念）                            | surface、border、spacing、typography                                           | 列表项中的主动作必须是实际 button/link。                              | PGN 和来源树有专属语义，不强制套 NList。                                                     |
| 来源树 / 层级选择      | 条件适用                | `NTree`                                    | `WorkspaceSourceTreeAdapter`（概念）             | surface、state-hover/active、accent、focus ring                                | 完整 tree 键盘、当前项、展开/折叠、类型化选中事件。                   | 来源节点模型、权限、懒加载和 `OD-01` 层级由项目层拥有；若 NTree 无法满足稳定焦点则自定义。   |
| 折叠区 / 团体台次展开  | 条件适用                | `NCollapse` 或 `NDataTable` expanded row   | `ProductDisclosure`（概念）                      | border、surface-2、accent、spacing                                             | button + `aria-expanded`、展开后不强制移焦、折叠保留触发器。          | 团体 DTO 未确认时为 `CONTRACT_BLOCKED`，不得填充示例台次。                                   |
| 分页                   | 适用                    | `NPagination`                              | `ProductPagination`（概念）                      | control height、surface-2、border、accent                                      | 当前页可感知；切页后公告并按页面策略聚焦结果标题。                    | 页码、URL、总数可信度和 display 自动轮换由产品层管理。                                       |
| Drawer                 | 适用                    | `NDrawer`、`NDrawerContent`                | `ProductDrawer`（概念）                          | surface、border、shadow-lg、spacing                                            | 模态/非模态策略明确；Escape、焦点圈定、关闭返回触发器。               | 平板/窄屏 source/context/settings 的 owner 与 scroll 容器由项目层指定。                      |
| Bottom sheet           | 适用                    | bottom placement `NDrawer`                 | `ProductSheet`（概念）                           | Drawer Token + safe-area spacing                                               | 与 drawer 相同；拖拽关闭不得成为唯一方式。                            | 用于窄屏上下文，不自动解决 `OD-09` 完整编辑。                                                |
| Modal / 确认对话框     | 适用                    | `NModal`、`NDialog` 或项目 dialog provider | `ProductDialog` / `ProductConfirmDialog`（概念） | surface、shadow-lg、radius-md、semantic status                                 | 初始焦点、Tab 圈定、Escape、busy、焦点返回由 adapter 统一。           | 危险确认、AI 首次使用、session expired 的动作和关闭策略由产品层定义。                        |
| Popover                | 适用轻量补充            | `NPopover`                                 | `ProductPopover`（概念）                         | Popover override、surface、shadow-md、radius-sm                                | click 触发时可键盘打开；Escape 和返回焦点。                           | 不承载关键错误、登录或不可恢复决定。                                                         |
| Tooltip                | 谨慎适用                | `NTooltip`                                 | `ProductTooltip`（概念）                         | text/surface/shadow                                                            | hover 与 focus 都能触发；内容不得是动作唯一名称。                     | 长期教学工作避免 tooltip 依赖；可见标签优先。                                                |
| 本地文件选择           | UI 外壳可用             | `NUpload`                                  | `LocalPgnFilePicker`（概念）                     | button/input/state Token                                                       | 有可见选择按钮、拖放等价操作、文件结果公告。                          | 文件过滤、读取、取消、部分失败、隐私和 PGN 解析必须项目自有；可继续使用原生 input。          |
| 通知 / toast           | 仅短暂非关键反馈适用    | `NMessage`、`NNotification`                | `ProductNoticeProvider`（概念）                  | semantic roles、surface、shadow                                                | 不抢焦点；重要消息另有持久状态区。                                    | 错误、权限、session expired、导入摘要禁止仅用 toast。当前 AppProviders 尚未安装该 provider。 |
| 全局 loading bar       | 谨慎适用                | `NLoadingBarProvider`                      | `ProductRouteProgress`（概念）                   | accent                                                                         | 不替代 route 标题焦点和具体区域状态。                                 | 仅真实导航/请求进度；文档完成期不要求实现。                                                  |

## 4. 必须保持项目自有的责任

| 责任                          | Naive UI 结论                 | 原因与允许复用范围                                                                                                                     |
| ----------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 规范棋盘                      | 拒绝替换                      | 棋规、局面、交互优先级、坐标、键盘、触摸、升变和视觉 Token 均由 `CanonicalChessBoard` 拥有。Naive UI 只可用于棋盘外部通用按钮/对话框。 |
| PGN 领域 UI                   | 拒绝通用组件接管              | 主线、变例、节点、注释和导航是领域模型。可在外壳使用按钮、scrollbar 或 disclosure adapter，但 PGN 树和状态所有权不外移。               |
| 标注绘制与径向菜单            | 拒绝替换                      | SVG 几何、手势冲突、撤销/重做和颜色语义项目自有；键盘等价入口可使用 ProductButton。                                                    |
| AI 生命周期                   | 拒绝由 `NSpin/NProgress` 决定 | Naive UI 只能渲染忙碌/进度外观；off、首次使用、运行、取消、失败、stale 和模式许可由项目状态机拥有。                                    |
| 工作区几何和 splitter 规则    | 拒绝 Layout 组件接管          | board-first 四区几何、无 body scroll、模块滚动和断点组合是产品合同。Drawer/Sheet 仅承载折叠区域。                                      |
| 赛场展示棋盘网格 / 可读性算法 | 拒绝通用 Grid 接管            | 单盘、四盘、九盘分页、稳定排序、聚焦返回、1080p/4K/21:9 和 `OD-05/06` 需项目算法。                                                     |
| live freshness / clock 推导   | 拒绝组件推断                  | 无真实合同前为 `CONTRACT_BLOCKED`；`NTag` 只能显示项目层给出的状态。                                                                   |

## 5. Provider 与适配器规则

1. `AppProviders.vue` 继续是唯一 Naive UI 主题入口。
2. 若采用 dialog/message/notification/loading-bar，先在项目 provider 层建立单一 owner；页面不得各自挂 provider。
3. 适配器只接受语义 variant，如 `primary`、`danger`、`warning`，不得接受任意 palette 字符串。
4. adapter 的 props/emits 必须在[组件责任规范](./PRODUCT_COMPONENT_RESPONSIBILITY_SPEC.zh-CN.md)登记。
5. `teleport` 覆盖层必须继承主题属性，并遵守 safe area、focus trap、return focus 和 scroll lock。
6. 暗色模式不得用组件局部修色；所有映射回到 `src/styles/tokens.css` 和项目主题 overrides。

## 6. 页面采用优先级

1. 第一批：按钮、字段、表单、状态、dialog/drawer 基础 adapter。
2. 第二批：赛事过滤、表格、分页、组别/轮次选择。
3. 第三批：设置 drawer、公共不可用表面、导入摘要。
4. 工作区 PGN、棋盘、标注、AI 和 display grid 仅消费上述通用 adapter，不迁移领域所有权。

## 7. 验收

- 所有 Naive UI 使用都能追溯到项目 adapter；禁止页面散落直接样式覆盖。
- computed style 只引用现有 Token；light/dark 均验证文本、边界、focus ring 和 disabled 状态。
- Dialog、Drawer、Sheet、Popover 完成键盘、Escape、focus trap、return focus 和 reduced-motion 验证。
- 表格、树、分页在键盘与触摸下保留页面层 URL、状态和滚动所有权。
- 不出现第二棋盘、通用 dashboard grid、KPI 卡片墙、过度 pill、玻璃态或装饰渐变。
