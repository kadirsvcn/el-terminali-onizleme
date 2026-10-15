const $ = (s) => document.querySelector(s);

const CHROME_VER = '130.0.0.0';
const GENERIC_UA = `Mozilla/5.0 (Linux; Android 13; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_VER} Mobile Safari/537.36`;
const uaFor = (d) => `Mozilla/5.0 (Linux; Android ${d.android || 13}; ${(d.model || '').split(' /')[0]}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_VER} Mobile Safari/537.36`;

const STATUS_H = 24;
const NAV_H = 48;

const DEFAULTS = {
  url: '',
  selected: ['zebra-tc52', 'zebra-tc53', 'zebra-mc33', 'honeywell-ct40'],
  landscape: false,
  zoom: 1,
  sysbars: true,
  bezel: true,
  ua: true,
  custom: []
};

let state;
let activeId = null;
const pending = new Map();

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const allDevices = () => [...DEVICES, ...state.custom];
const findDevice = (id) => allDevices().find((d) => d.id === id);
const save = () => chrome.storage.local.set({ hhsim: state });

let toastTimer;
function toast(msg, kind = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'show ' + kind;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = ''), 2600);
}

async function applyNetwork() {
  try {
    const r = await chrome.runtime.sendMessage({ type: 'configure', ua: state.ua ? GENERIC_UA : '' });
    if (r && !r.ok) console.warn('Ağ kuralı hatası', r.error);
  } catch (e) { console.warn(e); }
}

// Sayfanın göreceği viewport (CSS px)
function viewport(d) {
  let w = d.w, h = d.h;
  if (state.landscape) [w, h] = [h, w];
  if (state.sysbars) {
    const nav = d.nav ? NAV_H : 0;
    if (state.landscape) { h -= STATUS_H; w -= nav; }
    else { h -= STATUS_H + nav; }
  }
  return { w, h };
}

function clock() {
  const n = new Date();
  return String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
}

function statusBar() {
  return el('div', 'status', `<span>${clock()}</span><span>▾ ◢ ▮ 84%</span>`);
}

function navBar(vertical) {
  return el('div', 'nav' + (vertical ? ' v' : ''), '<span>◁</span><span>○</span><span>□</span>');
}

function keypad(d) {
  const kp = el('div', 'keypad');
  const keys = [
    ['F1', 'fn'], ['F2', 'fn'], ['SCAN', 'scan'], ['⌫', 'fn'],
    ['1'], ['2'], ['3'], ['TAB', 'fn'],
    ['4'], ['5'], ['6'], ['.', ''],
    ['7'], ['8'], ['9'], ['ENT', 'ent'],
    ['*'], ['0'], ['#'], ['-']
  ];
  for (const [k, cls] of keys) {
    const b = el('button', cls || '', esc(k));
    b.type = 'button';
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => {
      setActive(d.id);
      if (k === 'ENT') return sendToDevice(d.id, '', 'enter');
      if (k === 'TAB') return sendToDevice(d.id, '', 'tab');
      if (k === '⌫' || k === 'SCAN' || k === 'F1' || k === 'F2') return toast(`${k} tuşu simüle edilmiyor`);
      sendToDevice(d.id, k, 'none', true);
    });
    kp.append(b);
  }
  return kp;
}

// ---- Sürükle-bırak ile cihaz sırası ----
let dragId = null;

function clearDropMarks() {
  document.querySelectorAll('.drop-before, .drop-after').forEach((x) => x.classList.remove('drop-before', 'drop-after'));
}

