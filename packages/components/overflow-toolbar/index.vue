<template>
  <div :class="[ns.b(), ns.b('offscreen-measure')]" ref="offscreenBox">
    <div :class="ns.e('list-item')" v-for="item in list" :key="item.key">
      <slot name="item" :item="item">
        <div :class="ns.e('default-item')">
          <img
            v-if="item.icon"
            :class="ns.em('default-item', 'img')"
            :src="item.icon"
            alt=""
          />
          <div :class="ns.em('default-item', 'text')">{{ item.text }}</div>
        </div>
      </slot>
    </div>
    <div :class="ns.e('list-item')" data-btn-type="more">
      <slot name="more">
        <div :class="ns.e('default-item')">
          <span class="element-ai-vue-iconfont icon-more"></span>
          <div :class="ns.em('default-item', 'text')">
            {{ t('el.overflowToolbar.more', '更多') }}
          </div>
        </div>
      </slot>
    </div>
  </div>
  <div :class="ns.b()" ref="rootBox">
    <div :class="ns.e('list-item')" v-for="item in showList" :key="item.key">
      <slot name="item" :item="item">
        <div :class="ns.e('default-item')">
          <img
            v-if="item.icon"
            :class="ns.em('default-item', 'img')"
            :src="item.icon"
            alt=""
          />
          <div :class="ns.em('default-item', 'text')">{{ item.text }}</div>
        </div>
      </slot>
    </div>
    <div
      v-if="overflowList.length > 0"
      :class="ns.e('list-item')"
      data-btn-type="more"
    >
      <Popover
        :visible="visiblePopover ?? currentVisiblePopover"
        @update:visible="onChangeVisiblePopover"
        :trigger
        :effect="theme"
        placement="top"
      >
        <template #default>
          <slot name="more">
            <div :class="ns.e('default-item')">
              <span class="element-ai-vue-iconfont icon-more"></span>
              <div :class="ns.em('default-item', 'text')">
                {{ t('el.overflowToolbar.more', '更多') }}
              </div>
            </div>
          </slot>
        </template>
        <template #content>
          <div :class="ns.e('more-content')">
            <slot name="more-content" :overflowList="overflowList">
              <div
                v-for="item in overflowList"
                :class="ns.e('default-more-item')"
                :key="item.key"
                @click="onChangeVisiblePopover(false)"
              >
                <img
                  v-if="item.icon"
                  :class="ns.em('default-more-item', 'img')"
                  :src="item.icon"
                  alt=""
                />
                <div :class="ns.em('default-more-item', 'text')">
                  {{ item.text }}
                </div>
              </div>
            </slot>
          </div>
        </template>
      </Popover>
    </div>
  </div>
</template>

<script
  setup
  lang="ts"
  generic="T extends OverflowToolbarItem = OverflowToolbarItem"
>
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useLocale, useNamespace, useTheme } from '@element-ai-vue/hooks'
import { throttle } from 'lodash-es'
import {
  OverflowToolbarEmits,
  OverflowToolbarItem,
  overflowToolbarProps,
} from './props'
import Popover from '../popover/index.vue'
import { useElementSize } from '@vueuse/core'

defineOptions({
  name: 'ElAOverflowToolbar',
})

const props = defineProps({
  ...overflowToolbarProps<T>(),
})

defineSlots<{
  item?: (props: { item: T }) => any
  more?: () => any
  'more-content'?: (props: { overflowList: T[] }) => any
}>()
const emit = defineEmits<OverflowToolbarEmits>()

const ns = useNamespace('overflow-toolbar')

const themeRef = computed(() => props.theme)
const { theme } = useTheme(themeRef)
const { t } = useLocale()

const currentVisiblePopover = ref(props.visiblePopover ?? false)

const rootBoxRef = useTemplateRef('rootBox')
const offscreenBoxRef = useTemplateRef('offscreenBox')
const { width: maxWidth } = useElementSize(rootBoxRef)
const showMaxIndex = ref(0)

const showList = computed(() => {
  if (showMaxIndex.value <= 0 || showMaxIndex.value >= props.list.length) {
    return props.list
  }
  // 根据宽度计算可见节点
  return props.list.slice(0, showMaxIndex.value)
})

const overflowList = computed(() => {
  if (showList.value.length === props.list.length) {
    return []
  }
  // 根据宽度计算隐藏节点
  return props.list.slice(showMaxIndex.value)
})

const onChangeVisiblePopover = (visible: boolean) => {
  emit('update:visiblePopover', visible)
  currentVisiblePopover.value = visible
}

const elementLength: number[] = []
let moreBtnWidth = 0

const updateElementWidth = () => {
  const offscreenBox = offscreenBoxRef.value
  if (!offscreenBox) return
  const children = offscreenBox.children
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as HTMLElement
    const { width: childWidth } = child.getBoundingClientRect() // 强制触发重绘，获取最新宽度
    if (child.getAttribute('data-btn-type') === 'more') {
      moreBtnWidth = Math.ceil(childWidth)
      continue
    }
    elementLength.push(Math.ceil(childWidth))
  }
}

const computedShowButton = throttle(
  () => {
    const rootBox = rootBoxRef.value
    if (!rootBox) return
    const $elem = rootBoxRef.value
    const style = window.getComputedStyle($elem)
    const gap = parseInt(style.gap, 10) || 0
    let totalWidth = moreBtnWidth
    let maxIndex = props.list.length
    for (let i = 0; i < elementLength.length; i++) {
      const curElementWidth = elementLength[i]
      totalWidth += curElementWidth + gap

      /** 如果最后一个元素，都能显示下就不用计算更多按钮的宽度 */
      if (
        i === elementLength.length - 1 &&
        totalWidth - moreBtnWidth <= maxWidth.value
      ) {
        maxIndex = elementLength.length
        break
      }
      if (totalWidth >= maxWidth.value) {
        maxIndex = i
        break
      }
    }
    showMaxIndex.value = Math.max(props.minShowNum, maxIndex)
  },
  50,
  {
    leading: true,
    trailing: true,
  }
)

/** 强制更新，会刷新元素里面的所有内容 */
const forceUpdate = () => {
  elementLength.splice(0, elementLength.length)
  nextTick(() => {
    updateElementWidth()
    computedShowButton()
  })
}

onMounted(() => {
  updateElementWidth()
})

watch(maxWidth, () => {
  if (maxWidth.value) {
    computedShowButton()
  }
})

defineExpose({
  forceUpdate,
})
</script>
