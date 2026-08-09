# İkinci Dalga A1 — GA4 Olay Şeması

## VAR/YOK denetimi

Başlangıç durumu: **YOK**. `CommerceLayout.astro` yalnız temel GA4 `config` çağrısını içeriyordu; zorunlu funnel olaylarının emit noktaları bulunmuyordu.

## Uygulanan olay haritası

| Olay | Payload | Emit noktaları |
|---|---|---|
| `template_view` | `templateId`, `categorySlug` | `ProductHeroPremium.astro` |
| `download_start` | `templateId`, `source` | Demo, ürün checkout indirme, teslimat indirme |
| `download_complete` | `templateId`, `fileType` | Demo, ürün checkout indirme, teslimat indirme |
| `signup` | `method` | Başarılı demo e-posta erişimi (`demo_email`) |
| `checkout_intent` | `packId` | Geçerli satın alma formu submit'i |

Olay adlarının tek kaynağı `src/config/analytics.ts` dosyasıdır. Runtime kaynaklarında bu olay adlarının string literal olarak yeniden yazılması `scripts/seo/analytics-event-contract.ts` tarafından FAIL edilir.

`download_complete`, tarayıcıya geçerli indirme URL'sinin başarıyla teslim edilip indirme navigasyonu/tıklamasının başlatıldığı noktayı ifade eder; işletim sisteminin diske fiziksel yazımını tarayıcıdan doğruladığı iddia edilmez.

## Makine kanıtı

- `npm run seo:analytics-events`: event-map + literal drift kapısı.
- `tests/conformance/wave2-a1-analytics.test.ts`: beş olay, payload ve merkezi config sözleşmesi.
- PR CI: Security Gates + SEO V6 Conformance + Validate yeşil olmadan merge yok.

## Dış hesap kanıtı

GA4 DebugView, bu ajan oturumunda GA4 property kimlik doğrulamalı erişimi olmadığı için **SKIP_NO_DATA/ACCESS**. DebugView PASS iddiası üretilmez. Kod canlıya çıktığında gerçek property üzerinde beş event için DebugView kanıtı ayrıca alınmalıdır.
