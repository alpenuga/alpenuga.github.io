let data = defaultData();
const imgPrev = document.getElementById('imgPrev');
const loginEl = document.getElementById('login');
const panelEl = document.getElementById('panel');
const adminStatus = document.getElementById('adminStatus');

function showPanel() {
  loginEl.classList.add('hidden');
  panelEl.classList.remove('hidden');
  document.getElementById('newName').value = data.name || '';
  document.getElementById('newNameUz').value = data.name_uz || '';
  renderAdmin();
}

function showLogin() {
  loginEl.classList.remove('hidden');
  panelEl.classList.add('hidden');
}

function previewFromUrl(url) {
  if (!url) {
    imgPrev.src = '';
    imgPrev.classList.add('hidden');
    return;
  }
  imgPrev.src = url;
  imgPrev.classList.remove('hidden');
}

async function persist() {
  adminStatus.textContent = 'Сохранение…';
  await saveStore(data);
  adminStatus.textContent = 'Сохранено в Firebase. Витрина обновится сама.';
}

function resetProductForm() {
  document.getElementById('editProdId').value = '';
  document.getElementById('editCatId').value = '';
  document.getElementById('prodNameRu').value = '';
  document.getElementById('prodNameUz').value = '';
  document.getElementById('prodDescRu').value = '';
  document.getElementById('prodDescUz').value = '';
  document.getElementById('prodPrice').value = '';
  document.getElementById('prodImgUrl').value = '';
  previewFromUrl('');
  document.getElementById('formTitle').textContent = 'Новый товар';
  document.getElementById('saveProdBtn').textContent = 'Добавить товар';
  document.getElementById('cancelBtn').classList.add('hidden');
}

function fillCatSelect(selectedId) {
  const sel = document.getElementById('catSelect');
  sel.innerHTML = data.categories
    .map((c) => `<option value="${c.id}">${esc(c.name)}${c.name_uz ? ' / ' + esc(c.name_uz) : ''}</option>`)
    .join('');
  if (selectedId) sel.value = String(selectedId);
}

async function login() {
  if (!initFirebase()) {
    alert('Проверьте firebase-config.js');
    return;
  }
  const email = document.getElementById('email').value.trim();
  const pass = document.getElementById('pass').value;
  try {
    await firebase.auth().signInWithEmailAndPassword(email, pass);
  } catch (err) {
    alert('Ошибка входа: ' + err.message);
  }
}

async function saveName() {
  data.name = document.getElementById('newName').value.trim() || 'KLASS мебель';
  data.name_uz = document.getElementById('newNameUz').value.trim();
  await persist();
}

async function addCat() {
  const name = document.getElementById('catName').value.trim();
  const nameUz = document.getElementById('catNameUz').value.trim();
  if (!name) return alert('Укажите название категории на русском');
  data.categories.push({ id: Date.now(), name, name_uz: nameUz, products: [] });
  document.getElementById('catName').value = '';
  document.getElementById('catNameUz').value = '';
  await persist();
  renderAdmin();
}

async function saveProd() {
  const catId = Number(document.getElementById('catSelect').value);
  const cat = data.categories.find((c) => c.id === catId);
  if (!cat) return alert('Сначала добавьте категорию');

  const nameRu = document.getElementById('prodNameRu').value.trim();
  if (!nameRu) return alert('Укажите название на русском');

  const id = document.getElementById('editProdId').value
    ? Number(document.getElementById('editProdId').value)
    : Date.now();

  const payload = {
    id,
    name_ru: nameRu,
    name_uz: document.getElementById('prodNameUz').value.trim(),
    desc_ru: document.getElementById('prodDescRu').value.trim(),
    desc_uz: document.getElementById('prodDescUz').value.trim(),
    price: Number(document.getElementById('prodPrice').value) || 0,
    img: document.getElementById('prodImgUrl').value.trim()
  };

  const oldCatId = Number(document.getElementById('editCatId').value);
  const editing = Boolean(document.getElementById('editProdId').value);

  if (editing) {
    if (oldCatId && oldCatId !== catId) {
      const oldCat = data.categories.find((c) => c.id === oldCatId);
      if (oldCat) oldCat.products = oldCat.products.filter((p) => p.id !== id);
      cat.products.push(payload);
    } else {
      const p = cat.products.find((x) => x.id === id);
      if (p) Object.assign(p, payload);
      else cat.products.push(payload);
    }
  } else {
    cat.products.push(payload);
  }

  await persist();
  resetProductForm();
  renderAdmin();
}

