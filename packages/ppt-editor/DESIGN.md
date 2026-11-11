# element-ai-vue-ppt：独立 PPT 编辑核心包设计方案

更新日期：2026-10-30  
状态：待评审。本文替代 packages/components/ppt 下的旧方案；本次只整理设计与任务分区，未实现以下功能。  
配套文档：[本期任务分区与验收](./TASKS.md)。

## 1. 本次调整与已确认范围

用户已确定：

1. 核心代码放在 packages/ppt-editor，发布为独立 npm 包 **element-ai-vue-ppt**。
2. 包可直接引入、独立使用；packages/components/ppt 只封装并引用该包。
3. 采用标准 OOXML 作为 PPTX 文档底层，支持导入、编辑、导出。
4. 文件范围明确为 **PPTX 和旧版 PPT**，不包含 Word、Excel。
5. 多人协作、移动端编辑、完整母版编辑均属于**本期交付范围**，可按任务分区实施，不能作为后续可选功能省略。
6. 支持链接、本地文件、流式输入；AI 生成期间实时预览并禁止人工修改，完成收尾后恢复编辑。
7. 自主研发并可商用，不依赖付费编辑 SDK。

本方案选择的工程路线：

- 自研标准包内核、渲染、编辑命令、母版工具和组件交互。
- 单机 PPTX 编辑可在浏览器独立运行；跨设备协作需要自部署服务。
- 旧版 PPT 使用本期一并交付的免费格式转换服务适配，进入同一个 OOXML 内核。服务通过 LibreOffice 独立进程实现，不将其误称为 MIT 的前端依赖。
- 既提供 Vue 组件，也提供命令式挂载入口；不依赖 element-ai-vue 主组件库、theme-chalk 或仓库私有别名。
- PPTX 支持 Transitional 与 Strict 的识别、解析和对应命名空间写回；不能无提示将全部文件转换成另一种变体。
- 本期按完整产品任务拆分，前置里程碑只是研发顺序，不代表以基础预览版替代完整交付。

“支持任意来源”通过真实兼容样本和能力矩阵验收，不以文件后缀可打开就宣称所有对象无损。损坏文件、未知私有扩展、缺失字体与加密权限仍需明确处理；未达到目标的条目是待修复项，不能静默算作完成。

## 2. 标准、服务与数据模型的边界

| 层            | 采用方式                                         | 是否标准文档格式         |
| ------------- | ------------------------------------------------ | ------------------------ |
| PPTX 文件     | OPC 包、PresentationML、DrawingML 与关系图       | 是，OOXML                |
| 旧版 PPT 文件 | MS-PPT 二进制，经转换适配导入/导出               | 是，旧版格式；不是 OOXML |
| 显示模型      | 从标准文档派生的几何、文字和能力缓存             | 否，不作为替代文件       |
| 编辑/流式命令 | 本包定义的版本化操作消息                         | 否，不冒充 Office 标准   |
| 协作状态      | 标准文档检查点 + 有序操作日志 + 文本 CRDT 检查点 | 会话存储，可导出标准文件 |

保留原包和局部修改是基本原则，不能把整份 PPTX 降为简单 JSON 再重新生成。协作日志是标准文档修改的可重放记录，显示缓存不是另一份文档真相。

三条技术路线的结论：

| 路线                           | 评价                                                 |
| ------------------------------ | ---------------------------------------------------- |
| 自定义 JSON 重建 PPTX          | 早期容易实现，但不利于保留复杂原始内容，不作为主路线 |
| 标准包内核 + 命令层 + 自研渲染 | 已选择；承担兼容实现成本，掌握核心能力               |
| 接入现成付费 Office 编辑器     | 不采用；也不直接复制 AGPL 编辑器到 MIT 核心包        |

## 3. 独立包与组件库的关系

```text
业务应用
├── 直接使用 element-ai-vue-ppt
│   ├── PptEditor：Vue 组件
│   ├── createPptEditor：命令式挂载
│   └── ./core：无 UI 的标准文档与命令能力
└── 使用 element-ai-vue 的 ElAPpt
    └── packages/components/ppt：薄封装
        └── element-ai-vue-ppt：同一个核心包

可自部署配套服务
├── ./server：协作、权限、快照、资源、生成会话
└── conversion adapter：旧版 PPT ↔ PPTX
```

### 3.1 包职责

element-ai-vue-ppt 自带独立样式、图标、基础工具栏、桌面/移动端 UI、语言配置与主题变量。单独使用时不需要先安装 element-ai-vue。

根入口导出 PptEditor、createPptEditor 和公开类型。Vue 作为 peer dependency；命令式入口内部可挂载 Vue UI，宿主可以是普通网页或其他框架，但仍需要满足该运行时依赖。若用户只需要解析/操作文档，可以导入 ./core，不加载 Vue 和浏览器 UI。

服务端入口只通过 ./server 暴露；浏览器入口不能间接引入 Node 文件系统、WebSocket 服务端或转换进程代码。

