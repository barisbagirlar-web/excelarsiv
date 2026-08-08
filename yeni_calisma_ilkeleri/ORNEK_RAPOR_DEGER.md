# DEĞER KAPILARI RAPORU (D01–D14)

Dosya: `/mnt/user-data/uploads/KobiFinansYonetimPaketi.xlsx`
SHA-256: `b0c098e9227bea42b1c141ac16f9ee3810d93d9e4cb7d7c73b2428cae60a9f96`

- GEÇTİ: 4
- UYARI: 3
- **KALDI: 7**

## Kalan kapılar

- **D07** — ÖLÜ ÇIKTI — 5 kolon hesaplanmıyor: ['AYLIK_VERI.tblKobi[Kapanış Nakit (₺)] — başlık var, 8 dolu satırda ne formül ne değer', 'AYLIK_VERI.tblKobi[Tahmini Kâr (₺)] — başlık var, 8 dolu satırda ne formül ne değer', 'AYLIK_VERI.tblKobi[Risk Skoru] — başlık var, 8 dolu satırda ne formül ne değer', 'AYLIK_VERI.tblKobi[Not] — başlık var, 8 dolu satırda ne formül ne değer', 'ORNEK_VERI.tblOrnek[Not] — başlık var, 6 dolu satırda ne formül ne değer']
- **D06** — SAHTE KPI — 6 hücre yalnızca sabitlerden türüyor, veriyi ölçmüyor: [('KONTROLLER', 'B17', '=KobiToplamGiris'), ('KONTROLLER', 'B18', '=KobiDoluGiris'), ('KONTROLLER', 'B19', '=ROUND(IF(KobiToplamGiris=0,0,KobiDoluGiris/KobiToplamGiris*'), ('SENARYO_DUYARLILIK', 'B7', '=KobiIyiSenaryo'), ('SENARYO_DUYARLILIK', 'B8', '=KobiBazSenaryo')]
- **D13** — Motor adımı 16 (asgari 40) — hesap katmanı sığ. Sayfalar: ['HESAP']
- **D09** — Grafik 6 (asgari 8)
- **D09b** — 7 grafik serisi düz sıfır — alıcı ilk ekranda boş görür: ["PANO: 'PANO'!$B$10:$B$21 tamamı sıfır/boş", "PANO: 'PANO'!$C$10:$C$21 tamamı sıfır/boş", "PANO: 'PANO'!$D$10:$D$21 tamamı sıfır/boş", "PANO: 'PANO'!$E$10:$E$21 tamamı sıfır/boş", "PANO: 'PANO'!$F$10:$F$21 tamamı sıfır/boş"]
- **D10** — AYARLAR: zorunlu kolon yok: ['kaynak', 'yururluk_tarihi'] | mevcut: ['ayar adı', 'anahtar', 'varsayılan değer', '']
- **D11** — BOŞ DOSYADA YANLIŞ KARAR — 140 veri silindi, karar hâlâ 'UYGUN' (beklenen 'VERİ YOK'). Sessiz yanlış-pozitif: dosya veri yokluğunu 'her şey yolunda' sanıyor.

## Uyarılar

- D03 — SPEC'te analitik_moduller yok — derinlik puanı ölçülemedi
- D01 — SPEC'te deger bloğu yok — fiyat çapası ölçülemedi
- D02 — SPEC'te serbest_alternatif yok — ayrım ölçülemedi

## Geçen kapılar

- D14 — 140 formülde ayraç doğru (virgül)
- D07b — 52 ad tanımının hedefi dolu
- D08 — PANO'da 77 farklı canlı KPI
- D12 — Çapraz tutarlılık sağlandı