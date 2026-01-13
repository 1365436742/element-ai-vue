---
sidebar: false
outline: [2, 3]
---

# Element Ai Vue 贡献指南

Hi! 诚挚感谢您选择使用 **Element Ai Vue**。

**Element Ai Vue** 是一款快速搭建ai聊天场景的组件库。它基于 Vue 3 深度开发，能够充分满足项目对高度定制化的需求。

**Element Ai Vue** 的每一次迭代与进步都离不开社区的支持。如果您愿意贡献代码或提出宝贵建议，请仔细阅读以下指南。

## Issue 提交规范

为了保证问题处理的效率，请遵循以下规则：

- **仅限 Bug 与 Feature**：Issue 追踪系统仅用于提交 Bug 反馈、新功能建议（Feature Request）以及设计相关讨论。其他类型的咨询可能会被直接关闭。

- **避免重复**：在提交 Issue 之前，请先检索历史 Issue，确认相关内容是否已被提出。
- **提供详细信息**：
  - 请务必注明 **Element Ai Vue** 和 Vue 的具体版本号。
  - 提供操作系统及浏览器版本信息。

## Pull Request (PR) 规范

我们欢迎任何形式的代码贡献，但在提交 PR 前请注意以下事项：

### 1. 分支管理

- **Fork 项目**：请先将仓库 Fork 至您的个人账号下，切勿直接在主仓库中创建分支。
- **目标分支**：请确保将 PR 提交至 `dev` 分支，**严禁**直接提交至 `master` 分支。
- **同步代码**：提交 PR 前，请执行 `rebase` 操作，确保您的分支与上游代码同步，并保持 Commit 记录的整洁。

### 2. Commit 规范

Commit 信息需严格遵循 `type: description` 格式（Angular 规范），例如：`fix: [scrollbar] fix xxx bug`。

- **Header (描述信息)**：长度请控制在 72 个字符以内。
- **Type (必须为以下之一)**：
  - `feat`: 新功能
  - `fix`: 修复 Bug
  - `docs`: 文档变更
  - `style`: 代码格式调整（不影响逻辑）
  - `refactor`: 代码重构（既无新功能也无 Bug 修复）
  - `perf`: 性能优化
  - `test`: 测试相关
  - `build`: 构建系统或外部依赖变更
  - `ci`: CI 配置变更
  - `chore`: 其他杂项
  - `revert`: 回滚 Commit
  - `release`: 发布版本
  - `improvement`: 改进

### 3. 构建与文件

- **勿提交构建产物**：请不要提交 `lib` 目录下的打包文件。
- **本地构建检查**：提交前请在本地执行 `npm run build`，确保项目能成功编译打包。

### 4. 描述与审核

- **PR 描述**：如果是修复 Bug，请在 PR 中详细描述修复的内容及原因。
- **Code Review**：代码合并需经过严格审核——需由一名维护人员 Review 并 Approve，再由另一名维护人员复核，通过后方可合并。