function editProd(catId, prodId) {
  const cat = data.categories.find((c) => c.id === catId);
  const p = cat?.products.find((x) => x.id === prodId);
  if (!p) return;
  document.getElementById('editProdId').value = p.id;
  document.getElementById('editCatId').value = catId;
  fillCatSelect(catId);
  document.getElementById('prodNameRu').value = p.name_ru || '';
  document.getElementById('prodNameUz').value = p.name_uz || '';
  document.getElementById('prodDescRu').value = p.desc_ru || '';
  document.getElementById('prodDescUz').value = p.desc_uz || '';
  document.getElementById('prodPrice').value = p.price || '';
  document.getElementById('prodImgUrl').value = p.img || '';
  previewFromUrl(p.img || '');
  document.getElementById('formTitle').textContent = 'Редактировать товар';
  document.getElementById('saveProdBtn').textContent = 'Сохранить изменения';
  document.getElementById('cancelBtn').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProd(catId, prodId) {
  if (!confirm('Удалить товар?')) return;
  const cat = data.categories.find((c) => c.id === catId);
  if (!cat) return;
  cat.products = cat.products.filter((p) => p.id !== prodId);
  await persist();
  renderAdmin();
}

async function deleteCat(catId) {
  if (!confirm('Удалить категорию и все товары в ней?')) return;
  data.categories = data.categories.filter((c) => c.id !== catId);
  await persist();
  renderAdmin();
}

function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'klass-store.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function renderAdmin() {
  fillCatSelect();
  const list = document.getElementById('list');
  if (!data.categories.length) {
    list.innerHTML = '<p class="hint">Категорий нет — сначала добавьте категорию.</p>';
    return;
  }
  list.innerHTML = data.categories.map((c) => `
    <div class="cat-block">
      <div class="cat-head">
        <strong>${esc(c.name)}${c.name_uz ? ' / ' + esc(c.name_uz) : ''}</strong>
        <button class="btn btn-danger mini" data-act="del-cat" data-cat="${c.id}">Удалить</button>
      </div>
      ${c.products.map((p) => `
        <div class="list-item">
          <div style="display:flex;gap:0.8rem;align-items:center;">
            <img src="${esc(p.img)}" alt="">
            <div>
              <strong>${esc(p.name_ru)}</strong>
              ${p.name_uz ? `<div class="hint" style="margin:0">${esc(p.name_uz)}</div>` : ''}
              <div>${Number(p.price).toLocaleString('ru-RU')} сўм</div>
            </div>
          </div>
          <div class="btn-row">
            <button class="btn btn-edit mini" data-act="edit" data-cat="${c.id}" data-id="${p.id}">Изменить</button>
            <button class="btn btn-danger mini" data-act="del" data-cat="${c.id}" data-id="${p.id}">Удалить</button>
          </div>
        </div>
      `).join('') || '<p class="hint">В этой категории пока нет товаров.</p>'}
    </div>
  `).join('');
}

document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('pass').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') login();
});
document.getElementById('logoutBtn').addEventListener('click', () => firebase.auth().signOut());
document.getElementById('saveNameBtn').addEventListener('click', () => saveName().catch((e) => alert(e.message)));
document.getElementById('addCatBtn').addEventListener('click', () => addCat().catch((e) => alert(e.message)));
document.getElementById('saveProdBtn').addEventListener('click', () => saveProd().catch((e) => alert(e.message)));
document.getElementById('cancelBtn').addEventListener('click', resetProductForm);
document.getElementById('exportBtn').addEventListener('click', exportData);
document.getElementById('prodImgUrl').addEventListener('input', (e) => previewFromUrl(e.target.value.trim()));
document.getElementById('list').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const catId = Number(btn.dataset.cat);
  const id = Number(btn.dataset.id);
  if (btn.dataset.act === 'edit') editProd(catId, id);
  if (btn.dataset.act === 'del') deleteProd(catId, id).catch((err) => alert(err.message));
  if (btn.dataset.act === 'del-cat') deleteCat(catId).catch((err) => alert(err.message));
});

async function bootAdmin() {
  if (!initFirebase()) {
    adminStatus.textContent = 'Нет firebase-config.js';
    return;
  }
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      showLogin();
      return;
    }
    try {
      data = await loadStore();
      showPanel();
      adminStatus.textContent = 'Вы вошли как ' + user.email;
    } catch (err) {
      alert('Не удалось загрузить каталог: ' + err.message);
    }
  });
}

bootAdmin();