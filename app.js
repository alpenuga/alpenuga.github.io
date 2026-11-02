let data = defaultData();
let lang = getLang();
let activeCat = null;

const storeNameEl = document.getElementById('storeName');
const taglineEl = document.getElementById('tagline');
const langBtn = document.getElementById('langBtn');
const adminLink = document.getElementById('adminLink');
const catsEl = document.getElementById('cats');
const productsEl = document.getElementById('products');
const searchEl = document.getElementById('search');
const statusEl = document.getElementById('status');

function t() { return I18N[lang]; }

function applyChrome() {
  const title = pick(lang, data.name, data.name_uz);
  storeNameEl.textContent = title;
  document.title = title;
  taglineEl.textContent = t().tagline;
  langBtn.textContent = lang === 'ru' ? 'Oʻz' : 'РУ';
  adminLink.textContent = t().admin;
  searchEl.placeholder = t().search;
}

function productTitle(p) { return pick(lang, p.name_ru, p.name_uz); }
function productDesc(p) { return pick(lang, p.desc_ru, p.desc_uz); }
function catTitle(c) { return pick(lang, c.name, c.name_uz); }

function renderCats() {
  const buttons = [`<button class="${activeCat == null ? 'active' : ''}" data-id="">${esc(t().all)}</button>`];
  data.categories.forEach((c) => {
    buttons.push(`<button class="${activeCat === c.id ? 'active' : ''}" data-id="${c.id}">${esc(catTitle(c))}</button>`);
  });
  catsEl.innerHTML = buttons.join('');
}

function renderProducts() {
  const q = (searchEl.value || '').trim().toLowerCase();
  let list = activeCat == null
    ? data.categories.flatMap((c) => c.products)
    : (data.categories.find((c) => c.id === activeCat)?.products || []);

  if (q) {
    list = list.filter((p) =>
      `${p.name_ru} ${p.name_uz} ${p.desc_ru} ${p.desc_uz}`.toLowerCase().includes(q)
    );
  }

  if (!list.length) {
    productsEl.innerHTML = `<p class="empty">${esc(t().empty)}</p>`;
    return;
  }

  productsEl.innerHTML = list.map((p) => `
    <article class="card">
      <img src="${esc(p.img)}" alt="${esc(productTitle(p))}" onerror="this.src='https://picsum.photos/800/600?grayscale'">
      <div class="card-body">
        <h3>${esc(productTitle(p))}</h3>
        <p>${esc(productDesc(p))}</p>
        <div class="price">${Number(p.price).toLocaleString('ru-RU')} ${t().currency}</div>
      </div>
    </article>
  `).join('');
}

function render() {
  applyChrome();
  renderCats();
  renderProducts();
}

langBtn.addEventListener('click', () => {
  lang = lang === 'ru' ? 'uz' : 'ru';
  setLang(lang);
  render();
});

catsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  activeCat = btn.dataset.id ? Number(btn.dataset.id) : null;
  render();
});

searchEl.addEventListener('input', renderProducts);

async function boot() {
  statusEl.textContent = t().loading;
  try {
    data = await loadStore();
    statusEl.textContent = firebaseReady() ? '' : t().offline;
    if (initFirebase()) {
      firebase.firestore().collection('store').doc('main').onSnapshot((snap) => {
        if (!snap.exists) return;
        data = normalize(snap.data());
        cacheLocal(data);
        render();
      });
    }
  } catch (err) {
    statusEl.textContent = 'Ошибка Firebase: ' + err.message;
    try {
      data = normalize(JSON.parse(localStorage.getItem(STORE_KEY)));
    } catch {
      data = defaultData();
    }
  }
  render();
}

boot();