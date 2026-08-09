# İkinci Dalga C1 — İç Link Grafiği

## VAR/YOK

Başlangıç: **YOK**. Mevcut enterprise guard click-depth denetliyordu; her indexlenebilir build sayfası için benzersiz kaynak sayfası bazında `internalLinksIn` hesaplayan ve `< threshold` durumunu merge-block yapan bir graph kapısı yoktu.

## İlk koşuda bulunan kapsam kusuru

İlk gerçek CI koşusu:
- build: 48 HTML / 47 indexlenebilir URL,
- ilk link graf: 33 sayfa / 708 edge / threshold=2 / orphan=0.

`orphans=0` doğruydu ancak graf hedeflerini eski registry kayıtlarıyla sınırladığı için 14 yeni indexlenebilir route ölçüm dışında kalmıştı. Bu nedenle ilk sonuç nihai PASS kabul edilmedi.

Kalıcı çözüm: graf hedef seti registry'den değil **tüm gerçek build'deki indexlenebilir HTML sayfalarından** oluşturulur. Registry yalnız pageId/type zenginleştirmesi ve ayrıca `registered/unregistered` görünürlüğü için kullanılır. Böylece registry eskise bile yeni indexlenebilir sayfa orphan kontrolünden kaçamaz.

## Uygulama

`scripts/seo/link-graph.ts` gerçek `dist/**/*.html` build çıktısını okur:
- `/404` ve `meta robots noindex` sayfalarını hedef setinden çıkarır,
- kalan tüm indexlenebilir build sayfalarını graf hedefi yapar,
- internal `<a href>` bağlantılarını aynı-origin olarak normalize eder,
- query/hash varyasyonlarını tek route'a indirger,
- self-link'i inlink saymaz,
- aynı kaynak sayfadan aynı hedefe tekrarları bir kez sayar,
- `internalLinksIn`, `internalLinksOut`, `linkedFrom`, `linksTo` üretir,
- registry eşleşmesini `registryRegistered` ve `pageId` ile ayrıca raporlar,
- eşik değerini yalnız `seo.config.defaults.json.thresholds.internalLinksInMin` üzerinden okur,
- eşik altı sayfaları ORPHAN olarak raporlar,
- ürün/kategori/rehber için deterministic bağ önerisi üretir.

`npm test` sonuna `npm run seo:link-graph -- --check` eklendi. Böylece gerçek build grafında tek ORPHAN dahi merge'i exit 1 ile durdurur.

## Final gerçek build kanıtı

PR #69 ikinci koşu:
- Commerce: 22 ürün, 4 Shopier seviyesi, public Excel binary=0.
- Build: 48 HTML.
- Indexlenebilir/sitemap: 47 / 47.
- Sitemap semantic tests: 24 PASS / 0 FAIL.
- Enterprise guard: 48 HTML, 47 indexlenebilir, click-depth ≤ 4.
- Smoke: 48 sayfa, kırık iç link 0.
- **LINK GRAPH: pages=47, edges=756, threshold=2, orphans=0 — PASS.**
- Registry coverage: registered=33, unregistered=14.

14 registry açığı iç-link sonucunu artık daraltmıyor; tüm 47 indexlenebilir sayfa graph denetiminden geçti. Registry açığı ayrı Faz 1 tek-yazar düzeltme borcu olarak aynı yürütme içinde kapatılacaktır; C1 sonucu bunu görünür hale getirmiştir.

## Conformance

- Unique-source sayımı.
- External link dışlama.
- Query/hash normalizasyonu.
- noindex/404 dışlama.
- Registry dışı indexlenebilir route'un grafa zorunlu dahil edilmesi.
- Threshold fixture.

`--write` seçeneği `data/seo/link_graph.json` artefaktını güncelleyebilir; merge kapısı için dosya yazımı zorunlu değildir, gerçek build stdout sonucu otoritedir.
