# 发布 npm 包

先提交业务代码，保持 Git 工作区干净，并确保已通过 `npm login` 登录有这两个包发布权限的 npm 账号。

```bash
npm run publish
```

命令会按顺序执行：

1. 两个包各自递增 patch 版本（最后一位），例如 `element-ai-vue` 的 `0.1.7 → 0.1.8`、`element-ai-vue-uniapp-polyfill` 的 `0.1.0 → 0.1.1`。
2. 同步内部 metadata 的主包版本，重新生成 `version.ts`，执行 `npm run build`。
3. 检查两个 `dist` 包的版本和入口文件，提交三个 `package.json` 的版本变更。自动版本提交不运行会格式化全仓库的 Husky hook。
4. 分别从 `dist/element-ai-vue` 和 `dist/element-ai-vue-uniapp-polyfill` 发布 npm 包。

本地默认只创建 Git 提交。需要在发布前将提交推送到当前分支时，执行 `npm run publish -- --push`。提交消息带 `[skip ci]`，避免版本提交重复触发发布 workflow。

构建或 Git 提交失败时，脚本恢复原版本文件，不执行发布。Git 提交成功后，如果推送或发布失败，保留版本提交，可以重试：

```bash
# 不再递增版本，跳过已成功发布的包
npm run publish -- --resume

# 同时重试推送版本提交
npm run publish -- --resume --push
```

GitHub Actions 推送到 `main-publish-v1` 时也执行同一脚本，并在发布前推送版本提交。仓库需要配置 `NPM_TOKEN`，并允许 Actions 向发布分支推送提交。

如需重试 CI 发布，在 Actions 中手动运行工作流，选择原发布分支并勾选 `resume`；普通运行默认发布下一组 patch 版本。

运行 `npm run test:publish` 可在临时 Git 仓库中验证发布顺序和失败恢复，测试不会向 npm 或 GitHub 发布。
