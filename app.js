let data = defaultData();
let lang = getLang();
let activeCat = null;

const els = {
  storeName: document.getElementById('storeName'),
  tagline: document.getElementById('tagline'),
  langBtn: document.getElementById('langBtn'),
  headerPhone: document.getElementById('headerPhone'),
  cats: document.getElementById('cats'),
  products: document.getElementById('products'),
  search: document.getElementById('search'),
  sort: document.getElementById('sort'),
  priceMin: document.getElementById('priceMin'),
  priceMax: document.getElementById('priceMax'),
  status: document.getElementById('status'),
  footer: document.getElementById('footer'),
  heroMedia: document.getElementById('heroMedia'),
  heroTitle: document.getElementById('heroTitle'),
  heroKicker: document.getElementById('heroKicker'),
  heroCta: document.getElementById('heroCta'),
  modalBack: document.getElementById('modalBack'),
  modalImg: document.getElementById('modalImg'),
  modalTitle: document.getElementById('modalTitle'),
  modalDesc: document.getElementById('modalDesc'),
  modalPrice: document.getElementById('modalPrice'),
  modalActions: document.getElementById('modalActions')
};

function t() { return I18N[lang]; }
function contacts() { return data.contacts || defaultContacts(); }
function productTitle(p) { return pick(lang, p.name_ru, p.name_uz); }
function productDesc(p) { return pick(lang, p.desc_ru, p.desc_uz); }
function catTitle(c) { return pick(lang, c.name, c.name_uz); }
function storeTitle() { return pick(lang, data.name, data.name_uz); }

function applyChrome() {
  const title = storeTitle();
  els.storeName.textContent = title;
  document.title = title;
  els.tagline.textContent = t().tagline;
  els.langBtn.textContent = lang === 'ru' ? 'Oʻz' : 'Ру';
  els.search.placeholder = t().search;
  els.heroTitle.textContent = title;
  els.heroKicker.textContent = t().tagline;
  els.heroCta.textContent = t().catalog;
  const hero = contacts().heroImg;
  els.heroMedia.style.backgroundImage = hero
    ? `var(--hero-overlay), url("${hero}")`
    : 'var(--hero-overlay), linear-gradient(135deg, #3d3229, #1c1b19)';
  const phone = contacts().phone;
  if (phone) {
    els.headerPhone.textContent = phone;
    els.headerPhone.href = phoneHref(phone);
    els.headerPhone.classList.remove('hidden');
  } else {
    els.headerPhone.classList.add('hidden');
  }
  els.sort.options[0].textContent = t().sortNew;
  els.sort.options[1].textContent = t().sortCheap;
  els.sort.options[2].textContent = t().sortExp;
  els.priceMin.placeholder = t().priceFrom;
  els.priceMax.placeholder = t().priceTo;
  renderFooter();
}

function renderFooter() {
  const c = contacts();
  const bits = [
    c.phone,
    c.telegram,
    pick(lang, c.address, c.address_uz),
    pick(lang, c.hours, c.hours_uz)
  ].filter(Boolean);
  els.footer.innerHTML = `
    <h3>${esc(storeTitle())}</h3>
    <p class="footer-meta">${esc(bits.join(' · '))}</p>
    <p class="footer-note">${esc(t().prices)}</p>
    <p class="footer-copy">${esc(copyrightLine(storeTitle(), c.foundedYear))}</p>
  `;
}

function renderCats() {
  const buttons = [`<button class="${activeCat == null ? 'active' : ''}" data-id="">${esc(t().all)}</button>`];
  data.categories.forEach((c) => {
    buttons.push(`<button class="${activeCat === c.id ? 'active' : ''}" data-id="${c.id}">${esc(catTitle(c))}</button>`);
  });
  els.cats.innerHTML = buttons.join('');
}

function actionLinks(p, asButtons) {
  const c = contacts();
  const tg = telegramUrl(c.telegram);
  const tel = phoneHref(c.phone);
  const tag = asButtons ? 'button' : 'a';
  let html = '';
  if (tg) html += asButtons
    ? `<a class="btn" href="${esc(tg)}" target="_blank" rel="noopener">${esc(t().write)}</a>`
    : `<a href="${esc(tg)}" target="_blank" rel="noopener" data-stop="1">${esc(t().write)}</a>`;
  if (tel) html += asButtons
    ? `<a class="btn btn-ghost" href="${esc(tel)}">${esc(t().call)}</a>`
    : `<a href="${esc(tel)}" data-stop="1">${esc(t().call)}</a>`;
  return html;
}

