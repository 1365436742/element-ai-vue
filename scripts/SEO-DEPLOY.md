# 文档站 SEO 部署与收录检查

正式域名：`https://element-ai-vue.com`，中文规范首页：`/zh/`，英文首页：`/en/`。

## 构建与上传

```sh
pnpm docs:build
```

上传完整的 `docs/.vitepress/dist/`，包括 `robots.txt`、`sitemap.xml`、`404.html`、所有语言页面及 assets。组件库的 `pnpm build` 不会替代文档构建。

配置会为文档生成 canonical、中英文 hreflang 和页面描述。可在 Markdown frontmatter 中设置 `description`，提供比默认描述更具体的页面摘要。

## Nginx

2026-10-26 检查线上时，根首页 HTML 正文为空，`/robots.txt` 和不存在的网址都返回首页 HTML 及 HTTP 200；`/sitemap.xml` 正常返回 XML。普通 HTTP 请求正常不代表 Googlebot 一定可访问，仍需 Search Console 实时测试确认。

在现有 HTTPS server 中合并以下规则，保留证书、网站 root、CDN 和其他业务配置。不要直接覆盖整个 server 配置。如果已有 `/base-demo/` 或 `/cdn/` 等独立应用路由，保留其专用 location。

```nginx
# 根路径统一到已有中文首页，避免依赖 JavaScript 跳转。
location = / {
    return 301 https://element-ai-vue.com/zh/;
}

location = /robots.txt {
    default_type text/plain;
    try_files $uri =404;
}

location = /sitemap.xml {
    default_type application/xml;
    try_files $uri =404;
}

# VitePress cleanUrls: /zh/start 对应磁盘上的 /zh/start.html。
# 不要使用 /index.html 作为所有不存在 URL 的回退。
location / {
    try_files $uri $uri.html $uri/ =404;
}

error_page 404 /404.html;
location = /404.html {
    internal;
}
```

确认站点包含标准 MIME types 配置，部署后先执行 `nginx -t`，通过后再 reload。首页 JavaScript 跳转仍保留作为没有配置服务器重定向时的兼容方案，同时构建 HTML 已提供真实正文和链接。

## 上线验收

```sh
curl -I https://element-ai-vue.com/
curl -I https://element-ai-vue.com/zh/
curl -I https://element-ai-vue.com/zh/base/sender
curl -I https://element-ai-vue.com/en/base/sender
curl -i https://element-ai-vue.com/robots.txt
curl -I https://element-ai-vue.com/sitemap.xml
curl -I https://element-ai-vue.com/seo-check-nonexistent-20261026
```

预期：首页 301 到 `/zh/`；正常页面 200；robots 是纯文本并声明 Sitemap；sitemap 是 XML；不存在的页面返回真正的 404。检查响应头没有意外的 `X-Robots-Tag: noindex`，CDN/WAF 没有拦截 Googlebot。

## Google Search Console

1. 在 https://search.google.com/search-console 验证 `element-ai-vue.com` 域名属性。
2. 提交 `https://element-ai-vue.com/sitemap.xml`。
3. 用“网址检查”检查 `/zh/`、`/en/`、`/zh/start`，运行“测试实际网址”，确认网页可抓取、渲染正文存在、允许编入索引，再请求编入索引。
4. 检查 Google 选择的规范网址是否与对应 canonical 一致。根路径重定向未编入索引是正常现象，应检查目标 `/zh/`。
5. 如果仍搜不到品牌词，记录“网页未编入索引”的具体原因，并查看手动操作、安全问题及服务器抓取日志。不要仅凭 `site:` 查询或第三方搜索结果判断 Google 收录情况。

这些修改改善可抓取性和页面信息，不保证 Google 收录或品牌词排名，也没有固定生效时间。不要通过重复提交或堆砌 keywords 代替检查收录原因。

参考：[Google 技术要求](https://developers.google.com/search/docs/essentials/technical)、[规范网址](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)、[多语言页面](https://developers.google.com/search/docs/specialty/international/localized-versions)。
