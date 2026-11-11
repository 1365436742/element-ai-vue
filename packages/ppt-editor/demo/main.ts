import { createApp, h } from 'vue'
import { PptEditor, EditorController } from '../src/index'
import '../src/style.css'
const editor = new EditorController({ title: '把想法，变成下一步。' })
const part = editor.getState().scene.slides[0].part
const text = (
  id: string,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  color: string,
  bold = false
) =>
  editor.execute({
    type: 'object.add',
    part,
    object: {
      kind: 'text',
      id,
      name: value.slice(0, 18),
      text: value,
      frame: { x, y, width, height },
      style: { fontSize, color, bold, fontFamily: 'Noto Sans SC' },
    },
  })
await editor.execute({ type: 'page.background', part, color: '#faf8f1' })
await text('2', 'FIELD NOTES    /    2026', 88, 65, 800, 35, 15, '#80917e')
await text(
  '3',
  '把想法，\n变成下一步。',
  84,
  175,
  830,
  235,
  82,
  '#203d35',
  true
)
await text(
  '4',
  '从一个念头，到一场清晰的表达。',
  90,
  446,
  850,
  48,
  26,
  '#7b8872'
)
await editor.execute({
  type: 'object.add',
  part,
  object: {
    kind: 'shape',
    id: '5',
    frame: { x: 1000, y: 150, width: 180, height: 360 },
    geometry: 'roundRect',
    fill: '#dce4cf',
  },
})
await editor.execute({
  type: 'object.add',
  part,
  object: {
    kind: 'shape',
    id: '6',
    frame: { x: 1015, y: 190, width: 150, height: 150 },
    geometry: 'ellipse',
    fill: '#e78a50',
  },
})
await editor.execute({
  type: 'object.add',
  part,
  object: {
    kind: 'shape',
    id: '7',
    frame: { x: 1038, y: 355, width: 104, height: 104 },
    geometry: 'ellipse',
    fill: '#234b3b',
  },
})
await text('8', 'ELEMENT AI VUE', 90, 630, 500, 25, 12, '#90a087')
await text('9', '01  /  START WITH AN IDEA', 900, 630, 350, 25, 12, '#90a087')
for (let i = 0; i < 2; i++) {
  const result = await editor.execute({
    type: 'slide.add',
    name: i === 0 ? '01  发现与洞察' : '02  下一步行动',
  })
  const page = result.part!
  await editor.execute({
    type: 'page.background',
    part: page,
    color: i === 0 ? '#203d35' : '#f1e2d0',
  })
  await editor.execute({
    type: 'object.add',
    part: page,
    object: {
      kind: 'text',
      text: i === 0 ? '留一点空间，\n给新的可能。' : '从这里，\n开始你的故事。',
      frame: { x: 90, y: 170, width: 1100, height: 330 },
      style: {
        fontSize: 76,
        bold: true,
        color: i === 0 ? '#f1f3df' : '#203d35',
      },
    },
  })
}
async function streamDemo() {
  const id = crypto.randomUUID()
  let seq = 0
  await editor.applyGenerationEvent({
    type: 'generation.start',
    sessionId: id,
    seq: seq++,
    mode: 'append',
  })
  await editor.applyGenerationEvent({
    type: 'command',
    sessionId: id,
    seq: seq++,
    command: { type: 'slide.add', name: '流式生成' },
  })
  const page = editor.getState().scene.slides.at(-1)!.part
  await editor.applyGenerationEvent({
    type: 'command',
    sessionId: id,
    seq: seq++,
    command: {
      type: 'object.add',
      part: page,
      object: {
        kind: 'text',
        id: '2',
        text: '',
        frame: { x: 90, y: 200, width: 1000, height: 220 },
        style: { fontSize: 60, color: '#203d35', bold: true },
      },
    },
  })
  const content = '内容正在实时生成。\n完成之后，继续编辑。'
  for (let n = 1; n <= content.length; n++) {
    await new Promise((resolve) => setTimeout(resolve, 130))
    if (editor.getState().phase !== 'generating') return
    await editor.applyGenerationEvent({
      type: 'command',
      sessionId: id,
      seq: seq++,
      command: {
        type: 'text.set',
        ref: { part: page, id: '2' },
        text: content.slice(0, n),
      },
    })
  }
  await editor.applyGenerationEvent({
    type: 'generation.complete',
    sessionId: id,
    seq: seq++,
  })
}
createApp({
  render: () =>
    h('div', [
      h('div', { class: 'demo-heading' }, [
        h('h1', [h('span', 'Paperplane'), '演示文稿工作台']),
        h('div', { class: 'demo-actions' }, [
          h(
            'button',
            // oxlint-disable-next-line no-console
            { onClick: () => streamDemo().catch(console.error) },
            '体验流式生成'
          ),
          h('p', 'ELEMENT-AI-VUE-PPT  /  WORKSPACE'),
        ]),
      ]),
      h(PptEditor, { controller: editor }),
      h('div', { class: 'demo-caption' }, [
        h('span', 'A LITTLE STRUCTURE. A LOT OF POSSIBILITY.'),
        h('span', '独立内核 · 标准 PPTX · 本地编辑'),
      ]),
    ]),
}).mount('#app')
