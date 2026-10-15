// Piyasada en yaygın el terminalleri.
// w × h: dikey konumda CSS piksel (fiziksel çözünürlük / DPR), Android sistem çubukları dahil tüm ekran.
// nav: ekranda Android gezinme çubuğu (◁ ○ □) var mı
// keypad: fiziksel tuş takımı (çerçeve görünümünde çizilir ve tıklanabilir)
const DEVICES = [
  // Zebra
  { id: 'zebra-tc21',   brand: 'Zebra', model: 'TC21 / TC26',     inch: 5,   w: 360, h: 640, dpr: 2,   nav: true,  android: 11 },
  { id: 'zebra-tc22',   brand: 'Zebra', model: 'TC22 / TC27',     inch: 6,   w: 360, h: 780, dpr: 2,   nav: true,  android: 13 },
  { id: 'zebra-tc52',   brand: 'Zebra', model: 'TC52 / TC57',     inch: 5,   w: 360, h: 640, dpr: 2,   nav: true,  android: 11 },
  { id: 'zebra-tc53',   brand: 'Zebra', model: 'TC53 / TC58',     inch: 6,   w: 360, h: 720, dpr: 3,   nav: true,  android: 13 },
  { id: 'zebra-tc72',   brand: 'Zebra', model: 'TC72 / TC77',     inch: 4.7, w: 360, h: 640, dpr: 2,   nav: true,  android: 11 },
  { id: 'zebra-tc73',   brand: 'Zebra', model: 'TC73 / TC78',     inch: 6,   w: 360, h: 720, dpr: 3,   nav: true,  android: 13 },
  { id: 'zebra-ec50',   brand: 'Zebra', model: 'EC50 / EC55',     inch: 5,   w: 360, h: 640, dpr: 2,   nav: true,  android: 11 },
  { id: 'zebra-mc33',   brand: 'Zebra', model: 'MC3300 / MC33',   inch: 4,   w: 320, h: 533, dpr: 1.5, nav: false, keypad: 'num', android: 11 },
  { id: 'zebra-mc93',   brand: 'Zebra', model: 'MC9300 / MC93',   inch: 4.3, w: 320, h: 533, dpr: 1.5, nav: false, keypad: 'num', android: 11 },
  { id: 'zebra-wt6300', brand: 'Zebra', model: 'WT6300 (giyilebilir)', inch: 3.2, w: 320, h: 480, dpr: 1, nav: false, android: 10 },

  // Honeywell
  { id: 'honeywell-ct40', brand: 'Honeywell', model: 'CT40 / CT40 XP', inch: 5,   w: 360, h: 640, dpr: 2,   nav: true,  android: 11 },
  { id: 'honeywell-ct45', brand: 'Honeywell', model: 'CT45 / CT45 XP', inch: 5,   w: 360, h: 640, dpr: 2,   nav: true,  android: 13 },
  { id: 'honeywell-ct47', brand: 'Honeywell', model: 'CT47',           inch: 5.5, w: 360, h: 720, dpr: 3,   nav: true,  android: 12 },
  { id: 'honeywell-ct60', brand: 'Honeywell', model: 'CT60 / CT60 XP', inch: 4.7, w: 360, h: 640, dpr: 2,   nav: true,  android: 11 },
  { id: 'honeywell-eda51',brand: 'Honeywell', model: 'ScanPal EDA51',  inch: 5,   w: 360, h: 640, dpr: 2,   nav: true,  android: 10 },
  { id: 'honeywell-eda52',brand: 'Honeywell', model: 'ScanPal EDA52',  inch: 5.5, w: 360, h: 720, dpr: 2,   nav: true,  android: 11 },
  { id: 'honeywell-ck65', brand: 'Honeywell', model: 'CK65',           inch: 4,   w: 320, h: 533, dpr: 1.5, nav: false, keypad: 'num', android: 11 },

  // Datalogic
  { id: 'datalogic-memor10', brand: 'Datalogic', model: 'Memor 10',  inch: 5,   w: 360, h: 640, dpr: 2,   nav: true,  android: 10 },
  { id: 'datalogic-memor11', brand: 'Datalogic', model: 'Memor 11',  inch: 5,   w: 360, h: 640, dpr: 2,   nav: true,  android: 11 },
  { id: 'datalogic-skorpio', brand: 'Datalogic', model: 'Skorpio X5', inch: 4.3, w: 320, h: 533, dpr: 1.5, nav: false, keypad: 'num', android: 10 },

  // Diğer yaygın markalar
  { id: 'urovo-dt50',   brand: 'Urovo',       model: 'DT50',  inch: 5,   w: 360, h: 720, dpr: 2, nav: true, android: 11 },
  { id: 'newland-mt90', brand: 'Newland',     model: 'MT90',  inch: 5,   w: 360, h: 640, dpr: 2, nav: true, android: 10 },
  { id: 'pointmobile-pm85', brand: 'Point Mobile', model: 'PM85', inch: 4.3, w: 320, h: 533, dpr: 1.5, nav: true, android: 10 },
  { id: 'chainway-c66', brand: 'Chainway',    model: 'C66',   inch: 5.2, w: 360, h: 720, dpr: 2, nav: true, android: 11 }
];
