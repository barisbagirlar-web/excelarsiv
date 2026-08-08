# Shopier — Sipariş Onay Mesajı

## Shopier'e yapıştırılacak nihai mesaj

**ÖDEME TAMAMLANDI — SON ADIM: EXCEL DOSYANIZI İNDİRİN**

Ödemeniz başarıyla alınmıştır. Satın aldığınız Excel dosyası Shopier üzerinden değil, **ExcelArşiv güvenli teslimat ekranından** indirilecektir.

**Excel'inizi indirmek için:**
https://excelarsiv.com/teslimat

1. Yukarıdaki bağlantıya tıklayarak ExcelArşiv'e dönün.
2. Ödeme bu cihazda başlatıldıysa siparişiniz otomatik olarak kontrol edilir.
3. Ödeme onaylandığında **“Excel'i Bilgisayarıma İndir”** butonu açılır.
4. Butona tıklayarak dosyanızı doğrudan bilgisayarınıza indirin.

**Önemli:** Shopier ödeme ekranında, ExcelArşiv'de satın alma işlemini başlatırken kullandığınız **aynı e-posta adresini** kullanın.

Başka bir cihazdan devam ediyorsanız veya satın alma kaydı otomatik bulunmazsa teslimat ekranında **satın aldığınız ürün + Shopier'de kullandığınız e-posta + Shopier sipariş numarası** ile indirme hakkınızı güvenli biçimde geri yükleyebilirsiniz.

ExcelArşiv
https://excelarsiv.com

---

## Shopier panelinde uygulanacak yer

Shopier web paneli:

`Dükkan Yönetimi > Dükkan Seçenekleri > Sipariş Onay Mesajı`

Yukarıdaki nihai mesaj bu alana eksiksiz yapıştırılmalıdır.

Shopier'in resmi yardım dokümanına göre ödeme tamamlandıktan sonra müşteriye gösterilen sipariş onay sayfasına özel mesaj ve harici bağlantı eklenebilmektedir.

## Üretim akışı

`ExcelArşiv ürün sayfası -> Shopier ödeme -> Shopier sipariş onay mesajı -> https://excelarsiv.com/teslimat -> otomatik ödeme doğrulama -> Excel'i Bilgisayarıma İndir`

### Normal akış

- Müşteri ExcelArşiv'de e-posta adresini girer.
- Sistem güvenli checkout kaydı oluşturur ve tarayıcıda yalnızca gerekli checkout referansını saklar.
- Müşteri Shopier'e yönlendirilir.
- Müşteri aynı e-posta adresiyle ödemeyi tamamlar.
- Shopier sipariş onay ekranındaki ExcelArşiv teslimat bağlantısına tıklar.
- `/teslimat` sayfası mevcut checkout kaydını otomatik bulur.
- Shopier siparişi sunucu tarafında doğrulanır.
- Ödeme doğrulandıysa güvenli indirme butonu açılır.
- Butona basıldığında kısa süreli, tek kullanımlık indirme tokenı oluşturulur ve gerçek Excel dosyası private storage üzerinden indirilir.

### Kurtarma akışı

Tarayıcı kaydı yoksa müşteri `/teslimat` sayfasında:

- satın aldığı ürünü,
- Shopier'de kullandığı e-posta adresini,
- Shopier sipariş numarasını

girer. Sistem siparişi Shopier üzerinden yeniden doğrular ve yalnızca eşleşme başarılıysa indirme hakkını açar.

## Güvenlik kuralı

Shopier sipariş onay mesajındaki `https://excelarsiv.com/teslimat` bağlantısı **tek başına indirme yetkisi vermez**. Yetki yalnızca doğrulanmış Shopier ödeme kaydından sonra açılır. Gerçek Excel dosyasının public URL'si müşteriye verilmez.
