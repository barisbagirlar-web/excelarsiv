# EXCEL ÜRÜN ÜRETİM MANDASI — v4.0 · ENTERPRISE
## Bağlayıcı üretim sözleşmesi · Her dosya TEK BAŞINA 7.900+ TL

> **v4'ün v3'ten farkı tek cümleyle:** v3 değer kapılarını *tarif ediyordu*, v4 onları
> *çalıştırıyor*. `deger_kapilari.py` bu mandayla birlikte teslim edilir ve D01–D14'ü
> gerçekten ölçer. Kanıtlanmıştır: sahadaki bozuk bir dosyaya çalıştırıldığında 7 kapı
> KALDI vermiş, ölü hesap kolonunu, sahte kalite skorunu ve boş dosyada üretilen
> yanlış "UYGUN" kararını yakalamıştır.
>
> **Beyan kanıt değildir. Kanıt yalnızca denetçi çıktısıdır.** Bu kural artık mandanın
> kendisi için de geçerlidir.

---

## 0. KAPI MİMARİSİ — üç katman

| Katman | Kapılar | Ölçtüğü | Betik |
|---|---|---|---|
| **İşçilik** | G01–G24 (+G05b, G05c) = **26** | Koruma, biçim, ipucu, baskı, dil | `denetci.py` |
| **Dayanıklılık** | Ö1, Ö1b, Ö2, Ö2b = **4** | 5.000 satır ölçek, 7 uç durum | `olcek_testi.py` |
| **Değer** | D01–D14 (+D07b, D09b) = **16** | Ölü çıktı, sahte KPI, derinlik, karar kalitesi | `deger_kapilari.py` |

**Üçü de 0 KALDI vermeden sevk yasaktır. Toplam 46 kapı.**

> **Düzeltme:** v4'ün ilk taslağı "40 kapı" diyordu — alt kapılar (G05b, G05c, Ö1b, Ö2b,
> D07b, D09b) sayılmamıştı. Gerçek sayım betiklerden ölçülmüştür: 26 + 4 + 16 = 46.

Dördüncü betik `kapilar.py` üçünü sırayla çalıştırır, katman özeti ve SHA-256 üretir:

```
python kapilar.py cikti/<ad>.xlsx --spec SPEC.yaml
```

Eksik betikle sevk kararı verilemez — `kapilar.py` betik bulamazsa çıkış kodu 2 verir
ve "SEVK EDİLEBİLİR" demez. (Manda tam kapı setini şart koşar; eksik ölçüm, ölçüm değildir.)

Sıra bağlayıcıdır: önce işçilik, sonra dayanıklılık, en son değer. Değer kapıları en
pahalı olanlardır — işçilik kırıkken çalıştırmak zaman kaybıdır.

---

## 0b. KANIT: İŞÇİLİK KAPILARI DEĞERİ ÖLÇMEZ

Bu manda bir iddiaya dayanıyordu: *"G katmanı işçilik ölçer, değer ölçmez."*
İddia artık **ölçülmüştür**. Sahadaki bozuk dosya (7.900 TL etiketli KOBİ paketi)
üç katmandan geçirildi:

| Katman | Sonuç |
|---|---|
| **G — İşçilik** | **0 KALDI · "SEVK EDİLEBİLİR"** |
| **Ö — Dayanıklılık** | 1 KALDI (uç durumda sessiz yanlış karar) |
| **D — Değer** | 7 KALDI (ölü çıktı, sahte KPI, boş dosyada yanlış karar…) |

**26 işçilik kapısının tamamını geçen dosyada:**
- `Kapanış Nakit`, `Tahmini Kâr`, `Risk Skoru` kolonları formülsüz — motor sıfır üretiyor
- Kalite skoru sabitten türüyor, daima 100
- Veri tamamen boşaltıldığında karar hâlâ `UYGUN`
- Negatif ve azami değer senaryolarında da karar `UYGUN`
- 7 grafik serisi düz sıfır

Yani bir dosya **26 kapıdan geçip yine de çalışmayabilir.** v2/v3 disipliniyle üretilen
her ürün bu riski taşır. Ö ve D katmanları olmadan "denetimden geçti" cümlesi anlamsızdır.

---

## 1. NEDEN 7.900 TL — ve neden rakip bunu kopyalayamaz

Rakibiniz sizin **görünüşünüzü** bir hafta sonunda kopyalar. Renk paleti, sayfa düzeni,
KPI kartları — hepsi ekran görüntüsünden taklit edilebilir. Kopyalayamayacağı dört şey vardır
ve fiyatınız **yalnızca bunlardan** doğar:

