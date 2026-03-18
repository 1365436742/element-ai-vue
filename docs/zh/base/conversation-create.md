# ConversationCreate 新建会话

## 基础用法

:::demo ConversationCreateBase

```vue
<!-- @include: ../../examples/conversation-create/base.vue -->
```

:::

## Props

| 属性名       | 说明                                                                                              | 类型                | 默认值 |
| ------------ | ------------------------------------------------------------------------------------------------- | ------------------- | ------ |
| shortcutKeys | 触发新建会话的快捷键，格式参考 [usemagickeys](https://vueuse.org/core/useMagicKeys/#usemagickeys) | `string[]`          | `[]`   |
| theme        | 主题模式                                                                                          | `'dark' \| 'light'` | —      |

## Events

| 事件名                  | 说明                       | 回调参数 |
| ----------------------- | -------------------------- | -------- |
| conversationCreateClick | 点击按钮或触发快捷键时触发 | —        |

## Slots

| 插槽名  | 说明                                     |
| ------- | ---------------------------------------- |
| default | 自定义按钮中间的文字内容，默认为"新对话" |
| icon    | 自定义左侧图标区域，默认为加号图标       |
| end     | 自定义右侧区域，默认展示快捷键提示（⌘K） |
