<template>
  <div class="coming-soon" :class="{ dark: isDark }">
    <div class="coming-soon__container">
      <!-- 动画背景 -->
      <div class="coming-soon__bg">
        <div class="coming-soon__particles">
          <span
            v-for="i in 20"
            :key="i"
            class="particle"
            :style="getParticleStyle(i)"
          ></span>
        </div>
      </div>

      <!-- 主内容 -->
      <div class="coming-soon__content">
        <!-- 图标 -->
        <div class="coming-soon__icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L13.09 8.26L19 7L14.74 11.26L21 14L14.74 12.74L13.09 19L12 12.74L5 14L11.26 11.26L5 7L11.26 8.26L12 2Z"
              fill="currentColor"
              class="star-path"
            />
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-dasharray="4 2"
              class="circle-path"
            />
          </svg>
        </div>

        <!-- 标题 -->
        <h1 class="coming-soon__title">
          <span class="text-gradient">敬请期待</span>
        </h1>

        <!-- 副标题 -->
        <p class="coming-soon__subtitle">
          我们正在精心打造全新功能，即将与您见面
        </p>

        <!-- 进度指示器 -->
        <div class="coming-soon__progress">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <span class="progress-text">开发中...</span>
        </div>

        <!-- 特性预告 -->
        <div class="coming-soon__features">
          <div
            class="feature-item"
            v-for="(feature, index) in features"
            :key="index"
          >
            <div class="feature-icon">{{ feature.icon }}</div>
            <div class="feature-text">{{ feature.text }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useData } from 'vitepress'
const { isDark } = useData()

const features = [
  { icon: '🚀', text: '高性能组件' },
  { icon: '🎨', text: '精美设计' },
  { icon: '🔧', text: '灵活配置' },
]
const getParticleStyle = (index: number) => {
  const size = Math.random() * 6 + 2
  const left = Math.random() * 100
  const delay = Math.random() * 5
  const duration = Math.random() * 10 + 10

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}
</script>

<style scoped lang="scss">
.coming-soon {
  --cs-bg: #f8fafc;
  --cs-bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --cs-text: #1e293b;
  --cs-text-secondary: #64748b;
  --cs-primary: #6366f1;
  --cs-primary-light: #818cf8;
  --cs-card-bg: rgba(255, 255, 255, 0.9);
  --cs-border: rgba(99, 102, 241, 0.2);
  --cs-shadow: 0 25px 50px -12px rgba(99, 102, 241, 0.25);
  --cs-particle: rgba(99, 102, 241, 0.3);

  &.dark {
    --cs-bg: #0f172a;
    --cs-bg-gradient: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
    --cs-text: #f1f5f9;
    --cs-text-secondary: #94a3b8;
    --cs-primary: #818cf8;
    --cs-primary-light: #a5b4fc;
    --cs-card-bg: rgba(30, 41, 59, 0.9);
    --cs-border: rgba(129, 140, 248, 0.3);
    --cs-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    --cs-particle: rgba(129, 140, 248, 0.4);
  }

  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cs-bg);
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  transition: all 0.3s ease;

  &__container {
    position: relative;
    width: 100%;
    max-width: 600px;
    padding: 20px;
  }

  &__bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: 24px;
    background: var(--cs-bg-gradient);
  }

  &__particles {
    position: absolute;
    inset: 0;

    .particle {
      position: absolute;
      bottom: -10px;
      background: var(--cs-particle);
      border-radius: 50%;
      animation: float-up linear infinite;
    }
  }

  &__content {
    position: relative;
    background: var(--cs-card-bg);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    border: 1px solid var(--cs-border);
    padding: 48px 40px;
    text-align: center;
    box-shadow: var(--cs-shadow);
  }

  &__icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    color: var(--cs-primary);
    animation: pulse 2s ease-in-out infinite;

    svg {
      width: 100%;
      height: 100%;
    }

    .star-path {
      animation: rotate 4s linear infinite;
      transform-origin: center;
    }

    .circle-path {
      animation: dash 3s ease-in-out infinite;
    }
  }

  &__title {
    margin: 0 0 16px;
    font-size: 2.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;

    .text-gradient {
      background: linear-gradient(
        135deg,
        var(--cs-primary) 0%,
        var(--cs-primary-light) 50%,
        var(--cs-primary) 100%
      );
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 3s ease-in-out infinite;
    }
  }

  &__subtitle {
    margin: 0 0 32px;
    font-size: 1.1rem;
    color: var(--cs-text-secondary);
    line-height: 1.6;
  }

  &__progress {
    margin-bottom: 32px;

    .progress-bar {
      height: 6px;
      background: var(--cs-border);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 12px;
    }

    .progress-fill {
      width: 60%;
      height: 100%;
      background: linear-gradient(
        90deg,
        var(--cs-primary),
        var(--cs-primary-light)
      );
      border-radius: 3px;
      animation: progress-pulse 2s ease-in-out infinite;
    }

    .progress-text {
      font-size: 0.875rem;
      color: var(--cs-text-secondary);
      font-weight: 500;
    }
  }

  &__features {
    display: flex;
    justify-content: center;
    gap: 24px;
    flex-wrap: wrap;

    .feature-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 20px;
      background: var(--cs-border);
      border-radius: 12px;
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-4px);
      }
    }

    .feature-icon {
      font-size: 1.5rem;
    }

    .feature-text {
      font-size: 0.875rem;
      color: var(--cs-text);
      font-weight: 500;
    }
  }

  .theme-toggle {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    border: none;
    background: var(--cs-border);
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--cs-primary);
    transition: all 0.2s ease;

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      background: var(--cs-primary);
      color: white;
      transform: rotate(15deg);
    }
  }
}

@keyframes float-up {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-400px) rotate(720deg);
    opacity: 0;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dashoffset: 20;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes shimmer {
  0%,
  100% {
    background-position: 0% center;
  }
  50% {
    background-position: 200% center;
  }
}

@keyframes progress-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@media (max-width: 480px) {
  .coming-soon {
    &__content {
      padding: 32px 24px;
    }

    &__title {
      font-size: 2rem;
    }

    &__features {
      gap: 12px;

      .feature-item {
        padding: 12px 16px;
      }
    }
  }
}
</style>
