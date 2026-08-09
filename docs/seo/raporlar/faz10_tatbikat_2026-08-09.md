# FAZ 10 TABLETOP TATBİKATI — Yanlış Product Noindex

Tarih: 2026-08-09T14:12:00Z
Tür: kod/CI masa başı tatbikatı; production'a değişiklik uygulanmadı.

Senaryo: ortak product template'e yanlış `noindex` eklenmesi.

Beklenen algılama zinciri: build → SEO artifact validator → sitemap/index-state contract → conformance → merge engeli. Değişiklik merge sonrasında fark edilirse live-contract ve sitemap/canonical kontrolü tetikler; ilk çözüm son güvenli commit revertidir.

PASS kriteri: runbook rollback yolu mevcut, `INV-3.3` noindex-sitemap negatif fixture exit 1 üretir, production üzerinde tatbikat yapılmadı.

Sonuç: PASS — savunma zinciri kodla mevcut; gerçek kriz iddiası değildir.
