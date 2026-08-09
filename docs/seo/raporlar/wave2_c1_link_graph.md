# İkinci Dalga C1 — İç Link Grafiği

## VAR/YOK

Başlangıç: **YOK**. Mevcut enterprise guard click-depth denetliyordu; her canlı registry sayfası için benzersiz kaynak sayfası bazında `internalLinksIn` hesaplayan ve `< threshold` durumunu merge-block yapan bir graph kapısı yoktu.

## Uygulama

`scripts/seo/link-graph.ts` gerçek `dist/**/*.html` build çıktısını okur:
- internal `<a href>` bağlantılarını aynı-origin olarak normalize eder,
- query/hash varyasyonlarını tek route'a indirger,
- self-link'i inlink saymaz,
- aynı kaynak sayfadan aynı hedefe tekrarları bir kez sayar,
- canlı ve build'de mevcut registry route'ları için `internalLinksIn`, `internalLinksOut`, `linkedFrom`, `linksTo` üretir,
- eşik değerini yalnız `seo.config.defaults.json.thresholds.internalLinksInMin` üzerinden okur,
- eşik altı sayfaları ORPHAN olarak raporlar,
- ürün/kategori/rehber için deterministic bağ önerisi üretir.

`npm test` sonuna `npm run seo:link-graph -- --check` eklendi. Böylece gerçek build grafında tek ORPHAN dahi merge'i exit 1 ile durdurur.

## Kanıt

- Unit conformance: unique-source sayımı, external link dışlama, query/hash normalizasyonu ve threshold fixture.
- Gerçek build kanıtı: PR CI `Existing build and guards` ve `Validate / Build and smoke test` adımlarındaki `LINK GRAPH pages=... edges=... threshold=... orphans=...` satırı.
- Hedef: `orphans=0`. CI eşik altı sayfa bulursa aynı C1 branch'inde gerçek internal-link düzeltmesi yapılır ve test tekrar edilir.

`--write` seçeneği `data/seo/link_graph.json` artefaktını güncelleyebilir; merge kapısı için dosya yazımı zorunlu değildir, gerçek build stdout sonucu otoritedir.
