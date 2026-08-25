# MOSES

以用户体验为导向，提供更专业的服务。

纯静态网页：软件下载导航 + 在线工具合集，可直接打开或部署到静态托管。

## 打开方式

- 双击 `index.html` 即可浏览
- 或部署到 GitHub Pages / Cloudflare Pages 等后通过网址访问

## 修改内容

编辑 **`data.js`** 中的 `window.SITE_DATA`：

- 站点名称、标语 → `site`
- 软件列表与链接 → `categories`
- 在线工具需加 `"type": "online"`

## 文件说明

| 文件 | 作用 |
|------|------|
| `index.html` | 页面结构 |
| `styles.css` | 样式 |
| `data.js` | 站点数据 |
| `app.js` | 交互逻辑 |