### 3.2 ElAPpt 包装职责

- 保持 ElAPpt 名称和现有组件注册方式。
- 将属性、插槽、事件、实例方法转发到核心包；不得维护第二套协议或编辑实现。
- 适配主库主题变量与语言；核心包自身仍可独立设置主题。
- 通过公开 npm 包路径导入，不跨目录引用 ../../ppt-editor/src。
- 不在主库复制核心 CSS；由样式入口引用已发布包的样式。
- 核心能力的缺陷在核心包修复，包装层只解决主库集成问题。

### 3.3 拟议目录

```text
packages/ppt-editor/
├── DESIGN.md / TASKS.md
├── package.json / README.md / LICENSE
├── src/
│   ├── index.ts / imperative.ts
│   ├── core/
│   │   ├── opc/                 包、部件、Content Types、关系图
│   │   ├── xml/                 命名空间、局部写回与 XML 适配器
│   │   ├── presentation/        页面、母版、布局、主题、对象
│   │   ├── commands/            事务、冲突检测、逆操作
│   │   ├── text/                DrawingML 文本映射
│   │   ├── validation/
│   │   └── export/
│   ├── render/                  布局、字体、DOM/SVG、缩略图
│   ├── editor/                  选择、文本、图形、表格、图表工具
│   ├── master/                  母版和布局编辑 UI
│   ├── mobile/                  触摸手势、键盘、属性面板
│   ├── collaboration/           客户端、文本绑定、在线状态
│   ├── stream/                  SSE/NDJSON/事件输入与生成会话
│   ├── sources/                 URL、File、字节流、转换适配
│   ├── vue/                     PptEditor 与组合式 API
│   ├── styles/                  独立 CSS、主题变量
│   ├── workers/                 解压、资源处理、压缩
│   └── server/                  Node 服务能力，独立入口
├── templates/                   项目自建、来源清楚的标准模板
├── examples/                    独立 Vue、命令式、移动端、协作示例
├── services/conversion/         免费转换服务、镜像与部署说明
├── scripts/                     独立构建、打包检查
└── tests/                       单元、样本、浏览器、协作、打包验收

packages/components/ppt/          ElAPpt 适配层
```

以上为实施时的目标目录，本次只创建方案文件，不创建尚不能运行的空实现。

## 4. npm 发布与仓库构建

包名固定为 element-ai-vue-ppt；建议首个完整范围验收版本使用 0.x，独立遵循 SemVer，不强制跟随主组件库版本。包名可发布权限在发布准备时确认，不能由本方案假定已占用或已注册。

目标导出面：

| 子路径                           | 内容                           | 运行环境                               |
| -------------------------------- | ------------------------------ | -------------------------------------- |
| element-ai-vue-ppt               | Vue 组件、命令式挂载、公开类型 | 浏览器；SSR 导入安全                   |
| element-ai-vue-ppt/core          | 包模型、命令、格式检测、校验   | 浏览器/Node，通过适配器处理 XML 和资源 |
| element-ai-vue-ppt/collaboration | 协作客户端和宿主接口           | 浏览器                                 |
| element-ai-vue-ppt/stream        | SSE/NDJSON 解码、生成协议      | 浏览器/Node                            |
| element-ai-vue-ppt/server        | 自部署协作服务工厂与存储接口   | Node                                   |
| element-ai-vue-ppt/style.css     | 完整基础样式和变量             | CSS                                    |

各代码入口产出 ESM/CJS 和对应声明文件，CSS 标记为有副作用。Vue、Yjs 的外部依赖边界和实例去重由构建配置统一，不能把多个独立 Yjs 实例混用。Worker 和静态模板须随包发布，并验证安装后路径有效。

仓库中必须完成的改动：

1. pnpm-workspace.yaml 已覆盖 packages/\*，实施时加入独立 manifest 和锁文件 importer。
2. packages/components 与最终发布的 packages/element-ai-vue 声明 element-ai-vue-ppt 运行依赖，开发期使用 workspace 版本，打包后验证转换为可安装版本。
3. 现有 internal/build/src/tasks/modules.ts 扫描整个 packages，需要排除 ppt-editor/\*\*；样式扫描、类型输出扫描也要隔离，不能把核心源码和服务端再次作为主库入口。
4. 主库类型生成不得重新复制核心包声明；包装声明只引用公开包类型。
5. 主库全量打包区分浏览器依赖与 ./server，确认不会把服务端模块打进浏览器包；评估代码拆分和按需导入。
6. 当前 scripts/publish.ts 只显式包含主库与 uniapp-polyfill，需要增加独立包发布入口/选择参数与发布顺序，不能直接给所有包同步升级。
7. 执行 pack 后，在仓库外的临时消费者中安装 tarball 验证，而不只验证 monorepo 源码别名。
8. 核心包先发布可用版本，再发布引用它的主库版本；本次设计整理不执行 npm publish。

## 5. 文档内核与标准导出

### 5.1 数据和关系

