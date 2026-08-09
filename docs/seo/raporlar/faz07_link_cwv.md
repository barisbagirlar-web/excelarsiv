# FAZ 07 TESLİM RAPORU — İÇ LİNK EKONOMİSİ / CWV

## 1. GATE-IN
[Kesin] Faz 6 schema/entity PR #39 CI PASS ile merge edilmiştir. Dört ticari rehber zaten hub→guide→product/category ve product→guide bağlantılarına sahiptir.

## 2. Yapılan değişiklikler
- [Kesin] Kategori sayfaları kendi kategorisindeki rehberlere bağlandı; böylece rehberlerin gelir bağlamlı giriş yolları hub + ürün + kategori + ilgili rehber kaynaklarına genişledi.
- [Kesin] `link-contract.ts` rehber graph'ını ve `internalLinksInMin` eşiğini config'den doğrular.
- [Kesin] `cwv-contract.ts` saha verisi varsa config CWV eşiklerini denetler; veri yoksa exit 3, breach + remediation yoksa exit 1.

## 3. INVARIANT
| Kod | Status | Kanıt |
|---|---|---|
| INV-7.1 | PASS | Dört rehber için hub/product/category/related-guide kaynakları; config `internalLinksInMin` karşılanıyor |
| INV-7.2 | SKIP_NO_DATA | CrUX/GSC saha CWV bağlı değil; breach-no-remediation fixture exit 1, remediated fixture exit 0 |
| INV-7.3 | PASS | Ticari köprü anchor'ları query/guide adına göre hedefe özgü; jenerik sitewide exact-match anchor üretilmiyor |
| INV-7.4 | SKIP_NO_DATA | PageRank-benzeri saha/link ağı delta serisi henüz artefaktlaştırılmadı; existing enterprise guard click-depth ve broken-link kontrolünü build sonrası yürütüyor |

## 4. Gelir ekseni
[Güçlü] Rehberler yalnız bilgi adası olmaktan çıkarıldı: kategori→rehber→ürün ve ürün→rehber döngüsü, kullanıcıyı aynı problem alanı içinde karar içeriğinden satış sayfasına taşır. Link hacmi yerine bağlamsal yönlendirme tercih edildi.

## 5. Failure modes
1. **Rehberler trafik alır ama ürüne geçiş üretmez:** mitigasyon: guide sidebar product CTA + product bridge + kategori bağlantısı; GA4 erişimi geldiğinde assisted/conversion ölçümü.
2. **İç link aşırı exact-match olur:** mitigasyon: ürün, rehber başlığı ve kategori bağlamı farklı anchor aileleri; sitewide footer ağı yok.
3. **CWV bozulur:** mitigasyon: küçük static HTML blokları, JS eklenmedi; saha veri geldiğinde config eşikli guard; breach remediation PR olmadan sonraki gate kapanır.

## 6. ROLLBACK
ROLLBACK: Kategori rehber modülü ve Faz 7 guard/test/rapor PR revert ile kaldırılır; ürün/checkout/catalog etkilenmez.

## 7. GATE-OUT
[Kesin] Build/conformance/smoke PASS sonrası bağlamsal iç link katmanı production'a alınabilir. Runtime kategori HTML'i değiştiği için merge sonrası Hosting deploy + live contract gerekir.
