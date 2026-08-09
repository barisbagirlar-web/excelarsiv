# FAZ 17 — PORTFÖY EKONOMİSİ READINESS

## GATE
**BLOCKED_BY_EVIDENCE.** Faz 9 P&L serisi 0 ölçülmüş ay içeriyor; mandate `portfolioPnlMinMonths` kadar gerçek seri ister. Bu nedenle kurul kararı, bütçe dağıtımı veya DIVEST icrası yapılmadı.

## TAMAMLANAN KOD
Portfolio board zarfı, konsantrasyon, DIVEST 4-adım, bütçe sapması ve KARAR_DEFTERI onay guard'ları hazır. Normal `portfolio-pnl.ts` yeterli P&L ayı yokken exit 3 verir. Negatif fixture'lar INV-17.1–17.4 için exit 1 üretir.

## RİSK
Sıfır aylık veriyi sıfır performans sanmak → kararEligible=false. DIVEST'i otomatik yürütmek → guard yalnız doğrular, icra yapmaz. Bütçe hedefini uydurmak → config referansı.

ROLLBACK: readiness artefakt/script/test/rapor revert; runtime/registry değişmez.
