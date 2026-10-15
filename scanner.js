// Barkod okuyucu simülasyonu (Zebra DataWedge / Honeywell "keyboard wedge" gibi):
// Önizleme sayfasından gelen mesajla, odaktaki alana karakterleri klavye olayı olarak yazar,
// ardından isteğe bağlı Enter veya Tab gönderir. Yalnızca bu eklentinin sayfasından gelen mesajları dinler.
(() => {
  const EXT_ORIGIN = 'chrome-extension://' + chrome.runtime.id;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const KEYCODES = { Enter: 13, Tab: 9, Backspace: 8 };

  function deepActive(doc) {
    let el = doc.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
    return el;
  }

  function isEditable(el) {
    if (!el) return false;
    if (el.isContentEditable) return true;
    if (el.tagName === 'TEXTAREA') return !el.readOnly && !el.disabled;
    if (el.tagName === 'INPUT') {
      const t = (el.type || 'text').toLowerCase();
      return !el.readOnly && !el.disabled &&
        ['text', 'search', 'tel', 'url', 'email', 'number', 'password', ''].includes(t);
    }
    return false;
  }

  function keyEvent(type, key, el) {
    let keyCode = KEYCODES[key];
    let code = key;
    if (keyCode === undefined) {
      const up = key.toUpperCase();
      keyCode = up.charCodeAt(0);
      code = /[0-9]/.test(key) ? 'Digit' + key : /[a-z]/i.test(key) ? 'Key' + up : '';
    }
    const ev = new KeyboardEvent(type, {
      key, code, bubbles: true, cancelable: true, composed: true,
      charCode: type === 'keypress' ? (key.length === 1 ? key.charCodeAt(0) : keyCode) : 0
    });
    // Birçok terminal uygulaması hâlâ e.keyCode / e.which kontrol eder
    Object.defineProperty(ev, 'keyCode', { get: () => keyCode });
    Object.defineProperty(ev, 'which', { get: () => keyCode });
    return el.dispatchEvent(ev);
  }

  function insertText(el, text) {
    let ok = false;
    try { ok = document.execCommand('insertText', false, text); } catch (_) {}
    if (ok) return;
    if (el.isContentEditable) { el.textContent += text; }
    else {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, (el.value || '') + text); // React/Vue uyumlu
    }
    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
  }

  async function typeChar(el, ch) {
    const notPrevented = keyEvent('keydown', ch, el);
    if (notPrevented && keyEvent('keypress', ch, el)) insertText(el, ch);
    keyEvent('keyup', ch, el);
  }

  function focusNext(el) {
    const sel = 'input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';
    const list = [...document.querySelectorAll(sel)].filter((x) => x.offsetParent !== null);
    const i = list.indexOf(el);
    if (i >= 0 && list[i + 1]) list[i + 1].focus();
  }

  async function pressEnter(el) {
    const notPrevented = keyEvent('keydown', 'Enter', el);
    keyEvent('keypress', 'Enter', el);
    if (notPrevented) {
      if (el.tagName === 'TEXTAREA' || el.isContentEditable) insertText(el, '\n');
      else if (el.form) {
        el.dispatchEvent(new Event('change', { bubbles: true }));
        try { el.form.requestSubmit(); } catch (_) { el.form.submit(); }
      } else {
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    keyEvent('keyup', 'Enter', el);
  }

  async function pressTab(el) {
    const notPrevented = keyEvent('keydown', 'Tab', el);
    el.dispatchEvent(new Event('change', { bubbles: true }));
    if (notPrevented) focusNext(el);
    keyEvent('keyup', 'Tab', el);
  }

  let lastEditable = null;
  document.addEventListener('focusin', (e) => {
    const t = e.composedPath()[0];
    if (isEditable(t)) lastEditable = t;
  }, true);

  function describe(el) {
    const label = el.name || el.id || el.placeholder || el.getAttribute('aria-label') || el.tagName.toLowerCase();
    return String(label).slice(0, 40);
  }

  window.addEventListener('message', async (e) => {
    if (e.origin !== EXT_ORIGIN) return;
    const d = e.data;
    if (!d || d.__hhsim !== 'scan') return;
    const reply = (ok, info) => {
      try { e.source.postMessage({ __hhsim: 'scan-ack', nonce: d.nonce, ok, info }, e.origin); } catch (_) {}
    };

    let el = deepActive(document);
    if (!isEditable(el) && lastEditable && lastEditable.isConnected && isEditable(lastEditable)) el = lastEditable;
    if (!isEditable(el)) {
      // Odakta alan yoksa yine de tuş olaylarını document'a gönder (global klavye dinleyen uygulamalar için)
      if (d.code) for (const ch of d.code) { keyEvent('keydown', ch, document.body); keyEvent('keypress', ch, document.body); keyEvent('keyup', ch, document.body); }
      if (d.suffix === 'enter') { keyEvent('keydown', 'Enter', document.body); keyEvent('keyup', 'Enter', document.body); }
      reply(false, 'no-focus');
      return;
    }
    try { el.focus(); } catch (_) {}
    for (const ch of d.code || '') {
      await typeChar(el, ch);
      if (d.delay) await sleep(d.delay);
    }
    if (d.suffix === 'enter') await pressEnter(el);
    else if (d.suffix === 'tab') await pressTab(el);
    reply(true, describe(el));
  });
})();
