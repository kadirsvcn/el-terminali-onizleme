# El Terminali Önizleyici (Chrome eklentisi)

Web sitenizi Zebra, Honeywell, Datalogic, Urovo, Newland, Point Mobile ve Chainway el terminallerinin
gerçek viewport ölçülerinde yan yana gösterir ve barkod okutmayı simüle eder.

## Kurulum
1. Zip'i bir klasöre açın.
2. Chrome'da `chrome://extensions` adresine gidin, sağ üstten **Geliştirici modu**nu açın.
3. **Paketlenmemiş öğe yükle** → `el-terminali-onizleyici` klasörünü seçin.
4. (İsteğe bağlı) Eklentiyi araç çubuğuna sabitleyin.

Edge'de de aynı şekilde çalışır (`edge://extensions`).

## Kullanım
- Test edeceğiniz sayfadayken eklenti ikonuna tıklayın; önizleme yeni sekmede o adresle açılır.
  Ya da önizleme sayfasındaki adres kutusuna yazın (`192.168.1.10:8080`, `localhost:3000` da olur).
- **Cihazlar**: listeden terminal seçin, ya da kendi cihazınızı (CSS px + DPR) ekleyin.
- **Sistem çubukları**: Android durum çubuğu (24px) ve ekran gezinme çubuğu (48px) viewport'tan düşülür —
  sayfanızın gerçekte kullanabildiği alan budur. Tuş takımlı cihazlarda (MC33, MC93, CK65, Skorpio X5)
  gezinme çubuğu yoktur.
- **Döndür**: yatay/dikey. **Yakınlaştırma**: yalnızca görüntüyü ölçekler, viewport değişmez.
- **Android UA**: sunucuya giden User-Agent başlığını ve sayfanın gördüğü `navigator.userAgent`,
  `devicePixelRatio`, `maxTouchPoints` değerlerini cihaz gibi gösterir.

### Barkod okutma simülasyonu
DataWedge / keyboard wedge gibi çalışır: odaktaki alana karakterleri klavye olaylarıyla
(`keydown`/`keypress`/`input`/`keyup`, `keyCode` dahil) yazar, ardından **Enter**, **Tab** veya sonek göndermez.
1. Cihaz ekranında giriş alanına tıklayın (o cihaz turuncu "tarama hedefi" olur).
2. Tuş takımlı cihazlarda çerçeve açıkken tuşlar tıklanabilir: rakamlar yazılır, `ENT` Enter, `TAB` Tab gönderir.

## Sınırlar
- Sayfanın içinde CSS medya sorguları (`width`, `orientation`) doğru çalışır. `resolution`/`-webkit-device-pixel-ratio`
  medya sorguları ve `pointer: coarse` taklit edilemez (bunlar için Chrome DevTools cihaz modu gerekir).
- Siteyi iframe'e yükleyebilmek için yalnızca bu önizleme sekmesinde `X-Frame-Options` ve CSP başlıkları kaldırılır;
  normal gezinmeniz etkilenmez.
- Oturum açma gereken sitelerde çerez sorunu yaşarsanız: önce aynı tarayıcıda siteye normal sekmede giriş yapın.
- Cihaz ölçüleri üretici veri sayfalarındaki çözünürlüklerden hesaplanmıştır; firmware/ekran ölçeği ayarına göre
  gerçek cihazda birkaç piksel fark edebilir. Kendi cihazınızda `window.innerWidth` × `innerHeight` değerini
  ölçüp "Özel cihaz" olarak eklemek en kesin sonucu verir.