| Hendek | Neden kopyalanamaz | v4'te nerede |
|---|---|---|
| **H1 · Parametre bakımı** | Mevzuat değişince 12 dosyayı güncel tutmak süreklilik ister; tek seferlik kopyacı bunu taşıyamaz | §5 Ortak Parametre Kütüphanesi |
| **H2 · Kanıtlanmış doğruluk** | 40 kapılık denetim raporu + SHA-256 parmak izi; taklit dosya bu raporu üretemez | §6 Kanıt Paketi |
| **H3 · Analitik derinlik** | Yaşlandırma kopyalanır; varyans köprüsü + tahmin aralığı + kök-neden ayrıştırma kopyalanmaz | §4 Modül Kataloğu |
| **H4 · Regresyon güvencesi** | Sürüm 2'nin sürüm 1'i bozmadığını kanıtlamak altın dosya disiplini ister | §7 Altın Dosya |

**Kural:** Bir özellik bu dörtten birine yazılamıyorsa, o özellik fiyatı taşımıyordur.
Güzel görünmek fiyat taşımaz.

### Fiyat çapası (D01)

```
Y1 (danışman ikamesi) + Y2 (kurulum ikamesi)  ≥  3 × satış fiyatı
```

7.900 TL için **asgari 23.700 TL** ikame maliyeti. Y3 (önlenen hata maliyeti) hesaba
**dahil değildir** — abartıya en açık kalem odur, yalnızca bilgi olarak yazılır.

Eşik tutmuyorsa üç seçenek vardır ve **üçü de meşrudur**: derinleştir, fiyatı düşür,
ya da ürünü iptal et. Etiketi zorlamak yasaktır.

---

## 2. SERBEST ALTERNATİF TESTİ (D02)

Her ürün için dürüst cevap: **"Alıcı bunu bedavaya nasıl yapar?"**

Adaylar: ücretsiz şablon, muhasebe programının hazır raporu, banka/POS ekranı,
e-Defter portalı, bir yapay zekâya 20 dakikada kurdurmak, mali müşavirin zaten gönderdiği tablo.

**Asgari 5 ayrım maddesi** yazılır. Her madde:
- **çıktı düzeyinde** olacak ("daha güzel" değil),
- dosyada **ad tanımı karşılığı** olacak — denetçi bunu doğrular.

Ayrım 5'e çıkmıyorsa **kod yazmadan dur**. Ürün fikri zayıftır.

> Bu, mandanın en çok reddedilen kapısı olacaktır ve olması gerekir. Katalogdaki 12 üründen
> bir kısmının bu kapıyı geçemeyeceğini şimdiden öngörüyorum — özellikle POS/komisyon ve
> Vergi-SGK karşılığı gibi hesabı görece düz olanlar.

---

## 3. ÖLÜ ÇIKTI YASAĞI (D07) — en pahalı kusur

Sahada ölçülmüş gerçek vaka: 14 sayfalık, 140 formüllü, 6 grafikli, 7.900 TL etiketli bir
dosyada `Kapanış Nakit`, `Tahmini Kâr` ve `Risk Skoru` kolonları **başlık olarak vardı,
formül olarak yoktu**. Sonuç: motor sıfır üretti, karar kapısı veri yokluğunu "UYGUN" sandı,
6 grafiğin 4'ü düz sıfır çıktı. Dosya sözdizimsel olarak **hatasızdı** — `recalc` 0 hata verdi.

**Bu yüzden "0 formül hatası" bir kalite ölçüsü değildir.** Yeşil recalc, formüllerin
*çalıştığını* kanıtlar; *doğru* olduğunu değil, hatta *var olduğunu* bile değil.

Kesin kurallar:

- Başlığı olan her hesap kolonunun dolu satırlarında **formül olacak**. (D07)
- Her ad tanımı **dolu bir hücreyi** gösterecek. (D07b)
- Örnek veriyle açıldığında hiçbir grafik serisi **düz sıfır** olmayacak. (D09b)
- Hiçbir KPI yalnızca sabitlerden türemeyecek. (D06)

D06 özel not: kalite/güven skorunu sabit sayıdan üretmek (`toplamGiris = 9000`,
`doluGiris = 9000` → skor daima 100) **sahte KPI**'dır ve doğrudan KALDI'dır. Skor veriyi
ölçmüyorsa skor değildir, dekordur.

---