- 原始 ZIP 部件保存解压字节；脏部件保存局部 XML 修改和资源变化。
- 从包根关系定位主文档，按页面列表解析顺序，不依赖固定路径或文件名排序。
- 关系相对于所属部件解析；内部/外部 Target 分开管理。
- 新建、复制、删除页面/母版/布局/图片时，以关系图事务同步修改所有引用与 Content Types。
- 未修改部件内容原样保留；重新压缩后的 ZIP 不要求整文件字节一致。
- 未知节点、属性、扩展和 AlternateContent 分支保留；无法安全同步相关分支时返回能力诊断，不能只改某一分支后声称完整支持。
- 跨文档复制、母版复用和模板实例化统一服从目标包的 Strict/Transitional 变体。来源变体不同时，对复制依赖闭包中的命名空间、关系类型和受支持语义做显式适配；不支持的语义不能直接搬入，必须原子拒绝并报告具体对象，禁止生成混合变体包。
- 删除和替换共享资源前做入站引用检查；有未知引用时保守保留，避免错误回收。
- 保留、显示、编辑、播放四项能力分开报告。

运行时全局 objectId 与 OOXML 的部件 URI + 局部 shapeId 映射并存。服务端分配/确认新对象标识，离线客户端用临时 UUID；同一协作房间不允许重复 import 初始化文本 CRDT。

### 5.2 渲染与排版

DOM 展示文字和图片，SVG 展示几何/线条；使用统一坐标变换处理页面缩放、旋转、翻转和组坐标。持久化采用原标准单位，UI 在边界转换，设备像素比不改变文档尺寸。

文本样式解析覆盖文字片段、段落、文本框、占位符、布局、母版、主题的属性来源。界面需要能区分“继承值”和“当前覆盖值”，编辑覆盖与重置继承是不同命令。

字体通过宿主字体提供器加载，记录缺失/替换情况。正文换行、文本溢出、自适应、竖排、列表、段落间距纳入文本兼容任务，不将像素差异自动归因为导入成功。

### 5.3 本期对象覆盖

| 领域              | 本期目标                                                                   |
| ----------------- | -------------------------------------------------------------------------- |
| 文字              | 富文本、段落/列表、对齐、间距、文本框属性、中文输入、基础字段与超链接      |
| 图形              | 预置/自定义几何、填充/线条/透明度/支持的效果、组合、层级、连接线           |
| 图片              | PNG/JPEG/SVG 等目标格式、定位、旋转、裁剪、替换与媒体资源                  |
| 表格              | 单元格文字、行列、合并、边框、填充及编辑                                   |
| 图表              | 常用图表类型、数据编辑及 OOXML 图表/关联数据的同步；复杂类型单列兼容样例   |
| SmartArt/扩展对象 | 解析、显示、结构编辑能力单列研发任务与对象清单，不能把整体截图算作结构编辑 |
| 页面              | 新增、删除、排序、复制、跨文档复制、背景与尺寸                             |
| 母版/布局/主题    | 见第 6 节，完整编辑闭环                                                    |
| 演示播放          | 按下述补充建议实施播放、媒体和动画能力清单                                 |

演示播放是基于上一版完整范围的补充建议：播放导航、全屏/移动端演示、切换、对象动画、音视频；复杂时间线效果需逐项验收。其任务单独列出，不能混同于母版功能。

“完整”不是未经测试的全标准承诺。兼容清单中的目标条目未完成时，必须标为未完成并修复；诊断/占位是研发过程中的降级措施，不能取代用户要求的正式能力。

### 5.4 导出

先结算当前编辑事务，获得固定 revision 对应的标准包快照，再校验、合成、打包。协作模式由服务端返回已提交 revision 的快照，不把当前客户端未确认状态称为全员最新版本。

未修改对象及资源继续保留；修改 OOXML 子树时不无条件重建整个文本体。文本内部需保留受支持属性和原节点对应关系；不能映射的私有属性要进入兼容研发清单。

默认导出 PPTX。旧版 PPT 导出作为本期兼容服务能力一并提供：先产生 PPTX，再转换，明确可能损失现代格式特性。未要求执行宏，不把宏代码作为编辑器可执行功能。

## 6. 完整母版、布局和主题编辑

这是本期独立工作区，不只是“换背景”或几个固定模板。

| 能力       | 实现要求                                             |
| ---------- | ---------------------------------------------------- |
| 母版管理   | 创建、选择、重命名、复制、删除；维护布局与页面引用   |
| 布局管理   | 创建/复制/删除布局；页面切换布局、重置布局           |
| 占位符     | 新增、删除、移动、调整类型/编号/样式，匹配页面实例   |
| 母版对象   | 背景、图形、图片、文本、页脚等可编辑；子页实时继承   |
| 主题       | 主题颜色、字体、效果及覆盖；展示属性来源             |
| 文本层级   | 母版标题、正文各级样式，布局和页面覆盖               |
| 显示与重置 | 显示/隐藏母版图形；清除页面局部覆盖恢复继承          |
| 模板复用   | 将母版、布局及完整依赖复制到其他文档，重映射标准标识 |
| 协作       | 母版变化影响所有相关页；跨页失效、权限和冲突处理     |

