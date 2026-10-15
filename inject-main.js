// Yalnızca önizleme sayfasındaki cihaz iframe'lerinde çalışır (window.name "hhsim|" ile başlar
// ve en üst çerçeve bir chrome-extension:// sayfasıdır). Normal gezinmeye dokunmaz.
// Sayfanın JavaScript'ine cihazın UA'sını, DPR'ını ve dokunmatik desteğini gösterir.
(() => {
  try {
    const ao = location.ancestorOrigins;
    if (!ao || !ao.length || !ao[ao.length - 1].startsWith('chrome-extension://')) return;
    const name = window.name || '';
    if (!name.startsWith('hhsim|')) return;
    const parts = name.split('|');
    const dpr = parseFloat(parts[1]) || 2;
    const ua = parts.slice(2).join('|');

    const def = (obj, prop, value) => {
      try { Object.defineProperty(obj, prop, { get: () => value, configurable: true }); } catch (_) {}
    };

    if (ua) {
      def(navigator, 'userAgent', ua);
      def(navigator, 'appVersion', ua.replace(/^Mozilla\//, ''));
      def(navigator, 'platform', 'Linux armv8l');
      const orig = navigator.userAgentData;
      if (orig) {
        const fake = {
          brands: orig.brands,
          mobile: true,
          platform: 'Android',
          getHighEntropyValues: async (hints) => ({
            ...(await orig.getHighEntropyValues(hints).catch(() => ({}))),
            mobile: true,
            platform: 'Android',
            model: (ua.match(/Android [\d.]+; ([^)]+)\)/) || [])[1] || ''
          }),
          toJSON: () => ({ brands: orig.brands, mobile: true, platform: 'Android' })
        };
        def(navigator, 'userAgentData', fake);
      }
    }
    def(navigator, 'maxTouchPoints', 5);
    def(window, 'devicePixelRatio', dpr);
    if (!('ontouchstart' in window)) window.ontouchstart = null;
  } catch (_) {}
})();
