# İkinci Dalga A3 — Lansman Structural Break Seed

## VAR/YOK

Başlangıç: **YOK**. `data/seo/structural_breaks.json` içinde consent değişikliği vardı; `site_launch` kaydı ve config tabanlı seed motoru yoktu.

## Uygulama

- `measurement.launchDate` site config'e açık alan olarak eklendi.
- Güvenilir lansman tarihi repo kanıtında bulunmadığı için değer **null** bırakıldı; ölçüm penceresi başlangıcı lansman tarihi gibi kullanılmadı.
- `scripts/seo/structural-breaks.ts`:
  - tarihi yalnız config modelinden okur,
  - `site_launch` kaydını deterministik üretir,
  - mevcut diğer structural break kayıtlarını korur,
  - mevcut `site_launch` kaydını tekilleştirir,
  - `--dry-run` ile yazmadan kanıt üretir,
  - `--set-launch-date YYYY-MM-DD` ile config'i ve structural break dosyasını tek komutta günceller.
- ISO olmayan veya takvimde geçersiz tarih fail-closed olur.

## Şu anki operasyonel sonuç

`measurement.launchDate=null` olduğu için gerçek seed sonucu **SKIP_NO_DATA**. Bu bir kod eksiği değildir; gerçek lansman tarihi bilinmeden veri uydurmayı engelleyen kapıdır.

Lansman tarihi doğrulandığında:

`npm run seo:breaks -- --set-launch-date YYYY-MM-DD`

Dry-run:

`npm run seo:breaks -- --set-launch-date YYYY-MM-DD --dry-run`

## Kanıt

`tests/conformance/wave2-a3-breaks.test.ts` tarih doğrulaması, null fail-closed, deterministic seed ve tek-komut setter davranışını doğrular. PR CI Security + SEO V6 Conformance + Validate tamamen yeşil olmadan merge edilmez.
