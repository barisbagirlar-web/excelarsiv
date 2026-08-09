# FAZ 08 TESLİM RAPORU — CRAWL / AI BOT POLİTİKASI

## 1. GATE-IN
[Kesin] Faz 7 contextual link katmanı CI PASS ile merge edilmiştir. AI bot politikası `sites/excelarsiv/seo.config.json` içinde public allow, `/api` ve `/demo` teknik blok yaklaşımıyla tanımlıdır.

## 2. Somut kusur ve düzeltme
[Kesin] Önceki robots dosyasında `User-agent:*` grubu `/api` ve `/demo`yu engelliyor; fakat AI botlarına özel gruplar yalnız `Allow:/` içeriyordu. Botlar en spesifik grubu kullandığında teknik alan blokları özel grupta tekrar edilmediği için politika yoruma açık kalıyordu. Public içerik erişimi korunarak her AI bot grubuna `/api` ve `/demo` açık `Disallow` olarak eklendi.

## 3. INVARIANT
| Kod | Status | Kanıt |
|---|---|---|
| INV-8.1 | SKIP_NO_DATA | Sunucu logu/GSC Crawl Stats bağlı değil; `crawl-contract.ts` veri yokluğunda exit 3 |
| INV-8.2 | SKIP_NO_DATA | Discovery lag kaynağı yok; gün/saat tahmini yapılmadı |
| INV-8.3 | PASS | `bot-contract.ts` config↔robots grup eşleşmesi; UA-only block fixture exit 1 |

## 4. Gelir ekseni
[Güçlü] Arama ve AI discovery için public ürün/rehber içeriği açık tutuldu; yalnız satışa katkısı olmayan teknik `/api` ve `/demo` yüzeyleri bütün bot gruplarında açıkça kapatıldı. Bu, görünürlüğü kısıtlamadan crawl hijyenini sertleştirir.

## 5. Failure modes
1. **AI public içeriği yanlışlıkla bloklanır:** mitigasyon: config action `allow` ise her botta `Allow:/` zorunlu; validator fail-closed.
2. **Teknik endpoint botlara açılır:** mitigasyon: her custom botta blockedSections tekrarı zorunlu.
3. **UA spoofing üzerinden manuel block:** mitigasyon: block-action fixture DNS doğrulaması yoksa exit 1.

## 6. ROLLBACK
ROLLBACK: Robots değişikliği ve Faz 8 script/test/rapor PR revert ile geri alınır. Checkout/API erişimi robots tarafından güvenlik kontrolü olarak kullanılmaz; bu yalnız crawl politikasıdır.

## 7. GATE-OUT
[Kesin] CI PASS sonrası robots politikası production'a deploy edilebilir; runtime public dosyası değiştiği için Hosting deploy + live SEO contract gerekir.
