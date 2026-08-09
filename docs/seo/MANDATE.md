# SEO MASTER MANDATE — V6 "ENTERPRISE EDITION"
## Para kazandıran, kendi kendini denetleyen, Cursor tarafından koşulsuz yürütülebilir SEO işletim sistemi
### Strateji (V5 ekonomik yönetişimi) + Yürütme (V5.1 ajan sözleşmesi) + 10 bulunan kusurun kalıcı düzeltmesi

**Sürüm:** V6.0 (Final / Tam Sürüm) · **Taban:** V5.0 + V5.1-EXECUTABLE
**Hedef okuyucu:** Kod yazan otonom ajan (Cursor / Claude Code) + insan onay merci + iş sahibi
**Yürütme modeli:** Faz = branch = PR. Sözleşme ihlali = merge yok. Kanıtsız iddia = rapora giriş yok.

---

## 0.1 — BU BELGE NEDİR, NE DEĞİLDİR

**Nedir:** Hem bir **ajan yürütme sözleşmesi** (ajanın yorum yapmasını imkânsız kılan makine-kontrollü katman) hem bir **varlık yönetim sözleşmesidir** (SEO'yu gider değil, değerlenen ve değerlemesi yapılabilen bir varlık olarak yöneten ekonomik katman). 20 faz + Ajan İşletim Protokolü (AIP-01…27) + Yürütme Paketi (Bölüm X) + Kalibrasyon Protokolü (Bölüm K) + Uygulama Profilleri (Bölüm P) içerir.

**Değildir:** Sıralama garantisi, taktik listesi, içerik rehberi, satış sunumu.

**Temel tez:** Dünyada gerçekten para kazanan SEO operasyonlarının üç ortak özelliği vardır: **(1)** tekrarlanabilirlik ve doğrulanabilirlik (taktik değil sistem), **(2)** SEO'yu değerlenen bir varlık olarak yönetmek (her ay: ne yatırıldı, ne üretildi, varlık ne kadar değerlendi, hangi yatırım kaç ayda döndü), **(3)** kanıtlanmış olanı ölçeklemek (umutla değil, payback ile büyümek).

---

## 0.2 — V5 + V5.1 → V6 BİRLEŞTİRME HARİTASI

| Kaynak | Ne alındı | V6'daki yeri |
|---|---|---|
| V4/V5.1 | 13 fazlık teknik çekirdek (0–12) | Faz 0–12 (kusursuzlaştırılmış) |
| V5.1 | AIP-01…25 ajan sözleşmesi | AIP-01…27 (2 madde eklendi) |
| V5.1 | Yürütme Paketi: kickoff, `seo.config.json` + tam şema, artefakt zarfları, `PHASE_CONTRACTS.json`, `invariants.json`, preflight, conformance testleri, çakışma önceliği, Bitiş Tanımı | Bölüm X (düzeltilmiş) |
| V5.1 | Faz 13 off-page, Faz 14 niyet/CRO, Faz 15 dikey modüller, Faz 16 TAM/büyüme döngüsü | Faz 13–16 (genişletilmiş) |
| V5.1 | Kalibrasyon protokolü, S/M/L profilleri, framework tuzakları, birleşik yasaklar | Bölüm K, P, Ek D, Ek E |
| V5.0 | Ekonomik yönetişim: her fazda GELİR KATKISI + YETKİ SEVİYESİ, SEO P&L, portföy kararları (INVEST/HOLD/HARVEST/DIVEST), payback, kill kriterleri, gelir SLO'ları, varlık değerleme V1/V2, yönetim raporu, Agent Yetki Matrisi | Global sözleşme + Faz 9, 11, 12, 17, 19 + 0.11 |
| V5.0 | Programmatic fabrika (kill switch'li), marka SERP sahiplenme + Wikidata zemini | Faz 18 · Faz 13'e gömüldü |
| V5.0 | KPI sözlüğü, yönetim raporu şablonu, sprint şablonu, başlangıç listesi | Ek H–K |
| **V6 yeni** | 10 yürütme kusurunun kalıcı düzeltmesi + 2 yeni AIP + 5 yeni conformance testi + tam invariant yeniden numaralandırması | Bölüm X.11 errata |

**Faz mimarisi (V6 — tek ve çelişkisiz):**
`0 Keşif → 1 Registry → 2 Host/Redirect → 3 Sitemap/Robots → 4 Render → 5 İçerik/Entity → 6 Schema → 7 Link/CWV → 8 Crawl/AI → 9 Veri Ambarı + P&L → 10 Kriz/Migrasyon → 11 KAC + Portföy → 12 SRE İşletim → 13 Off-Page/Hendek → 14 Niyet/CRO → 15 Dikey Modüller → 16 TAM/Büyüme → 17 Portföy Ekonomisi → 18 Programmatic Fabrika → 19 Varlık Değerleme`

---

## 0.3 — AJAN İŞLETİM PROTOKOLÜ (AIP-01…27) — İHLALİ MERGE ENGELLER

> Bu bölüm ajana verilen **ilk ve bağlayıcı** talimattır. Her faz prompt'undan önce okunur. Çelişkide AIP-21 öncelik sırası uygulanır.

| Kod | Kural |
|---|---|
| **AIP-01** | **Bir faz = bir branch = bir PR.** Branch: `seo/faz-<NN>-<slug>`. Fazlar arası dosya karışması yasak. |
| **AIP-02** | **Varsayım yasaktır.** Değer `seo.config.json`'da yoksa ve türetilemiyorsa: DUR, 0.6 formatıyla sor, bekle. Placeholder/lorem yazmak ihlaldir. |
| **AIP-03** | **Dosya manifesti bağlayıcıdır.** Sadece X.2 ağacındaki yollara yaz. Manifest dışı dosya için önce onay. |
| **AIP-04** | **Idempotency.** Her script iki kez çalışınca aynı çıktıyı üretir (zaman damgası hariç). |
| **AIP-05** | **Exit code sözleşmesi.** `0`=PASS · `1`=BLOCK ihlali · `2`=WARN eşiği aşıldı · `3`=girdi verisi eksik · `4`=konfigürasyon hatası. `3` ile `1` asla karışmaz: veri yokluğu başarısızlık değildir. |
| **AIP-06** | **Determinizm.** Tüm çıktı dizileri sabit sırada (route alfabetik, tarih artan). Rastgelelik yasak; gerekiyorsa sabit seed. |
| **AIP-07** | **Kanıt kuralı.** Her PASS iddiası ham makine çıktısıyla belgelenir (komut + stdout). Ekran görüntüsü kanıt değildir. |
| **AIP-08** | **Negatif test zorunlu.** Her `BLOCK` invariant için bilerek ihlal eden fixture testi yazılır; script'in **gerçekten** exit 1 verdiği kanıtlanır. Negatif testi olmayan invariant, olmayan invariant'tır. |
| **AIP-09** | **Bağımlılık disiplini.** Yeni paket onay gerektirir. Önerilen set: `zod`, `tsx`, `fast-glob`, `cheerio`/`jsdom`, `puppeteer`, `web-vitals`, `vitest`. |
| **AIP-10** | **Kod standardı.** TS `strict: true`, `any` yasak, saf fonksiyon + ince I/O, tek logger, her script `--dry-run` destekler. |
| **AIP-11** | **Zaman.** Tüm tarihler UTC ISO-8601. Yerel saat yasak. |
| **AIP-12** | **Para.** Birim `seo.config.json.site.currency`'den gelir. Dahili gösterim **tam sayı minor unit** (kuruş/cent). Float ile para hesabı yasak. |
| **AIP-13** | **Sır yönetimi.** Hiçbir credential koda yazılmaz. `.env` + `.env.example` (gerçek değer yok). Secret bulursan raporla ve DUR. |
| **AIP-14** | **Yazma yetkisi.** Otomasyon/cron **sadece PR açar**. Prod'a doğrudan yazma, otomatik merge, otomatik içerik yayını, otomatik 301 yasak. |
| **AIP-15** | **Kapsam kilidi.** Faz prompt'unda istenmeyen hiçbir "iyileştirme" yapılmaz. İlgisiz sorun `docs/seo/BULGULAR_KUYRUGU.md`'ye yazılır, dokunulmaz. |
| **AIP-16** | **Geri alınabilirlik.** Her PR açıklamasında `ROLLBACK:` satırı. Geri alınamaz işlem (HSTS preload, toplu 410, domain değişimi, DIVEST icrası) için açık insan onayı şart. |
| **AIP-17** | **Güven etiketi.** Her iddia `[Kesin]/[Güçlü]/[Varsayım]/[Eksik_veri]` taşır. Etiketsiz iddia rapora giremez. |
| **AIP-18** | **Sessiz başarısızlık yasağı.** `try/catch`'te yutulan hata yasak. Boş sonuç dönen sorgu exit `3` ile çıkar, `0` ile değil. |
| **AIP-19** | **Kendi kendini onaylama yasağı.** Ajan "tamamlandı" demez; GATE-OUT tablosunu kanıtlarla doldurup onay ister. |
| **AIP-20** | **Dil.** Rapor/yorum/commit mesajları `site.language` dilinde. Tanımlayıcılar `namingConvention`'a uyar. |
| **AIP-21** | **Öncelik sırası (üstteki kazanır):** ① Yasal/etik + Ek E yasakları → ② kullanıcının o anki açık talimatı → ③ AIP → ④ `seo.config.json` → ⑤ Faz gövdesi → ⑥ Ek/örnekler. |
| **AIP-22** | **Dikey modül (Faz 15) çakışması:** Dikey invariantlar genel kuralı **daraltır, gevşetmez**. Gevşetme gerekiyorsa DUR ve sor. |
| **AIP-23** | **Sayı çakışması:** Belgedeki eşik ile config'deki eşik farklıysa **config kazanır**. Kodda sabit sayı yasak (`INV-X.5`). |
| **AIP-24** | **Belirsiz kural:** İki okuma mümkünse **daha kısıtlayıcı** uygulanır ve `docs/seo/YORUM_KAYDI.md`'ye yazılır. |
| **AIP-25** | **Sözleşme hatası:** Çelişki/eksik referans/imkânsız kural bulursan uydurma — `docs/seo/MANDATE_ERRATA.md`'ye yaz ve DUR. |
| **AIP-26** *(V6)* | **Garanti ve vaat yasağı (makine zorlamalı).** Hiçbir rapor/PR/commit/issue metni sıralama, trafik veya gelir **garantisi/vaadi** içeremez. Regex denetimi conformance testindedir: `garanti`, `kesin çıkar`, `#1 ol`, `guaranteed`, `şunu yaparsan … çıkarsın` örüntüleri → exit 1. |
| **AIP-27** *(V6)* | **Onay kaydı zorunluluğu.** Her insan-onay gerektiren karar (portföy, disavow, geri alınamaz işlem, cluster onayı, bütçe) `docs/seo/KARAR_DEFTERI.md`'ye `onaylayan + tarih + gerekçe` ile işlenir. Kayıtsız onay, onaysızlıktır. |

---
## 0.4 — `seo.config.json` — TEK GERÇEK KAYNAK

Tüm ajanlar ve script'ler önce bu dosyayı okur. Enum dışı değer = yapılandırma hatası (exit 4). Tam şema: Bölüm X.3.

```json
{
  "version": "6.0",
  "site": {
    "siteId": "sectorcalc",
    "rootUrl": "https://www.sectorcalc.com",
    "language": "tr|en",
    "currency": "TRY",
    "region": "TR|GLOBAL",
    "industry": "ecommerce|saas|media|local|other",
    "hasEcommerce": true,
    "hasBlog": true,
    "maxConcurrentKacActions": 3,
    "allowedEnvironments": ["staging", "production"]
  },
  "deployment": {
    "target": "vercel|netlify|cloudflare_pages|static_host",
    "supportsHeaders": true,
    "supportsEdgeRedirects": true,
    "redirectLimit": 2000
  },
  "measurement": {
    "defaultWindowDays": 90,
    "dataWindowStart": "2025-09-11",
    "calendarYearEnabled": false,
    "gscGenerativeAiReportAvailable": true,
    "gscGenerativeAiInFormula": false,
    "confidenceMode": "strict"
  },
  "thresholds": {
    "lcpP75Ms": 2500,
    "inpP75Ms": 200,
    "clsP75": 0.1,
    "decayDays": 60,
    "highTrafficThreshold": 1000,
    "similarityMax": 0.7,
    "intentScoreMin": 5,
    "consentTrackingRequired": true,
    "concentrationWarnPct": 60,
    "divestPendingMaxDays": 90,
    "programmaticIndexMinPct": 50,
    "programmaticEvalDays": 60,
    "brandSerpOwnershipWarnPct": 80
  },
  "economics": {
    "defaultValuePerConversionMinor": 0,
    "ltvModel": "none|cohort|blended",
    "paybackMaxMonths": 12,
    "budgetSplit": { "investPct": 60, "holdPct": 20, "harvestPct": 10, "divestPct": 10 },
    "valuationMultiples": { "low": 2.5, "high": 3.5 }
  },
  "policy": {
    "aiBots": {
      "aiTraining": "block|allow",
      "aiSearch": "allow|block",
      "custom": { "OAI-SearchBot": "allow|block", "ChatGPT-User": "allow|block", "GPTBot": "allow|block", "ClaudeBot": "allow|block", "PerplexityBot": "allow|block", "Google-Extended": "allow|block" }
    },
    "blockedSections": ["/sepet", "/odeme", "/hesap", "/ara", "/admin", "/api", "/wp-admin"],
    "perplexityQuery": null
  },
  "business": {
    "verticals": ["ecommerce", "local", "saas", "media", "i18n"],
    "revenueModel": "ecommerce|leadgen|ads|affiliate|paywall|mixed"
  }
}
```

**Kurallar:**
- `verticals` boşsa Faz 15 uygulanmaz (SKIP). Birden fazlaysa hepsi uygulanır ve AIP-22 devrededir.
- `budgetSplit` toplamı 100 olmalı; değişiklik A3 + KARAR_DEFTERI kaydı.
- `defaultValuePerConversionMinor: 0` bilinçli varsayılan: 0 kalırsa değer içeren tüm metrikler `confidence: "low"` + `partial: true`.
- `dataWindowStart` asla 2025-09-11'den önce olamaz — **şemada `minimum` kısıtıyla zorlanır** (V6 düzeltmesi E-04).

---
## 0.5 — GLOBAL FAZ SÖZLEŞMESİ — HER FAZ 7 PARÇA

```
GATE-IN        → başlamadan önce sağlanması gerekenler + doğrulama komutları
CURSOR'A VER   → tam, kopyala-yapıştır yürütme prompt'u
INVARIANT      → INV-<faz>.<n> [BLOCK|WARN|INFO] + makine kontrolü
KANIT          → bu fazın üretmesi gereken doğrulanabilir artefaktlar
ROLLBACK       → bu fazın değişiklikleri nasıl geri alınır
GELİR KATKISI  → bu fazın para zincirindeki yeri (Yeni/Dönüşüm/Defans/Ölçüm/Kapasite)
YETKİ SEVİYESİ → A0 Otonom | A1 PR Yetkili | A2 Onay Kapılı | A3 İnsan Kararı
GATE-OUT       → ajanın doldurması gereken kapanış tablosu
```

**Yetki matrisi:** A0 = rapor üretir, yazmaz · A1 = kod değişikliği PR'ı açar (otomasyon cron'ları A1'dir) · A2 = yalnızca `allowedEnvironments` onayıyla çalışır · A3 = insan onayı olmadan işlem yapılamaz (her zaman KARAR_DEFTERI kaydı).

**INV-G.1 [BLOCK]** Garanti yasağı (AIP-26 makine zorlar).
**INV-G.2 [BLOCK]** Para içeren her metrik aralık veya nokta + güven etiketiyle gelir; etiketsiz para iddiası rapora giremez.
**INV-G.3 [BLOCK]** Onay kayıtları (AIP-27) conformance testiyle doğrulanır.
**INV-G.4 [BLOCK]** Otomasyon yetki sınırını aşamaz; aşma girişimi `docs/seo/YETKI_IHLALI.md`'ye yazılıp DUR'ur.

---
## 0.6 — DUR-VE-SOR PROTOKOLÜ

Ajan durması gerektiğinde **tahminle ilerlemez**; tek mesajda şu formatta sorar:

```
DURDUM — Faz <NN>
Neden: <hangi AIP/INV/GATE-IN tetikledi>
Sorular:
  1. <tek, net soru>
  2. ...
Bloklanan işler: <liste>
Bloklanmayan işler (devam edebilirim): <liste>
```

**Durma tetikleyicileri (en az birinde DUR):**
1. `seo.config.json`'da karar gerektiren değer `"|"` placeholder'ı içeriyor veya eksik.
2. İki kural çelişiyor ve AIP-21/22/23/24 çözmüyor.
3. Geri alınamaz işlem öncesi onay kaydı yok.
4. Bir `A3` (insan kararı) adımına sıra geldi.
5. Script exit `3` (eksik veri) döndü ve alternatif veri kaynağı tanımsız.
6. Üretim ortamına yazma isteği oluştu.

---
## 0.7 — TESLİM RAPORU ŞABLONU — HER FAZIN SONUNDA AYNI FORMAT

```
# FAZ <NN> TESLİM RAPORU
## 1. GATE-IN Doğrulaması      → her madde: komut + çıktı özeti + ✅/❌
## 2. Yapılan Değişiklikler    → dosya listesi (AIP-03 manifest kontrolü)
## 3. INVARIANT Sonuçları      → tablo: kod | beklenen | ölçülen | PASS/FAIL/SKIP_NO_DATA | kanıt komutu
## 4. Kanıtlar                 → her PASS için ham çıktı bloğu
## 5. Negatif Test Sonuçları   → fixture + gerçek exit code
## 6. Açık Kalanlar / Riskler  → BULGULAR_KUYRUGU'na aktarılanlar
## 7. GATE-OUT Tablosu         → ✅/❌ + kanıt referansı
## 8. Rollback Notu            → `ROLLBACK:` satırı
## 9. Onay İsteği              → "Bu fazı onaylıyor musunuz?" (ajan AIP-19 gereği kendini onaylayamaz)
```

Her tablo satırında `status` yalnızca `PASS | FAIL | SKIP_NO_DATA` olabilir — `SKIPPED`/`NOT_RUN` gibi dördüncü durum **yasak** (V6: conformance testi `invariant-result-schema` ile zorlanır).

---
## 0.8 — 2026 ZEMİNİ — İŞE YARAMAYANLAR, ÖLDÜ SANILIP ÖLMEYENLER

**A) "10 mavi link dönemi" ölçüm altyapısı olarak kapandı.** Google 2025-09-11'de `&num=100` parametresini kaldırdı. **Sonuç:** rank tracker verisi 2025-09-11 öncesi/sonrası karşılaştırılamaz; GSC impressions 2025-09-11 öncesi bot-şişirmelidir. **Kural:** `dataWindowStart ≥ 2025-09-11`; eski veri yalnızca "tarihsel bağlam" etiketiyle, asla trend/regresyon/önceliklendirme girdisi olarak kullanılamaz.

**B) Schema artık Entity API'sidir.** Rich-result takıntısı bitti; schema'nın asıl işi AI grounding ve entity konsolidasyonu. FAQ rich results 2026-05-07'de kaldırıldı, GSC API görünümü Ağu 2026'da düşecek → **FAQ verisine dayanan raporlar sessiz NULL riski taşır**; schema'da FAQPage bırakılabilir ama ölçümde dayanak olamaz.

