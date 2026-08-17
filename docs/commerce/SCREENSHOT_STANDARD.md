# GÖRSEL STANDARDI — Ürün Ekran Görüntüsü Çekim Protokolü
### excelarsiv.com/sablonlar — Kart görselleri için bağlayıcı kural seti

## TEMEL KARAR
Kart görseli her zaman **gerçek, işlenmemiş Excel ekran görüntüsüdür.**
Stok fotoğraf, laptop/masa mockup'ı, illüstrasyon, AI-üretimi görsel,
gradient/glassmorphism efekti, sahte "canlı veri" paneli — hiçbiri
kullanılmaz. Sebep iki yönlü:

1. **Dürüstlük:** Satılan ürün bir Excel dosyasıdır. Müşteri tam olarak
   ne göreceğini, satın almadan önce görmelidir. Bu, sizin ai_tas.txt
   talimatınızdaki "sahte kanıt/gösterge yasak" ilkesinin doğrudan
   uygulamasıdır.
2. **Satın alma hissi:** B2B finans/muhasebe araçlarında satın alma
   kararını geciktiren en büyük risk algısı "içeride ne var, tam
   göremiyorum" tereddüdüdür. Gerçek, dürüst ekran görüntüsü bu riski
   sıfırlar — cilalanmış ama sahte bir görsel yerine ham gerçeklik
   güven üretir. Bu kategori (kurumsal/mühendislik yazılım-benzeri
   ürün) için "premium" = stüdyo fotoğrafı değil, **netlik + tutarlılık
   + kanıt**tır.

## NEDEN "GENEL EKRAN" DEĞİL, "SONUÇ HÜCRESİ" ODAKLI KIRPMA?
Mevcut yapıda ekran görüntüsünün sol-üst köşesi (genelde veri giriş
sütunları — tarih, tutar, açıklama gibi sıradan hücreler) gösteriliyordu.
Bu, ürünün asıl değerini (kararı/sonucu) gizliyor. Müşteri bir Excel
dosyası değil, **bir karar** satın alıyor: "SAT/ZAM/ÇEKİL", "UYGUN/İNCELE/
DURDUR", risk skoru, renkli uyarı hücresi gibi. Kart görseli bu karar
alanını göstermeli — bu hem dürüst (gerçek ürün ekranı) hem de en
ikna edici (asıl faydayı en hızlı gösteren) seçimdir.

## ÇEKİM PROTOKOLÜ (INVARIANTLAR)

**I1 — Kaynak:** Ekran görüntüsü doğrudan gerçek .xlsx dosyasından, canlı
uygulama görünümünden alınır. Photoshop/AI ile üretilmiş, sonradan
eklenmiş hiçbir öğe olamaz.

**I2 — Zoom sabiti:** Tüm ekran görüntüleri Excel'de %100 zoom'da alınır.
Farklı ürünlerde farklı zoom kullanmak, kartlar arası tutarlılığı bozar.

**I3 — Tema sabiti:** Excel açık tema (light mode), varsayılan gridline
rengi, varsayılan hücre renk paleti. Koyu tema veya özel Excel teması
kullanılmaz (marka kuralınızla — "dark tema olmayacak" — birebir uyumlu).

**I4 — Odak bölgesi:** Kırpma alanı, ürünün nihai karar/sonuç hücresini
(renk kodlu KARAR/DURUM hücresi, risk skoru, toplam/net rakam) çerçevenin
alt üçte birinde bırakacak şekilde seçilir. Bu, `ProductCard.astro`
bileşenindeki `screenshotFocus="result"` (varsayılan) ile eşleşir.

**I5 — Gridline şeridi korunur:** Kırpma, Excel'in sütun harfi (A, B, C…)
şeridinden en az ince bir kesit bırakacak şekilde yapılır. Bu şerit
"bu gerçek bir Excel dosyası" sinyalini taşır — sahte/mockup bir arayüz
değil. Kasıtlı olarak silinmez.

**I6 — Örnek veri gerçekçi ama anonim:** Görünen şirket adı, kişi adı,
vergi no gibi alanlarda gerçek bir işletmenin verisi kullanılmaz;
"ABC Ticaret Ltd. Şti." gibi jenerik ama gerçekçi placeholder kullanılır.
Sayılar (₺, %, tarih) gerçekçi aralıkta olmalı — abartılı/etkileyici
görünsün diye şişirilmiş rakam konulmaz (dürüstlük ilkesi).

**I7 — Çözünürlük:** Minimum 1280×960px kaynak görüntü (kart 640×480
gösterir, retina ekranlarda netlik için 2x kaynak gerekir).

**I8 — Format:** PNG, sıkıştırma kalitesi kayıpsız veya minimum kayıplı.
JPEG artefaktları (hücre kenarlarında bulanıklaşma) kabul edilmez —
finansal tablo netliği güven sinyalidir.

## ÇOK SAYFALI ÜRÜNLER (≥15 sayfa)
`ProductCard.astro` otomatik olarak `pageCount >= 15` olan ürünlerde
sağ kenarda ince bir "sayfa yığını" dokusu gösterir (kod tarafında
otomatik, ekstra görsel üretimi gerekmez). Bu doku gerçek sayfa
sayısından türetilir — kurgusal içerik eklemez, sadece "bu tek sayfa
değil, çok sayfalı bir sistem" bilgisini dürüstçe iletir.

## RET LİSTESİ (asla kullanılmaz)
- Stok fotoğraf (gülümseyen iş insanı, laptop üzerinde el, ofis manzarası)
- 3D laptop/monitör mockup'ı içine yerleştirilmiş ekran görüntüsü
- Gradient arka plan, glassmorphism, parlaklık/glow efekti
- Sahte "canlı" rozet, kurgusal KPI paneli, gerçek olmayan yüzde/ok
- Ürünün gerçekte üretmediği bir görünüm (ör. gerçek dosyada olmayan
  grafik/chart'ı sadece görsel için ekleyip dosyada olmayan bir şeyi
  varmış gibi göstermek)

## UYGULAMA SIRASI
1. Mevcut 50 ürünün ekran görüntüleri bu protokole göre yeniden taranır/kırpılır
   (mevcut .png dosyaları zaten gerçek ekran görüntüsüyse, sadece **kırpma
   noktası** I4'e göre güncellenir — yeniden çekim gerekmeyebilir).
2. Her ürün için `screenshotFocus` değeri belirlenir (çoğunlukla "result";
   sonuç hücresi görselin en üstündeyse "top" kullanılır).
3. Yeni ürünlerde çekim bu protokole göre en baştan yapılır — kontrol
   listesi: Zoom %100 mi? Açık tema mi? Sonuç hücresi alt 1/3'te mi?
   Gridline şeridi görünüyor mu? Placeholder veri mi?

## KABUL KRİTERİ
Bir ekran görüntüsü, I1–I8'in tamamını karşılamadan siteye yüklenmez.
Ret listesindeki bir öğe tespit edilirse görsel derhal değiştirilir —
kısmi uygunluk kabul edilmez.
