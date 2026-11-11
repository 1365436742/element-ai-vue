# element-ai-vue-ppt

独立 Vue 3 演示文稿编辑器。文件事实来源是标准 OOXML 部件包；预览场景是派生数据。主库 `ElAPpt` 使用此包，不维护第二套文档内核。

**当前为 0.1 开发版，尚未发布 npm，也未达到完整 PowerPoint 功能等价。** 实现与未完成项见 [STATUS.md](./STATUS.md)。本目录内 `pnpm build` 后可 `pnpm pack` 安装本地 tarball。

## 运行

```sh
pnpm install
pnpm --filter element-ai-vue-ppt dev
pnpm --filter element-ai-vue-ppt test
pnpm --filter element-ai-vue-ppt build
```

独立构建生成 ESM、CommonJS、TypeScript 声明和 CSS；Node 服务仅从 `/server` 导出。根入口可以 SSR 导入，组件需要在浏览器挂载。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { PptEditor } from 'element-ai-vue-ppt'
import type { PptEditorHandle } from 'element-ai-vue-ppt'
import 'element-ai-vue-ppt/style.css'

const editor = ref<PptEditorHandle>()
const source = { type: 'new' as const, title: '我的演示文稿' }
async function save() {
  const blob = await editor.value!.exportFile()
  // 保存 Blob；内置工具栏也提供下载。
}
</script>

<template>
  <PptEditor ref="editor" :source="source" style="height: 80vh" />
</template>
```

命令式挂载仍使用 Vue 渲染，Vue 是 peer dependency：

```ts
import { createPptEditor } from 'element-ai-vue-ppt'
import 'element-ai-vue-ppt/style.css'

const editor = createPptEditor(document.querySelector('#editor')!, {
  source: { type: 'new', title: '项目汇报' },
})
// 离开页面时 editor.destroy()；协作中仅断开当前客户端，不取消全局生成。
```

## 输入与编辑

`source` 支持 URL 字符串、File、Blob、ArrayBuffer，以及 `{type:'url',url,request}`、`{type:'file',file}`、`{type:'binary-stream',stream,fileName}`、`{type:'events',events,mode}`、`{type:'new',title}`。URL 需满足 CORS；请求头可通过 `request.headers` 配置。字节流必须完整下载再解包，不能把部分 ZIP 当成已生成内容。

`editable=false` 禁止人工修改。`options` 用于首次创建控制器，运行时替换协作配置应重建组件；`source` 和 `editable` 支持响应式更新。可监听 `ready`、`change`、`error` 事件。

```ts
const page = editor.getState().scene.slides[0]
await editor.execute({
  type: 'object.add',
  part: page.part,
  object: {
    kind: 'text',
    text: '你好，世界',
    frame: { x: 80, y: 100, width: 700, height: 120 },
    style: { fontSize: 48, color: '#234B3B', bold: true },
  },
})
```

位置、尺寸和 `fontSize` 均用 CSS px，内核转换为 EMU / 百分之一磅。`execute()` 原子执行，失败回滚。本地撤销最多保留 50 步。`getState().scene.diagnostics` 报告已识别的兼容性问题；没有报告不代表已实现所有 Office 特性。

工具栏支持插入标准表格，在画布双击单元格原位编辑多行文字，并保留尚未提交的单元格草稿。点击其他位置或 Ctrl / ⌘ + Enter 保存，Esc 取消。右侧保留行列结构、位置与尺寸等精细控制。`table.add` 创建表格，`table.set` 更新同尺寸内容，`table.structure` 插入或删除行列；合并单元格支持主单元格文字编辑，选中覆盖格会自动定位主单元格。导入的列宽、行高比例会用于预览。行列操作保持表格外框，按比例调整受影响轴；新增单元格为空白，已有单元格格式保留。未提交单元格草稿时禁用行列操作；编辑期间文档版本发生变化会保留草稿并阻止旧草稿保存（目前采用保守冲突检查，包含其他位置的更新）。表格按固定行列轨道裁剪溢出文字，完整自动排版仍在实现中。若缩减段落会删除未知扩展数据，操作会拒绝并回滚。

```ts
await editor.execute({
  type: 'table.structure',
  ref: { part: 'ppt/slides/slide1.xml', id: '2' },
  axis: 'row', // row | column
  action: 'insert', // insert | delete
  index: 1, // 从 0 开始；插入到此位置之前，等于行/列数则追加
})
```

不能删除最后一行或列；新增表格最多 100 行、50 列。合并表格的行列操作、非法结构和无效尺寸会拒绝并回滚。

手机端也在画布原位编辑文字；双指缩放和平移画布，桌面可按住空格或鼠标中键拖动，点击缩放百分比恢复适应画布。手势只改变视图，不修改文档坐标。

普通页面、母版与布局共享对象命令。`setWorkspace('master')` 打开母版工作区。还提供 `master.duplicate`、`layout.duplicate`、`placeholder.set`、`layout.reset`、`page.showMaster`、`slides.import` 命令。跨文档导入复制依赖闭包，普通页面复制共享原有母版/布局，页面私有依赖单独复制。

## 流式生成

**标准文件协议为 PPTX/OOXML；以下 JSON 是本包的应用层传输封装，不是微软制定的流式 PPT 标准。** 不要求调用者持久化自定义 scene JSON。

```ts
import { readGenerationStream } from 'element-ai-vue-ppt/stream'