**C) AI Overviews CTR aşındırıyor; savunma marka talebidir.** Bilgi sorgularında organik CTR düşüyor. Karşı-strateji: (1) marka araması üretimi (hendek), (2) AI citation görünürlüğü (grounding için temiz entity), (3) tıklama-dışı değer ölçümü (assisted/AI referral).

**D) INP + Soft Navigations ölçümü zorunlu.** Chrome 151 ile soft navigasyonlar INP'ye girer; SPA'larda route-change ölçümü olmadan INP verisi yalandır.

**E) GSC Generative AI raporu (2026-06-03):** Yalnızca impressions, API yok. **Kural:** gelir formüllerine giremez (`gscGenerativeAiInFormula: false` şema-zorunlu); yalnızca bağlamsal INFO.

**F) Yapısal kırılmalar JOIN gerektirir.** Migrasyon, GA4 geçişi, CMP/consent değişimi, num=100 kırılması gibi olaylar `structuralBreaksApplied[]` olarak her artefakt zarfına yazılır; kırılma öncesi/sonrası karıştırılmaz.

**G) Incrementality opsiyonel değil.** "SEO yaptık, trafik arttı" korelasyondur. Kanıt: kontrol grubu, parallel-trends kontrolü, min 28 gün, güven aralığı. Aksi halde etki `[Varsayım]`.

---
## 0.9 — PARA ZİNCİRİ MİMARİSİ — HER İŞ 8 KATMANIN BİRİNDE

```
KATMAN 1 KAYNAK      : Faz 0, 16 (keşif, TAM)              → "nerede para var?"
KATMAN 2 GÖRÜNÜRLÜK  : Faz 1–8 (teknik + içerik + entity)  → "bulunabilir miyiz?"
KATMAN 3 ÖLÇÜM       : Faz 9, 12 (ambar, SRE)              → "neyi biliyoruz?"
KATMAN 4 KARAR       : Faz 11, 14 (KAC, CRO)               → "neye yatırım yapılır?"
KATMAN 5 ÖLÇEK       : Faz 18, 15 (fabrika, dikeyler)      → "kanıtlanmışı nasıl çoğaltırız?"
KATMAN 6 SAVUNMA     : Faz 13, 10 (hendek, kriz)           → "değeri kim korur?"
KATMAN 7 KORUMA      : Faz 17 (portföy ekonomisi)          → "ne durdurulur?"
KATMAN 8 YÖNETİM     : Faz 19, 12 (değerleme, rapor)       → "patron ne görür?"
```

Her fazın GELİR KATKISI bu katmanlardan biriyle etiketlenir: **Yeni gelir | Dönüşüm | Defans | Ölçüm | Kapasite**.

---
## 0.10 — AGENT YETKİ MATRİSİ (AYM)

| İşlem | Seviye | Koşul |
|---|---|---|
| Rapor/artefakt üretimi | A0 | Her zaman |
| Kod değişikliği (registry, schema, template, test) | A1 | PR + conformance PASS |
| Cron/otomasyon kurulumu | A2 | `allowedEnvironments` + onay |
| 301 yönlendirme, sitemap değişikliği, robots değişikliği | A2 | İnsan merge onayı |
| İçerik yayını, DIVEST icrası, disavow, HSTS, domain değişimi | A3 | KARAR_DEFTERI kaydı şart |
| Bütçe/portföy kararı (INVEST/DIVEST) | A3 | KARAR_DEFTERI + Faz 17 çıktısı |
| KVKK/GDPR kapsamlı veri varlığı yayını | A3 | Faz 5 Veri Varlığı Planı onayı |

---
## 0.11 — COLD-START PROTOKOLÜ *(V6 — kalıcı çözüm, kusur E-07)*

**Sorun:** `dataWindowStart ≥ 2025-09-11` kuralı, yeni açılan veya o tarihten önce GSC verisi işlenmemiş sitelerde tüm fazları exit 3'e kilitler. **Kalıcı çözüm:** Cold-start bir hata değil, tanımlı bir moddur.

```
MOD TESPİTİ: site ilk kez kuruluyorsa VEYA GSC'de dataWindowStart sonrası <28 gün veri varsa → coldStart: true
```

| Faz | Cold-start davranışı |
|---|---|
| 0–8 | Normal çalışır (teknik keşif veri gerektirmez; dış kaynaklar: PageSpeed API, Ads Keyword Planner, SERP gözlemi) |
| 9 | Ambar kurulur; GSC tabloları boş şemayla başlar, `partial: true` |
| 11 | KAC çalışır ama tüm skorlar `confidence: "low"`; öncelik Ads hacim + SERP gözlemiyle; TAS `partial: true` (C5 dış doğrulama beklenmeden C1–C4 ile) |
| 12 | SLO'lar kurulur; baz çizgisi ilk 28 gün sonunda kilitlenir |
| 13–19 | `tam_map.json` ve `portfolio_board.json` için Ads/Search verisi proxy kullanılır; her artefakt `coldStart: true` + `confidence: "low"` |

**Kural:** Cold-start'ta exit 3 üretilmez; bunun yerine `coldStart: true` zarf bayrağı + düşük güven etiketi. 28. gün sonunda mod otomatik kapanır (script: `seo:coldstart-check`).

---
## 0.12 — MULTI-SITE / PORTFÖY MODU *(V6 — kalıcı çözüm, kusur E-08)*

**Sorun:** İş sahibi birden çok site işletir (ör. 5+ alan). Tek-site varsayımı yürütmeyi kırar. **Kalıcı çözüm:**

1. Her site kendi dizininde kendi `seo.config.json`'ını taşır: `sites/<siteId>/seo.config.json`. Paylaşılan eşikler kök `seo.config.defaults.json`'dan miras alınır; site bazında override edilebilir.
2. Tüm artefakt zarflarına `siteId` alanı zorunludur (şemada `required`). Registry, sitemap, P&L tabloları `siteId` ile partisyonlanır.
3. Script'ler `--site <siteId>` parametresi alır; parametresiz çalıştırma exit 4.
4. **Portföy katmanı** Faz 17'nin üstünde `portfolio/portfolio_sites.json` üretir: siteler arası bütçe dağılımı, konsantrasyon (tek site > %60 gelir → WARN), cross-site cannibalization kontrolü (aynı query cluster iki sitede → tek owner site).
5. **Yasak:** Siteler arası link şeması (karşılıklı footer link ağı) Ek E'ye dahildir — cross-site link yalnızca doğal, editoryal ve tek yönlü olabilir.

---
# BÖLÜM X — YÜRÜTME PAKETİ (MANDATORY EXECUTION LAYER)

> Bu bölüm olmadan belge bir "strateji metni"dir; bu bölümle bir "derlenebilir program"dır. Faz 0'a başlamadan önce X.1–X.8 kurulur.

### X.1 — KICKOFF MESAJI (ajanla ilk konuşma — aynen kullanılır)

```
Sen bu repo'da SEO MASTER MANDATE V6 yürüten ajansın.
İLK İŞİN (sırayla):
1. docs/seo/MANDATE.md dosyasını baştan sona oku (bu belge).
2. AIP-01…27'yi bağlayıcı kabul et.
3. sites/<siteId>/seo.config.json dosyasını oku; "|" placeholder veya eksik
   karar değeri varsa DUR ve 0.6 formatında sor.
4. Bu mesaja SADECE şu formatta cevap ver:
   - Okudum: AIP-01…27, Bölüm X, Bölüm P, Ek E
   - Profil: <S|M/L> (Bölüm P'den)
   - Site: <siteId> — eksik config alanı: <varsa liste | yok>
   - Sıradaki faz: Faz 00
   - Anlamadığım/çelişkili bulduğum kurallar: <varsa liste → MANDATE_ERRATA.md>
Bu formatın dışına çıkma. Faz prompt'u verilmeden kod yazma.
```

### X.2 — REPO MANİFESTİ (AIP-03 — tek izinli dosya ağacı)

```
sites/<siteId>/seo.config.json
seo.config.defaults.json
docs/seo/MANDATE.md
docs/seo/KARAR_DEFTERI.md
docs/seo/BULGULAR_KUYRUGU.md
docs/seo/YORUM_KAYDI.md
docs/seo/MANDATE_ERRATA.md
docs/seo/YETKI_IHLALI.md
data/seo/registry/<siteId>_seo_registry.json
data/seo/invariants.json
data/seo/tam_map.json
data/seo/brand_demand.json
data/seo/linkable_assets.json
data/seo/cro_experiments.json
data/seo/pnl.json
data/seo/portfolio_board.json
data/seo/valuation.json
portfolio/portfolio_sites.json
scripts/seo/*.ts
tests/conformance/*.test.ts
.github/workflows/seo-conformance.yml
public/robots.txt, public/sitemap*.xml (framework'e göre app/…)
.env.example
```