## 4. ANALİTİK DERİNLİK — puanlı katalog (D03, D04, D05)

**Eşik: ≥100 puan ve ≥2 İLERİ modül.**

### Temel — 10 puan
`T1` Yaşlandırma · `T2` Trend + hareketli ortalama · `T3` Pareto/yoğunlaşma ·
`T4` Dönem karşılaştırma · `T5` Mutabakat farkı · `T6` Kırılım/başabaş noktası

### Orta — 15 puan
`O1` Anomali (MAD tabanlı) + gerekçe · `O2` Duyarlılık/tornado (sıralı) ·
`O3` Senaryo motoru (≥3) · `O4` Nakit dönüşüm döngüsü · `O5` Vade ve gecikme maliyeti ·
`O6` Yoğunlaşma riski (HHI) · `O7` Kohort/vintage davranışı · `O8` Canlı veri kalite skoru

### İleri — 25 puan
`I1` Tahmin + **aralık** · `I2` Yüzdelik dağılım (P10/P50/P90) · `I3` Finansman kararı (XNPV/XIRR) ·
`I4` Erken ödeme iskontosu vs kredi · `I5` EOQ + emniyet stoğu · `I6` Varyans köprüsü
(fiyat/miktar/karışım) · `I7` Nakit açığı köprüleme planı · `I8` Mutabakat kök-neden ayrıştırma

### Modül geçerlilik şartı (üçü birden)

1. Sonucu **ad tanımlı** hücrede duruyor.
2. **Formülle** çalışıyor.
3. **Makine üretilmiş yorum cümlesi** var — `_xlfn.TEXTJOIN` ile kurulmuş, sayıyı Türkçe
   yorumlayan metin. Sabit metin yorum **puanı iptal eder**. (D05)

Bu üçüncü şart dolgu modül eklemeyi teknik olarak imkânsız kılar: yorum cümlesi
yazılamıyorsa modül gerçekten hesaplanmıyordur.

---

## 5. ORTAK PARAMETRE KÜTÜPHANESİ (H1 — asıl hendek)

12 ürün ayrı ayrı parametre tutmaz. **Tek kaynak:**

```
ortak/
  parametreler.yaml        # tüm mevzuat parametreleri, sürümlü
  PARAMETRE_KAYNAKLARI.md  # kaynak + yürürlük + doğrulama tarihi
  stil.py                  # tek görsel sistem, 12 ürün aynı dili konuşur
  motor_kutuphanesi.py     # T/O/I modüllerinin yeniden kullanılabilir üreticileri
```

AYARLAR sayfası **zorunlu kolonlarla** kurulur (D10 bunu ölçer):

```
anahtar | deger | birim | aciklama | kaynak | yururluk_tarihi | dogrulama_tarihi
```

- `kaynak` ve `yururluk_tarihi` **%100 dolu** olacak.
- Mevzuat parametresi için kaynak: **kurum + tebliğ/karar no + tarih**.
- Kaynağı olmayan sayı `kaynak = Varsayım` olarak işaretlenir ve KILAVUZ'da toplu listelenir.
  **Gizli varsayım yasaktır.**
- Rapor altbilgisine parametre seti tarihi basılır.

**İş modeli sonucu:** Mevzuat değiştiğinde tek dosyayı güncelleyip 12 ürünü yeniden
üretirsiniz. Rakip her dosyayı elle günceller — ya da güncelleyemez. Hendek budur.

---

## 6. KANIT PAKETİ (H2) — Enterprise alıcının aradığı

```
<URUN_ADI>.xlsx
KANIT/
  RAPOR_DENETIM.md        # G01–G24 → 0 KALDI
  RAPOR_OLCEK.md          # Ö1, Ö2 → temiz, yeniden hesap süresi ölçülü
  RAPOR_DEGER.md          # D01–D14 → 0 KALDI + SHA-256 parmak izi
  PARAMETRE_KAYNAKLARI.md
  FIYAT_SAVUNMASI.md
SURUM_NOTLARI.md
KULLANIM_KILAVUZU.pdf     # 5–8 sayfa, ekran görüntülü
ornek_veri.csv
```

**SHA-256 parmak izi** her denetim raporunda yer alır. Alıcı indirdiği dosyanın denetlenen
dosya olduğunu doğrulayabilir. Türkiye'de Excel şablonu satan hiçbir rakip bunu yapmıyor;
maliyeti sıfıra yakın, algısal farkı büyük.

### Ortam beyanı (zorunlu)

Test edilmiş ve **yazılı beyan edilmiş** olacak:

