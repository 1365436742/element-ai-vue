<template>
  <!-- 加载动画组件 -->
  <div class="loading-dots">
    <span class="dot dot-1"></span>
    <span class="dot dot-2"></span>
    <span class="dot dot-3"></span>
  </div>
</template>

<script setup lang="scss"></script>

<style scoped>
/* 容器样式 */
.loading-dots {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px; /* 点之间的间距 */
  font-size: 20px; /* 控制点的大小 */
}

/* 单个点的基础样式 */
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%; /* 圆形 */
  background-color: #409eff; /* 主题色（可自定义） */
  opacity: 0; /* 初始透明 */
  animation: dot-flash 1.4s infinite ease-in-out both;
}

/* 分别给三个点设置动画延迟，实现依次闪烁 */
.dot-1 {
  animation-delay: 0.2s;
}

.dot-2 {
  animation-delay: 0.4s;
}

.dot-3 {
  animation-delay: 0.6s;
}

/* 核心动画：透明度变化 */
@keyframes dot-flash {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(0.8); /* 可选：缩放效果增强动画感 */
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
