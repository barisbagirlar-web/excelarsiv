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

## Kanıt

- Unit conformance: unique-source sayımı, external link dışlama, query/hash normalizasyonu, noindex/404 dışlama, registry dışı indexlenebilir sayfanın da grafa girmesi ve threshold fixture.
- Gerçek build kanıtı: PR CI `Existing build and guards` ve `Validate / Build and smoke test` adımlarındaki `LINK GRAPH pages=... edges=... threshold=... orphans=...` satırı.
- Registry coverage ayrıca `REGISTRY COVERAGE registered=... unregistered=...` olarak raporlanır; bu C1 orphan kontrolünü daraltmaz.
- Hedef: `pages = tüm indexlenebilir build sayfaları` ve `orphans=0`. CI eşik altı sayfa bulursa aynı C1 branch'inde gerçek internal-link düzeltmesi yapılır ve test tekrar edilir.

`--write` seçeneği `data/seo/link_graph.json` artefaktını güncelleyebilir; merge kapısı için dosya yazımı zorunlu değildir, gerçek build stdout sonucu otoritedir.