删除仍被引用的母版/布局必须显式选择迁移目标；操作把引用迁移、关系修改、缓存失效作为同一事务。切换布局按占位符匹配迁移内容，无法匹配的内容保留为普通页面对象或明确待处理对象，禁止静默删除。

复制母版要复制依赖闭包和主题/资源映射，不只复制单个 XML。删除布局并发于用户编辑其子页面时，服务端依据实体版本检测冲突，要求基于新布局重试。

## 7. 多人协作：本期服务与一致性方案

### 7.1 部署与职责

单机无需服务。跨设备协作由本期提供的 Node 服务支持 WebSocket、身份/权限适配、文档房间、顺序提交、日志、快照、资源存储和恢复。免费开源不等于没有服务器运维成本；无需购买第三方 SaaS 授权。

包提供 ./server 工厂与可运行示例，默认 SQLite/WAL 存日志及元数据、文件目录存包和资源；存储接口可替换为业务数据库/对象存储。本期基线是单房间单写入协调者，可运行多个房间；不以未实现的多节点高可用作为交付前提。

### 7.2 协作策略

采用“服务端有序命令 + 每个文本对象的 Yjs CRDT”：

- 形状位置、样式、页面顺序、母版和包关系通过语义命令提交。服务端校验后原子写 OOXML，分配递增 revision 并广播。
- 同一文本框的并发输入使用 Yjs + y-prosemirror；更新包装为具有 objectId、epoch、操作 ID 的文本命令，由服务端检验当前权限和 schema 后合并，再写回 OOXML。
- 不把整个 XML 字符串放进 Y.Text，不使用最后一次整包上传覆盖多人编辑。
- 稳定版 Yjs v13 与兼容的 y-prosemirror 组合优先，实施时锁定准确版本；不能混用当前开发分支的新主版本。
- y-websocket 可以参考传输/在线状态实现，但其默认广播不能绕过命令权限、生成锁和事务校验。生产入口使用项目受控协议。

服务端在候选文本状态上验证更新，成功后一起持久化 CRDT 更新、标准文档增量和 revision；失败不先广播“成功”。客户端被拒绝的乐观更新保留为本地草稿，并从已确认的状态重新建立当前编辑实例，不能将非法更新继续传播。

所有会改变文字内容、段落结构或局部文字格式的入口都经过同一个文本协调层，包括键盘、工具栏、AI、表格单元格、母版文本和命令式 API。协作启用时先形成受验证的 CRDT 事务，再由统一映射器写 OOXML，禁止某一路直接改 XML、另一路只改 Yjs。几何和主题继承修改仍走结构/样式命令，但不得重置已有文本 CRDT；主题继承只改变显示解析结果，局部文字格式修改才进入对应文本事务。

文本以稳定 textUnitId 定位，涵盖文本框、表格单元格和母版/布局中的文本区域。textUnitId 与标准节点的映射纳入检查点。复制对象时创建新身份并从受支持的文本结构初始化一次；删除父对象时同时标记其文本身份失效，拒绝后续更新，不凭遗留 CRDT 消息自动恢复已删除对象。

### 7.3 冲突、撤销与掉线

| 情况                       | 处理规则                                                                 |
| -------------------------- | ------------------------------------------------------------------------ |
| 两人同时输入同一文本框     | CRDT 合并；同一文本对象共用一次初始化和持久化身份                        |
| 两人拖动同一对象           | frame 作为原子属性组，按服务端接受顺序提交；界面显示远端正在操作         |
| 一人删对象，另一人继续编辑 | 已删除对象的后续命令拒绝，保留本地输入草稿，不自动复活对象               |
| 同时修改母版/布局引用      | 结构操作要求实体版本匹配，否则返回冲突并重算                             |
| 修改不同元素               | 独立提交，不使用文档全局版本将无关修改全部拒绝                           |
| 本地撤销                   | 只撤销本人操作；文本采用作者范围的逆操作，非文本逆命令带字段版本前置条件 |
| 掉线                       | 可查看缓存，未同步输入作为草稿；恢复后文本合并、结构命令逐项校验         |
| 权限变化                   | 服务端即时生效；过期或无权操作拒绝，不依赖客户端按钮状态                 |

非文本撤销不能用“恢复整个 XML 部件旧字节”的方式抹掉其他人的修改。历史快照与多人撤销分开设计。

每个已接受操作包含 opId、actorId、documentId、epoch、revision，重复 opId 返回原结果。快照保存对应 revision、操作日志截点、文本 CRDT 状态和对象映射；崩溃恢复从同一提交边界回放。普通 PPTX 导出不嵌入协作日志，重新作为新文件导入则建立新 epoch；继续同一房间必须加载服务端会话快照。

这里 revision 指正式文档提交序列。生成候选操作另带 branchId 与 branchRevision，不提前推进正式文档 revision；UI 将候选进度与已保存版本分开显示。候选操作和资源任务也持久化，但只有提升事务成功后才产生新的正式提交点。

