# FAZ 13 — OFF-PAGE / MOAT

[Kesin] Dört mevcut metodoloji rehberi linkable-asset envanterine alındı. Paid link, PBN, link exchange ve bulk guest post yasak; disavow koşulsuz üretilemez. Backlink/brand/AI citation kaynakları bağlı olmadığı için `brand_demand.json` partial ve SKIP_NO_DATA.

INV-13.1 PASS: unconditional-disavow fixture exit 1. INV-13.2 PASS: link-scheme fixture exit 1. INV-13.3–13.6 veri/izleme bağımlı; kanıtsız oran üretilmez.

Failure modes: sahte backlink fırsatı → yasak taktik guard; brand talebi tahmini → boş seri; link satın alma ile kısa yol → BLOCK.

ROLLBACK: veri/script/test/rapor revert; runtime yok.
