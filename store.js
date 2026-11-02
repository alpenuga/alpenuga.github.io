const STORE_KEY = 'klassStore';
const THEME_KEY = 'klassTheme';
const LANG_KEY = 'klassLang';

const I18N = {
  ru: {
    all: 'Все',
    search: 'Поиск…',
    empty: 'Скоро появятся товары',
    tagline: 'мебель',
    currency: 'сўм',
    loading: 'Загрузка каталога…',
    offline: 'Нет связи с Firebase, показан локальный кэш.',
    catalog: 'Смотреть каталог',
    write: 'Написать',
    call: 'Звонок',
    prices: 'Цены уточняйте',
    sortNew: 'Новые',
    sortCheap: 'Сначала дешёвые',
    sortExp: 'Сначала дорогие',
    priceFrom: 'от',
    priceTo: 'до'
  },
  uz: {
    all: 'Barchasi',
    search: 'Qidiruv…',
    empty: 'Tez orada mahsulotlar paydo boʻladi',
    tagline: 'mebel',
    currency: 'soʻm',
    loading: 'Katalog yuklanmoqda…',
    offline: 'Firebase yoʻq, mahalliy nusxa koʻrsatildi.',
    catalog: 'Katalogni koʻrish',
    write: 'Yozish',
    call: 'Qoʻngʻiroq',
    prices: 'Narxlarni aniqlashtiring',
    sortNew: 'Yangi',
    sortCheap: 'Avval arzon',
    sortExp: 'Avval qimmat',
    priceFrom: 'dan',
    priceTo: 'gacha'
  }
};

function defaultContacts() {
  return {
    phone: '',
    telegram: '',
    address: '',
    address_uz: '',
    hours: '',
    hours_uz: '',
    foundedYear: 2024,
    heroImg: ''
  };
}

function defaultData() {
  return {
    name: 'KLASS мебель',
    name_uz: 'KLASS mebel',
    contacts: defaultContacts(),
    categories: []
  };
}

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return defaultData();
  const data = {
    name: raw.name || 'KLASS мебель',
    name_uz: raw.name_uz || raw.name || 'KLASS mebel',
    contacts: { ...defaultContacts(), ...(raw.contacts || {}) },
    categories: Array.isArray(raw.categories) ? raw.categories : []
  };
  data.contacts.foundedYear = Number(data.contacts.foundedYear) || 2024;
  data.categories.forEach((c) => {
    c.id = Number(c.id) || Date.now();
    c.name = c.name || '';
    c.name_uz = c.name_uz || '';
    c.products = Array.isArray(c.products) ? c.products : [];
    c.products.forEach((p) => {
      if (p.name && !p.name_ru) p.name_ru = p.name;
      if (p.desc && !p.desc_ru) p.desc_ru = p.desc;
      p.id = Number(p.id) || Date.now();
      p.name_ru = p.name_ru || '';
      p.name_uz = p.name_uz || '';
      p.desc_ru = p.desc_ru || '';
      p.desc_uz = p.desc_uz || '';
      p.price = Number(p.price) || 0;
      p.img = p.img || '';
    });
  });
  return data;
}

function firebaseReady() {
  return typeof firebase !== 'undefined'
    && typeof firebaseConfig === 'object'
    && firebaseConfig.projectId === 'klass-db84f';
}

function initFirebase() {
  if (!firebaseReady()) return false;
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  return true;
}

function cacheLocal(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

async function loadStore() {
  if (initFirebase()) {
    const ref = firebase.firestore().collection('store').doc('main');
    const snap = await ref.get();
    if (snap.exists) {
      const data = normalize(snap.data());
      cacheLocal(data);
      return data;
    }
    const fresh = defaultData();
    cacheLocal(fresh);
    return fresh;
  }
  try {
    return normalize(JSON.parse(localStorage.getItem(STORE_KEY)) || defaultData());
  } catch {
    return defaultData();
  }
}

async function saveStore(data) {
  cacheLocal(data);
  if (!initFirebase()) throw new Error('Firebase не настроен');
  await firebase.firestore().collection('store').doc('main').set(data);
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function applyTheme() {
  const theme = localStorage.getItem(THEME_KEY) || 'light';
  document.body.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = theme === 'dark' ? '☀' : '☾';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#2A3545' : '#F3F1ED');
}

function toggleTheme() {
  const next = (localStorage.getItem(THEME_KEY) || 'light') === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme();
}

function getLang() {
  return localStorage.getItem(LANG_KEY) === 'uz' ? 'uz' : 'ru';
}

function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
}

function pick(lang, ru, uz) {
  return lang === 'uz' && uz ? uz : ru;
}

function telegramUrl(value) {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return 'https://t.me/' + v.replace(/^@/, '');
}

function phoneHref(value) {
  const v = (value || '').trim();
  if (!v) return '';
  return 'tel:' + v.replace(/[^\d+]/g, '');
}

function copyrightLine(name, founded) {
  const now = new Date().getFullYear();
  const start = Number(founded) || now;
  const range = start < now ? `${start}–${now}` : String(now);
  return `© ${range} ${name}`;
}

document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'themeBtn') toggleTheme();
});
applyTheme();