| Ortam | Durum |
|---|---|
| Excel 2016 / 2019 / 2021 / 365 (Windows) | Tam destek |
| Excel for Mac | Test edildi mi, hangi sınırla |
| LibreOffice Calc | Beyan edilir |
| Google Sheets | Beyan edilir — **destekleniyorsa** test edilmiştir, edilmiyorsa açıkça yazılır |

Belirsiz bırakmak yasak. "Çalışması lazım" beyan değildir.

### Gizlilik / KVKK konumlandırması

Dosya **tamamen çevrimdışı** çalışır: dış bağlantı yok, web eklentisi yok, telemetri yok,
makro yok. Bu bulut tabanlı rakiplere karşı gerçek bir satış argümanıdır ve G20 kapısıyla
denetlenir. KILAVUZ'da açıkça yazılır: *"Verileriniz cihazınızdan çıkmaz."*

---

## 7. ALTIN DOSYA VE REGRESYON (H4)

Her ürün için `ornek/altin_cikti.json`:

```json
{
  "surum": "2.0.0",
  "girdi": "ornek_veri.csv",
  "beklenen": {
    "modulI1TahminOrta": 412500,
    "modulO1AnomaliSayisi": 3,
    "kararSonuc": "İNCELE",
    "veriKaliteSkoru": 86
  },
  "tolerans": 0.001
}
```

**Kural:** Yeni sürüm üretildiğinde aynı girdiyle aynı çıktı gelmelidir. Gelmiyorsa fark
**bilinçli** olmalı ve `SURUM_NOTLARI.md`'de gerekçelenmelidir. Sessiz sayısal kayma
en tehlikeli regresyondur — kimse fark etmez, alıcı yanlış karar verir.

Altın dosya olmadan sürüm 2 çıkarmak yasaktır.

---

## 8. KARAR KALİTESİ DOKTRİNİ (D11)

Alıcı tablo satın almıyor; **karar** satın alıyor.

1. **Veri yoksa karar yok.** Dolu satır < eşik ise karar hücresi `VERİ YOK` döndürür.
   Boş dosyanın `UYGUN` demesi **doğrudan KALDI**'dır ve denetçi bunu veriyi boşaltıp
   yeniden hesaplayarak fiilen test eder.
2. **Gerekçesiz karar yasak.** Hangi kuralın tetiklendiği formülle yazılır.
3. **Karar kuralları KILAVUZ'da açıkça gösterilir.** Kara kutu yasaktır.
4. **Aksiyonlar türetilir.** Hiçbir eşik ihlal edilmediyse "aksiyon gerekmiyor" der —
   sabit üç öneriyi her koşulda göstermek yasaktır.
5. **Güven damgası.** Kalite skoru eşiğin altındaysa tüm çıktılara
   "DÜŞÜK GÜVEN — sonuçlar eksik veriye dayanıyor" basılır.

---

## 9. GÖRÜNÜR DERİNLİK — 60 saniye kuralı (D08, D09)

Görünmeyen derinlik fiyat taşımaz.

- PANO tek ekranda **≥12 farklı canlı KPI**.
- Üst şeritte **karar + gerekçe cümlesi**; kaydırmak gerekmez.
- **≥8 grafik**, en az biri **tahmin aralığı** gösterir.
- Örnek veriyle açılışta boş grafik / sıfır KPI / "YOK" hücresi **bulunamaz**.
- Yalnızca MOTOR'da duran modül **puan almaz** — PANO veya RAPOR'da izdüşümü olacak.

---

## 10. MOTOR DERİNLİĞİ (D13)

- **≥40 isimli ara hesap adımı.** Her adım: `ad | formül | birim | ne işe yarar`.
- Tek dev formül yasak — `=EĞER(EĞER(EĞER(...)))` adımlara bölünür.
- Her adımın **birimi** yazılır (₺, gün, %, adet, kat). Birimsiz sayı yasak.
- Aynı hesap iki yerde yapılmaz; PANO/RAPOR yalnızca okur. (D12 çapraz tutarlılığı ölçer)
- **Bölen sıfır koruması zorunlu.**

---

## 11. TEKNİK TUZAKLAR — düzeltilmeden üretim yasak

v2/v3 dosyalarında **ölçülerek** saptanmış kusurlar:

