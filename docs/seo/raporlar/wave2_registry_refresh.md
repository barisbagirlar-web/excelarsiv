# İkinci Dalga — Faz 1 Registry Refresh

## Tetikleyici kusur

C1 gerçek build grafı 47 indexlenebilir route ölçtü; registry coverage yalnız 33 kayıt gösterdi. Eksik 14 route:
- 4 rehber detay sayfası,
- 10 yeni ürün detay sayfası.

Bu açık, B2 tamamlandıktan sonra paralel runtime ürün/rehber eklemeleriyle oluştu. Registry tek-yazar kuralı nedeniyle düzeltme yalnız Faz 1 sözleşmesi altında yapıldı.

## Düzeltme

- Registry `source.builtIndexableUrlCount`: 33 → 47.
- `commercialProductCount`: 12 → 22.
- `guideCount`: 4 eklendi.
- 4 rehber kayıt edildi; aynı query'nin ürün owner'ını bozmamak için rehberlerde `primaryQueryClusterId:null` tutuldu.
- 10 yeni ürün kayıt edildi. Product SEO içindeki primary query adayları not alanına alındı; dış demand kanıtı olmadığı için yeni cluster ID uydurulmadı ve `primaryQueryClusterId:null` bırakıldı.
- Mevcut 33 zengin registry kaydı korundu.

## Kalıcı koruma

`scripts/seo/registry-source-parity.ts` artık source-of-truth route setini şu kaynaklardan üretir:
- statik `src/pages/**/*.astro` route'ları (404 ve dynamic placeholder hariç),
- `commerce/catalog.json` ürünleri,
- `src/content/guides/*.mdx` rehberleri,
- `src/lib/categories.ts` kategori slug'ları.

`tests/conformance/invariants/1-source-parity.test.ts` her SEO conformance koşusunda live registry route setinin bu source setine birebir eşit olmasını zorlar. Yeni ürün/rehber/kategori eklenip registry güncellenmezse merge artık FAIL olur.

## Beklenen kanıt

- source expected = 47,
- registry live = 47,
- missing = 0,
- extra = 0,
- `seo:validate-registry` PASS,
- Security + SEO V6 Conformance + Validate PASS.

Runtime/public değişiklik yoktur; deploy gerektirmez.
