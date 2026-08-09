# İkinci Dalga A2 — Consent Mode v2 + CMP

## VAR/YOK denetimi

Başlangıç: **YOK**. GA4 etiketi `CommerceLayout.astro` içinde doğrudan yükleniyor ve consent sinyali/CMP bulunmuyordu.

## Uygulama

- Basic Consent Mode v2 yaklaşımı: Google etiketi kullanıcı seçimi olmadan yüklenmez.
- İlk durum: `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization` = `denied`.
- “Tümünü Kabul Et”: dört sinyal `granted`, tercih localStorage içinde versioned kayıtla saklanır, sonra Google tag yüklenir.
- “Yalnızca Gerekli”: dört sinyal `denied`; Google tag yüklenmez.
- Kullanıcı daha sonra sabit “Çerez Tercihleri” butonuyla seçimini değiştirebilir.
- `trackAnalyticsEvent()` ayrıca consent kontrolü yapar; izin yokken event dataLayer'a dahi yazılmaz.
- `data/seo/structural_breaks.json`: `consent v2 live` measurement-change kaydı eklendi.

Bu uygulama, talimattaki “rıza reddedildiğinde GA4 hit'i gitmesin” şartı nedeniyle basic-consent yükleme kapısı kullanır. Advanced mode'daki cookieless ping davranışı bilinçli olarak kullanılmaz.

## Makine kanıtı

`npm run seo:consent`:
- layout içinde doğrudan Google tag `<script src>` = 0,
- dört v2 sinyali default denied + grant update mevcut,
- dinamik Google tag loader yalnız `granted` kolunda,
- analytics event consent gate mevcut,
- denied fixture `analyticsAllowed=false`,
- structural break kaydı mevcut.

`tests/conformance/wave2-a2-consent.test.ts`:
- denied/granted sinyal parity,
- stale/bozuk preference fail-closed,
- denied fixture analytics eligibility=false,
- layout/CMP/tag-loader sözleşmesi.

## Dış network kanıtı

Gerçek staging browser network kaydı bu ajan oturumunda staging oturumu/harici tarayıcı kanıt kanalı bulunmadığı için **SKIP_NO_DATA/ACCESS**. Kod-level negatif kapı sıfır doğrudan tag yükleme noktasını ve denied event gate'i doğrular; gerçek staging HAR/DevTools kanıtı ayrıca alınmalıdır.

Bu teknik uygulama hukuki uygunluk garantisi olarak yorumlanmaz; banner metni ve hukuki metinler gerektiğinde hukuk danışmanı tarafından ayrıca gözden geçirilmelidir.
