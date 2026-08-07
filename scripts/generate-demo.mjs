// ESKİ STATİK DEMO ÜRETİCİSİ DEVRE DIŞI.
// Proof Demo artık Firebase Functions üzerinden talep anında oluşturulur.
// public/ altında .xlsx/.xlsm üretmek güvenlik kapısı ihlalidir.

console.error('HATA: Statik demo üretimi kapalı. Proof Demo /api/demo-request + /api/demo-download üzerinden üretilir.');
process.exit(1);