在线用户、光标、选区和拖拽预览属于临时状态，做节流与失效，不写进标准 PPTX。

### 7.4 资源与导出

图片先上传或由服务端受控获取，获得资源 ID 后再提交引用命令。远端用户不能收到只在上传者浏览器有效的 blob: URL。下载与房间权限绑定，未绑定资源在明确的回收策略下清理。

导出只包括服务端确认的 revision；未提交修改提示为本地待同步。服务端在固定提交点生成标准包，不要求所有用户长期停止输入。

## 8. 移动端编辑

移动端是完整编辑入口，不是仅适配预览。以 iOS Safari、Android Chrome 与桌面 Chromium/Safari 的实际设备版本作为验收矩阵。

- 窄屏使用页面抽屉、底部工具栏和属性面板；母版模式也有可访问入口。
- 点击选择元素，双击/显式按钮进入文字编辑；多选通过显式多选模式，避免依赖鼠标框选。
- 单指操作当前选中元素；双指平移/缩放画布；文本选区模式优先保留原生选字，不被画布手势截获。
- 拖拽、缩放、旋转控制点扩大触摸命中区，不改变文档实际元素大小。
- 处理虚拟键盘、VisualViewport、安全区域和横竖屏；输入时保持当前文本可见。
- 支持移动端文件选择、相册图片、下载/分享适配；权限和浏览器限制明确反馈。
- 工具栏提供撤销、重做、复制、删除、图层和母版操作，不能把全部功能隐藏在仅桌面可用的右键菜单。
- 长文档只渲染当前及邻近页面，图片解码与缓存设预算，避免移动端内存峰值。
- 真实触屏测试覆盖中文输入法、两指手势、远端协作更新与键盘同时出现，不能仅用桌面缩窄窗口替代。

## 9. PPTX 与旧版 PPT 兼容

### 9.1 PPTX 原生路径

检测 OPC 类型、主文档命名空间和关系，而不只看扩展名。Transitional/Strict 采用对应 URI 和映射，写回保留原变体；未知扩展按原包保留并形成诊断。

兼容样本包含 PowerPoint 各目标版本、WPS 导出文件以及正常/边界对象组合。不可编辑对象不算作“完整编辑已完成”，须纳入对应对象任务修复。

### 9.2 旧版 PPT 路径

旧版 PPT 是 MS-PPT 二进制，不是把 XML 压缩成 ZIP。本期采用：

```text
旧版 .ppt → 自部署转换服务 → 标准 .pptx → 同一个编辑内核
编辑结果 .pptx → 按需调用转换服务 → 旧版 .ppt
```

转换器默认选用 LibreOffice headless 独立进程，镜像固定版本，任务使用独立工作目录/用户配置目录、超时和并发限制。提供可替换 ConversionAdapter，业务方可接入自己的免费实现。

服务通过文件内容接收输入，完成后返回文件、转换版本和已知诊断。不把“进程返回 0”当作视觉和编辑兼容性证明；现代对象转旧格式的变化需要样本对照，无法自动识别的格式损失说明为未知，不伪造完整损失清单。

无转换服务时，原生 PPTX 功能仍可独立使用；打开 .ppt 返回 CONVERSION_REQUIRED，并提供可配置服务入口。产品本期交付包含服务适配、部署材料和真实转换验收，不能只交一个接口占位就宣布支持旧版 PPT。

默认保存 PPTX；按用户选择保存旧版 PPT 时明确目标格式限制。保留上传原文件供重新下载或重新转换，但不声称编辑后还能无损恢复所有原始二进制记录。

### 9.3 特殊文件

- 加密 PPT/PPTX：提供密码输入/宿主密码获取接口，交由隔离转换/解密适配器处理；密码不进入日志、协作广播和导出元数据。能否打开按目标加密样本验证。
- 数字签名：展示签名存在状态；修改会使原签名失效，导出编辑副本必须显式说明并正确处理签名部件，不冒充原签名仍有效。
- 损坏文件：给出结构化错误与可重试/转换路径；不能承诺所有损坏文件均可修复。
- .pptm、Word、Excel 不是用户本次确认的文件范围，检测后返回准确类型提示，不作为空白 PPT 加载。
- 嵌入对象和宏不在浏览器执行；原文件中的数据保留与编辑能力分开报告。

## 10. 多种输入形式与公开 API

统一使用 source 属性，避免 URL 和流式属性同时存在时的隐含优先级。字符串 URL、File/Blob/ArrayBuffer 作为便捷写法，内部立即转换为带 type 的结构。