### X.3 — `seo.config.schema.json` (zod değil, saf JSON Schema — preflight bununla doğrular)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "site", "deployment", "measurement", "thresholds", "economics", "policy", "business"],
  "properties": {
    "version": { "const": "6.0" },
    "site": {
      "type": "object",
      "required": ["siteId", "rootUrl", "language", "currency", "region", "industry", "allowedEnvironments"],
      "properties": {
        "siteId": { "type": "string", "pattern": "^[a-z0-9-]+$" },
        "rootUrl": { "type": "string", "pattern": "^https://[a-z0-9.-]+\\.[a-z]{2,}(/[a-z0-9-]+)?$", "not": { "pattern": "\\|$" } },
        "language": { "enum": ["tr", "en"] },
        "currency": { "type": "string", "minLength": 3, "maxLength": 3 },
        "region": { "type": "string" },
        "industry": { "enum": ["ecommerce", "saas", "media", "local", "other"] },
        "hasEcommerce": { "type": "boolean" },
        "hasBlog": { "type": "boolean" },
        "maxConcurrentKacActions": { "type": "integer", "minimum": 1, "maximum": 10 },
        "allowedEnvironments": { "type": "array", "items": { "enum": ["staging", "production"] }, "minItems": 1 }
      }
    },
    "deployment": {
      "type": "object",
      "required": ["target", "supportsHeaders", "supportsEdgeRedirects"],
      "properties": {
        "target": { "enum": ["vercel", "netlify", "cloudflare_pages", "static_host"] },
        "supportsHeaders": { "type": "boolean" },
        "supportsEdgeRedirects": { "type": "boolean" },
        "redirectLimit": { "type": "integer", "minimum": 1 }
      }
    },
    "measurement": {
      "type": "object",
      "required": ["defaultWindowDays", "dataWindowStart", "gscGenerativeAiInFormula"],
      "properties": {
        "defaultWindowDays": { "type": "integer", "minimum": 28 },
        "dataWindowStart": { "type": "string", "format": "date", "minimum": "2025-09-11" },
        "calendarYearEnabled": { "type": "boolean" },
        "gscGenerativeAiReportAvailable": { "type": "boolean" },
        "gscGenerativeAiInFormula": { "const": false },
        "confidenceMode": { "enum": ["strict", "lenient"] }
      }
    },
    "thresholds": {
      "type": "object",
      "required": ["lcpP75Ms", "inpP75Ms", "clsP75", "decayDays", "highTrafficThreshold", "similarityMax", "intentScoreMin"],
      "properties": {
        "lcpP75Ms": { "type": "integer", "minimum": 1000 },
        "inpP75Ms": { "type": "integer", "minimum": 50 },
        "clsP75": { "type": "number", "minimum": 0 },
        "decayDays": { "type": "integer", "minimum": 14 },
        "highTrafficThreshold": { "type": "integer", "minimum": 0 },
        "similarityMax": { "type": "number", "minimum": 0.5, "maximum": 1 },
        "intentScoreMin": { "type": "integer", "minimum": 1, "maximum": 7 },
        "consentTrackingRequired": { "type": "boolean" },
        "concentrationWarnPct": { "type": "integer", "minimum": 1, "maximum": 100 },
        "divestPendingMaxDays": { "type": "integer", "minimum": 7 },
        "programmaticIndexMinPct": { "type": "integer", "minimum": 1, "maximum": 100 },
        "programmaticEvalDays": { "type": "integer", "minimum": 14 },
        "brandSerpOwnershipWarnPct": { "type": "integer", "minimum": 1, "maximum": 100 }
      }
    },
    "economics": {
      "type": "object",
      "required": ["defaultValuePerConversionMinor", "ltvModel", "paybackMaxMonths", "budgetSplit", "valuationMultiples"],
      "properties": {
        "defaultValuePerConversionMinor": { "type": "integer", "minimum": 0 },
        "ltvModel": { "enum": ["none", "cohort", "blended"] },
        "paybackMaxMonths": { "type": "integer", "minimum": 1 },
        "budgetSplit": {
          "type": "object",
          "required": ["investPct", "holdPct", "harvestPct", "divestPct"],
          "properties": {
            "investPct": { "type": "integer", "minimum": 0, "maximum": 100 },
            "holdPct": { "type": "integer", "minimum": 0, "maximum": 100 },
            "harvestPct": { "type": "integer", "minimum": 0, "maximum": 100 },
            "divestPct": { "type": "integer", "minimum": 0, "maximum": 100 }
          }
        },
        "valuationMultiples": {
          "type": "object",
          "required": ["low", "high"],
          "properties": { "low": { "type": "number", "minimum": 0 }, "high": { "type": "number", "minimum": 0 } }
        }
      }
    },
    "policy": {
      "type": "object",
      "required": ["aiBots", "blockedSections"],
      "properties": {
        "aiBots": {
          "type": "object",
          "required": ["aiTraining", "aiSearch"],
          "properties": {
            "aiTraining": { "enum": ["block", "allow"] },
            "aiSearch": { "enum": ["allow", "block"] },
            "custom": { "type": "object", "additionalProperties": { "enum": ["allow", "block"] } }
          }
        },
        "blockedSections": { "type": "array", "items": { "type": "string", "pattern": "^/" } },
        "perplexityQuery": { "type": ["string", "null"] }
      }
    },
    "business": {
      "type": "object",
      "required": ["verticals", "revenueModel"],
      "properties": {
        "verticals": { "type": "array", "items": { "enum": ["ecommerce", "local", "saas", "media", "i18n"] }, "uniqueItems": true },
        "revenueModel": { "enum": ["ecommerce", "leadgen", "ads", "affiliate", "paywall", "mixed"] }
      }
    }
  },
  "patternProperties": {},
  "$comment": "Her string alanda '|' karakteri placeholder taramasıyla preflight'te reddedilir."
}
```

**Şema kuralları:** Enum dışı değer → exit 4. `budgetSplit` toplamı ≠ 100 → exit 4 (preflight P-07). `dataWindowStart < 2025-09-11` → exit 4 (V6 düzeltmesi: eskiden sadece açıklamaydı, artık `minimum` kısıtı). `gscGenerativeAiInFormula: true` → exit 4.

---
### X.4 — `PHASE_CONTRACTS.json` — HANGİ FAZ NEYE YAZAR, NEYE YAZAMAZ

```json
{
  "faz-00": { "writes": ["data/seo/tam_map.json", "docs/seo/KARAR_DEFTERI.md"], "forbidsWrites": ["data/seo/registry/**", "public/**"] },
  "faz-01": { "writes": ["data/seo/registry/**", "scripts/seo/registry-*.ts", "tests/conformance/registry-*.test.ts"], "forbidsWrites": ["public/**", "app/**"] },
  "faz-02": { "writes": ["public/robots.txt", "vercel.json|netlify.toml|_headers", "scripts/seo/redirect-*.ts"], "forbidsWrites": ["data/seo/registry/**"] },
  "faz-03": { "writes": ["app/sitemap*.ts", "public/sitemap*.xml", "scripts/seo/sitemap-*.ts"], "forbidsWrites": [] },
  "faz-11": { "writes": ["data/seo/kac/**", "scripts/seo/kac-*.ts"], "forbidsWrites": ["public/**", "app/**"] },
  "faz-13": { "writes": ["data/seo/linkable_assets.json", "data/seo/brand_demand.json", "scripts/seo/audit-*.ts"], "forbidsWrites": ["public/**"] },
  "faz-17": { "writes": ["data/seo/pnl.json", "data/seo/portfolio_board.json", "portfolio/portfolio_sites.json", "scripts/seo/*pnl*.ts"], "forbidsWrites": ["public/**", "app/**", "data/seo/registry/**"] },
  "faz-19": { "writes": ["data/seo/valuation.json", "docs/seo/DD_PAKETI/**"], "forbidsWrites": ["public/**", "app/**"] }
}
```

**Kural:** Listede olmayan fazlar bu dosyaya Faz 0'dan sonra eklenir; eklemeler PR ile. Bir faz `forbidsWrites`'ına yazmaya kalkarsa conformance testi `phase-writes-lock` exit 1 verir (V6 yeni test). `data/seo/registry/**` yazabilen tek faz **Faz 1'dir** — diğer fazlar registry'yi yalnızca okur ve değişiklikleri Faz 1 PR'ı ister.

### X.5 — `data/seo/invariants.json` — TEK KAYIT YERİ

Her invariant tek satır: `{ "id": "INV-11.3", "phase": 11, "severity": "BLOCK", "configRefs": ["thresholds.similarityMax"], "negativeTest": "tests/conformance/inv-11-3.test.ts", "statement": "..." }`

**INV-X.5 [BLOCK]** Hiçbir eşik kodda sabit yazılamaz; hepsi `configRefs` üzerinden config'den okunur. Conformance testi `no-hardcoded-thresholds` script'lerde sayısal literal taraması yapar (izinli: 0, 1, 100, tarih sabitleri).

### X.6 — `package.json` + CI

```json
{
  "scripts": {
    "seo:preflight": "tsx scripts/seo/preflight.ts --site $SITE_ID",
    "seo:validate-registry": "tsx scripts/seo/registry-validate.ts --site $SITE_ID",
    "seo:conformance": "vitest run tests/conformance",
    "seo:kac": "tsx scripts/seo/kac-prioritize.ts --site $SITE_ID --dry-run",
    "seo:pnl": "tsx scripts/seo/seo-pnl.ts --site $SITE_ID --dry-run",
    "seo:valuation": "tsx scripts/seo/valuation.ts --site $SITE_ID --dry-run",
    "seo:coldstart-check": "tsx scripts/seo/coldstart-check.ts --site $SITE_ID"
  }
}
```

**Eklemeli-CI kuralı (V6 düzeltmesi E-09):** `prebuild` ve CI yalnızca **o ana kadar kurulmuş** script'leri çağırır. Faz 1 kurulmadan `seo:validate-registry` çağırmak build'i kırar — bu bir yürütme kusuruydu, kalıcı çözümü: her script varlık kontrolüyle koşullu çağrılır (`test -f scripts/seo/registry-validate.ts && npm run seo:validate-registry || true` deseni yerine, preflight script'i faz ilerlemesini `docs/seo/PROGRESS.md`'den okuyup yalnızca tamamlanmış fazların kontrollerini çalıştırır).

### X.7 — `seo-preflight.ts` — 10 KONTROL (her PR'da ilk çalışan)

P-01 config şema doğrulaması (X.3) · P-02 `|` placeholder taraması · P-03 manifest dışı dosya taraması (git diff) · P-04 secret taraması (entropy + bilinen örüntüler) · P-05 `invariants.json` ↔ Ek F tutarlılığı · P-06 artefakt zarf şeması · P-07 `budgetSplit` toplamı = 100 · P-08 `dataWindowStart ≥ 2025-09-11` · P-09 multi-site: `--site` parametresi + `siteId` eşleşmesi · P-10 garanti-regex ön taraması (AIP-26, hızlı geçiş).

### X.8 — CONFORMANCE TESTLERİ — 15 TEST (10 → 15, V6 genişletmesi)

| # | Test | Ne kanıtlar |
|---|---|---|
| C-01 | `artifact-envelope` | Her artefakt `meta{artifact,schemaVersion,generatedAt,generatorScript,inputWindow,confidence,partial,siteId,coldStart,structuralBreaksApplied}` zarfını taşır |
| C-02 | `invariant-result-schema` | Sonuçlar yalnızca `PASS\|FAIL\|SKIP_NO_DATA`; BLOCK invariantlarda `negativeTestPassed: true` |
| C-03 | `no-hardcoded-thresholds` | INV-X.5 |
| C-04 | `phase-writes-lock` *(V6)* | PHASE_CONTRACTS ihlali = exit 1 |
| C-05 | `money-integer` *(V6)* | Para alanlarında float yok; tümü `*Minor` integer |
| C-06 | `guarantee-regex` *(V6)* | AIP-26 — rapor/PR/commit metinlerinde vaat örüntüsü = exit 1 |
| C-07 | `approval-records` *(V6)* | A3 işlemlerinin KARAR_DEFTERI kaydı var |
| C-08 | `registry-single-writer` | Registry'ye Faz 1 dışı yazma = exit 1 |
| C-09 | `negative-tests-exist` | Her BLOCK invariantın negatif fixture testi dosyada var ve geçiyor |
| C-10 | `determinism` | Script iki kez → aynı çıktı (generatedAt hariç) |
| C-11 | `exit-codes` | Eksik veri fixture'ı → 3; ihlal fixture'ı → 1; config hatası → 4 |
| C-12 | `envelope-completeness` *(V6)* | `tam_map.json`, `slo_history.json`, `calibration_report.json` dahil **tüm** artefaktlar zarf taşır (V5.1 kusuru E-01: 3 artefakt zarf sözleşmesinin dışında kalmıştı) |
| C-13 | `structural-breaks-join` | Kırılma tarihi `structuralBreaksApplied`'e yazılmadan öncesi/sonrası karıştırılamaz |
| C-14 | `coldstart-flag` *(V6)* | 28 günden az veriyle `coldStart: true` ve `confidence: "low"` zorunlu |
| C-15 | `portfolio-siteid` *(V6)* | Multi-site artefaktlarında `siteId` zorunlu; cross-site cluster çakışması tespiti |

### X.9 — ÇAKIŞMA ÇÖZÜMÜ

AIP-21…25'e bak (0.3). Ek kural: Bölüm X (yürütme paketi) ile faz gövdesi çelişirse **Bölüm X kazanır** — çünkü X makine-zorlamalıdır, gövde insan-okumalıdır.

### X.10 — BİTİŞ TANIMI (DoD) — 10 MADDE

1. GATE-IN kanıtlı ✅ · 2. Manifest içi değişiklik ✅ · 3. Tüm invariantlar PASS veya kanıtlı SKIP_NO_DATA ✅ · 4. Negatif testler geçiyor ✅ · 5. Artefaktlar zarf şemasına uygun ✅ · 6. Teslim raporu 0.7 formatında ✅ · 7. `ROLLBACK:` satırı ✅ · 8. A3 adımları KARAR_DEFTERI'nde ✅ · 9. BULGULAR_KUYRUGU güncel ✅ · 10. Onay istenmiş, ajan kendini onaylamamış ✅

### X.11 — ERRATA — BULUNAN KUSURLAR VE KALICI ÇÖZÜMLER (V4/V5/V5.1 → V6)

> Bu tablo, önceki sürümlerin **yürütmeyi kıran** kusurlarının kaydıdır. Ajan bu tabloyu okuyup "eski alışkanlıkla" hareket etmez.

| # | Kusur | Nereden | Kalıcı çözüm (V6) |
|---|---|---|---|
| E-01 | `tam_map.json`, `slo_history.json`, `calibration_report.json` artefakt zarf sözleşmesinde tanımsız → zarf/orphan açığı | V5.1 §0.4 | Zarf şeması C-12 testiyle tüm artefaktlara zorlandı |
| E-02 | Faz 12 SLO tablosu eşikleri gövdede sabit (LCP 2.5s vb.) — AIP-23/INV-X.5 ile çelişiyor | V5.1 Faz 12 | SLO eşikleri yalnızca `config.thresholds`'tan okunur; gövdede sayı yok |
| E-03 | `ownerRoute: \`/${string}\`` null kabul etmiyor; metodoloji "içerik boşluğu = null owner" diyor → Faz 11 tip-güvenli kurulamaz | V5.1 Faz 11 | Tip: `ownerRoute: \`/${string}\` | null`; conformance'da null-owner fixture'ı |
| E-04 | `dataWindowStart` "2025-09-11'den önce olamaz" sadece açıklamaydı | V5.1 X.3 | Şemada `"minimum": "2025-09-11"` + preflight P-08 |
| E-05 | Faz 1'de `SeoPageRecord` arayüzü kapanıp ardından arayüz DIŞI "// EKLENECEK alanlar" bloğu → derlenmez | V5.1 Faz 1 | Tek bütün tip tanımı (Faz 1); conformance'da `tsc --noEmit` |
| E-06 | Kickoff "AIP-01…25" diyor ama AIP-21…25 X.9'da tanımlı — sıralama belirsiz | V5.1 X.1 | Kickoff doğrudan 0.3 tablosuna refere eder; AIP tek yerde (0.3) |
| E-07 | Cold-start tanımsız: yeni sitede `dataWindowStart` kuralı her şeyi exit 3'e kilitler | Her iki belge | 0.11 Cold-Start Protokolü + `coldStart` zarf bayrağı + C-14 |
| E-08 | Multi-site boyutu yok: tek-site varsayımı portföy işleten sahibi kırar | Her iki belge | 0.12 Multi-Site Modu + `siteId` zorunluluğu + C-15 |
| E-09 | `prebuild`/CI henüz kurulmamış script'leri çağırır → ilk haftalarda build kırılır | V5.1 X.6 | PROGRESS.md-tabanlı eklemeli-CI (X.6) |
| E-10 | Faz 11/13/14'te KANIT ve ROLLBACK bölümleri eksik (global sözleşme ihlali) | V5.1 | V6'da tüm fazlar 7 parçalı; conformance'da faz-bölüm-lint |
| E-11 | INV numara çakışmaları: iki belgede INV-12.1 ve INV-13.x farklı kurallar | V5 ∩ V5.1 | Tam yeniden numaralandırma (Ek F); `invariants.json` tek kaynak |
| E-12 | V5 Faz 0 "Fırsat Haritası" ≡ V5.1 Faz 16 "TAM" — mükerrer kapsam | V5 ∩ V5.1 | Keşif Faz 0'da, genişleme/TAM Faz 16'da tekilleşti |
| E-13 | V5 Faz 14 i18n ≡ V5.1 Faz 15 i18n modülü — mükerrer | V5 ∩ V5.1 | i18n yalnızca Faz 15'te; Faz 18 (fabrika) ona refere eder |
| E-14 | V5 Faz 15 (hendek/PR) ≡ V5.1 Faz 13 (off-page) — mükerrer | V5 ∩ V5.1 | Tek Faz 13: Off-Page + Hendek birleşik |
| E-15 | Para formülleri float'a açık (payback, P&L) | V5 | AIP-12 minor-unit + C-05 money-integer |
| E-16 | Garanti/onay disiplini metin düzeyindeydi, makine zorlaması yoktu | V5 | AIP-26/27 + C-06/C-07 |
| E-17 | Conformance 10 test eksikti (yukarıdaki kusurların hiçbiri testle yakalanamıyordu) | V5.1 X.8 | 15 teste genişletildi |

---
# FAZLAR (0–19)

> Faz prompt'larında **sayısal eşik yazılmaz** (INV-X.5); `config.thresholds.*` referansı kullanılır. Her faz sonunda 0.7 teslim raporu.

---
## FAZ 0 — KEŞİF VE EKONOMİK BAZ

**GATE-IN:** `seo.config.json` preflight PASS · KARAR_DEFTERI açık · `site.rootUrl` erişilebilir (HTTP 200).
**GELİR KATKISI:** Ölçüm (baz çizgisi olmadan hiçbir etki iddiası yapılamaz). **YETKİ:** A0 (salt okunur tarama).

**CURSOR'A VER:**
```
Faz 0. AIP-01…27 bağlayıcı. Salt okunur çalış; hiçbir site dosyasına dokunma.
1. Mevcut durumu tara: crawlable URL sayısı, index bloat sinyalleri (parametre,
   etiket, arama sonucu sayfaları), robots.txt durumu, sitemap varlığı, HTTP/HTTPS
   ve www/non-www davranışı, header seti (HSTS, canonical, hreflang).
2. GSC + GA4 erişimini doğrula; erişim yoksa DUR-ve-SOR (exit 3 yolu).
3. Cold-start tespiti yap (0.11): dataWindowStart sonrası <28 gün veri → coldStart: true.
4. 2026 zemini taraması: num=100 öncesi veri kullanılıyor mu? FAQ rich-result'a
   dayanan ölçüm var mı? (A/G maddeleri)
5. Ölü ağırlık envanteri: trafik/dönüşüm/link üretmeyen URL adayları (etiketleme,
   silme/301 YOK — yalnızca envanter).
6. SERP özellik envanteri: hedef dikeyde AI Overview, PAA, video, görsel paketi
   yoğunluğu (gözlem, config'deki dikey listesiyle).
7. Çıktı: data/seo/tam_map.json (TASLAK baz haritası — genişleme Faz 16'da) +
   docs/seo/raporlar/faz00_baz.md (0.7 formatı).
```

**INVARIANT:**
- **INV-0.1 [BLOCK]** Rapor hiçbir 2025-09-11 öncesi veriyi trend girdisi olarak kullanamaz; kullanılmışsa `historicalContextOnly: true` etiketi zorunlu.
- **INV-0.2 [BLOCK]** Faz 0 hiçbir yazma işlemi yapmaz (manifest: yalnızca `tam_map.json` + rapor).
- **INV-0.3 [WARN]** `blockedSections` dışında kalan parametreli URL'ler crawl bütçesinin >%20'sini tüketiyorsa raporla.
- **INV-0.4 [INFO]** Cold-start tespiti yapılmamış rapor kabul edilmez (`coldStart` alanı zorunlu).

**KANIT:** crawl özeti (URL sayıları), robots/header ham çıktıları, GSC/GA4 erişim kanıtı, `tam_map.json` zarfı.
**ROLLBACK:** Yazma yok → geri alınacak bir şey yok; artefaktlar silinebilir.
**GATE-OUT:** ☐ Baz çizgisi tablo halinde ☐ Cold-start bayrağı ☐ 2026 zemini ihlalleri listelendi ☐ BULGULAR_KUYRUGU açıldı

---
## FAZ 1 — SEO REGISTRY v2 (TEK GERÇEK TABLO)

**GATE-IN:** Faz 0 onayı · `PHASE_CONTRACTS.json` faz-01 girdisi mevcut.
**GELİR KATKISI:** Kapasite (tüm karar sistemlerinin veri tabanı). **YETKİ:** A1 (PR).

**CURSOR'A VER:**
```
Faz 1. Tek dosya ailesi: data/seo/registry/<siteId>_seo_registry.json +
scripts/seo/registry-*.ts + testleri. Arayüzü TEK SEFERDE, BÜTÜN olarak yaz
(parçalı "eklenecek alanlar" bloğu YASAK — errata E-05).
```

```typescript
interface SeoPageRecord {
  pageId: string;
  siteId: string;
  route: `/${string}`;
  type: "home" | "category" | "product" | "article" | "tool" | "landing" | "legal" | "other";
  status: "live" | "draft" | "redirected" | "retired";
  primaryQueryClusterId: string | null;
  queryClusterIds: string[];
  primaryEntity: string | null;
  searchIntent: "informational" | "commercial" | "transactional" | "navigational" | null;
  templateId: string | null;
  serpFeatureTargets: string[];
  canonical: string | null;
  hreflangGroup: string | null;
  internalLinksIn: number; internalLinksOut: number;
  impressions28d: number | null; clicks28d: number | null;
  conversions28d: number | null;
  conversionValueMinor: number | null;
  firstTouchValueMinor: number | null;
  ltv12ValueMinor: number | null;
  assistedValueMinor: number | null;
  aiReferralValueMinor: number | null;
  productionCostMinor: number | null;
  costConfidence: "high" | "medium" | "low" | null;
  portfolioDecision: "INVEST" | "HOLD" | "HARVEST" | "DIVEST" | null;
  growthLoop: "content_compounding" | "tool_virality" | "ugc_loop" | "programmatic_longtail" | null;
  ownerRoute: `/${string}` | null;
  lastCrawledAt: string | null;
  lastSignificantChangeAt: string | null;
  decayFlag: boolean;
  redirectTarget: string | null;
  retiredAt: string | null;
  notes: string | null;
}
```

```
2. registry-validate.ts: şema + referans bütünlüğü (cluster id'ler var mı,
   canonical hedefi registry'de mi, ownerRoute varsa status: live mi).
3. registry-import.ts: mevcut URL envanterini içeri al (crawl çıktısından);
   idempotent (AIP-04).
4. Negatif testler: kırık referans fixture'ı → exit 1; float para fixture'ı → exit 1.
```

**INVARIANT:**
- **INV-1.1 [BLOCK]** Her canlı URL tam olarak bir kayıt; `pageId` benzersiz.
- **INV-1.2 [BLOCK]** `conversionValueMinor` ve tüm `*Minor` alanları integer; float = exit 1 (C-05).
- **INV-1.3 [BLOCK]** `primaryQueryClusterId` atanmışsa `ownerRoute` doldurulmuş olmalı (null ikisi birden olabilir — boşluk işareti).
- **INV-1.4 [WARN]** `productionCostMinor: null` olan kayıt oranı >%30 → portföy kararları `partial: true`.
- **INV-1.5 [BLOCK]** `status: "retired"` kayıt sitemap'te yer alamaz (Faz 3 ile çapraz kontrol).
- **INV-1.6 [WARN]** `templateId` dolu kayıtların toplam içindeki payı >%50 → programmatik yoğunluk uyarısı (Faz 18 tetikleyicisi).
- **INV-1.7 [BLOCK]** Registry'ye yalnızca Faz 1 script'leri yazar (C-08).
- **INV-1.8 [INFO]** `growthLoop` yalnızca Faz 16 atamasıyla dolar; elle atama `YORUM_KAYDI` gerektirir.

**KANIT:** `registry-validate` PASS çıktısı, negatif test logları, kayıt sayıları tablosu.
**ROLLBACK:** Registry JSON'u git'te sürümlenir; `git revert` yeterli.
**GATE-OUT:** ☐ Doğrulama PASS ☐ Negatif testler ☐ Boşluk oranı raporlandı ☐ Manifest uyumu

---
## FAZ 2 — HOST, CANONICAL, REDIRECT LEDGER

**GATE-IN:** Faz 1 PASS · `deployment` config dolu.
**GELİR KATKISI:** Defans (link eşitliği sızıntısının kapatılması). **YETKİ:** A2 (robots/redirect değişikliği insan merge onaylı).

**CURSOR'A VER:**
```
Faz 2. Kurallar:
1. Tek canonical host: rootUrl. www↔non-www ve http→https tek 301'de hedefe
   (zincir yok). Edge redirect destekleniyorsa edge'de, değilse framework katmanında.
2. Redirect ledger: data/seo/redirects.json — {from,to,type,createdAt,reason}.
   Ledger olmadan tek bir 301 bile yazılmaz. Ledger'da zincir (A→B→C) tespit
   scripti: zincir → tek adıma düzelt PR'ı.
3. Trailing slash politikası: tek seçenek, config'den; iki varyant da 200 DÖNEMEZ.
4. HSTS: max-age kademeli; preload YASAK (ayrı açık onay olmadan — A3).
5. Vary: User-Agent header'ı YASAK (cache parçalanması + cloaking sinyali).
6. Soft-404 taraması: 200 dönüp "bulunamadı" içeren sayfalar → 404/410 PR'ı.
```

**INVARIANT:**
- **INV-2.1 [BLOCK]** Tüm http:// ve alternatif-host istekleri tek 301 ile canonical'a.
- **INV-2.2 [BLOCK]** Redirect zinciri yok (ledger doğrulaması: her `to` hedefi terminal).
- **INV-2.3 [BLOCK]** HSTS preload header'ı onaysız = exit 1.
- **INV-2.4 [WARN]** Ledger'da 180 günden eski aktif 301'ler: kaynak hâlâ link alıyor mu raporu.
- **INV-2.5 [BLOCK]** Aynı içerik iki URL varyantında 200 dönemez (slash/case).
- **INV-2.6 [INFO]** `deployment.redirectLimit`'in %80'ine ulaşıldıysa konsolidasyon öner.

**KANIT:** `curl -I` ham çıktıları (4 varyant), redirect-ledger validate çıktısı.
**ROLLBACK:** Edge/framework redirect kuralı kaldırılır; ledger satırı `removedAt` ile işaretlenir.
**GATE-OUT:** ☐ 4 varyant tek 301 ☐ Zincir sıfır ☐ Ledger güncel ☐ Negatif test (yapay zincir → exit 1)

---
## FAZ 3 — INDEX STATE MACHINE, SİTEMAP, ROBOTS, PARAMETRELER

**GATE-IN:** Faz 2 PASS.
**GELİR KATKISI:** Defans + Kapasite (index bloat kontrolü). **YETKİ:** A2.

**CURSOR'A VER:**
```
Faz 3. Kurallar:
1. Her URL için tek indeks durumu: INDEX (200 + index) | NOINDEX (200 + noindex)
   | GONE (404/410) | REDIRECT (301). Bir URL iki durumda olamaz; robots.txt ile
   engellenen sayfaya noindex KONAMAZ (engellenen sayfa taranamaz, noindex okunamaz).
2. Kohort sitemap mimarisi: sitemap_index.xml → tip bazlı alt sitemaplar
   (pages, articles, products, tools). Her alt sitemap ≤ config limiti. Sitemap
   bir ÖLÇÜM ARACIDIR: kohort bazlı indexlenme oranı Faz 12 SLO'suna beslenir.
3. robots.txt: blockedSections config'den üretilir; elle farklı robots YASAK
   (tek kaynak). AI bot kuralları policy.aiBots'tan (Faz 8'le ortak blok).
4. Parametre stratejisi: her parametre için karar kaydı {param, davranış:
   allow|noindex|block, gerekçe}. Faceted navigasyon: yalnızca search demand'i
   kanıtlı kombinasyonlar INDEX; geri kalan noindex,follow.
5. Canonical: self-referencing varsayılan; cross-domain canonical yalnızca
   syndication senaryosunda + kayıtlı.
```

**INVARIANT:**
- **INV-3.1 [BLOCK]** Sitemap'teki her URL: 200 + INDEX + registry'de `status: "live"` (Faz 1 çapraz kontrolü INV-1.5).
- **INV-3.2 [BLOCK]** robots'ta engellenen yol sitemap'te olamaz.
- **INV-3.3 [BLOCK]** noindex sayfa sitemap'te olamaz.
- **INV-3.4a [BLOCK]** Sitemap lastmod yalnızca anlamlı içerik değişiminde güncellenir (sahte lastmod = exit 1; `lastSignificantChangeAt` ile eşleşmeli).
- **INV-3.4b [WARN]** Kohort indexlenme oranı (sitemap'e giriş → GSC'de indexed) <%70 ise kök neden analizi zorunlu.
- **INV-3.5 [WARN]** Parametreli URL'lerin index'te bulunması → karar kaydı eksik demektir.
- **INV-3.6 [INFO]** Alt sitemap boyutları ve kohort oranları `slo_history.json`'a yazılır.

**KANIT:** sitemap validate çıktısı (her URL için HTTP + robots + registry eşleşmesi), robots diff'i, kohort tablosu.
**ROLLBACK:** robots/sitemap önceki sürüme `git revert`; noindex etiketleri şablon PR'ıyla geri alınır.
**GATE-OUT:** ☐ Çapraz kontroller PASS ☐ Kohort sitemap canlı ☐ Parametre karar kayıtları ☐ Negatif test (sitemap'e noindex URL → exit 1)

---
## FAZ 4 — RENDER PARİTESİ (JS/SSR)

**GATE-IN:** Faz 3 PASS.
**GELİR KATKISI:** Defans (görünürlüğün teknik tabanı). **YETKİ:** A1.

**CURSOR'A VER:**
```
Faz 4. Puppeteer ile ham HTML ↔ render edilmiş DOM parite taraması:
1. Kritik içerik (H1, ana gövde, fiyat/CTA, canonical, schema JSON-LD) ham
   HTML'de mevcut olmalı. Render sonrası farklılaşan canonical/hreflang = KRİTİK.
2. Hydration kaynaklı içerik kaybı taraması: render sonrası kaybolan node yok.
3. Soft navigation ölçümü (SPA): route değişiminde title/canonical/INP ölçümü
   (Chrome 151 zemini — 0.8/D).
4. Lazy-load: kritik metin/görsel asla lazy değil; lazy yalnızca below-fold.
5. Çıktı: parity raporu (sayfa tipi başına PASS/FAIL + ham diff özeti).
```

**INVARIANT:**
- **INV-4.1 [BLOCK]** Kritik içerik ham HTML'de (parite farkı = exit 1).
- **INV-4.2 [BLOCK]** Render sonrası canonical/hreflang değişimi = exit 1.
- **INV-4.3 [WARN]** Hydration süresi > config.thresholds.inpP75Ms × 10 (sayfa tipi bazında).
- **INV-4.4 [INFO]** Soft navigasyon INP telemetrisi kuruldu mu.

**KANIT:** Parite raporu, ham/rendered HTML örnek çiftleri, puppeteer script çıktısı.
**ROLLBACK:** SSR/parite düzeltmeleri şablon PR'ıyla geri alınabilir; rapor salt okunur.
**GATE-OUT:** ☐ Tüm sayfa tipleri parite PASS ☐ Soft-nav telemetrisi ☐ Negatif test (JS-sonrası canonical fixture'ı → exit 1)

---
## FAZ 5 — İÇERİK KALİTESİ, ENTITY, DECAY, VERİ VARLIĞI

**GATE-IN:** Faz 4 PASS · Registry dolu.
**GELİR KATKISI:** Yeni gelir + Defans. **YETKİ:** A1 (şablon/taslak PR'ı); içerik yayını A3.

**CURSOR'A VER:**
```
Faz 5. Kurallar:
1. Her sayfa tek primary entity + tek searchIntent (registry'den). Entity
   konsolidasyonu: aynı entity'yi hedefleyen çoklu sayfalar → birleştirme
   ÖNERİSİ (otomatik birleştirme YASAK — A3).
2. Decay izleme: sonSignificantChangeAt + impressions28d trendi; decayDays
   eşiğini aşan + trafik düşen sayfalar decayFlag: true → Faz 11 girdisi.
3. Uzman otorite takvimi: her ticari cluster için yazar/uzman ataması, biyografi
   sayfası, kaynakça standardı. AI-üretim içerik: insan editoryal onayı olmadan
   yayın YASAK (Ek E).
4. Benzersizlik: yeni/güncellenen içerik similarityMax altında olmalı (mevcut
   corpus'a karşı embedding veya shingle benzerliği).
5. Veri Varlığı Planı: yayınlanacak her veri ürünü (istatistik sayfası, veri
   seti, araç) için {kaynak, güncelleme sıklığı, KVKK/GDPR değerlendirmesi}.
   KVKK/GDPR kapsamlı yayın = A3 onayı olmadan çıkmaz.
6. İçerik PR şablonu: başlık/H1 tek entity, ilk 100 kelimede tanım + kapsam,
   kaynakça, SSS yalnızca gerçek kullanıcı sorularından (uydurma SSS YASAK).
```

**INVARIANT:**
- **INV-5.1 [BLOCK]** İnsan onaysız AI-üretim içerik yayını = exit 1 (KARAR_DEFTERI kontrolü, C-07).
- **INV-5.2 [BLOCK]** Benzerlik > similarityMax olan yeni sayfa merge edilemez.
- **INV-5.3 [WARN]** decayFlag sayısı toplam canlı sayfanın >%25'i → içerik borcu raporu.
- **INV-5.4 [WARN]** Uzman atamasız ticari cluster → E-E-A-T açığı etiketi.
- **INV-5.5 [BLOCK]** KVKK/GDPR değerlendirmesiz veri varlığı yayını = exit 1.
- **INV-5.6 [INFO]** Her içerik PR'ında `lastSignificantChangeAt` güncellenir (INV-3.4a besleyicisi).

**KANIT:** Benzerlik raporu, decay tablosu, Veri Varlığı Planı dosyası, onay kayıtları.
**ROLLBACK:** İçerik PR'ı `git revert`; decayFlag hesaplanmış alan, yeniden hesaplanır.
**GATE-OUT:** ☐ Benzerlik PASS ☐ Decay envanteri ☐ Veri varlığı planı onaylı ☐ Negatif test (benzer kopya fixture → exit 1)

---
## FAZ 6 — SCHEMA = ENTITY API (GROUNDING)

**GATE-IN:** Faz 5 PASS.
**GELİR KATKISI:** Yeni gelir (AI citation + entity konsolidasyonu). **YETKİ:** A1.

**CURSOR'A VER:**
```
Faz 6. Schema'nın işi dekorasyon değil, makine-okunur entity beyanı:
1. Sayfa tipi → schema tipi haritası (config'de): Organization (site geneli, tek
   yerden), WebSite+SearchAction (yalnızca gerçek site araması varsa), Article/
   Product/SoftwareApplication/FAQPage (varsa; FAQ ölçümde dayanak DEĞİL — 0.8/B),
   BreadcrumbList (render edilmiş breadcrumb'la birebir).
2. @id mimarisi: her entity stabil @id (rootUrl#org vb.); sayfalar @id ile
   referanslar, tekrar tanımlamaz. Entity konsolidasyonu = tek gerçek.
3. sameAs: yalnızca doğrulanmış profiller (resmî sosyal, Wikidata varsa).
4. Doğrulama: validator + render sonrası JSON-LD parse testi (INV-4.2 çapraz).
5. YASAK: görünür içerikte olmayan iddia schema'da (review/aggregateRating
   uydurma = Ek E ihlali), sitewide gereksiz tekrar.
```

**INVARIANT:**
- **INV-6.1 [BLOCK]** Schema'daki her iddia sayfada görünür içerikle doğrulanabilir.
- **INV-6.2 [BLOCK]** Organization tek kaynak (çift Organization tanımı = exit 1).
- **INV-6.3 [WARN]** BreadcrumbList ↔ görünür breadcrumb uyumsuzluğu.
- **INV-6.4 [INFO]** FAQPage kullanımı varsa ölçüm bağımlılığı sıfır olmalı (raporlar FAQ rich-result verisine dayanamaz).

**KANIT:** Validator çıktıları, @id grafik dökümü, render-sonrası parse testi.
**ROLLBACK:** JSON-LD blokları şablon PR'ıyla geri alınır.
**GATE-OUT:** ☐ Validator PASS ☐ Tek Organization ☐ Negatif test (görünmez rating fixture → exit 1)

---
## FAZ 7 — İÇ LİNK EKONOMİSİ + CWV

**GATE-IN:** Faz 6 PASS.
**GELİR KATKISI:** Dönüşüm + Defans. **YETKİ:** A1.

**CURSOR'A VER:**
```
Faz 7. Kurallar:
1. Link eşitliği simülasyonu: PageLink-benzeri iterasyon (damping 0.85) ile iç
   link dağılımı; yetim sayfa (internalLinksIn < 2) envanteri. Amaç: INVEST
   sayfalara (Faz 17) link eşitliği akıtmak — simülasyon çıktısı PR açıklamasında.
2. Anchor disiplini: aynı hedefe tekil anchor spam'i yok; açıklayıcı anchor.
3. CWV saha verisi (75p): LCP/INP/CLS config.thresholds'tan. Lab verisi yalnızca
   saha verisi yoksa ve [Güçlü] etiketiyle. INP: soft navigasyonlar dahil (0.8/D).
4. Reklam geliri modeli (revenueModel: ads/mixed) varsa: reklam yoğunluğu ↔ CWV
   çakışması INV-16.4'e devredilir; bu fazda yalnızca ölçüm.
5. Düzeltmeler: görsel boyutlandırma, font-display, üçüncü-parti script bütçesi —
   her biri ayrı PR (AIP-15 kapsam kilidi).
```

**INVARIANT:**
- **INV-7.1 [WARN]** Yetim sayfa oranı >%10 → iç link PR'ı önerisi.
- **INV-7.2 [BLOCK]** CWV eşik aşımı + düzeltme PR'ı açılmamış → sonraki faz GATE-IN reddeder (SLO bağlantısı Faz 12).
- **INV-7.3 [WARN]** Tek anchor metni bir hedefe >%30 oranında.
- **INV-7.4 [INFO]** Simülasyon öncesi/sonrası link eşitliği delta tablosu kanıt dosyasında.

**KANIT:** Simülasyon çıktısı, CrUX/PSI ham JSON, yetim listesi, CWV trend grafiği verisi.
**ROLLBACK:** İç link PR'ları geri alınabilir; simülasyon salt okunur.
**GATE-OUT:** ☐ Saha verisi 75p raporlu ☐ Yetim envanteri ☐ Negatif test (yapay yetim fixture → WARN tetik)

---
## FAZ 8 — CRAWL EKONOMİSİ + AI BOT POLİTİKASI

**GATE-IN:** Faz 7 PASS.
**GELİR KATKISI:** Kapasite + Defans. **YETKİ:** A2.

**CURSOR'A VER:**
```
Faz 8. Kurallar:
1. Log analizi (varsa): Googlebot hit dağılımı — crawl waste raporu (blockedSections
   dışı parametre/filtre/etiket sayfalarına giden hit oranı). Log yoksa exit 3
   değil: GSC crawl stats ile proxy, confidence: "low".
2. Discovery lag: yeni sayfa → ilk Googlebot hit → indexlenme süresi ölçümü;
   slo_history.json'a yazılır.
3. Bot doğrulama: AI/bot trafiği reverse+forward DNS ile doğrulanır; UA string'i
   TEK BAŞINA kanıt değildir.
4. AI bot politikası: robots.txt policy.aiBots.custom'dan ÜRETİLİR (Faz 3 ortak
   bloğu). aiTraining≠aiSearch ayrımı zorunlu; politika değişikliği A3.
5. Bot hız sınırı/403/robots değişiklikleri PR ile; sessiz bloklama YASAK.
```

**INVARIANT:**
- **INV-8.1 [WARN]** Crawl waste >%20 → kök neden + PR önerisi.
- **INV-8.2 [INFO]** Discovery lag medyanı raporlanır (birim: SAAT — errata geçmişi: gün/saat karışıklığı düzeltildi).
- **INV-8.3 [BLOCK]** Doğrulanmamış bot için engelleme kuralı yazılamaz (reverse+forward DNS kanıtı şart).

**KANIT:** Log/crawl-stats özetleri, DNS doğrulama logları, robots diff'i.
**ROLLBACK:** robots kuralları config'den üretildiği için config geri alma + yeniden üretim.
**GATE-OUT:** ☐ Waste oranı ☐ Lag medyanı ☐ DNS doğrulama örnekleri ☐ Negatif test (sahte-UA fixture → exit 1)

---
## FAZ 9 — VERİ AMBARI, INCREMENTALITY, SEO P&L

**GATE-IN:** Faz 8 PASS · GSC/GA4 API erişimi (yoksa DUR-ve-SOR).
**GELİR KATKISI:** Ölçüm (paranın izlendiği katman). **YETKİ:** A1 (script'ler); ambar şema değişikliği A2.

**CURSOR'A VER:**
```
Faz 9. Kurallar:
1. Ambar tabloları (siteId partisyonlu): gsc_query_daily, gsc_page_daily,
   ga4_sessions_daily, ga4_conversions_daily, crux_p75_weekly, registry_snapshot,
   structural_breaks, costs_monthly (productionCostMinor aylık agregasyonu).
2. JOIN disiplini: tüm seriler dataWindowStart sonrası; kırılma tarihleri
   structural_breaks tablosundan okunup structuralBreaksApplied[] zarfına yazılır
   (C-13). num=100 öncesi seri ASLA join'lenmez.
3. Incrementality protokolü: müdahale grubu vs kontrol grubu, parallel-trends
   ön kontrolü, min 28 gün, %95 güven aralığı. Sonuç: effectSize + CI + p; CI
   sıfırı kapsıyorsa etki [Varsayım].
4. SEO P&L (scripts/seo/seo_pnl.sql + seo-pnl.ts): aylık, siteId bazında —
   gelir = Σ conversionValueMinor (first-touch) + assistedValueMinor +
   aiReferralValueMinor (ayrı kolonlar; çift sayım YASAK: assisted ayrı raporlanır,
   toplama katılmaz); maliyet = Σ productionCostMinor + araç/ajans gideri
   (costs_monthly). LTV katmanı: economics.ltvModel ≠ "none" ise ltv12ValueMinor
   kullanılır; "none" ise ilk-dokunuş değer + confidence: "low".
5. AI referral ölçümü: GA4 kaynak listesi (chatgpt.com, perplexity, copilot…)
   config'de; konversiyon değeri minor unit.
6. Çıktı: data/seo/pnl.json (zarf + aylık seri) — Faz 17 ve 19'un tek girdisi.
```

**INVARIANT:**
- **INV-9.1 [BLOCK]** Para hesabı yalnızca integer minor unit; float = exit 1 (C-05).
- **INV-9.2 [BLOCK]** Kırılma öncesi/sonrası seriler birleşik trend hesabına giremez (C-13).
- **INV-9.3 [BLOCK]** Incrementality raporu CI olmadan yayınlanamaz; "etki var" iddiası CI sıfırı kapsıyorsa [Varsayım]'a düşürülür.
- **INV-9.4 [WARN]** `defaultValuePerConversionMinor: 0` iken P&L üretildi → zarf `confidence: "low"` + rapor başlığında uyarı.
- **INV-9.5 [INFO]** GSC Generative AI impressions yalnızca bilgi satırı; formüle girmez (şema `const: false`).

**KANIT:** Ambar DDL, join örnekleri, P&L JSON, incrementality hesap dökümü.
**ROLLBACK:** Ambar tabloları yeniden hesaplanabilir (kaynak: API); script `git revert`.
**GATE-OUT:** ☐ P&L üretildi ☐ CI'lı etki raporu ☐ Çift sayım kontrolü ☐ Negatif test (float fixture → exit 1)

---
## FAZ 10 — MİGRASYON, KRİZ, YASAKLAR

**GATE-IN:** Faz 9 PASS.
**GELİR KATKISI:** Defans (varlığın sigortası). **YETKİ:** A3 (tüm icra).

**CURSOR'A VER:**
```
Faz 10. Bu faz HAZIRLIK fazıdır; migrasyon yoksa tatbikatla kapanır.
1. Migrasyon runbook'u: envanter (registry export) → redirect ledger taslağı
   (Faz 2 formatı) → staging doğrulama → canlı geçiş → 72s izleme penceresi
   (GSC + log + CWV) → kabul/rollback kararı. Domain değişimi = A3 + runbook'un
   tamamı + geri dönüş planı.
2. Kriz senaryoları (A–D): A) Algoritma düşüşü (28g -%30 tıklama) B) Manuel
   işlem C) Teknik felaket (yanlış noindex, robots bloğu) D) Gelir krizi
   (tıklama sabit, değer -%30). Her biri için: tespit sinyali → ilk 4 saat
   kontrol listesi → karar ağacı → iletişim şablonu. SENARYO D'de yanıt SEO
   değil ekonomidir: Faz 17 portföy + dönüşüm tarafı (Faz 14).
3. Yasaklar (Ek E ile birebir): otomatik 301, otomatik içerik yayını, toplu
   410, disavow (Faz 13 istisnası hariç: manuel işlem/kanıtlı negative SEO +
   A3), HSTS preload, paid link, PBN, cross-site link şeması, sahte lastmod,
   görünmez schema iddiası, uydurma SSS, garanti dili.
4. Yıllık tatbikat: senaryolardan biri staging'de prova edilir; sonuç
   KARAR_DEFTERI'ne.
```

**INVARIANT:**
- **INV-10.1 [BLOCK]** Runbook'suz migrasyon başlatılamaz (dosya varlığı + onay kaydı kontrolü).
- **INV-10.2 [BLOCK]** Ek E yasaklarının herhangi birinin PR'da tespiti = exit 1 + YETKI_IHLALI.md.
- **INV-10.3 [INFO]** Tatbikat tarihi 12 aydan eskiyse yönetim raporunda uyarı.

**KANIT:** Runbook dosyaları, tatbikat raporu, yasak-taraması CI çıktısı.
**ROLLBACK:** Bu fazın kendisi geri alma planıdır; icra geri almaları runbook'a göre.
**GATE-OUT:** ☐ Runbook mevcut ☐ 4 senaryo kartı ☐ Tatbikat kaydı ☐ Yasak taraması PASS

---
## FAZ 11 — KAC SİSTEMİ + PORTFÖY KARAR KATMANI

**GATE-IN:** Faz 9 PASS (P&L serisi mevcut) · Cold-start ise 0.11 modu.
**GELİR KATKISI:** Karar (yatırımın hedeflendiği katman). **YETKİ:** A1 (skorlama) + A3 (cluster onayı, portföy kararı).

**CURSOR'A VER:**
```
Faz 11. Pipeline (her adım deterministik, exit-code'lu):
1. KEYWORD: kaynaklar = GSC query + Ads Keyword Planner + site içi arama +
   PAA scrape (izinli). dataWindowStart öncesi query verisi kullanılmaz.
2. QUERY CLUSTER: SERP-overlap veya embedding kümeleme; 1 cluster = 1 owner
   sayfa (registry.ownerRoute; boşluk → null, "içerik boşluğu" etiketi).
3. PRIMARY ENTITY: her cluster tek entity (Faz 5/6 ile tutarlı).
4. TAS (Trafik Potansiyeli Skoru): C1 kapsam (hacim) × C2 erişilebilir tıklama
   payı (SERP özellik envanteriyle aşındırılmış — kendi CTR eğrin, endüstri
   tablosu YASAK) × C3 entity konsolidasyonu × C4 IG (intent-geography) ×
   C5 dış doğrulama. C5 eksik → partial: true (cold-start'ta beklenen).
5. KENDİ CTR EĞRİSİ: GSC position→CTR regresyonu, site bazında; <30 gün veri
   → confidence: "low" (endüstri tablosuna düşme YASAK).
6. DÖNÜŞÜM KATMANI: cluster → cvr (GA4) × değer (conversionValueMinor).
7. 9-DURUM KARAR MATRİSİ: {güçlü/zayıf/yoğun olmayan} × {yeni/büyüt/koru} →
   her cluster tek durum + tek aksiyon.
8. STRIKING DISTANCE: poz 4–20 → POZİSYON AÇIĞI (içerik/link işi) vs CTR AÇIĞI
   (title/snippet işi) ayrımı; ikisi karıştırılamaz.
9. ÖNCELİK SKORU: beklenenEkTıklama × cvr × değerMinor × güvenÇarpanı ÷ efor.
   güvenÇarpanı: high=1.0, medium=0.7, low=0.4.
10. PORTFÖY ÖNERİSİ: her cluster INVEST/HOLD/HARVEST/DIVEST önerisi —
    NİHAİ KARAR A3 (Faz 17 icra eder). paybackMonths = productionCostMinor ÷
    aylıkBeklenenDeğerMinor; > paybackMaxMonths → INVEST önerilemez.
11. Eşzamanlı aksiyon üst sınırı: maxConcurrentKacActions.
```

**INVARIANT:**
- **INV-11.1 [BLOCK]** 1 cluster = 1 owner (çok owner = exit 1; cannibalization raporu).
- **INV-11.2 [BLOCK]** Endüstri CTR tablosu kullanımı = exit 1 (kaynak etiketi taraması).
- **INV-11.3 [BLOCK]** Benzerlik > similarityMax olan yeni owner sayfa açılamaz (INV-5.2 bağlantısı).
- **INV-11.4 [BLOCK]** Portföy kararları KARAR_DEFTERI kaydı olmadan registry'ye yazılamaz (C-07; Faz 1 tek yazar — karar Faz 1 PR'ıyla işlenir).
- **INV-11.5 [WARN]** DIVEST önerisi > divestPendingMaxDays beklerse yönetim raporuna taşınır.
- **INV-11.6 [BLOCK]** Skor girdilerinden herhangi biri null → o cluster skoru `partial: true`; partial cluster INVEST öneremez.
- **INV-11.7 [WARN]** POZİSYON/CTR açığı ayrımı yapılmamış striking-distance listesi.
- **INV-11.8 [INFO]** Skor formülü ve güven çarpanları raporda açık yazılır (kara kutu skor yasak).

**KANIT:** `kac-prioritize --dry-run` çıktısı, cluster-owner tablosu, CTR eğrisi regresyon özeti, 9-durum dağılımı, KARAR_DEFTERI kayıtları.
**ROLLBACK:** Skorlama salt okunur; registry'ye yazılan kararlar Faz 1 PR'ıyla geri alınır.
**GATE-OUT:** ☐ Cluster haritası ☐ 9-durum tablosu ☐ Öncelik kuyruğu (N ≤ maxConcurrent) ☐ Onay kayıtları ☐ Negatif testler (çift owner, endüstri-CTR fixture → exit 1)

---
## FAZ 12 — SEO SRE: SLO, İZLEME, KILL KRİTERLERİ

**GATE-IN:** Faz 11 PASS.
**GELİR KATKISI:** Ölçüm + Koruma. **YETKİ:** A2 (cron kurulumu).

**CURSOR'A VER:**
```
Faz 12. SLO tanımları — EŞİKLER YALNIZCA config.thresholds'tan okunur
(errata E-02: gövdede sabit sayı YASAK):
1. SLO seti: a) CWV 75p (lcpP75Ms, inpP75Ms, clsP75) b) Kohort indexlenme
   (INV-3.4b eşiği) c) Discovery lag (INV-8.2) d) Gelir SLO'su: 28g organik
   değer düşüşü >%30 → gelir alarmı e) Kanıt SLO'su: her ay conformance + P&L
   artefaktı üretilmiş olmalı; üretilmediyse "kör uçuş" alarmı.
2. İzleme: cron → seo-slo-check.ts --site <id>; ihlalde issue açar (PR değil),
   2 ardışık ihlalde deploy-freeze önerisi (A3 onaylar).
3. Kill kriterleri (varlık bazında, Faz 17 ile bağlantılı): bir sayfa/cluster
   90 günde: sıfır dönüşüm + TAS partial kalıyor + iki yenileme denemesi
   başarısız → HARVEST/DIVEST değerlendirmesi zorunlu (otomatik icra YASAK).
4. slo_history.json: her kontrol bir satır {slo, measured, thresholdRef, status,
   ts} — zarf şemasına tabi (C-12).
5. Alarm hijyeni: aynı alarm 3 kez sessizce kapanıp açılıyorsa eşik kalibrasyonu
   PR'ı (Bölüm K bağlantısı); alarm yorgunluğu metriği raporlanır.
```

**INVARIANT:**
- **INV-12.1 [BLOCK]** SLO ihlali + issue açılmamış = exit 1 (sessiz ihlal yasağı, AIP-18).
- **INV-12.2 [BLOCK]** SLO eşiği koddan sabit okunursa = exit 1 (C-03 ile çift zorlama).
- **INV-12.3 [WARN]** Deploy-freeze önerisi 7 gün içinde A3 kararı almamışsa eskalasyon.
- **INV-12.4 [INFO]** Kanıt SLO'su: son 35 günde conformance artefaktı yoksa tüm fazlar GATE-IN reddeder.
- **INV-12.5 [BLOCK]** Kill kriteri tetiklenen varlık için 30 gün içinde portföy kararı (INVEST dışı bir karar da karardır) alınmamışsa = exit 1 (askıda varlık yasağı).

**KANIT:** `slo_history.json` serisi, issue linkleri, cron tanımı, alarm-yorgunluğu tablosu.
**ROLLBACK:** Cron kaldırılır; SLO tanımları config'den geri alınır.
**GATE-OUT:** ☐ 5 SLO canlı ☐ İlk kontrol çalıştı ☐ Kill-kriteri kuyruğu boş/işleniyor ☐ Negatif test (sabit eşik fixture → exit 1)

---
## FAZ 13 — OFF-PAGE OTORİTE + MARKA HENDEĞİ (BİRLEŞİK)

**GATE-IN:** Faz 5 PASS (içerik/veri varlığı tabanı) · Faz 12 canlı.
**GELİR KATKISI:** Savunma + Yeni gelir (AI Overviews aşındırmasına karşı tek yapısal savunma: marka talebi). **YETKİ:** A1 (varlık üretimi) + A3 (disavow, PR kampanya onayı).

**CURSOR'A VER:**
```
Faz 13 (V5 dijital PR + V5.1 off-page birleşimi). Kurallar:
1. LINKABLE ASSET envanteri: 6 tip {veri çalışması, araç/hesaplayıcı, şablon/
   checklist, orijinal araştırma, uzman yorumu deposu, görsel varlık}. Her varlık
   registry'de type: "tool"|"article" + linkableAsset: true etiketi. Envanter:
   linkable_assets.json.
2. BACKLINK AUDIT: audit-backlinks.ts — kaynak dağılımı, anchor dağılımı,
   toksik sinyal listesi (yalnızca RAPOR; aksiyon YOK).
3. DISAVOW: yalnızca (manuel işlem VAR) VEYA (kanıtlı negative SEO) + A3 onayı +
   KARAR_DEFTERI gerekçesi. Bu koşullar yoksa disavow dosyası oluşturulamaz.
4. DİJİTAL PR PLAYBOOK: veri varlığı → basın özeti → hedef yayın listesi →
   pitch. YASAK: paid link, PBN, link değişimi şeması, toplu misafir yazarlık
   şablonu, cross-site link ağı (0.12).
5. UNLINKED MENTION: marka geçen link'siz bahsetmeler → nazik link talebi
   (track-mentions.ts; otomatik e-posta YASAK, taslak üretir).
6. MARKA TALEBİ ÖLÇÜMÜ: brand_demand.json — marka arama hacmi trendi (GSC +
   Ads), doğrudan trafik payı, brand/non-brand ayrımı her P&L'de zorunlu.
7. BRAND SERP SAHİPLENME: marka sorgusunda ilk 10 sonucun sahiplik oranı;
   < brandSerpOwnershipWarnPct → WARN + varlık planı (profil sayfaları, video,
   doküman). Wikidata/knowledge panel: notability kanıtı olmadan girişim YASAK
   (kayıt + kaynakça şart).
8. AI CITATION: hedef sorgularda AI yanıtlarında geçme oranı (örneklem, elle/
   izinli API); config.perplexityQuery doluysa otomatik örneklem.
```

**INVARIANT:**
- **INV-13.1 [BLOCK]** Koşulsuz disavow = exit 1 (üç koşul kaydı zorunlu).
- **INV-13.2 [BLOCK]** Paid link/PBN/link şeması tespiti = exit 1 + YETKI_IHLALI (Ek E).
- **INV-13.3 [WARN]** Linkable asset olmadan PR kampanyası önerilemez (kayıt kontrolü).
- **INV-13.4 [INFO]** Brand/non-brand ayrımı olmayan aylık rapor eksiktir.
- **INV-13.5 [WARN]** Marka SERP sahiplik oranı < brandSerpOwnershipWarnPct.
- **INV-13.6 [INFO]** AI citation örneklemi en az ayda bir; yöntem notu zorunlu (örneklem küçük → [Güçlü] iddia yasak).

**KANIT:** `linkable_assets.json`, backlink audit raporu, `brand_demand.json`, brand SERP tablosu, onay kayıtları.
**ROLLBACK:** Varlık sayfaları Faz 1 süreciyle retire; disavow dosyası Search Console'dan geri alınır (kayıtla).
**GATE-OUT:** ☐ Envanter ☐ Audit ☐ Brand demand serisi ☐ Negatif test (koşulsuz disavow fixture → exit 1)

---
## FAZ 14 — NİYET TATMİNİ + CRO DİSİPLİNİ

**GATE-IN:** Faz 11 PASS (öncelik kuyruğu mevcut).
**GELİR KATKISI:** Dönüşüm (trafiği paraya çeviren katman). **YETKİ:** A1 (deney altyapısı) + A3 (deney başlatma).

**CURSOR'A VER:**
```
Faz 14. Kurallar:
1. NİYET TATMİN RUBRİĞİ N1–N7: N1 sorgu-başlık uyumu, N2 ilk-ekran vaadi,
   N3 içerik derinliği/kapsam, N4 güven sinyalleri, N5 eyleme geçirilebilirlik,
   N6 engel sayısı (form alanı, adım), N7 tatmin sonrası yönlendirme. Her biri
   1–7; toplam ≤ intentScoreMin×7 (config) → o sayfa için CRO BLOKE (önce niyet).
2. Bilgilendirici cluster'lar assisted conversion ile ölçülür; doğrudan CVR
   dayatılmaz (Faz 9 kolonları).
3. DENEY DİSİPLİNİ: tek birincil metrik + guardrail metrikler + önceden
   hesaplanmış örneklem/MDE + karar kuralı (decisionRule) + min 14 TAM HAFTA +
   peeking YASAK (ara analiz = deney geçersiz). Hepsi cro_experiments.json'da
   başlamadan kilitlenir.
4. SEO–CRO ÇATIŞMA KAPISI: deney varyantı indexlenemez (noindex/canonical),
   varyant URL'leri sitemap'e girmez, A/B aracı cloaking sinyali üretemez
   (bot'a farklı içerik YASAK).
5. CONSENT ETKİSİ: CMP/consent değişimi structural_breaks kaydıdır;
   consentTrackingRequired: true ise consent-mode v2 doğrulaması olmadan
   hiçbir CRO/ölçüm raporu PASS yazamaz (SKIP_NO_DATA değil, FAIL).
6. Reklam/paywall modelleri: Faz 16 gelir-modeli kuralları bu fazın
   guardrail'lerini belirler (INV-16.4).
```

**INVARIANT:**
- **INV-14.1 [BLOCK]** N-skoru ≤ eşik sayfada CRO deneyi başlatılamaz.
- **INV-14.2 [BLOCK]** Örneklem/MDE/decisionRule kilitsiz deney = exit 1.
- **INV-14.3 [BLOCK]** Peeking tespiti (plan dışı ara rapor) = deney geçersiz + kayıt.
- **INV-14.4 [BLOCK]** Deney varyantının indexlenmesi = exit 1.
- **INV-14.5 [WARN]** Consent-mode doğrulaması 30 günden eski.
- **INV-14.6 [INFO]** Min süre 14 tam hafta; kısa kapatılan deney "sonuçsuz" sayılır, kaybeden/ kazanan ilan edilemez.

**KANIT:** Rubrik tabloları, `cro_experiments.json` kilit kayıtları, consent doğrulama çıktısı.
**ROLLBACK:** Deney aracı kapatılır; varyantlar kaldırılır; kayıt `retired` olur (silinmez — öğrenme varlığı).
**GATE-OUT:** ☐ Rubrik uygulandı ☐ Deney kilit şeması ☐ Consent doğrulandı ☐ Negatif test (kilitsiz deney fixture → exit 1)

---
## FAZ 15 — DİKEY MODÜLLER (config.business.verticals doluysa)

**GATE-IN:** Faz 14 PASS · `verticals` boş değil (boşsa faz SKIP — tek koşullu faz).
**GELİR KATKISI:** Kapasite (dikeye özgü yürütme kuralları). **YETKİ:** A1/A2 (modüle göre); AIP-22: daraltır, gevşetmez.

**CURSOR'A VER (modül başına):**

```
MODÜL 15.A — E-TİCARET
1. Varyant canonical: renk/beden varyantları tek ürün URL'sine canonical;
   ayrı indexlenen varyant YALNIZCA bağımsız arama talebi kanıtlıysa.
2. Stok-tükenen ürün 200 KALIR (stok bilgisi + alternatifler); 404 yalnızca
   kalıcı kaldırmada; 301 yalnızca halef ürün varsa.
3. Product schema: fiyat/stok görünür içerikle birebir (INV-6.1).
4. Filtre/facet: Faz 3 parametre karar kayıtlarına tabi; talep-kanıtlı
   kombinasyonlar statik INDEX sayfa olur.

MODÜL 15.B — LOCAL
1. NAP (isim/adres/telefon) tüm yüzeylerde BAYT-BAYT AYNI (site, GBP, dizinler).
2. Doorway YASAK: şehir-adı-değişen kopya sayfalar; her konum sayfası gerçek
   yerel içerik (ekip, foto, rota, yorum) taşır.
3. GBP/site tutarlılığı + yorum yanıt SLA'sı.

MODÜL 15.C — SAAS
1. Metodoloji/dokümantasyon SSR (INV-4.1); uygulama-içi içerik auth arkasında
   kalır, pazarlama yüzeyi ayrı.
2. Yalnızca GERÇEK teklifler (fiyat, deneme) — sahte "ücretsiz" vaadi Ek E.
3. Karşılaştırma sayfaları: rakip adı kullanımı doğru, güncel, kaynaklı.

MODÜL 15.D — YAYINCI/MEDYA
1. News sitemap: yalnızca son 48 saat; eski haber ana sitemap'te.
2. Yazar sayfaları + düzeltme politikası görünür.
3. Ads RPM ↔ CWV çatışması INV-16.4'e devredilir.

MODÜL 15.E — i18n (tek kaynak; Faz 18 buraya refere eder)
1. hreflang KARŞILIKLI: A→B varsa B→A zorunlu; tek yönlü = hata.
2. Tam olarak 1 x-default.
3. IP-bazlı zorunlu yönlendirme YASAK (dil öneri banner'ı serbest).
4. hreflang ↔ canonical ↔ registry.hreflangGroup üçlü tutarlılığı.
5. Çeviri: makine çevirisi yalnızca insan redaksiyonuyla yayınlanır (INV-5.1).
```

**INVARIANT:**
- **INV-15.1 [BLOCK]** (e-com) Stok-tükenen ürünün 404/410'a çevrilmesi (kalıcı kaldırma kaydı yoksa) = exit 1.
- **INV-15.2 [BLOCK]** (e-com) Varyant URL'leri bağımsız indexlenmiş + talep kanıtı yok = exit 1.
- **INV-15.3 [WARN]** (e-com) Product schema fiyat/stok ↔ görünür içerik uyumsuzluğu.
- **INV-15.4 [BLOCK]** (local) NAP uyumsuzluğu (bayt farkı) = exit 1.
- **INV-15.5 [BLOCK]** (local) Doorway kalıbı (şablon benzerliği > similarityMax + gerçek yerel içerik yok) = exit 1.
- **INV-15.6 [WARN]** (local) GBP ↔ site tutarlılık kontrolü 90 günden eski.
- **INV-15.7 [BLOCK]** (saas) Metodoloji/dokümantasyon sayfaları JS-render'a bağımlı = exit 1.
- **INV-15.8 [BLOCK]** (saas) Gerçek olmayan teklif/fiyat iddiası = exit 1.
- **INV-15.9 [WARN]** (saas) Karşılaştırma sayfası kaynakça/güncellik damgasız.
- **INV-15.10 [BLOCK]** (media) News sitemap'te 48 saatten eski içerik = exit 1.
- **INV-15.11 [WARN]** (media) Yazar sayfası/düzeltme politikası eksik.
- **INV-15.12 [INFO]** (media) Evergreen/haber ayrımı registry type alanında tutulur.
- **INV-15.13 [BLOCK]** (i18n) Tek yönlü hreflang = exit 1.
- **INV-15.14 [BLOCK]** (i18n) Sıfır veya 2+ x-default = exit 1.
- **INV-15.15 [BLOCK]** (i18n) IP-bazlı zorunlu yönlendirme = exit 1.
- **INV-15.16 [BLOCK]** (i18n) hreflang ↔ canonical ↔ registry üçlü uyumsuzluğu = exit 1.
- **INV-15.17 [WARN]** (i18n) İnsan redaksiyonu kaydı olmayan çeviri sayfası.
- **INV-15.18 [INFO]** Modül kapsam dışı kural önerisi BULGULAR_KUYRUGU'na (AIP-15).
- **INV-15.19 [BLOCK]** AIP-22 ihlali: dikey kuralın genel kuralı gevşetmesi = exit 1.

**KANIT:** Modül başına doğrulama script çıktıları (audit-vertical-*.ts), fixture testleri.
**ROLLBACK:** Tüm modül düzeltmeleri şablon/config PR'ları; i18n etiketleri tek PR'da geri alınabilir.
**GATE-OUT (her aktif modül için):** ☐ Doğrulama PASS ☐ Negatif testler ☐ AIP-22 kontrolü

---
## FAZ 16 — TAM HARİTASI, BÜYÜME DÖNGÜLERİ, GELİR MODELİ AYRIMI

**GATE-IN:** Faz 11 PASS (cluster envanteri) · Faz 0 baz haritası.
**GELİR KATKISI:** Kaynak + Ölçek (büyümenin nereden geleceği). **YETKİ:** A1 (harita) + A3 (döngü yatırımı).

**CURSOR'A VER:**
```
Faz 16. Kurallar:
1. TAM HARİTASI: tam_map.json — toplam sorgu evreni (dikey × niyet × coğrafya),
   mevcut coverage ratio (owner'lı cluster / toplam cluster), büyüme bölmeleri.
   Cold-start'ta Ads hacim verisi proxy (0.11). Faz 0 taslağı burada kesinleşir
   (errata E-12: keşif 0'da, genişleme 16'da — mükerrer YOK).
2. COVERAGE RATIO eşiği: <%15 → büyüme alanı "yeni cluster"; %15–60 → "owner
   güçlendirme"; >%60 → "yeni dikey/coğrafya". Eşikler invariants.json'da.
3. GROWTH LOOP ataması (registry.growthLoop): her cluster en fazla 1 döngü:
   content_compounding (gözlem: 90g), tool_virality (gözlem: 60g + paylaşım
   metriği), ugc_loop (gözlem: 90g + moderasyon script'i ŞART), programmatic_
   longtail (Faz 18 kapısından geçmeden ATANAMAZ).
4. GELİR MODELİ AYRIMI (revenueModel): ads → RPM↔CWV bütçesi (INV-16.4);
   affiliate → FTC/yerel açıklama zorunluluğu + rel="sponsored"; paywall →
   örnek içerik politikası (Google'ın flexible sampling kuralları); leadgen →
   form-analitik eşlemesi; mixed → her sayfa tek birincil model etiketi.
5. Çıktılar: tam_map.json (kesin), coverage raporu, growthLoop atama PR'ı.
```

**INVARIANT:**
- **INV-16.1 [BLOCK]** TAM haritası olmadan "büyüme fırsatı" iddiası rapora giremez.
- **INV-16.2 [WARN]** Coverage hesaplamasında owner'lı cluster tanımı net değilse (registry sorgusu kanıtıyla).
- **INV-16.3 [BLOCK]** ugc_loop ataması + moderasyon script'i yok = exit 1.
- **INV-16.4 [BLOCK]** (ads/mixed) Reklam yoğunluğu değişikliği CWV SLO'sunu bozuyorsa deploy edilemez; RPM↔CWV bütçe kaydı zorunlu.
- **INV-16.5 [WARN]** Growth loop gözlem penceresi dolmadan "döngü çalışıyor" iddiası.
- **INV-16.6 [INFO]** Affiliate açıklama denetimi aylık; eksik sayfa listesi rapora gider.

**KANIT:** `tam_map.json` zarfı, coverage sorgu çıktısı, loop atama tablosu, gelir-modeli etiket raporu.
**ROLLBACK:** Atamalar registry alanları; Faz 1 PR'ıyla geri alınır.
**GATE-OUT:** ☐ TAM kesin ☐ Coverage + bölge kararı ☐ Loop atamaları ☐ Negatif test (moderasyonsuz UGC fixture → exit 1)

---
## FAZ 17 — PORTFÖY EKONOMİSİ (P&L → KARAR → İCRA)

**GATE-IN:** Faz 9 P&L serisi ≥ 2 ay · Faz 11 önerileri · Faz 12 kill kuyruğu.
**GELİR KATKISI:** Koruma (kaynağın rasyonel dağıtımı — paranın patronu katman). **YETKİ:** A3 (tüm kararlar insan).

**CURSOR'A VER:**
```
Faz 17. Kurallar:
1. AYLIK PORTFÖY KURULU: girdi = pnl.json + kac-prioritize çıktısı + kill
   kuyruğu; çıktı = portfolio_board.json — her cluster/sayfa için nihai
   INVEST/HOLD/HARVEST/DIVEST + gerekçe + onaylayan (KARAR_DEFTERI).
2. BÜTÇE KİLİDİ: ekonomik kaynak dağılımı economics.budgetSplit'e uyar;
   INVEST payı < investPct ise gerekçe kaydı zorunlu. Sapma >10 puan = A3
   onaylı config değişikliği (yoksa exit 1).
3. KONSANTRASYON RİSKİ: tek sayfa veya tek cluster toplam organik değerin
   > concentrationWarnPct%'si → WARN + çeşitlendirme planı. Multi-site'ta
   tek site >%60 → portfolio_sites.json WARN (0.12).
4. DIVEST İCRASI (4 adım, asla otomatik): ① halef/redirect hedefi kaydı
   (yoksa 410) ② iç link temizliği PR'ı ③ 301/410 icrası (A3 merge)
   ④ 28g izleme + P&L kapanış satırı. Registry status: "retired" ancak
   icra sonrası (INV-1.5 ile sitemap'ten düşer).
5. PAYBACK TAKİBİ: INVEST kararlarının paybackMonths projeksiyonu gerçekleşenle
   90g'de bir karşılaştırılır; sapma >%50 → Bölüm K kalibrasyon tetiklenir.
6. HARVEST rejimi: bakım-only (decay izleme + yıllık taze); HARVEST sayfasına
   yeni yatırım PR'ı açılamaz (kural kaydı).
```

**INVARIANT:**
- **INV-17.1 [BLOCK]** Konsantrasyon > eşik + çeşitlendirme planı yok = exit 1.
- **INV-17.2 [BLOCK]** DIVEST icrası 4 adımın tamamı + onay kaydı olmadan = exit 1.
- **INV-17.3 [BLOCK]** Bütçe sapması >10 puan + config değişikliği yok = exit 1.
- **INV-17.4 [BLOCK]** Portföy kararı KARAR_DEFTERI'siz registry'ye işlenemez (C-07 + C-08 zinciri).
- **INV-17.5 [WARN]** Payback sapması >%50 kalibrasyon tetiklenmediyse.
- **INV-17.6 [INFO]** HARVEST ihlali (yatırım PR'ı) taraması aylık.

**KANIT:** `portfolio_board.json`, kurul tutanağı (KARAR_DEFTERI), bütçe dağılım tablosu, DIVEST icra kayıtları.
**ROLLBACK:** Karar geri alma = yeni kurul kararı (kayıtlı); icra geri almaları runbook (Faz 10).
**GATE-OUT:** ☐ Kurul yapıldı ☐ Bütçe kilidi PASS ☐ Konsantrasyon raporu ☐ Kill kuyruğu sıfırlandı ☐ Negatif test (onaysız DIVEST fixture → exit 1)

---
## FAZ 18 — PROGRAMMATIC FABRİKA (KALİTE KAPILI ÖLÇEK)

**GATE-IN:** Faz 17'de INVEST kararı alınmış en az 1 programmatic_longtail cluster · Faz 15.E (i18n varsa).
**GELİR KATKISI:** Ölçek (kanıtlanmış desenin çoğaltılması). **YETKİ:** A1 (şablon) + A3 (her parti yayını).

**CURSOR'A VER:**
```
Faz 18. Kapı kuralı: fabrika, kanıtlanmış deseni çoğaltır; kanıtlanmamışı
üretmez. Kurallar:
1. UYGUNLUK TESTİ (5 koşul, hepsi şart): ① cluster programmatic_longtail
   atamalı (Faz 16) ② veri kaynağı yapısal ve güncellenebilir ③ her sayfa
   tekil kullanıcı sorusuna cevap veriyor ④ benzersizlik skoru hesaplanabilir
   ⑤ pilot sayfa (elle yazılmış 3–5 örnek) 28g'de indekslendi + sıfır olmayan
   gösterim. Bir koşul fail → DUR, fabrika açılmaz.
2. templates.ts: her şablon kayıtlı {templateId, slotlar, veri bağlama,
   benzersizlik stratejisi}; registry.templateId bu dosyaya referans (INV-1.6
   yoğunluk uyarısının kaynağı).
3. PARTİ disiplini: her parti ≤ config limitinde sayfa, tek PR, insan
   örneklem onayı (en az 5 sayfa gözden geçirme kaydı) ile yayınlanır.
4. KİLL SWİTCH: parti indexlenme oranı < programmaticIndexMinPct% VE
   programmaticEvalDays gün geçmişse → parti noindex'e çekilir + kök neden
   raporu (otomatik değil, script önerir; A3 onaylar).
5. BENZERSİZLİK: parti içi medyan benzerlik < similarityMax; aksi halde
   yayın bloke.
6. ROLLBACK TESTİ: her şablon için "partiyi geri alma" kuru çalışması
   (--dry-run) CI'da kanıtlanır; geri alınamayan şablon yayınlanamaz.
7. i18n partileri yalnızca Faz 15.E kurallarıyla (hreflang üçlü kontrolü dahil).
```

**INVARIANT:**
- **INV-18.1 [BLOCK]** Kayıtsız templateId ile sayfa üretimi = exit 1.
- **INV-18.2 [BLOCK]** 5-koşul uygunluk testi geçilmeden ilk parti = exit 1.
- **INV-18.3 [BLOCK]** Programmatik sayfalar genel invariantlardan MUAF DEĞİLDİR (schema, benzersizlik, sitemap, CWV hepsi geçerli) — muafiyet isteyen PR = exit 1.
- **INV-18.4 [WARN]** Kill-switch koşulu oluşmuş + 7 gün içinde A3 kararı yok → eskalasyon.
- **INV-18.5 [BLOCK]** Rollback kuru çalışması CI'da kanıtlanmamış şablon yayınlanamaz.
- **INV-18.6 [BLOCK]** Parti içi medyan benzerlik ≥ similarityMax = yayın bloke.

**KANIT:** Uygunluk testi raporu, `templates.ts`, parti PR'ları + örneklem kayıtları, kill-switch geçmişi, CI rollback kanıtı.
**ROLLBACK:** Parti = tek PR → tek `git revert` + noindex takviyesi; kill-switch zaten yarı-geri-alma mekanizmasıdır.
**GATE-OUT:** ☐ Uygunluk PASS ☐ Şablon kaydı ☐ Pilot kanıtı ☐ Negatif testler (kayıtsız şablon, benzer parti → exit 1)

---
## FAZ 19 — VARLIK DEĞERLEME + YÖNETİM RAPORU + DD PAKETİ

**GATE-IN:** Faz 17 ≥ 3 aylık kurul geçmişi · P&L ≥ 6 ay (yoksa değerleme [Varsayım] + partial).
**GELİR KATKISI:** Yönetim (varlığın fiyatının bilinmesi). **YETKİ:** A0 (rapor) — değerleme yayını A3.

**CURSOR'A VER:**
```
Faz 19. Kurallar:
1. ÜÇ YÖNTEM, TEK RAPOR: V1 = yıllık artık organik gelir × çarpan
   (valuationMultiples.low–high aralığı; tek çarpan YASAK). V2 = ikame maliyeti:
   aynı trafiği Ads ile satın alma maliyeti (CPC × tıklama, dataWindowStart
   sonrası). V3 = nakit akışı projeksiyonu (yalnızca ≥12 ay P&L varsa; büyüme
   varsayımı [Varsayım] etiketli). Rapor üç yöntemi YANYANA verir; tekil "değer"
   iddiası YASAK — aralık + güven etiketi.
2. YÖNETİM KURULU AYLIK RAPORU (Ek I şablonu): tek sayfa — trafik, değer
   (minor→major gösterim), INVEST/HOLD/HARVEST/DIVEST dağılımı, konsantrasyon,
   kill kuyruğu, SLO durumu, garanti-dili taraması PASS ibaresi.
3. DD PAKETİ (due diligence): docs/seo/DD_PAKETI/ — registry export, P&L ham
   serisi, redirect ledger, conformance geçmişi, KARAR_DEFTERI, structural
   breaks listesi. Satış/yatırım görüşmesinde tek paket.
4. Değerleme artefaktı: valuation.json (zarf + 3 yöntem + aralıklar).
5. DÜRÜSTLÜK: P&L confidence: "low" ise değerleme ancak [Varsayım]; rapor
   kapağında açık yazar (INV-G.2).
```

**INVARIANT:**
- **INV-19.1 [BLOCK]** Metodoloji/çarpan aralığı belirtmeden değer iddiası = exit 1.
- **INV-19.2 [WARN]** Yönetim raporu Ek I şablonundan saparsa (alan eksikliği).
- **INV-19.3 [BLOCK]** DD paketinde KARAR_DEFTERI veya conformance geçmişi eksik = exit 1.
- **INV-19.4 [INFO]** V3 yalnızca ≥12 ay veriyle; aksi halde "hesaplanmadı" yazılır (uydurma yasak).

**KANIT:** `valuation.json`, yönetim raporu PDF/MD, DD paketi manifesti.
**ROLLBACK:** Raporlar yeniden üretilebilir; yanlış yayınlanan değerleme düzeltme kaydıyla güncellenir.
**GATE-OUT:** ☐ 3 yöntem yan yana ☐ Şablon uyumu ☐ DD manifesti tam ☐ Negatif test (çarpansız değer fixture → exit 1)

---
# BÖLÜM K — KALİBRASYON PROTOKOLÜ (MODELLER KENDİ KENDİNİ SINAR)

**Amaç:** KAC öncelik skoru ve CTR eğrisi gerçekten öngörücü mü? Kanıtsız model, dekorasyondur.

```
K-1. ZAMAN-BAZLI SPLIT: tahminler üretim anında mühürlenir (kac_predictions
     tablosu: cluster, skor, öngörülenEkTıklama, ts); gerçekleşme 90g sonra
     aynı cluster'dan okunur. Geriye dönük "fit" YASAK.
K-2. METRİK: Spearman rho (öngörülen sıralama ↔ gerçekleşen sıralama).
K-3. KABUL: rho ≥ 0.30 → model canlı kalır. rho < 0.30 → skor "deneysel"
     etiketine düşer; INVEST kararlarında güven çarpanı 0.4'e kilitlenir;
     yeniden kalibrasyon PR'ı zorunlu.
K-4. OVERFIT KARŞITI: formül katsayıları en fazla çeyrekte bir değişir;
     her değişiklik KARAR_DEFTERI + önceki formülün performans özetiyle.
K-5. ÇIKTI: calibration_report.json (zarf şemasına tabi — C-12).
K-6. PAYBACK KALİBRASYONU: INV-17.5 sapması da bu protokole beslenir.
```

**INV-K.1 [BLOCK]** Kalibrasyon raporu 120 günden eskiyse skor tabanlı öncelik listesi yayınlanamaz.
**INV-K.2 [INFO]** rho raporlanırken örneklem büyüklüğü zorunlu (n<20 → [Güçlü] iddia yasak).

---
# BÖLÜM P — UYGULAMA PROFİLLERİ (S/M/L) + EFOR TABLOSU

| Profil | Kim | Fazlar |
|---|---|---|
| **S** (tek site, küçük ekip, ~18 kişi-gün) | Yeni/küçük site | MUST: 0,1,2,3,4,5,6,7,11*,12,14 · SHOULD: 9(basit),13 · SKIP: 8,10†,15,16,17,18,19 |
| **M** (büyüyen, ~62 kişi-gün) | Trafiği olan ticari site | MUST: 0–7,9,10,11,12,13,14,15‡,17 · SHOULD: 8,16,19 · SKIP: 18 |
| **L** (kurumsal/portföy, ~118 kişi-gün) | Çok siteli grup | MUST: tümü (0–19) + 0.12 multi-site + portfolio katmanı |

\* S profilinde Faz 11 "lite": cluster + 9-durum + öncelik; CTR eğrisi ve TAS tamamı M'de.
† Migrasyon yoksa S'de Faz 10 yalnızca yasaklar bölümüyle okunur (1 saat).
‡ `verticals` boşsa Faz 15 her profilde SKIP.

| Faz | S | M | L | Faz | S | M | L |
|---|---|---|---|---|---|---|---|
| 0 Keşif | 1 | 2 | 3 | 10 Kriz | — | 2 | 3 |
| 1 Registry | 2 | 3 | 4 | 11 KAC | 3 | 6 | 9 |
| 2 Host/Redirect | 1 | 1 | 2 | 12 SRE | 1 | 3 | 5 |
| 3 Sitemap/Robots | 1 | 2 | 3 | 13 Off-page | — | 4 | 8 |
| 4 Render | 1 | 2 | 3 | 14 CRO | 2 | 4 | 6 |
| 5 İçerik | 3 | 5 | 8 | 15 Dikey | — | 3 | 6 |
| 6 Schema | 1 | 2 | 3 | 16 TAM/Döngü | — | 2 | 5 |
| 7 Link/CWV | 2 | 3 | 5 | 17 Portföy | — | 2 | 5 |
| 8 Crawl/AI | — | 2 | 4 | 18 Fabrika | — | — | 7 |
| 9 Ambar/P&L | — | 4 | 7 | 19 Değerleme | — | 1 | 3 |

*(Rakamlar kişi-gün; [Varsayım] değil planlama tahmini — gerçekleşen efor `docs/seo/EFOR_DEFTERI.md`'ye işlenir ve bir sonraki plan buna göre kalibre edilir.)*

---
# EK D — FRAMEWORK TUZAKLARI (uygulama-notları)

1. **Next.js App Router:** `app/sitemap.ts` dinamik üretir — kohort bölümleme burada; `metadata.alternates.hreflang` üçlü kontrolün (INV-15.16) kod tarafı. Middleware'de redirect zinciri riski — ledger'a bağla.
2. **Vercel:** `vercel.json` redirects + edge config; `redirectLimit` config'den. Headers cache davranışını değiştirir — `Vary: User-Agent` yasağı (INV-2.5 bağlamı).
3. **Netlify:** `_redirects` sıralı işler — zincir testi burada kritik; `_headers` ile HSTS kademesi.
4. **Cloudflare Pages:** `_redirects` limiti düşük; büyük ledger → bulk redirects API'si (manifest dışı — onaylı istisna).
5. **Statik host:** Edge redirect yok → framework katmanı; `supportsEdgeRedirects: false` iken Faz 2'de 301'ler framework'te.
6. **SPA:** Soft navigasyon INP'si (INV-4.4) web-vitals `onINP` + route-change dinleyicisiyle; history API patch'i manifest'te tek dosya.
7. **WordPress:** Redirect eklentisi ledger'ı EZER — tek kaynak kuralı: ledger → eklenti importu (tek yön).

---
# EK E — BİRLEŞİK YASAKLAR LİSTESİ (22 madde — hepsi conformance/CI taranabilir)

1. Sıralama/trafik/gelir garantisi veya vaat dili (AIP-26).
2. Otomatik 301/410/içerik yayını (AIP-14).
3. Paid link, PBN, link değişim şeması, cross-site link ağı (INV-13.2).
4. Koşulsuz disavow (INV-13.1).
5. HSTS preload onaysız (INV-2.3).
6. Sahte `lastmod` (INV-3.4a).
7. Görünür içerikte olmayan schema iddiası (INV-6.1).
8. Uydurma SSS / uydurma kaynakça (INV-5, Ek D notu).
9. İnsan onaysız AI-üretim içerik yayını (INV-5.1).
10. Endüstri CTR tablosu (INV-11.2).
11. dataWindowStart öncesi veriyi trend girdisi yapmak (INV-0.1).
12. GSC Generative AI impressions'ı gelir formülüne sokmak (INV-9.5).
13. Float ile para hesabı (AIP-12, C-05).
14. Kodda sabit eşik (INV-X.5).
15. Kırılma öncesi/sonrası serileri karıştırmak (INV-9.2).
16. Peeking / kilitsiz deney (INV-14.2/14.3).
17. Doorway sayfalar (INV-15.5).
18. IP-bazlı zorunlu yönlendirme (INV-15.15).
19. Bot'a farklı içerik (cloaking sinyali) (INV-14.4 bağlamı).
20. Doğrulanmamış bot engellemesi (INV-8.3).
21. Registry'ye Faz 1 dışı yazma (C-08).
22. Kanıtsız PASS / sessiz başarısızlık / kendi kendine onay (AIP-07/18/19).

---
# EK F — İNVARİANT DİZİNİ (TAM LİSTE — `data/seo/invariants.json` ile birebir; P-05 tutarlılık kontrolü)

**Global (4):** INV-G.1 garanti yasağı [BLOCK] · INV-G.2 para-etiket disiplini [BLOCK] · INV-G.3 onay kaydı [BLOCK] · INV-G.4 yetki aşımı [BLOCK]
**Yürütme (1):** INV-X.5 sabit eşik yasağı [BLOCK]
**Kalibrasyon (2):** INV-K.1 kalibrasyon tazeliği [BLOCK] · INV-K.2 örneklem zorunluluğu [INFO]
**Faz 0 (4):** 0.1 tarihsel-veri yasağı [BLOCK] · 0.2 yazma yasağı [BLOCK] · 0.3 crawl-bütçe uyarısı [WARN] · 0.4 cold-start zorunluluğu [INFO]
**Faz 1 (8):** 1.1 tekil kayıt [BLOCK] · 1.2 integer-para [BLOCK] · 1.3 cluster-owner tutarlılığı [BLOCK] · 1.4 maliyet-boşluğu [WARN] · 1.5 retired≠sitemap [BLOCK] · 1.6 programmatik yoğunluk [WARN] · 1.7 tek-yazar [BLOCK] · 1.8 growthLoop ataması [INFO]
**Faz 2 (6):** 2.1 tek-301 [BLOCK] · 2.2 zincir yasağı [BLOCK] · 2.3 preload yasağı [BLOCK] · 2.4 eski-301 [WARN] · 2.5 varyant-200 yasağı [BLOCK] · 2.6 limit uyarısı [INFO]
**Faz 3 (7):** 3.1 sitemap↔registry [BLOCK] · 3.2 robots↔sitemap [BLOCK] · 3.3 noindex↔sitemap [BLOCK] · 3.4a lastmod [BLOCK] · 3.4b kohort [WARN] · 3.5 parametre kararı [WARN] · 3.6 kohort kaydı [INFO]
**Faz 4 (4):** 4.1 parite [BLOCK] · 4.2 canonical/hreflang render değişimi [BLOCK] · 4.3 hydration [WARN] · 4.4 soft-nav INP [INFO]
**Faz 5 (6):** 5.1 insan onayı [BLOCK] · 5.2 benzerlik [BLOCK] · 5.3 decay borcu [WARN] · 5.4 uzman açığı [WARN] · 5.5 KVKK/GDPR [BLOCK] · 5.6 change-damgası [INFO]
**Faz 6 (4):** 6.1 doğrulanabilir iddia [BLOCK] · 6.2 tek Organization [BLOCK] · 6.3 breadcrumb uyumu [WARN] · 6.4 FAQ bağımsızlığı [INFO]
**Faz 7 (4):** 7.1 yetim [WARN] · 7.2 CWV kapısı [BLOCK] · 7.3 anchor yoğunluğu [WARN] · 7.4 delta tablosu [INFO]
**Faz 8 (3):** 8.1 crawl waste [WARN] · 8.2 discovery lag [INFO] · 8.3 bot doğrulama [BLOCK]
**Faz 9 (5):** 9.1 integer-para [BLOCK] · 9.2 kırılma-join [BLOCK] · 9.3 CI zorunluluğu [BLOCK] · 9.4 sıfır-değer uyarısı [WARN] · 9.5 GenAI izolasyonu [INFO]
**Faz 10 (3):** 10.1 runbook [BLOCK] · 10.2 yasak taraması [BLOCK] · 10.3 tatbikat [INFO]
**Faz 11 (8):** 11.1 tek owner [BLOCK] · 11.2 CTR tablosu yasağı [BLOCK] · 11.3 benzerlik kapısı [BLOCK] · 11.4 karar kaydı [BLOCK] · 11.5 divest bekleme [WARN] · 11.6 partial≠INVEST [BLOCK] · 11.7 açık ayrımı [WARN] · 11.8 açık formül [INFO]
**Faz 12 (5):** 12.1 sessiz-ihlal yasağı [BLOCK] · 12.2 config-eşik [BLOCK] · 12.3 freeze eskalasyonu [WARN] · 12.4 kanıt SLO [INFO] · 12.5 askıda-varlık yasağı [BLOCK]
**Faz 13 (6):** 13.1 disavow koşulları [BLOCK] · 13.2 link şeması yasağı [BLOCK] · 13.3 varlıksız-PR [WARN] · 13.4 brand ayrımı [INFO] · 13.5 brand SERP [WARN] · 13.6 AI citation yöntemi [INFO]
**Faz 14 (6):** 14.1 niyet kapısı [BLOCK] · 14.2 deney kilidi [BLOCK] · 14.3 peeking [BLOCK] · 14.4 varyant-index yasağı [BLOCK] · 14.5 consent tazeliği [WARN] · 14.6 min süre [INFO]
**Faz 15 (19):** 15.1–15.19 (dikey bloklar; yukarıdaki faz gövdesindeki metinle birebir)
**Faz 16 (6):** 16.1 TAM zorunluluğu [BLOCK] · 16.2 coverage tanımı [WARN] · 16.3 UGC moderasyonu [BLOCK] · 16.4 RPM↔CWV [BLOCK] · 16.5 gözlem penceresi [WARN] · 16.6 affiliate denetimi [INFO]
**Faz 17 (6):** 17.1 konsantrasyon [BLOCK] · 17.2 divest icra [BLOCK] · 17.3 bütçe sapması [BLOCK] · 17.4 karar zinciri [BLOCK] · 17.5 payback kalibrasyonu [WARN] · 17.6 harvest ihlali [INFO]
**Faz 18 (6):** 18.1 şablon kaydı [BLOCK] · 18.2 uygunluk kapısı [BLOCK] · 18.3 muafiyet yasağı [BLOCK] · 18.4 kill-switch eskalasyonu [WARN] · 18.5 rollback kanıtı [BLOCK] · 18.6 parti benzersizliği [BLOCK]
**Faz 19 (4):** 19.1 metodolojisiz-değer yasağı [BLOCK] · 19.2 şablon uyumu [WARN] · 19.3 DD bütünlüğü [BLOCK] · 19.4 V3 veri koşulu [INFO]

**Toplam: 127 invariant + 27 AIP + 15 conformance testi + 10 preflight kontrolü.** BLOCK: 75 · WARN: 30 · INFO: 22. *(Bu sayılar `invariants.json`'dan script'le sayılır; elle güncellenmez.)*

---
# EK G — KOMUT DİZİNİ (TAM)

```bash
# Kurulum / kapılar
SITE_ID=sectorcalc npm run seo:preflight
npm run seo:validate-registry
npm run seo:conformance
npm run seo:coldstart-check

# Karar sistemleri
npm run seo:kac
tsx scripts/seo/audit-backlinks.ts --site $SITE_ID
tsx scripts/seo/audit-brand-serp.ts --site $SITE_ID
tsx scripts/seo/track-mentions.ts --site $SITE_ID
tsx scripts/seo/audit-vertical-ecommerce.ts --site $SITE_ID
tsx scripts/seo/seo-slo-check.ts --site $SITE_ID

# Ekonomi
npm run seo:pnl
npm run seo:valuation
tsx scripts/seo/calibration.ts --site $SITE_ID

# Raporlama
tsx scripts/seo/board-report.ts --site $SITE_ID --month 2026-08
```

*(Tüm script'ler `--dry-run` destekler; yazan her script önce dry-run kanıtı ister. `SITE_ID` olmadan çalıştırma exit 4 — 0.12.)*

---
# EK H — KPI SÖZLÜĞÜ (TEK TANIM — başka yerde yeniden tanımlanamaz)

| KPI | Tanım | Kaynak | Etiket kuralı |
|---|---|---|---|
| Organik değer (aylık) | Σ conversionValueMinor (first-touch) | pnl.json | INV-G.2 |
| Assisted değer | Son tıklama öncesi organik temaslı dönüşüm değeri | pnl.json | Toplama katılmaz |
| AI referral değeri | AI kaynaklı oturum dönüşüm değeri | pnl.json | Kaynak listesi config'den |
| Brand talep | Marka sorgu hacmi trendi + doğrudan trafik payı | brand_demand.json | Örneklem notu |
| TAS | C1×C2×C3×C4×C5 (C5 yoksa partial) | kac çıktısı | Formül açık |
| Coverage ratio | Owner'lı cluster / toplam cluster | tam_map.json | Registry sorgusu kanıtlı |
| Payback (ay) | productionCostMinor ÷ aylıkBeklenenDeğerMinor | portfolio_board.json | Sapma → Bölüm K |
| Kohort index oranı | Sitemap kohortunun indexed payı | slo_history.json | 28g pencereli |
| Varlık değeri | V1/V2/V3 aralıkları | valuation.json | Tekil değer yasak |
| Kör uçuş | Kanıt SLO'su ihlali süresi (gün) | slo_history.json | >0 ise fazlar kilitli |

---
# EK I — YÖNETİM KURULU AYLIK RAPOR ŞABLONU (TEK SAYFA)

```
# SEO VARLIK RAPORU — <siteId> — <YYYY-MM>
DURUM: 🟢/🟡/🔴 (SLO + kör uçuş + gelir SLO birleşik sinyali)
1. PARA: organik değer <aralık> [etiket] · assisted <aralık> · AI referral <aralık>
2. VARLIK: değer aralığı V1 <…> / V2 <…> / V3 <… veya "hesaplanmadı">
3. PORTFÖY: INVEST n=… · HOLD n=… · HARVEST n=… · DIVEST n=… (kurul: <tarih>)
4. RİSK: konsantrasyon <%> · kill kuyruğu n=… · kör uçuş <gün>
5. HENDEK: brand talep trendi ↗/→/↘ · brand SERP sahiplik <%> · AI citation n=…
6. KALİTE: conformance son koşu <tarih> PASS/FAIL · kalibrasyon rho=… (n=…)
7. KARAR GEREKTİRENLER: <A3 bekleyen maddeler, her biri tek satır>
İBARE: Bu rapor garanti-dili taramasından geçmiştir (AIP-26) ✅
```

---
# EK J — SPRINT ŞABLONU (2 HAFTALIK)

```
SPRINT <n> — <siteId>
Girdi: kac-prioritize kuyruğu (N ≤ maxConcurrentKacActions) + kill kuyruğu + SLO açıkları
Her iş kartı: {cluster, durum (9-durum), aksiyon, beklenenEkTıklama, değerMinor,
güvenÇarpanı, efor, faz-referansı, GATE-OUT bağlantısı}
Yasak: kuyruk dışı iş (AIP-15) · garanti dili · onaysız icra
Kapanış: yapılanlar (PR linkleri) · incrementality penceresi açılanlar · BULGULAR_KUYRUGU güncellemesi
```

---
# EK K — BAŞLANGIÇ KONTROL LİSTESİ (İLK 7 GÜN)

```
Gün 1: Bölüm X.1 kickoff mesajını ajana ver → formatlı cevabı doğrula
Gün 1: sites/<siteId>/seo.config.json doldur → preflight PASS (exit 0)
Gün 2: X.2 manifest + X.4 PHASE_CONTRACTS + X.5 invariants.json kur → conformance C-01…C-15 yeşil
Gün 2: Cold-start tespiti (0.11) → bayrağı zarfa işle
Gün 3: FAZ 0 → onay
Gün 4–5: FAZ 1 → onay (registry boş bile olsa şema + testlerle kurulur)
Gün 6: FAZ 2–3 → onay
Gün 7: İlk hafta özeti: PASS tablosu + açık DUR-ve-SOR maddeleri + PROFİL seçimi (Bölüm P)
Kural: Onaysız faz geçilmez (AIP-19). İlk onaylı 3 fazdan sonra tempo serbestleşir.
```

---
# KAPANIŞ — DÜRÜST PUANLAMA (BU SÖZLEŞME KENDİ KENDİNİ DE DENETLER)

Bu belge kendisine **10/10'u ancak üç kanıt üretildiğinde** verir:

1. **UYGULANABİLİRLİK KANITI** ✅ *(tasarım gereği)*: Her faz 7 parçalı; her BLOCK invariant negatif testli; her eşik config'den; her para integer; her karar kayıtlı. Bu belgeyle donatılan bir repo'da ajanın "yorum yapma" alanı AIP-24'ün kısıtlayıcı okumasına kilitlidir.
2. **MODEL GEÇERLİLİĞİ KANITI** ⏳ *(90–120 gün gerektirir)*: Bölüm K rho ≥ 0.30 üretmedikçe KAC skoru "deneysel"dir — bu sözleşme bunu saklamaz, raporlar.
3. **TİCARİ ETKİ KANITI** ⏳ *(incrementality penceresi gerektirir)*: CI sıfırı kapsıyorsa etki [Varsayım]'dır. Para kazandırdığı iddiası ancak kontrol gruplu kanıtla söylenir — aksi halde INV-G.1 ihlali olur.

**Bu sözleşmenin en güçlü maddesi:** Para kazandıracağını vaat etmez; para kazandırıp kazandırmadığını **kanıtlamadan konuşmayı yasaklar.** Dünyada gelir üreten SEO operasyonlarını taktik listelerinden ayıran şey budur: ölçülebilir disiplin + yürütülebilir sözleşme + dürüst raporlama.

---
## SÜRÜM GEÇMİŞİ

- **V3** → **V4**: Gate/invariant/kanıt/rollback sözleşmesi, KAC, SRE, 2026 zemini.
- **V4** → **V5.0**: Ekonomik yönetişim (P&L, portföy, fabrika, hendek, değerleme, yetki matrisi).
- **V5.0** → **V5.1-EXECUTABLE**: AIP-01…25, Bölüm X, kalibrasyon, profiller, dikeyler, CRO, off-page, TAM.
- **V5.1** → **V6.0 ENTERPRISE**: İki dalın birleşimi; 20 fazlık çelişkisiz mimari; 17 maddelik errata ile kalıcı düzeltmeler (derlenme hatası, tip çelişkisi, şema deliği, faz/INV çakışmaları, cold-start, multi-site, eklemeli-CI, artefakt zarf tamamlığı); AIP-26/27; conformance 10→15; para disiplini minor-unit; dürüst puanlama kapanışı korunarak.

**SON.** Bu belge değiştiğinde: `docs/seo/MANDATE_ERRATA.md`'ye kayıt + sürüm numarası + `invariants.json` P-05 kontrolü. Sessiz değişiklik yasaktır.
