# İkinci Dalga B1 — Dış Talep Verisi Import

## VAR/YOK

Başlangıç: **YOK**. Dış keyword CSV'sini normalize edip KAC/TAM'a bağlayan güvenli import motoru bulunmuyordu.

## Uygulama

`npm run seo:demand-import -- --input <csv> --source <ads_keyword_planner|ahrefs|semrush>` varsayılan olarak dry-run çalışır. `--write` verilmedikçe production artefaktı değiştirmez.

Motor:
1. `keyword,volume,cpc?,competition?` CSV sözleşmesini doğrular.
2. Keyword'ü Unicode/TR normalize eder, duplicate keyword'lerde en yüksek hacimli satırı korur.
3. Geçersiz/negatif hacim ve CPC satırlarını açık reddedilenler listesine alır.
4. Mevcut KAC primary-query anchor'larına anlamlı token ortaklığıyla deterministic owner eşler.
5. Owner route varsa registry'den gerçek `pageId` bağlar.
6. Owner bulunmayan demand satırını `contentGap:true`, `ownerRoute:null` ve yalnız öneri niteliğinde `suggestedRoute` ile kaydeder; otomatik sayfa yayınlamaz.
7. KAC çıktısını `partial:true`, `coldStart:true`, numeric priority/INVEST kararı olmadan üretir.
8. TAM coverage'ı yalnız import edilen veri kümesinin paydasıyla `coverageBasis: imported-keyword-dataset-only`, `provisional:true` olarak tohumlar; tam pazar paydası iddiası kurmaz.

## Gerçek veri durumu

Kullanıcı tarafından sağlanan Keyword Planner/Ahrefs/Semrush CSV'si henüz yoktur. Bu nedenle production `data/seo/demand/keyword_demand.json` üretilmedi ve mevcut KAC/TAM artefaktları sahte fixture ile değiştirilmedi.

Operasyonel durum: **SKIP_NO_DATA**.

## Makine kanıtı

Sentetik `tests/fixtures/seo-demand/sample.csv` yalnız test girdisidir. Conformance testi şunları doğrular:
- 3 kabul / 1 ret,
- duplicate dedupe,
- mevcut kasa + stok owner eşlemesi,
- 1 explicit içerik boşluğu,
- provisional imported-dataset TAM coverage,
- source etiketi + low confidence/partial davranışı.

Gerçek CSV geldiğinde önerilen icra:

`npm run seo:demand-import -- --input path/to/file.csv --source ads_keyword_planner`

Dry-run kontrolünden sonra:

`npm run seo:demand-import -- --input path/to/file.csv --source ads_keyword_planner --write`

Ardından `npm run seo:kac && npm run seo:tam && npm run seo:validate-registry` çalıştırılır.
