# RELEASE MANDATE — Ürün Kartı Standardizasyonu (excelarsiv.com/sablonlar)

## AMAÇ
`/sablonlar` sayfasındaki 50 ürün kartını tek bir standart bileşene indir.
Ürüne özel kurgusal dashboard/"Canlı" pano görselleri kaldırılır; tüm kartlar
aynı "gerçek ekran görüntüsü + defter sekmesi" şablonunu kullanır.

**Bağlı doküman:** Ekran görüntüsü içeriği ve kırpma kuralları için
`SCREENSHOT_STANDARD.md`'ye bakılır — bu mandate onu değiştirmez,
tamamlar. `screenshotFocus` prop değerleri o dokümandaki protokole
göre atanır.

## KAPSAM
- Etkilenen: `/sablonlar` listeleme sayfası ve ürün kartı bileşeni (mevcut kart
  markup'ının bulunduğu component — muhtemelen `ProductCard` veya listeleme
  içine gömülü bir `.astro` parçası).
- Etkilenmeyen: ürün detay sayfaları (`/sablon/[slug]`), ödeme akışı, Shopier/WhatsApp
  entegrasyonu, fiyatlandırma mantığı.

## INVARIANTLAR (asla bozulmayacaklar)
1. **I1 — Tek şablon:** 50 üründen HİÇBİRİ özel/farklı bir kart yapısı kullanmaz.
   Ekli `ProductCard.astro` tüm ürünler için tek kaynak bileşendir.
2. **I2 — Sahte veri yok:** Kart içinde hiçbir kurgusal/"canlı" rakam, yüzde
   değişim oku veya "● Canlı" rozeti bulunmaz. Yalnızca gerçek ürün ekran
   görüntüsü kullanılır (ai_tas.txt ile çelişki sıfır olacak).
3. **I3 — Sıfır border-radius:** Kart, çerçeve, buton, rozet — hiçbirinde
   köşe yuvarlama yok.
4. **I4 — Sabit en-boy oranı:** Ekran görüntüsü alanı tüm kartlarda 4:3 sabit
   `aspect-ratio` ile render edilir; görüntü `object-fit: cover` ile kırpılır,
   gerekirse taşan img yeniden kaydedilmez, CSS ile kırpılır.
5. **I5 — Erişilebilirlik:** Tüm interaktif elemanlarda `:focus-visible` outline
   görünür kalır; renk kontrastı WCAG AA'yı geçer; `prefers-reduced-motion`
   saygı görür.
6. **I6 — Dil:** Kullanıcıya görünen tüm metin Türkçe; kod tanımlayıcıları
   (class, prop, dosya adı) İngilizce.

## GATE'LER (her biri geçmeden bir sonrakine geçilmez)

### GATE 1 — Bileşen entegrasyonu
- `ProductCard.astro` proje component dizinine eklenir (örn. `src/components/ProductCard.astro`).
- `/sablonlar` sayfasındaki ürün listesi bu bileşeni prop'larla besler:
  `title, categorySlug, categoryLabel, benefit, pageCount, format, formulaType, price, screenshotUrl, screenshotAlt, detailUrl, orderUrl`.
- **Kanıt:** `git diff` çıktısı, değişen dosya listesi.

### GATE 2 — Eski kart yapısının kaldırılması
- Ürüne özel "dashboard" görsel bloğu (örn. GİRİŞ/ÇIKIŞ/NET/MİN. NAKİT +
  "● Canlı" rozetli kart) dahil, TÜM eski kart varyasyonları silinir.
- **Kanıt:** Build sonrası `/sablonlar` HTML çıktısında `Canlı` string'i
  0 sonuç döner (`grep -c "Canlı" dist/sablonlar/index.html` → 0,
  fiyat/ürün adı gibi meşru eşleşmeler hariç manuel kontrol edilir).

### GATE 3 — Görsel regresyon
- 50 ürünün tamamı için ekran görüntüsü alınır (Playwright/Percy veya manuel
  tam sayfa screenshot).
- Her kart aynı yükseklikte, aynı hizada, aynı tipografi ölçeğinde olmalı.
- **Kanıt:** Önce/sonra tam sayfa screenshot çifti.

### GATE 4 — Performans ve erişilebilirlik
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95 (mevcut skorun altına
  düşülmez).
- **Kanıt:** Lighthouse raporu (before/after).

### GATE 5 — Fonksiyonel doğrulama
- Her kartta: Detay linki doğru `slug`'a gider, Satın Al linki doğru
  WhatsApp/Shopier mesajını üretir (mevcut mesaj formatı korunur).
- **Kanıt:** 5 rastgele üründe manuel tıklama testi + link URL kontrolü.

## ROLLBACK
- Tüm değişiklik tek bir feature branch + tek commit setinde yapılır.
- Gate 3 veya Gate 4 başarısız olursa: `git revert` ile tek adımda önceki
  kart yapısına dönülür, canlıya alınmaz.
- Canlıya alındıktan sonra 14 gün içinde WhatsApp sipariş tıklama oranı
  önceki 14 güne göre >%10 düşerse: aynı `git revert` ile geri alınır.

## KABUL KRİTERİ (mandate kapanış şartı)
Gate 1–5 kanıtlarının tamamı sağlanmadan bu mandate KAPANMAZ. Kısmi
uygulama (örn. bazı kartlar eski, bazıları yeni format) kabul edilmez —
I1 invariantını ihlal eder.