const response = await fetch('/api/generate', { method: 'POST' })
if (!response.ok || !response.body) throw new Error('生成请求失败')
await editor.open({
  type: 'events',
  events: readGenerationStream(response.body, 'ndjson'), // 也支持 sse
  mode: 'replace',
})
```

一行一个完整事件（SSE 使用 `data:` 包装）：

```json
{"type":"generation.start","sessionId":"g1","seq":0,"mode":"replace","title":"项目汇报"}
{"type":"command","sessionId":"g1","seq":1,"command":{"type":"object.add","part":"ppt/slides/slide1.xml","object":{"kind":"text","id":"2","text":"阶段成果","frame":{"x":80,"y":100,"width":600,"height":120}}}}
{"type":"generation.complete","sessionId":"g1","seq":2}
```

序号从 0 连续递增，重放须保持相同内容；缺号报错。新包默认已有一页。`append` 的对象路径从现有场景读取，不能假定编号连续。每个命令都是完整 JSON；任意字符片段不能直接作为命令提交。图片命令使用 `Uint8Array`；发送端调用 `/stream` 的 `encodeGenerationEvent(event)`，把二进制字段编码成 `{ "$bytes": "base64…" }`，再追加换行或 SSE 的 `data:`。`readGenerationStream` 自动恢复为字节数组。异步 URL 图片占位/重试协议尚未实现。

生成时使用候选文档，界面只读，禁止导出。只有 `generation.complete` 或用户明确接受草稿才提交。EOF、报错和取消均保留草稿；`resolveDraft('accept'|'discard')` 处理草稿。没有文件或用户数据自动上传到第三方。

## 自部署协作

```ts
import {
  createPresentationServer,
  createFileRoomStore,
} from 'element-ai-vue-ppt/server'