function listedProducts() {
  let list = activeCat == null
    ? data.categories.flatMap((c) => c.products)
    : (data.categories.find((c) => c.id === activeCat)?.products || []);
  const q = (els.search.value || '').trim().toLowerCase();
  if (q) {
    list = list.filter((p) =>
      `${p.name_ru} ${p.name_uz} ${p.desc_ru} ${p.desc_uz}`.toLowerCase().includes(q)
    );
  }
  const min = Number(els.priceMin.value);
  const max = Number(els.priceMax.value);
  if (min) list = list.filter((p) => p.price >= min);
  if (max) list = list.filter((p) => p.price <= max);
  const sort = els.sort.value;
  list = [...list];
  if (sort === 'cheap') list.sort((a, b) => a.price - b.price);
  if (sort === 'expensive') list.sort((a, b) => b.price - a.price);
  if (sort === 'new') list.sort((a, b) => b.id - a.id);
  return list;
}

function renderProducts() {
  const list = listedProducts();
  if (!list.length) {
    els.products.innerHTML = `<p class="empty">${esc(t().empty)}</p>`;
    return;
  }
  els.products.innerHTML = list.map((p) => `
    <article class="card" data-open="${p.id}">
      <img src="${esc(p.img)}" alt="${esc(productTitle(p))}">
      <div class="card-body">
        <h3>${esc(productTitle(p))}</h3>
        <p>${esc(productDesc(p))}</p>
        <div class="price">${Number(p.price).toLocaleString('ru-RU')} ${t().currency}</div>
        <div class="card-actions">${actionLinks(p, false)}</div>
      </div>
    </article>
  `).join('');
}

function findProduct(id) {
  for (const c of data.categories) {
    const p = c.products.find((x) => String(x.id) === String(id));
    if (p) return p;
  }
  return null;
}

function openModal(id) {
  const p = findProduct(id);
  if (!p) return;
  els.modalImg.src = p.img || '';
  els.modalImg.alt = productTitle(p);
  els.modalTitle.textContent = productTitle(p);
  els.modalDesc.textContent = productDesc(p);
  els.modalPrice.textContent = `${Number(p.price).toLocaleString('ru-RU')} ${t().currency}`;
  els.modalActions.innerHTML = actionLinks(p, true);
  els.modalBack.classList.remove('hidden');
}

function closeModal() {
  els.modalBack.classList.add('hidden');
}

function renderSkeleton() {
  els.products.innerHTML = Array.from({ length: 6 }, () => `
    <div class="skel-card">
      <div class="skel-img"></div>
      <div class="skel-line"></div>
      <div class="skel-line short"></div>
    </div>
  `).join('');
}

function render() {
  applyChrome();
  renderCats();
  renderProducts();
}

els.langBtn.addEventListener('click', () => {
  lang = lang === 'ru' ? 'uz' : 'ru';
  setLang(lang);
  render();
});

els.cats.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  activeCat = btn.dataset.id ? Number(btn.dataset.id) : null;
  render();
});

['input', 'change'].forEach((ev) => {
  els.search.addEventListener(ev, renderProducts);
  els.sort.addEventListener(ev, renderProducts);
  els.priceMin.addEventListener(ev, renderProducts);
  els.priceMax.addEventListener(ev, renderProducts);
});

els.products.addEventListener('click', (e) => {
  if (e.target.closest('[data-stop]')) {
    e.stopPropagation();
    return;
  }
  const card = e.target.closest('[data-open]');
  if (card) openModal(card.dataset.open);
});

document.getElementById('modalClose').addEventListener('click', closeModal);
els.modalBack.addEventListener('click', (e) => {
  if (e.target === els.modalBack) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

async function boot() {
  renderSkeleton();
  els.status.textContent = t().loading;
  try {
    data = await loadStore();
    els.status.textContent = firebaseReady() ? '' : t().offline;
    if (initFirebase()) {
      firebase.firestore().collection('store').doc('main').onSnapshot((snap) => {
        if (!snap.exists) return;
        data = normalize(snap.data());
        cacheLocal(data);
        render();
      });
    }
  } catch (err) {
    els.status.textContent = 'Ошибка Firebase: ' + err.message;
    try { data = normalize(JSON.parse(localStorage.getItem(STORE_KEY))); }
    catch { data = defaultData(); }
  }
  render();
}

boot();