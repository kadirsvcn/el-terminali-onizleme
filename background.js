// Eklenti ikonuna tıklanınca mevcut sekmenin adresiyle önizleme sayfasını açar.
chrome.action.onClicked.addListener((tab) => {
  const url = tab.url && /^(https?|file):/i.test(tab.url) ? tab.url : '';
  const page = chrome.runtime.getURL('preview.html') + (url ? '?url=' + encodeURIComponent(url) : '');
  chrome.tabs.create({ url: page, index: tab.index + 1 });
});

const ruleBase = (tabId) => (tabId % 100000) * 10 + 1;

// Önizleme sekmesi için ağ kuralları:
//  - iframe içine yüklenebilmesi için X-Frame-Options / CSP başlıklarını kaldırır
//  - isteğe bağlı olarak User-Agent başlığını Android cihaz gibi gösterir
// Kurallar yalnızca önizleme sekmesinin kendi tabId'sine uygulanır; normal gezinmeyi etkilemez.
async function configure(tabId, ua) {
  const existing = await chrome.declarativeNetRequest.getSessionRules();
  const base = ruleBase(tabId);
  const removeRuleIds = [...new Set([
    base, base + 1,
    ...existing.filter((r) => r.condition.tabIds && r.condition.tabIds.includes(tabId)).map((r) => r.id)
  ])];

  const addRules = [{
    id: base,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      responseHeaders: [
        { header: 'x-frame-options', operation: 'remove' },
        { header: 'content-security-policy', operation: 'remove' },
        { header: 'content-security-policy-report-only', operation: 'remove' }
      ]
    },
    condition: { tabIds: [tabId], resourceTypes: ['sub_frame'] }
  }];

  if (ua) {
    addRules.push({
      id: base + 1,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [{ header: 'user-agent', operation: 'set', value: ua }]
      },
      condition: {
        tabIds: [tabId],
        resourceTypes: ['sub_frame', 'xmlhttprequest', 'script', 'stylesheet', 'image', 'font', 'media', 'websocket', 'other']
      }
    });
  }

  await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds, addRules });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'configure' && sender.tab) {
    configure(sender.tab.id, msg.ua)
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const base = ruleBase(tabId);
  try {
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [base, base + 1] });
  } catch (_) {}
});