| # | Kusur | Düzeltme |
|---|---|---|
| **Ç1** | `"NO"` beyaz listede, `"no"` yasak listede — aynı metin hem geçer hem kalır | Yasak sözcük eşleşmesi **kelime sınırıyla ve ≥4 harf** |
| **Ç2** | Manda "kapasite ≥1.000" der, denetçi <200'de sadece UYARI verir; `asgari_tablo_kapasitesi` **hiç okunmaz** | G24 → KALDI, SPEC değeri okunur |
| **Ç3** | Volatil bütçe aşımı yalnızca UYARI | Aşım → KALDI |
| **Ç4** | SPEC formülleri **noktalı virgüllü** (`SUMIFS(a;b;"x")`). openpyxl formülü XML'e aynen yazar; XML **virgül** ister → dosya bozuk açılır | Tüm formül ayracı **virgül**. Excel arayüzü yerel ayracı zaten gösterir. (D14) |
| **Ç5** | `dizi: true` formüller — betikle yazılan dizi formülü taşma üst verisi olmadan sessizce tek hücreye düşer | `SUMPRODUCT` veya tabloda yardımcı hesaplanan kolon |

### Betik üretiminde kesin yasak fonksiyonlar
`XLOOKUP, XMATCH, FILTER, SORT, SORTBY, UNIQUE, SEQUENCE, LAMBDA, LET, BYROW, BYCOL,
MAP, SCAN, REDUCE, TEXTSPLIT, VSTACK, HSTACK, TAKE, DROP, GROUPBY, PIVOTBY`

Bunlar **hata vermez, sessizce yanlış çalışır** — tespit edilmesi en zor kusur sınıfı.

### `_xlfn.` öneki zorunlu
`_xlfn.TEXTJOIN, _xlfn.CONCAT, _xlfn.IFS, _xlfn.SWITCH, _xlfn.MAXIFS, _xlfn.MINIFS`

### Tercih edilen çekirdek
`INDEX+MATCH, SUMIFS, COUNTIFS, AVERAGEIFS, SUMPRODUCT, IFERROR, AGGREGATE, CHOOSE,
LARGE, SMALL, PERCENTILE.INC, MEDIAN, STDEV.P, SLOPE, INTERCEPT, FORECAST.LINEAR, TREND,
NPV, IRR, XNPV, XIRR, EOMONTH, NETWORKDAYS, WORKDAY, ROUND, TEXT, REPT`

**Volatil bütçe: dosya genelinde en fazla 12** (`INDIRECT, OFFSET, NOW, TODAY, RAND`).
`TODAY()` yerine AYARLAR'da tek `raporTarihi` hücresi.

---

## 12. ÜRETİM DÖNGÜSÜ

```
1. SPEC.yaml yaz (deger + serbest_alternatif + analitik_moduller dahil) → insan onayı
2. python kur/ana.py                          → cikti/<ad>.xlsx
3. python dogrula/kapilar.py cikti/<ad>.xlsx --spec SPEC.yaml
      → G, Ö, D katmanlarını sırayla çalıştırır, KANIT/ altına 3 rapor yazar
4. KALDI varsa → kodu düzelt → 2'ye dön       (azami 6 tur)
5. 46 kapı 0 KALDI → altın dosya kaydet → SEVK
```