const service = createPresentationServer({
  authenticate: async (token, roomId) => {
    // 必须用实际账号服务校验 token 和房间权限。
    return lookupRoomMember(token, roomId)
    // { id, name, role: 'editor' | 'viewer', color? } 或 undefined
  },
  store: createFileRoomStore('./ppt-data'),
  allowedOrigins: ['https://your-app.example'],
})
await service.listen(8787)
```

```ts
const options = {
  collaboration: {
    url: 'wss://your-service.example/collaboration',
    roomId: 'presentation-123',
    token: accessToken,
    user: { id: currentUser.id, name: currentUser.name },
  },
}
// <PptEditor :options="options" />
```

真实身份取自服务器 `authenticate`，客户端 `user` 不是授权依据。token 通过加入房间消息传递，不放在 URL。房间已有文档时拒绝 `source` 覆盖；空房间仅允许初始化一次。文本使用 Yjs；同文本并发编辑按 CRDT 合并。结构命令使用 revision 前置条件，冲突明确拒绝，用户审阅新版本后重试。当前不支持协作结构撤销；不会用整包回滚覆盖其他人修改。

生成租约在服务端验证 owner 和 fencing token；其他成员只读，发起者断开后候选保留。发起者以同一服务端身份重连，可继续或处理草稿。所有接受/丢弃切换 epoch，旧文字草稿不得静默提交。界面会保留未确认的文字供用户复制恢复。

默认存储为原子文件检查点，OOXML、CRDT、操作去重和候选一起持久化；已执行 fsync 和 rename。**一个房间必须由同一个 Node 进程协调**，文件存储不支持多个进程同时写同一房间。SQLite/分布式协调、远端光标和作者范围撤销仍待实现。可通过 `RoomStore` 更换存储；去重窗口保留最近 1000 操作。每次广播完整检查点，大文档性能尚待优化。

## 旧 PPT 转换

```ts
import { createHttpConversionAdapter } from 'element-ai-vue-ppt/stream'
const options = {
  conversion: createHttpConversionAdapter('https://service.example/convert', {
    headers: { Authorization: `Bearer ${token}` },
  }),
}
// 打开 .ppt 自动先转换；await editor.exportFile({ format:'ppt' }) 导出旧版。
```

服务端配置 `conversion: createLibreOfficeConverter({ binary: 'soffice' })`，可选 `timeoutMs`、`maxConcurrent`、`maxBytes`。需自行安装 LibreOffice；没有付费 SDK 依赖。`examples/server.mjs` 可直接运行，默认关闭转换，通过 `PPT_ENABLE_CONVERSION=true` 开启。转换服务按任务使用独立目录/用户配置，限制并发和超时并清理文件。生产应把 LibreOffice 放在受限的独立容器中，限制网络和 CPU/内存，不与业务数据共享宿主目录。

```sh
PPT_EDITOR_TOKEN='replace-with-your-token' PPT_ENABLE_CONVERSION=true node packages/ppt-editor/examples/server.mjs
# 验证实际转换（需 soffice）
PPT_TEST_SOFFICE=1 pnpm --filter element-ai-vue-ppt test
```

加密文件、宏文件、签名编辑和损坏文件修复未实现；转换失败会抛错，不返回空白文稿冒充成功。转换可改变字体、效果和布局，应审阅输出。Docker 示例在 `examples/`，未在本机验证镜像构建。

## 发布与许可

核心可独立构建、打包和发布，MIT。基础依赖：fflate、xmldom、Yjs、ws、Vue；随各依赖保留其许可证。此包没有捆绑商业字体，也没有捆绑 LibreOffice。字体由部署环境提供。

仓库发布脚本支持 `npm run publish -- --package=element-ai-vue-ppt`，失败可加 `--resume`；该命令会更改版本、创建版本提交并正式发布，只应在审核完成后手动运行。主库发布前检查核心依赖版本已发布，避免发布无法安装的依赖。当前开发期间仅构建/pack，不发布。

### 导入样本的高级内容

预设形状和自定义路径使用 DrawingML 几何求值，支持主题颜色变换、逐段/逐 run 文字、部分图案及渐变填充。图片裁剪通过 `image.crop` 编辑，图片和内嵌 MP4/MP3 可用 `resource.replace` 替换资源并保留对象身份。媒体默认不自动播放；浏览器是否能解码具体文件仍取决于编码格式。

SmartArt 支持读取已有 DrawingML 缓存、节点文字编辑及图示位置/尺寸编辑。`diagram.text.set` 同时更新原始数据节点和显示缓存，不会将图示转换成普通形状。没有缓存、缓存结构不完整或被多个图示共享的数据会保守拒绝对应编辑。节点增删、重排和通用布局算法尚未完成。

```ts
await editor.execute({
  type: 'image.crop',
  ref: { part: 'ppt/slides/slide7.xml', id: '1028' },
  crop: { left: 0, top: 0, right: 0, bottom: 0.37302 },
})
await editor.execute({
  type: 'diagram.text.set',
  ref: diagramObject,
  nodeId: diagramObject.diagramTexts[0].id,
  text: '新的节点文字',
})
```

具体样本逐页进度见 [SAMPLE-ACCEPTANCE.md](./SAMPLE-ACCEPTANCE.md)，总体边界见 [STATUS.md](./STATUS.md)。几何预设数据来自 Apache POI，发布包 `dist` 中包含 Apache 2.0 许可证和上游 NOTICE；编辑引擎主体使用 MIT 许可证。

### 画布交互与预览

文字和形状文字、表格单元格、已有缓存的 SmartArt 节点均可双击原位编辑，移动端也在画布内输入。双击图片打开资源替换，媒体对象提供画布上的替换按钮。字体、坐标、裁剪和行列结构仍在属性面板处理。流式生成期间禁止编辑，未提交文字保留为草稿。

预览模式禁止拖动、缩放调整对象和修改内容。底部提供上一页、下一页、页码与退出；画布获得焦点时支持方向键、PageUp/PageDown、空格、Home/End，Esc 退出。媒体控件与导航按钮保留原生键盘行为。

本地命令使用共享不可变资源的文档快照、按页场景缓存；画布复用未变化的对象和缩略图，减少每次编辑的压缩、解析和 SVG 重绘。样本核心编辑基准由约 1.2–1.5 秒降至约 22–27 毫秒（不包含浏览器绘制和网络协作延迟）。可设置 `PPT_SAMPLE_PATH` 后运行 `node --import tsx tests/interaction-perf-benchmark.ts` 复测。
