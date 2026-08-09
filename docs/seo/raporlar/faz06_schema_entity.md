# FAZ 06 TESLİM RAPORU — SCHEMA / ENTITY GRAPH

## 1. GATE-IN
[Kesin] Faz 5 CI PASS, merge ve Firebase Hosting deploy tamamlandı; custom domain ve SEO live-contract PASS.

## 2. Yapılan değişiklikler
- [Kesin] Product entity'leri stabil `#product`, Offer `#offer`, Breadcrumb `#breadcrumb`, FAQ `#faq` kimlikleri aldı.
- [Kesin] Product → WebPage, Offer → Organization, Product → Brand ilişkileri `@id` ile bağlandı; ikinci Organization tanımı oluşturulmadı.
- [Kesin] Dört rehber Article + Breadcrumb entity graph aldı; Article → ürün `#product` ilişkisi kuruldu.
- [Kesin] Rehber `dateModified` değeri görünür `<time>` ile desteklendi.
- [Kesin] Review/aggregateRating eklenmedi; görünmeyen iddia yok.

## 3. INVARIANT
| Kod | Status | Kanıt |
|---|---|---|
| INV-6.1 | PASS | `schema-contract.ts`; visible Product/Article source kontrolü; invisible-rating fixture exit 1 |
| INV-6.2 | PASS | Organization yalnız CommerceLayout kaynağında; duplicate-org fixture exit 1 |
| INV-6.3 | PASS | Product ve guide görünür Breadcrumbs + BreadcrumbList kaynakları |
| INV-6.4 | PASS | FAQPage ürünlerde görünür FAQ ile eşleşiyor; hiçbir performans/KPI hesabı FAQ rich result'a bağlı değil |

## 4. Gelir ekseni
[Güçlü] Amaç schema sayısını artırmak değil, ücretli ürün ve karar rehberini aynı entity graph'ta açık şekilde bağlamaktır. Bu yapı ürün verisinin ve rehber ilişkisinin arama/AI sistemlerince daha tutarlı okunmasını destekler; performans sonucu ölçülmeden artış iddiası yapılmaz.

## 5. Riskler
1. **Schema'da görünmeyen claim eklenmesi:** fixture + source contract merge'i bloklar.
2. **Organization çoğalması:** source-count contract yalnız tek kaynağa izin verir.
3. **FAQ performans bağımlılığı:** KPI dışı tutulur; yalnız görünür soru-cevap verisinin makine temsili olarak kalır.

## 6. ROLLBACK
ROLLBACK: Faz 6 schema değişiklikleri PR revert ile kaldırılır; ürün URL, fiyat, checkout ve içerik gövdesi değişmez.

## 7. GATE-OUT
[Kesin] Build/conformance/live-contract PASS sonrası entity graph production'a alınabilir. Runtime schema değiştiği için merge sonrası Hosting deploy gereklidir.