Geliştirme sırasında hızlı tur için: `--hizli` (5.000 satır ölçeğini atlar),
`--devam` (ilk KALDI'da durmaz, tüm katmanları görürsün).

**Depo yapısı — betiklerin tamamı bulunmak zorundadır:**

```
dogrula/
  kapilar.py           # orkestratör
  denetci.py           # G katmanı  (26 kapı)
  olcek_testi.py       # Ö katmanı  (4 kapı)
  deger_kapilari.py    # D katmanı  (16 kapı)
```

6 turda temizlenmiyorsa **dur ve raporla**. Sahte "tamamlandı" beyanı en ağır ihlaldir.

---

## 13. FİYAT DOĞRULAMA PROTOKOLÜ — mühendisliğin ölçemediği kısım

**Bu bölüm dürüstlük gereğidir.** Yukarıdaki 40 kapının hiçbiri "biri buna 7.900 TL öder mi"
sorusunu cevaplamaz. Kapılar arzı ölçer; fiyatı talep belirler. Elimizde şu an
**hiçbir talep verisi yok**.

Bu yüzden mandanın son maddesi kod değil, deney:

1. **Tek ürünü tam v4'e çıkar** — 12'sini birden değil.
2. **30 gün 7.900 TL etiketiyle yayınla.** Ölç: görüntülenme, sepete ekleme, satın alma,
   terk noktası.
3. **A/B testi:** aynı ürün için 4.900 TL ve 7.900 TL sayfaları. Hangisinin **toplam
   geliri** yüksek — dönüşüm oranı değil, gelir.
4. **İlk 3 satıştan sonra alıcıyla konuş.** "Bunu almasaydınız ne yapardınız?" — Y1/Y2
   tahminlerinin gerçek karşılığı budur.
5. **Eşikleri geri kalibre et.** §1'deki `3×` çarpanı, §4'teki puan ağırlıkları,
   §9'daki 12 KPI eşiği — hepsi şu an **benim varsayımım**, ölçüm değil. Satış verisi
   geldiğinde bunlar veriyle değiştirilir.

**Manda kendi kuralına tabidir:** bu eşiklerin tamamı `kaynak = Varsayım` etiketlidir.

---

## 14. KABUL VE DURDURMA

**Sevk (hepsi birden):**
- `kapilar.py` çıktısı: **46 kapı, 0 KALDI** (üç katman da çalışmış olacak — "betik yok" sevk engelidir)
- Boş dosya testi: karar = `VERİ YOK`
- Örnek veri testi: sıfır/boş KPI ve düz sıfır grafik serisi yok
- Altın dosya kaydedildi · Kanıt paketi tam · Ortam beyanı yazılı

**Durdurma (ürün fikri iptal):**
- Serbest alternatif ayrımı 5 maddeye çıkmıyor
- Derinlik puanı 100'e çıkarılamıyor → konu yeterince derin değil
- `Y1+Y2 < 23.700 TL` → 7.900 etiketiyle sevk edilmez

---

## 15. DÜRÜSTLÜK MADDESİ

Teslimde şu **altı** soru kanıtla cevaplanır:

1. Hangi kapılar geçti? → üç denetim raporunu yapıştır.
2. Hangi maddeyi uygulayamadın? Neden? Yerine ne yaptın?
3. Bu dosyanın en zayıf noktası nedir? ("Yok" kabul edilmez.)
4. Bu dosya gerçekten 7.900 TL ediyor mu? Y1+Y2 hesabını göster. **Etmiyorsa söyle** —
   fiyatı savunmak senin işin değil, ölçmek senin işin.
5. Serbest alternatifle en çok örtüşen özelliğin hangisi? Alıcı nerede "bunu zaten
   bedavaya yapabiliyorum" der?
6. Hangi eşiği tutturmak için içeriği zorladın? (Dolgu modül, şişirilmiş Y3, gereksiz grafik.)

Altı cevap verilmeden iş teslim edilmiş sayılmaz.

---

## EK — MODÜL KOMBİNASYONLARI (tavan, bağlayıcı değil)

| Ürün ailesi | Modüller | Puan |
|---|---|---|
| Kasa / nakit kontrol | T2,T5,T6 + O1,O8 + I1,I7 | 110 |
| 13 haftalık nakit akışı | T2,T6 + O2,O3,O8 + I1,I7 | 115 |
| Cari / tahsilat / müşteri riski | T1,T3 + O6,O7,O8 + I1,I6 | 115 |
| Banka / kredi / taksit | T4,T6 + O5,O8 + I3,I4 | 100 |
| Çek-senet vade riski | T1,T6 + O5,O6,O8 + I1,I3 | 115 |
| Gelir-gider / gerçek kârlılık | T3,T4 + O2,O8 + I6,I2 | 100 |
| Vergi / SGK / maaş karşılığı | T2,T6 + O5,O8 + I1,I7 | 100 |
| Stok / nakit bağlanma | T1,T3 + O4,O8 + I5,I6 | 100 |
| POS / komisyon / net tahsilat | T4,T5 + O6,O8 + I2,I4 | 100 |
| Aylık patron paneli | T2,T3,T4 + O2,O3,O8 + I1,I2 | 125 |
| Proje / iş bazında kârlılık | T3,T6 + O2,O8 + I3,I6 | 100 |

Ürünün gerçek acısına uymayan modülü puan için eklemek **yasaktır** — dolgu modül
D05 (yorum cümlesi) kapısında zaten düşer.

Sınırda duran satırlara dikkat: **100 puanla geçen ürünler** (banka/kredi, gelir-gider,
vergi/SGK, stok, POS, proje) tek modül düşerse kapıda kalır. Bu ürünlerde D01 ikame
testini **kod yazmadan önce** çalıştırın; bir kısmının 7.900 TL yerine daha düşük bantta
konumlanması muhtemeldir ve bu bir başarısızlık değil, doğru fiyatlamadır.
