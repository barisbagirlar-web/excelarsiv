# FAZ 11 TESLİM RAPORU — KAC / PORTFÖY KARAR KATMANI

## 1. GATE-IN
Faz 9 motoru kurulmuş fakat authenticated GSC/GA4 olmadığı için ekonomik seri [Eksik_veri] durumundadır. E-34 kapsamında KAC'ın veri gerektirmeyen owner/safety katmanı kurulmuştur; sayısal skor veya yatırım kararı üretilmemiştir.

## 2. ÇIKTI
- [Kesin] 12 ücretli ürün cluster'ı tek owner route ile makine kaydına alındı.
- [Kesin] `sourceCtrModel`, 9-durum `state`, numeric `priorityScore` ve `portfolioRecommendation` gerçek veri gelene kadar null tutuldu.
- [Kesin] Partial cluster için INVEST ve numeric skor fail-closed bloklanır.
- [Kesin] Endüstri CTR tablosu, çift owner, eşik üstü benzerlik ve onaysız karar negatif fixture'ları exit 1 üretir.

## 3. INVARIANT
| Kod | Status | Kanıt |
|---|---|---|
| INV-11.1 | PASS | 12 cluster tek owner; double-owner fixture exit 1 |
| INV-11.2 | PASS | Gerçek artefaktta CTR model null; industry-ctr fixture exit 1 |
| INV-11.3 | PASS | similarityMax config kapısı; similarity fixture exit 1 |
| INV-11.4 | PASS | Gerçek portföy kararı yok; decision-no-approval fixture exit 1 |
| INV-11.5 | SKIP_NO_DATA | DIVEST önerisi üretilemez; bekleme süresi oluşmadı |
| INV-11.6 | PASS | partial + INVEST veya numeric skor yasak; fixture exit 1 |
| INV-11.7 | SKIP_NO_DATA | GSC pozisyon/CTR serisi yok, striking-distance ayrımı yapılamaz |
| INV-11.8 | PASS | Kara kutu skor yok; scoringEnabled=false ve eksik sinyaller açık |

## 4. Gelir ekseni
[Kesin] En değerli çıktı sahte öncelik skoru üretmemektir. 12 mevcut ücretli ürünün owner/query yapısı korunur; veri geldiğinde CTR×CVR×değer×güven/efor modeli bu haritanın üzerinde çalışacaktır.

## 5. Failure modes
1. **Null veriye 0 muamelesi:** mitigasyon: priorityScore null, decisionEligible=false.
2. **Hacim tahminiyle INVEST:** mitigasyon: partial-invest BLOCK.
3. **Bir sorgu ailesine iki satış sayfası:** mitigasyon: multi-owner BLOCK.

## 6. ROLLBACK
ROLLBACK: KAC artefakt/script/test/rapor PR revert edilir; registry ve runtime değişmez.

## 7. GATE-OUT
**PARTIAL_SAFE — [Eksik_veri].** Owner/safety sözleşmesi tamamdır; authenticated GSC/GA4 gelene kadar sayısal öncelik ve INVEST/HOLD/HARVEST/DIVEST nihai kararı üretilemez. Faz 12'nin veri gerektirmeyen SRE/evidence katmanı E-34 kapsamında devam edebilir.
