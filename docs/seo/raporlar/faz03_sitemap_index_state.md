# FAZ 03 TESLİM RAPORU — INDEX STATE / SITEMAP / ROBOTS

## 1. GATE-IN

[Kesin] Faz 2 ledger/guard kurulmuştur. Mevcut production sitemap mimarisi karar defterinde kilitlidir: `/sitemap.xml` sitemapindex → `sitemap-pages.xml` + `sitemap-products.xml`.

## 2. Yapılan değişiklikler

[Kesin] Çalışan sitemap üretim motoru değiştirilmedi. Yeni `sitemap-contract.ts` registry/robots statik girdilerini ve BLOCK fixture'larını denetler. Existing build zinciri hâlâ `generate-artifacts.mjs → finalize-sitemap-index.mjs → validate-artifacts.mjs → test-sitemap-index-semantics.mjs → enterprise-guard.mjs` hattını çalıştırır.

## 3. INVARIANT

| Kod | Status | Kanıt |
|---|---|---|
| INV-3.1 | PASS | Registry'de retired yok; robots canonical sitemap root; bad-state fixture exit 1; mevcut build validator tüm sitemap URL'lerini 200/indexable olarak denetler |
| INV-3.2 | PASS | `/api` ve `/demo` robots blocked; sitemap fixture'a blocked URL eklenince exit 1 |
| INV-3.3 | PASS | noindex sitemap fixture exit 1; mevcut quality gate noindex URL'leri sitemap'ten dışlar |
| INV-3.4a | PASS | mevcut semantic-lastmod motoru korunur; mismatch fixture exit 1 |
| INV-3.4b | SKIP_NO_DATA | GSC indexed kohort verisi bağlı değil |
| INV-3.5 | SKIP_NO_DATA | GSC index parametre görünümü bağlı değil; üretim route setinde ticari parametre sayfası yok |
| INV-3.6 | SKIP_NO_DATA | Kohort index oranı GSC olmadan slo_history'ye yazılmaz |

## 4. Gelir ekseni

[Güçlü] En yüksek getirili karar sitemap'ı yeniden tasarlamak değil, halihazırdaki sağlam delivery layer'ı koruyup Faz 5'te arama talebine hizalı yeni yüksek-değer içerikleri bu sözleşmeye otomatik dahil etmektir. Sitemap churn organik kazanç üretmez; semantic lastmod korunur.

## 5. Riskler ve mitigasyon

1. **Sitemap mimarisini gereksiz değiştirme:** mevcut 182 canlı sözleşme kontrolünü bozabilir. Mitigasyon: root/child isimleri kilitli.
2. **Sahte freshness:** her deploy lastmod basmak crawl sinyalini kirletir. Mitigasyon: semantic lastmod + fixture.
3. **Index oranını tahmin etme:** GSC yok. Mitigasyon: 3.4b/3.6 SKIP_NO_DATA; hacim uydurulmaz.

## 6. ROLLBACK

ROLLBACK: Faz 3 ek script/test/rapor revert edilir; production sitemap/robots dosyası bu PR'da değişmez.

## 7. GATE-OUT

[Kesin] Index-state/sitemap/robots BLOCK sözleşmeleri ek testlerle sertleştirildi; mevcut production sitemap motoru aynen korundu. Faz 4 render paritesi için giriş hazırdır.