function enableDrag(card, handle, id) {
  handle.draggable = true;

  handle.addEventListener('dragstart', (e) => {
    dragId = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.setDragImage(card, 20, 20);
    card.classList.add('dragging');
    document.body.classList.add('dnd'); // iframe'ler sürükleme olaylarını yutmasın
  });

  handle.addEventListener('dragend', () => {
    dragId = null;
    card.classList.remove('dragging');
    document.body.classList.remove('dnd');
    clearDropMarks();
  });

  const isAfter = (e) => {
    const r = card.getBoundingClientRect();
    return e.clientX > r.left + r.width / 2;
  };

  card.addEventListener('dragover', (e) => {
    if (!dragId || dragId === id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const after = isAfter(e);
    if (!card.classList.contains(after ? 'drop-after' : 'drop-before')) {
      clearDropMarks();
      card.classList.add(after ? 'drop-after' : 'drop-before');
    }
  });

  card.addEventListener('dragleave', (e) => {
    if (!card.contains(e.relatedTarget)) card.classList.remove('drop-before', 'drop-after');
  });

  card.addEventListener('drop', (e) => {
    if (!dragId || dragId === id) return;
    e.preventDefault();
    const moved = dragId;
    const order = state.selected.filter((x) => x !== moved);
    order.splice(order.indexOf(id) + (isAfter(e) ? 1 : 0), 0, moved);
    clearDropMarks();
    if (order.join() === state.selected.join()) return;
    state.selected = order;
    save();
    moveCards(order);
  });
}

// Kartları yeniden oluşturmadan sıralar (yalnızca yer değiştiren iframe yeniden yüklenir)
function moveCards(order) {
  const stage = $('#stage');
  for (const id of order) {
    const c = stage.querySelector(`.device[data-id="${CSS.escape(id)}"]`);
    if (c && stage.lastElementChild !== c) stage.append(c);
  }
}

function deviceCard(d) {
  const { w, h } = viewport(d);
  const L = state.landscape;

  const card = el('section', 'device' + (d.id === activeId ? ' active' : ''));
  card.dataset.id = d.id;

  const label = el('header', 'dlabel',
    `<b>${esc(d.brand)} ${esc(d.model)}</b><span>Viewport ${w}×${h} · DPR ${d.dpr} · ${d.inch}" · ${Math.round(d.w * d.dpr)}×${Math.round(d.h * d.dpr)} fiziksel</span>`);
  label.title = 'Tıkla: tarama hedefi yap · Sürükle: sırasını değiştir';
  label.prepend(el('i', 'grip', '⠿'));
  label.addEventListener('click', () => setActive(d.id));
  enableDrag(card, label, d.id);

  const wrap = el('div', 'wrap');
  const body = el('div', 'body' + (state.bezel ? ' bezel' : '') + (L ? ' land' : ''));
  body.style.transform = `scale(${state.zoom})`;

  const screen = el('div', 'screen');
  if (state.sysbars) screen.append(statusBar());
  const row = el('div', 'row');

  const f = document.createElement('iframe');
  f.style.width = w + 'px';
  f.style.height = h + 'px';
  f.dataset.id = d.id;
  f.name = state.ua ? `hhsim|${d.dpr}|${uaFor(d)}` : `hhsim|${d.dpr}|`;
  f.allow = 'camera; microphone; geolocation; clipboard-read; clipboard-write; fullscreen';
  f.src = state.url;
  row.append(f);
  if (state.sysbars && d.nav && L) row.append(navBar(true));
  screen.append(row);
  if (state.sysbars && d.nav && !L) screen.append(navBar(false));
  body.append(screen);

  if (state.bezel) {
    if (d.keypad && !L) body.append(keypad(d));
    body.append(el('div', 'bezel-brand', esc(d.brand)));
  }

  wrap.append(body);
  card.append(label, wrap);

  requestAnimationFrame(() => {
    wrap.style.width = body.offsetWidth * state.zoom + 'px';
    wrap.style.height = body.offsetHeight * state.zoom + 'px';
  });
  return card;
}

function render() {
  const stage = $('#stage');
  stage.innerHTML = '';
  $('#count').textContent = state.selected.length;

  if (!state.url) {
    stage.append(el('div', 'empty', 'Test etmek istediğiniz adresi yukarıya yazıp <b>Aç</b>\'a basın. İpucu: sitenizdeyken eklenti ikonuna tıklarsanız adres otomatik gelir.'));
    return;
  }
  const list = state.selected.map(findDevice).filter(Boolean);
  if (!list.length) {
    stage.append(el('div', 'empty', '<b>Cihazlar</b> menüsünden en az bir terminal seçin.'));
    return;
  }
  if (!list.some((d) => d.id === activeId)) activeId = list[0].id;
  for (const d of list) stage.append(deviceCard(d));
}

function setActive(id) {
  activeId = id;
  document.querySelectorAll('.device').forEach((x) => x.classList.toggle('active', x.dataset.id === id));
}

// Bir iframe'e tıklanınca onu tarama hedefi yap
window.addEventListener('blur', () => {
  setTimeout(() => {
    const a = document.activeElement;
    if (a && a.tagName === 'IFRAME' && a.dataset.id) setActive(a.dataset.id);
  }, 0);
});

window.addEventListener('message', (e) => {
  const d = e.data;
  if (!d || d.__hhsim !== 'scan-ack') return;
  const p = pending.get(d.nonce);
  if (p) { pending.delete(d.nonce); p(d); }
});

function sendToDevice(id, code, suffix, quiet = false) {
  const f = document.querySelector(`iframe[data-id="${CSS.escape(id)}"]`);
  if (!f) return Promise.resolve(null);
  try { f.focus(); } catch (_) {}
  const nonce = Math.random().toString(36).slice(2);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(nonce);
      if (!quiet) toast('Sayfaya ulaşılamadı. Sayfa yüklenmemiş olabilir ya da eklentinin sitede çalışma izni yok.', 'err');
      resolve(null);
    }, 1500);
    pending.set(nonce, (ack) => {
      clearTimeout(timer);
      if (!quiet || !ack.ok) {
        if (ack.ok) toast(code ? `Okutuldu → ${ack.info}: ${code}` : `Gönderildi → ${ack.info}`, 'ok');
        else toast('Odakta bir giriş alanı yok. Önce cihaz ekranında alana tıklayın.', 'err');
      }
      resolve(ack);
    });
    f.contentWindow.postMessage({ __hhsim: 'scan', nonce, code, suffix, delay: 0 }, '*');
  });
}

