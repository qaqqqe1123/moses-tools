const NAV_SHORT = {
  "free-picks": "精选",
  compress: "压缩",
  browser: "浏览器",
  "office-free": "办公",
  chat: "通讯",
  remote: "远程",
  media: "影音",
  tools: "工具",
  system: "系统",
  input: "输入法",
  games: "游戏",
  online: "在线",
  security: "安全",
};

const NAV_OFFSET = 132;

const state = { data: null, query: "" };

const els = {
  siteName: document.getElementById("site-name"),
  siteTitle: document.getElementById("site-title"),
  siteTagline: document.getElementById("site-tagline"),
  siteNotice: document.getElementById("site-notice"),
  nav: document.getElementById("nav"),
  navDrawer: document.getElementById("nav-drawer"),
  navDrawerGrid: document.getElementById("nav-drawer-grid"),
  navToggle: document.getElementById("nav-toggle"),
  navDrawerClose: document.getElementById("nav-drawer-close"),
  categories: document.getElementById("categories"),
  resultCount: document.getElementById("result-count"),
  search: document.getElementById("search"),
  dialog: document.getElementById("detail-dialog"),
  detailBody: document.getElementById("detail-body"),
};

function navLabel(cat) {
  return NAV_SHORT[cat.id] || cat.name.replace(/（.*?）/g, "");
}

function categoryHref(id) {
  return `#cat-${id}`;
}

function setActiveNav(id) {
  const href = categoryHref(id);
  els.nav.querySelectorAll("a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === href);
  });
  els.navDrawerGrid?.querySelectorAll("a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === href);
  });
}

function scrollToCategory(id) {
  const el = document.getElementById(`cat-${id}`);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
  setActiveNav(id);
  history.replaceState(null, "", categoryHref(id));
}

function syncHashNav() {
  const hash = window.location.hash;
  if (!hash.startsWith("#cat-")) return;
  const id = hash.slice(5);
  setActiveNav(id);
  window.requestAnimationFrame(() => {
    const el = document.getElementById(`cat-${id}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    window.scrollTo({ top, behavior: window.scrollY > 40 ? "smooth" : "auto" });
  });
}

function openNavDrawer() {
  els.navDrawer.hidden = false;
  els.navToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("nav-open");
}

function closeNavDrawer() {
  els.navDrawer.hidden = true;
  els.navToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");
}

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
  const links = categories
    .map(
      (cat) =>
        `<a href="${categoryHref(cat.id)}" data-cat="${escapeHtml(cat.id)}">${escapeHtml(navLabel(cat))}</a>`,
    )
    .join("");

  els.nav.innerHTML = links;
  if (els.navDrawerGrid) {
    els.navDrawerGrid.innerHTML = categories
      .map(
        (cat) => `
        <a class="nav-drawer-item" href="${categoryHref(cat.id)}" data-cat="${escapeHtml(cat.id)}">
          <span class="nav-drawer-title">${escapeHtml(navLabel(cat))}</span>
          <span class="nav-drawer-desc">${escapeHtml(cat.desc || cat.name)} · ${cat.items.length} 项</span>
        </a>
      `,
      )
      .join("");
  }
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

  const onNavClick = (e) => {
    const link = e.target.closest("a[data-cat]");
    if (!link) return;
    e.preventDefault();
    scrollToCategory(link.getAttribute("data-cat"));
    closeNavDrawer();
  };

  els.nav.addEventListener("click", onNavClick);
  els.navDrawerGrid?.addEventListener("click", onNavClick);

  els.navToggle?.addEventListener("click", () => {
    if (els.navDrawer.hidden) openNavDrawer();
    else closeNavDrawer();
  });

  els.navDrawerClose?.addEventListener("click", closeNavDrawer);
  els.navDrawer?.addEventListener("click", (e) => {
    if (e.target === els.navDrawer) closeNavDrawer();
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

  const onScroll = () => {
    const sections = [...document.querySelectorAll(".category")];
    let current = sections[0]?.id?.replace("cat-", "");
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= NAV_OFFSET + 8) {
        current = section.id.replace("cat-", "");
      }
    }
    if (current) setActiveNav(current);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("hashchange", syncHashNav);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNavDrawer();
  });
}

function onScrollInit() {
  const sections = [...document.querySelectorAll(".category")];
  const current = sections[0]?.id?.replace("cat-", "");
  if (current) setActiveNav(current);
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
    if (window.location.hash.startsWith("#cat-")) {
      setTimeout(syncHashNav, 80);
    } else {
      onScrollInit();
    }
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
