const state = { data: null, query: "" };

const els = {
  siteName: document.getElementById("site-name"),
  siteTitle: document.getElementById("site-title"),
  siteTagline: document.getElementById("site-tagline"),
  siteNotice: document.getElementById("site-notice"),
  nav: document.getElementById("nav"),
  categories: document.getElementById("categories"),
  resultCount: document.getElementById("result-count"),
  search: document.getElementById("search"),
  dialog: document.getElementById("detail-dialog"),
  detailBody: document.getElementById("detail-body"),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function matchesQuery(item, query) {
  if (!query) return true;
  const hay = [item.name, item.desc, ...(item.tags || [])].join(" ").toLowerCase();
  return hay.includes(query);
}

function findItem(id) {
  for (const cat of state.data.categories) {
    const hit = cat.items.find((item) => item.id === id);
    if (hit) return { category: cat, item: hit };
  }
  return null;
}

function isOnline(item) {
  return item.type === "online";
}

function renderNav(categories) {
  els.nav.innerHTML = categories
    .map((cat) => `<a href="#cat-${escapeHtml(cat.id)}">${escapeHtml(cat.name)}</a>`)
    .join("");
}

function renderItem(item) {
  const online = isOnline(item);
  const actionLabel = online ? "打开" : "下载";
  const tags = (item.tags || [])
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join("");

  return `
    <article class="item${online ? " item-online" : ""}" data-id="${escapeHtml(item.id)}">
      <div class="item-top">
        <div>
          <h4>${escapeHtml(item.name)}</h4>
          <p class="desc">${escapeHtml(item.desc || "")}</p>
        </div>
        <div class="tags">${tags}</div>
      </div>
      <div class="meta">
        <span>${escapeHtml(item.platform || (online ? "浏览器" : "Windows"))}</span>
        <span>${escapeHtml(item.version || "")}</span>
        <span>${escapeHtml(online ? item.size || "无需安装" : item.size || "")}</span>
      </div>
      <div class="item-actions">
        <a class="btn btn-primary" href="${escapeHtml(item.download)}" target="_blank" rel="noopener noreferrer">${actionLabel}</a>
        <button class="btn btn-soft" type="button" data-detail="${escapeHtml(item.id)}">详情</button>
      </div>
    </article>
  `;
}

function renderCatalog() {
  const query = state.query.trim().toLowerCase();
  let visible = 0;

  const html = state.data.categories
    .map((cat) => {
      const items = cat.items.filter((item) => matchesQuery(item, query));
      if (!items.length) return "";
      visible += items.length;
      return `
        <section class="category" id="cat-${escapeHtml(cat.id)}">
          <div class="category-head">
            <h3>${escapeHtml(cat.name)}</h3>
            <p>${escapeHtml(cat.desc || "")} · ${items.length} 项</p>
          </div>
          <div class="grid">
            ${items.map(renderItem).join("")}
          </div>
        </section>
      `;
    })
    .join("");

  els.categories.innerHTML = html || `<div class="empty">没有匹配「${escapeHtml(state.query)}」的软件</div>`;
  els.resultCount.textContent = query
    ? `找到 ${visible} 个结果`
    : `共 ${state.data.categories.reduce((n, c) => n + c.items.length, 0)} 项`;
}

function openDetail(id) {
  const found = findItem(id);
  if (!found) return;
  const { item } = found;
  const online = isOnline(item);
  const actionLabel = online ? "打开网站" : "打开下载";
  const linkLabel = online ? "访问地址" : "下载地址";

  els.detailBody.innerHTML = `
    <h3>${escapeHtml(item.name)}</h3>
    <p>${escapeHtml(item.desc || "")}</p>
    <p>平台：${escapeHtml(item.platform || (online ? "浏览器" : "-"))} · 版本：${escapeHtml(item.version || "-")} · ${online ? "类型" : "大小"}：${escapeHtml(online ? "在线使用" : item.size || "-")}</p>
    <p>官网</p>
    <div class="link-box">${escapeHtml(item.official || item.download || "")}</div>
    <p>${linkLabel}</p>
    <div class="link-box">${escapeHtml(item.download || "")}</div>
    <div class="dialog-actions">
      <a class="btn btn-primary" href="${escapeHtml(item.download)}" target="_blank" rel="noopener noreferrer">${actionLabel}</a>
      <button class="btn btn-ghost" type="button" data-copy="${escapeHtml(item.download)}">复制链接</button>
    </div>
  `;
  els.dialog.showModal();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    window.prompt("复制链接", text);
    return false;
  }
}

function bindEvents() {
  els.search.addEventListener("input", () => {
    state.query = els.search.value;
    renderCatalog();
  });

  els.categories.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-detail]");
    if (!btn) return;
    openDetail(btn.getAttribute("data-detail"));
  });

  els.detailBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const ok = await copyText(btn.getAttribute("data-copy") || "");
    btn.textContent = ok ? "已复制" : "已弹出";
    setTimeout(() => {
      btn.textContent = "复制链接";
    }, 1200);
  });

  const links = () => [...els.nav.querySelectorAll("a")];
  const onScroll = () => {
    const sections = [...document.querySelectorAll(".category")];
    let current = sections[0]?.id;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= 120) current = section.id;
    }
    links().forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === `#${current}`);
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

function boot() {
  try {
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
  } catch (err) {
    console.error(err);
    els.categories.innerHTML = `<div class="empty">页面加载出错：${escapeHtml(err.message)}</div>`;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