```ts
type PptSource =
  | { type: 'url'; url: string; request?: RequestInit }
  | { type: 'file'; file: File | Blob | ArrayBuffer }
  | {
      type: 'binary-stream'
      stream: ReadableStream<Uint8Array>
      fileName: string
    }
  | {
      type: 'events'
      events: AsyncIterable<GenerationEvent>
      mode: 'replace' | 'append'
    }
  | { type: 'new'; templateId?: string; title?: string }

interface PptEditorOptions {
  source?: PptSource | string | File | Blob | ArrayBuffer
  editable?: boolean
  collaboration?: CollaborationOptions
  conversion?: ConversionAdapter
  resourceProvider?: ResourceProvider
  fontProvider?: FontProvider
  theme?: 'light' | 'dark'
  locale?: string
}
```

RequestInit 中的凭据和 signal 不序列化到文档/协作日志。原始响应、SSE 字节流由 ./stream 提供适配器转换成完整事件。File 与 Blob 在 Node 核心入口有独立字节输入类型，不要求 Node 先创建浏览器 DOM。

binary-stream 是“文件下载流”，只显示下载进度，文件完整且可验证后才打开；events 是“生成操作流”，才能逐步出现页面内容。两者不能混用。

```ts
interface PptEditorHandle {
  open(
    source: PptSource | string | File | Blob | ArrayBuffer
  ): Promise<OpenResult>
  getState(): EditorState
  commitEditingSession(): Promise<EditorState>
  applyGenerationEvent(event: GenerationEvent): Promise<ApplyResult>
  cancelGeneration(): Promise<void>
  retryAsset(assetId: string): Promise<void>
  omitPendingImage(elementClientId: string): Promise<void>
  resolveDraft(action: 'accept' | 'discard'): Promise<void>
  exportFile(options?: { format?: 'pptx' | 'ppt' }): Promise<Blob>
  execute(command: EditorCommand): Promise<CommandResult>
  undo(): Promise<void>
  redo(): Promise<void>
  setWorkspace(mode: 'slides' | 'master'): void
  destroy(): Promise<void>
}
```

这些类型是设计接口，实施时提供完整公开定义。EditorState 包含 documentId、epoch、revision、状态、工作区、effectiveEditable、同步状态、generationId、最后确认 seq 和待处理资源。

事件包括 ready、change、status-change、selection-change、presence-change、generation-progress、compatibility-report、warning、error。change 明确来源为 local/remote/generation，避免宿主回传整个文件造成同步循环。

### 独立 Vue 使用示例

```vue
<script setup lang="ts">
import { PptEditor } from 'element-ai-vue-ppt'
import 'element-ai-vue-ppt/style.css'

const source = { type: 'url' as const, url: '/files/example.pptx' }
</script>

<template>
  <PptEditor :source="source" :editable="true" />
</template>
```

### 命令式使用示例

```ts
import { createPptEditor } from 'element-ai-vue-ppt'
import 'element-ai-vue-ppt/style.css'

const editor = await createPptEditor(container, {
  source: { type: 'file', file },
  editable: true,
})
const output = await editor.exportFile({ format: 'pptx' })
await editor.destroy()
```

### 流式使用示例

```ts
// 由宿主通过 fetch + ./stream 适配器得到 events。
// 每条事件是完整消息，不是任意网络 chunk。
await editor.open({
  type: 'events',
  events,
  mode: 'replace',
})
```

source 改变会创建新的加载令牌，取消旧请求、解析任务和生成会话；旧异步结果不得回写。协作房间里 source 只用于有权限的初次初始化，不允许后来加入的客户端覆盖房间文件；替换文档必须执行服务端确认的 replace 命令。

上述取消规则对单机生成直接生效；协作模式下 source 切换或 destroy 仅取消本客户端任务、退订旧房间和清理本地资源，不能因此取消整个房间的生成、释放其他用户租约或删除候选分支。房间生成取消必须由有权限者显式调用并获服务端确认。发起者离线后按服务端租约和恢复策略进入中断/接管流程，不能用组件卸载事件充当全局取消。

外部任意链接不保证可读，URL 输入受 CORS、鉴权和过期时间限制。宿主通过受控 loader/资源提供器处理；不能默认由服务器无条件代理任意 URL。

## 11. 流式生成与多人协作交接

### 11.1 协议信封

```ts
interface GenerationEvent {
  protocolVersion: 1
  documentId: string
  epoch: string
  generationId: string
  seq: number
  operation: GenerationOperation
}
```

基本操作：generation.start、slide.add、text.add、text.append、shape.add、image.add、asset.resolve、element.update、slide.complete、generation.complete、generation.error。表格、图表、富文本块、母版和布局生成复用同一已验证命令系统，提供结构化操作，不允许任意 XML 字符串直接修改包。

clientId 在一个 generation 内唯一，映射到服务端确认的 objectId/部件/shapeId。几何数据统一源单位；高层内容生成可用模板布局器计算几何，再生成标准操作。

```json
{
  "protocolVersion": 1,
  "documentId": "doc-1",
  "epoch": "epoch-1",
  "generationId": "gen-1",
  "seq": 4,
  "operation": {
    "type": "text.append",
    "elementId": "title-1",
    "text": "季度经营分析"
  }
}
```

