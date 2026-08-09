# FAZ 09 DURUM RAPORU — VERİ AMBARI / SEO P&L

## 1. GATE-IN
[Eksik_veri] Authenticated GSC ve GA4 rapor verisi bağlı değildir. Bu nedenle Faz 9 ekonomik GATE-IN'i tam sağlanmamaktadır. Kullanıcının DEGRADED_PUBLIC yürütme yetkisi yalnız altyapı ve fail-safe sözleşmenin kurulmasına izin verir; ölçülmüş sonuç üretmeye izin vermez.

## 2. Kurulan altyapı
- [Kesin] `seo-pnl.ts` minor-unit, structural-break ve incrementality-CI kurallarını fail-closed doğrular.
- [Kesin] `pnl.json` tam artefakt zarfıyla fakat boş seri olarak üretildi: `partial:true`, `confidence:low`, `status:SKIP_NO_DATA`.
- [Kesin] Assisted değer toplam gelire otomatik eklenmez; çift sayım politika olarak kapatıldı.
- [Kesin] GSC Generative AI impressions ekonomik formüle giremez; config `false` kilidi bootstrap preflight'ta korunuyor.

## 3. INVARIANT
| Kod | Status | Kanıt |
|---|---|---|
| INV-9.1 | PASS | float-money fixture exit 1; tüm ekonomik alan sözleşmesi integer minor-unit |
| INV-9.2 | PASS | structural-mix fixture exit 1 |
| INV-9.3 | PASS | effectSize var + CI yok fixture exit 1 |
| INV-9.4 | PASS | default değer 0 olduğu için artefakt `confidence:low`, `partial:true` |
| INV-9.5 | PASS | `gscGenerativeAiInFormula:false` preflight ile zorlanıyor |

## 4. Gelir ekseni
[Kesin] Bu aşamada gelir artışı ölçülmüş değildir. Doğru karar, boş veriyi sıfır gelir diye yorumlamak değil, veri geldiğinde first-touch / assisted / AI referral / cost serilerini aynı kırılma sözleşmesiyle hesaplayacak motoru hazır tutmaktır.

## 5. Failure modes
1. **Boş veri = sıfır performans sanılması:** mitigasyon: `series:[]` + `status:SKIP_NO_DATA`; sıfır gözlem üretilmez.
2. **Assisted double count:** mitigasyon: ayrı kolon/politika; recognized value toplamına otomatik eklenmez.
3. **Kırılma öncesi/sonrası trend karışması:** mitigasyon: structural-mix BLOCK fixture.

## 6. ROLLBACK
ROLLBACK: Faz 9 altyapı PR'ı revert edilir; runtime etkisi yoktur.

## 7. GATE-OUT
**PARTIAL_BLOCKED — [Eksik_veri].** Kod/test sözleşmesi hazırdır; authenticated GSC + GA4 olmadan Faz 9 ölçüm/P&L GATE-OUT'u PASS ilan edilmez. Bu veri engeli Faz 10 gibi veri gerektirmeyen savunma/runbook işlerini E-34 kapsamında engellemez; Faz 17/19 ekonomik kararlarını engeller.