function normalizeUrl(v) {
  v = v.trim();
  if (!v) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(v)) v = (/^(localhost|\d+\.\d+\.\d+\.\d+)/.test(v) ? 'http://' : 'https://') + v;
  return v;
}

// ---- Cihaz paneli ----
function renderPanel() {
  const list = $('#deviceList');
  list.innerHTML = '';
  const groups = {};
  for (const d of allDevices()) (groups[d.custom ? 'Özel cihazlar' : d.brand] ||= []).push(d);
  for (const [brand, devs] of Object.entries(groups)) {
    const fs = el('fieldset');
    fs.append(el('legend', '', esc(brand)));
    for (const d of devs) {
      const row = el('label', 'dev-item');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = state.selected.includes(d.id);
      cb.addEventListener('change', () => {
        state.selected = cb.checked ? [...state.selected, d.id] : state.selected.filter((x) => x !== d.id);
        save(); render();
      });
      row.append(cb, el('span', '', esc(d.custom ? `${d.brand} ${d.model}` : d.model)), el('small', '', `${d.w}×${d.h} · ${d.inch}"`));
      if (d.custom) {
        const del = el('button', 'del', '✕');
        del.type = 'button';
        del.title = 'Sil';
        del.addEventListener('click', (e) => {
          e.preventDefault();
          state.custom = state.custom.filter((x) => x.id !== d.id);
          state.selected = state.selected.filter((x) => x !== d.id);
          save(); renderPanel(); render();
        });
        row.append(del);
      }
      fs.append(row);
    }
    list.append(fs);
  }
}

function syncControls() {
  $('#url').value = state.url;
  $('#zoom').value = String(state.zoom);
  $('#sysbars').checked = state.sysbars;
  $('#bezel').checked = state.bezel;
  $('#ua').checked = state.ua;
  $('#rotate').textContent = state.landscape ? '⤾ Yatay' : '⤾ Dikey';
}

function bindControls() {
  $('#urlForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.url = normalizeUrl($('#url').value);
    $('#url').value = state.url;
    history.replaceState(null, '', '?url=' + encodeURIComponent(state.url));
    save(); render();
  });
  $('#reload').addEventListener('click', render);
  $('#rotate').addEventListener('click', () => { state.landscape = !state.landscape; syncControls(); save(); render(); });
  $('#zoom').addEventListener('change', (e) => { state.zoom = +e.target.value; save(); render(); });
  $('#sysbars').addEventListener('change', (e) => { state.sysbars = e.target.checked; save(); render(); });
  $('#bezel').addEventListener('change', (e) => { state.bezel = e.target.checked; save(); render(); });
  $('#ua').addEventListener('change', async (e) => { state.ua = e.target.checked; save(); await applyNetwork(); render(); });

  $('#devicesBtn').addEventListener('click', () => { $('#panel').hidden = !$('#panel').hidden; });
  $('#closePanel').addEventListener('click', () => { $('#panel').hidden = true; });
  $('#selAll').addEventListener('click', () => { state.selected = allDevices().map((d) => d.id); save(); renderPanel(); render(); });
  $('#selNone').addEventListener('click', () => { state.selected = []; save(); renderPanel(); render(); });

  $('#customForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const d = {
      id: 'custom-' + Date.now(),
      custom: true,
      brand: fd.get('brand').trim(),
      model: fd.get('model').trim(),
      w: +fd.get('w'), h: +fd.get('h'), dpr: +fd.get('dpr'),
      inch: +fd.get('inch') || 5,
      nav: fd.get('nav') === 'on',
      keypad: fd.get('keypad') === 'on' ? 'num' : undefined,
      android: 13
    };
    state.custom.push(d);
    state.selected.push(d.id);
    save(); renderPanel(); render();
    e.target.reset();
    toast(`${d.brand} ${d.model} eklendi`, 'ok');
  });

  // Durum çubuğu saatini güncel tut
  setInterval(() => document.querySelectorAll('.status span:first-child').forEach((s) => (s.textContent = clock())), 30000);
}

(async function init() {
  const s = await chrome.storage.local.get('hhsim');
  state = { ...DEFAULTS, ...(s.hhsim || {}) };
  const p = new URLSearchParams(location.search).get('url');
  if (p) state.url = p;
  bindControls();
  syncControls();
  renderPanel();
  await applyNetwork();
  render();
})();
