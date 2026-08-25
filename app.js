function boot() {
  const data = window.SITE_DATA;
  if (!data || !data.categories) {
    els.categories.innerHTML = `<div class="empty">页面数据加载失败，请刷新后重试。</div>`;
    return;
  }
  state.data = data;

  const site = state.data.site || {};
  els.siteName.textContent = site.name || "MOSES";
  els.siteTitle.textContent = site.name || "MOSES";
  els.siteTagline.textContent = site.tagline || "以用户体验为导向，提供更专业的服务";
  els.siteNotice.textContent = site.notice || "";
  document.title = (site.name || "MOSES") + " · 专业软件与工具导航";

  renderNav(state.data.categories);
  renderCatalog();
  bindEvents();
}

boot();