text.append 明确为文本追加，不把半段 Markdown 自动转为富文本。富文本使用段落/片段操作，版本化 schema 与客户端/服务端共用校验。

### 11.2 全局生成锁

本期默认生成期间锁定**整份文档的人工写入**，所有协作者仍可查看和翻页。锁不能只存在于发起人的浏览器。

- 服务端在操作序列的确定提交点授予 generation 租约，记录 owner、generationId、到期时间和单调 fencingToken。
- start 先结算发起者编辑；其他用户已被服务端接受的操作纳入基线。锁授予后到达的人工命令拒绝并保留为客户端草稿，不能因强制失焦丢字。
- 生成事件的写入会话与租约由服务端绑定，不能只信任 payload 的 generationId。
- 生成在候选包/候选操作分支执行，所有客户端可看进度；保留开始前的已确认检查点。
- 租约失效进入中断状态，由有权限者恢复或接受/丢弃草稿；旧 token 永久失效，迟到生成者不能继续写。
- 授予新写入权限之前，必须封闭旧生成任务和资源回调；尚未同步的人工草稿需基于当前 epoch/revision 显式恢复。

单机模式复用同一状态机，由本地协调者执行，不依赖网络服务。

候选分支必须同时包含标准包修改集、文本 CRDT 状态、对象/textUnitId/clientId 映射、资源任务、操作日志和检查点，不能只复制 PPTX 包。所有命令和异步结果都绑定 branchId 与 fencingToken；append 从同一基线克隆完整会话状态，replace 从新的空白状态开始。candidate 不与 live 分支共享可变对象。

完成或接受草稿时，以一个持久化事务切换标准包、CRDT、映射和日志的当前指针，并产生新的 epoch；丢弃时恢复完整基线并同样建立新 epoch 使旧分支消息失效。客户端拿到新 epoch 的检查点后重建文本绑定和显示缓存，再恢复对应权限的编辑。旧 epoch 的未同步人工输入保留为草稿，由恢复流程显式处理，不能直接投进新的 CRDT 文档。

append 提升保留基线中原有 objectId、textUnitId 和 CRDT 内部身份，只合入新增对象；新 epoch 在这里是会话隔离边界，不表示重新导入或重新初始化旧文字。replace 提升建立新的文档对象集合。生成中 exportFile 返回 GENERATION_IN_PROGRESS，不导出临时候选；中断后显式接受草稿并完成校验，才允许导出。服务端可保存基线供恢复，但 UI 不将其标为候选内容的最新导出。

### 11.3 顺序、资源和恢复

- seq 连续、重复同内容幂等；重复不同内容为冲突；缺号停止后续应用并请求补发。
- SSE EOF 不代表成功，必须收到 generation.complete。
- image.add 立即登记稳定顺序和最新属性；下载完成顺序不能改变图层。
- asset.resolve 先登记异步任务、确认事件，再继续文字事件；完成后原子绑定图片/资源/关系。任务需复查 generation、token 和目标有效性。
- generation.complete 封闭输入，但允许已登记任务收尾。资源失败需重试或通过受控恢复入口移除占位。
- 同一房间重连使用服务端已确认 seq 与候选分支检查点恢复；检查点包含 clientId 映射、资源任务状态、协议版本和已接收事件摘要。
- 浏览器刷新不能仅靠导出的 PPTX 恢复生成；本期实现服务端会话恢复。单机允许宿主存储会话检查点或重新播放事件。
- 取消后可丢弃候选包恢复基线，或显式接受校验通过的草稿；不能自动把中断当作完成。

### 11.4 完成条件

```text
ready → generating（全局人工只读）
      → finalizing（事件齐全、资源处理、标准校验、必要布局刷新）
      → ready（按当前权限恢复编辑）
```

解锁前必须确认：队列清空、无缺号、待声明资源已绑定/显式移除、标准结构和关系校验通过、当前视图所需资源已完成或报告降级、协作最终 revision 已提交并广播。远端未拿到该 revision 时继续显示同步状态，不能抢先提交基于旧分支的编辑。

权限、网络状态、文档能力和生成状态共同决定 effectiveEditable。只读角色完成后仍然只读；本地人工入口不能绕过协作权限。

## 12. 技术选型、许可与运行依赖

| 模块           | 建议选型                                             | 说明                                                   |
| -------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| UI             | Vue 3 + TypeScript                                   | 独立样式和主题，不反向依赖主库                         |
| 文档渲染       | DOM + SVG                                            | 自研 OOXML 解析与排版                                  |
| 元素交互       | Moveable + Selecto                                   | MIT；移动端补齐手势与命中区                            |
| 文本           | Tiptap 开源核心 / ProseMirror                        | 不引入付费 AI/文件转换扩展                             |
| ZIP            | fflate                                               | MIT，压缩解压和 Worker                                 |
| XML            | XmlAdapter；浏览器原生 DOM，Node 使用 @xmldom/xmldom | 明确不同解析器一致性测试                               |
| 文本协作       | Yjs + y-prosemirror                                  | MIT；锁定兼容稳定版本                                  |
| 协作传输       | 自研受控 WebSocket 协议                              | 鉴权、命令校验、租约和顺序提交不能只靠 CRDT            |
| 旧格式转换     | LibreOffice headless 独立服务                        | 免费软件，遵守实际分发版本许可；不作为 MIT JS 代码混入 |
| 开发期标准检查 | Open XML SDK                                         | MIT，可用于 CI；不是可视化编辑引擎                     |

