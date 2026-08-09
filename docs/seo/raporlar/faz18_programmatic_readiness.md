# FAZ 18 — PROGRAMMATIC FABRİKA READINESS

## GATE
**KAPALI.** Faz 17'de gerçek P&L destekli `INVEST + programmatic_longtail` kararı yoktur. Bu nedenle template registry bilinçli olarak boştur ve hiçbir sayfa/parti üretilmez.

## TAMAMLANAN KOD
Factory safety contract hazır: kayıtlı templateId, 5 koşul uygunluk, config tabanlı 3–5 pilot ve 28g kanıt penceresi, genel invariant muafiyeti yasağı, rollback dry-run ve similarityMax kapısı. Normal script yatırım kararı yokken exit 3 verir.

INV-18.1/18.2/18.3/18.5/18.6 negatif fixture'ları exit 1. INV-18.4 karar süresi gerçek kill koşulu oluşmadan aktif değildir.

Failure modes: kanıtsız ölçek → factory açılmaz; thin/benzer parti → BLOCK; geri alınamayan batch → BLOCK.

ROLLBACK: readiness script/test/rapor revert; src/public/registry değişmez.
