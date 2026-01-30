<template>
  <div
    :class="[ns.b(), ns.m(type)]"
    :style="
      type === 'circle' ? { width: `${width}px`, height: `${width}px` } : {}
    "
  >
    <!-- 圆形进度条 -->
    <template v-if="type === 'circle'">
      <svg viewBox="0 0 100 100">
        <!-- 背景圆环 -->
        <circle
          :class="ns.e('track')"
          :cx="50"
          :cy="50"
          :r="radius"
          fill="none"
          :stroke-width="relativeStrokeWidth"
        />
        <!-- 进度圆环 -->
        <circle
          :class="ns.e('path')"
          :cx="50"
          :cy="50"
          :r="radius"
          fill="none"
          :stroke="strokeColor"
          :stroke-width="relativeStrokeWidth"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          stroke-linecap="round"
          :style="{ transition: 'stroke-dashoffset 0.3s ease' }"
        />
      </svg>
      <!-- 显示百分比信息 -->
      <div v-if="showInfo" :class="ns.e('info')">
        <span :class="ns.e('text')">{{ percentage }}%</span>
      </div>
    </template>

    <!-- 线性进度条 -->
    <template v-else>
      <div :class="ns.e('bar')" :style="{ height: `${strokeWidth}px` }">
        <div
          :class="ns.e('bar-outer')"
          :style="{
            borderRadius: `${strokeWidth / 2}px`,
          }"
        >
          <div
            :class="ns.e('bar-inner')"
            :style="{
              width: `${validPercentage}%`,
              backgroundColor: strokeColor,
              borderRadius: `${strokeWidth / 2}px`,
              transition: 'width 0.3s ease',
            }"
          ></div>
        </div>
      </div>
      <div v-if="showInfo" :class="ns.e('bar-text')">
        <span>{{ percentage }}%</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNamespace } from '@element-ai-vue/hooks'

export interface ProgressProps {
  /** 进度百分比 0-100 */
  percentage?: number
  /** 进度条类型 */
  type?: 'line' | 'circle'
  /** 是否显示进度信息 */
  showInfo?: boolean
  /** 进度条颜色 */
  color?: string
  /** 进度条状态 */
  status?: 'success' | 'exception' | 'warning' | 'normal'
  /** 进度条线宽 */
  strokeWidth?: number
  /** 圆形进度条的宽度 */
  width?: number
}

const props = withDefaults(defineProps<ProgressProps>(), {
  percentage: 0,
  type: 'line',
  showInfo: true,
  color: '',
  status: 'normal',
  strokeWidth: 6,
  width: 120,
})

const ns = useNamespace('progress')

// 计算相对于 viewBox 的线宽
const relativeStrokeWidth = computed(() => {
  return (props.strokeWidth / props.width) * 100
})

// 计算半径 (考虑线宽，避免被裁切)
const radius = computed(() => {
  return 50 - relativeStrokeWidth.value / 2
})

// 计算周长
const circumference = computed(() => {
  return 2 * Math.PI * radius.value
})

// 计算进度偏移量
const dashOffset = computed(() => {
  return circumference.value * (1 - validPercentage.value / 100)
})

// 有效百分比（限制在 0-100 范围内）
const validPercentage = computed(() => {
  return Math.min(100, Math.max(0, props.percentage))
})

// 状态颜色映射
const statusColorMap: Record<string, string> = {
  success: '#21B443',
  exception: '#F56C6C',
  warning: '#E6A23C',
  normal: '#409EFF',
}

// 计算进度条颜色
const strokeColor = computed(() => {
  if (props.color) {
    return props.color
  }
  return statusColorMap[props.status] || statusColorMap.normal
})
</script>