所有实际接入版本及其传递依赖在实施时核对 LICENSE/NOTICE。项目代码计划使用 MIT；模板、图标、字体、示例文件分别记录来源。商业使用不依赖购买 SaaS，但自部署服务、字体授权和运维并不会由开源许可证自动解决。

本期不把 Open XML SDK 或 LibreOffice 声明成浏览器直接可用的 JS SDK。转换服务和协作服务都有可运行代码、部署示例和验收，不只有接口定义。

## 13. 测试、兼容和发布标准

必须交付的验证材料：

1. 标准包回归：原样导出、局部修改、未知部件保留、关系完整性、Strict/Transitional、跨文档依赖复制。
2. 对象兼容表：文字、图片、形状、表格、图表、组合、SmartArt、母版及目标动画，分别验证保留/显示/编辑/播放。
3. PPT 转换样本：旧版 PPT 导入、编辑、导出 PPTX，以及反向导出 PPT 后实际打开检查；转换失败和已知损失可追踪。
4. 协作测试：同段文字、多对象拖拽、删除冲突、母版变更、本人撤销、掉线重连、权限撤销、服务重启恢复。
5. 生成交接：多个客户端全局锁、token 过期、事件重复/缺号、资源迟到、取消恢复、完成后继续协作编辑。
6. 移动端真机：iOS Safari/Android Chrome 的中文输入、手势、键盘、母版编辑、协作、保存/分享。
7. 互操作验收：PowerPoint 与 WPS 打开导出文件，无新增修复提示，受支持对象仍可编辑；记录应用版本和样本。
8. 独立 npm 验收：tarball 在干净 Vue 项目、普通命令式页面和 Node 核心/服务示例可用，无仓库源码路径。
9. 主库验收：ElAPpt 与独立 PptEditor 对同一输入行为一致，主库类型/构建/文档通过，核心不重复扫描。
10. 性能数据：桌面/移动端、10/50/100 页与图片密集样本的首屏、输入、流式延迟、内存和导出；具体预算在基准任务中定义并锁定。

单项可在任务分区中先完成，但只有上述本期目标及其依赖全部通过，才能称本期完成。没有真实 PowerPoint 或移动真机验证时标记“未验证”，不能拿单元测试代替。

## 14. 风险与实施约束

- 范围已从轻量组件升级为独立编辑产品，不能将多人协作/母版/移动端仅增加布尔属性就计为实现。
- 同步与 OOXML 写回必须共用事务边界；先广播后持久化会导致重启丢改动。
- 文本 CRDT 与标准文本映射需要保留格式和稳定身份，不能每次载入文本框都创建新的协作文档。
- 完整母版修改存在跨页影响，缓存失效和并发结构检查需与核心一起设计。
- 旧版格式转换不等于无损编辑，必须报告并验证实际结果；不把 100% 任意文件兼容作为未经证明的结论。
- source 更换、组件卸载和文档 epoch 更换必须清理所属本地任务和资源；房间租约、候选分支和全局生成只由服务端授权操作或租约策略变更，不能跟随任一客户端卸载而删除。
- 文档输入设置解压字节/条目/图片像素预算，校验关系路径，不执行宏或嵌入代码；转换服务使用隔离任务和资源限制。
- 本方案确定结构和本期分工；实现开始前需要据此细化接口契约和测试步骤。详见 [TASKS.md](./TASKS.md)。

## 15. 官方参考

下面支持标准和基础库事实；架构、API、状态机与分区为本项目设计建议。

- [Microsoft：PresentationML 结构](https://learn.microsoft.com/en-us/office/open-xml/presentation/structure-of-a-presentationml-document)
- [Microsoft：旧版 MS-PPT 格式](https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-ppt/)
- [Open XML SDK](https://github.com/dotnet/Open-XML-SDK)
- [fflate](https://github.com/101arrowz/fflate)
- [Tiptap](https://github.com/ueberdosis/tiptap)
- [ProseMirror](https://github.com/prosemirror/prosemirror)
- [Moveable](https://github.com/daybrush/moveable) / [Selecto](https://github.com/daybrush/selecto)
- [Yjs](https://github.com/yjs/yjs) / [y-prosemirror](https://github.com/yjs/y-prosemirror) / [y-websocket](https://github.com/yjs/y-websocket)
- [@xmldom/xmldom](https://github.com/xmldom/xmldom)
- [LibreOffice 转换过滤器](https://help.libreoffice.org/latest/en-US/text/shared/guide/convertfilters.html)
- [LibreOffice 许可证](https://www.libreoffice.org/licenses/)
