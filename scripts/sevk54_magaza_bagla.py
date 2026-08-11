#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PORTFOY SEVK 54 ürününü excelarsiv.com mağazasına bağlar.

Kaynak: ../excelarsiv-automation/urunler/<slug>/ (SEVK_KARARI + xlsx + SPEC.yaml)
Hedef: delivery + commerce/catalog.json + functions/catalog.json + MDX +
       proof-demo-specs.js + productSeo.ts + ekran görüntüsü yer tutucu

Shopier fiyat seviyeleri sabit (990/1490/2490/7900). SEVK SPEC fiyatları
≥4900 olduğu için tüm 54 ürün EXCLUSIVE (7900 TL) olarak listelenir.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import zipfile
from pathlib import Path

KOK = Path(__file__).resolve().parents[1]
OTOMASYON = KOK.parent / "excelarsiv-automation"
URUNLER = OTOMASYON / "urunler"
PORTFOY = OTOMASYON / "V6_EXCEL_URETIM" / "PORTFOY_SEVK_54.md"
TESLIM = KOK / "delivery" / "paid-products"
MDX_DIR = KOK / "src" / "content" / "templates"
SS_DIR = KOK / "public" / "screenshots"
CATALOG = KOK / "commerce" / "catalog.json"
FCATALOG = KOK / "functions" / "catalog.json"
PROOF = KOK / "functions" / "proof-demo-specs.js"
SEO = KOK / "src" / "data" / "productSeo.ts"

ARKETIP_KATEGORI = {
    "A1": "muhasebe-ve-vergi",
    "A2": "satis-ve-fiyatlama",
    "A3": "nakit-akisi",
    "A4": "muhasebe-ve-vergi",
    "A5": "stok-ve-uretim",
    "A6": "butce-ve-planlama",
    "A7": "stok-ve-uretim",
    "A8": "butce-ve-planlama",
}

SAYFA_AMAC = {
    "KAPAK": ("Ürün kapak sayfası ve dosya kimliği", "output"),
    "HIZLI_BASLANGIC": ("Hızlı başlangıç rehberi", "output"),
    "GIRDI": ("Ana veri girişleri", "input"),
    "VARSAYIMLAR": ("Varsayım ve parametre girişleri", "input"),
    "KURALLAR": ("İş kuralları ve eşikler", "calculation"),
    "MOTOR": ("Hesaplama motoru", "calculation"),
    "HESAP": ("Ara hesap adımları", "calculation"),
    "KARAR": ("Karar kapısı, gerekçe ve aksiyonlar", "calculation"),
    "PANO": ("Canlı KPI ve yönetici panosu", "output"),
    "RAPOR": ("Yazdırılabilir yönetici raporu", "output"),
    "KANIT_RAPORU": ("Kanıt ve denetim raporu", "output"),
    "ORNEK_VERI": ("Örnek veri seti", "input"),
    "AYARLAR": ("Parametre ve eşik ayarları", "input"),
    "KILAVUZ": ("Kullanım kılavuzu", "output"),
    "TESTLER": ("Doğrulama testleri", "calculation"),
    "LISTELER": ("Veri doğrulama listeleri", "input"),
    "SENARYO": ("Senaryo karşılaştırması", "calculation"),
    "FINANSMAN": ("Finansman senaryoları", "calculation"),
}


def yq(s: str) -> str:
    return s.replace("'", "''")


def portfoy_sluglari() -> list[str]:
    text = PORTFOY.read_text(encoding="utf-8")
    return re.findall(r"`([a-z0-9-]+)`", text)


def spec_oku(slug: str) -> dict:
    yol = URUNLER / slug / "SPEC.yaml"
    text = yol.read_text(encoding="utf-8") if yol.exists() else ""
    ad_m = re.search(r'^\s*ad:\s*"([^"]+)"', text, re.M)
    ark_m = re.search(r"^arketip:\s*([A-Z0-9+]+)", text, re.M)
    ad = ad_m.group(1) if ad_m else slug.replace("-", " ").title()
    ark = (ark_m.group(1).split("+")[0] if ark_m else "A1")
    hedef_m = re.search(r'hedef_kullanici:\s*"([^"]+)"', text)
    hedef = hedef_m.group(1) if hedef_m else "işletme yöneticisi, mali müşavir, operasyon sorumlusu"
    ozet = f"{ad} ile girdilerinizi işleyin; karar, risk ve yönetici özetini tek dosyada görün."
    if len(ozet) > 160:
        ozet = ozet[:157] + "..."
    if len(ozet) < 40:
        ozet = ozet + " Karar destek çıktısı üretir."
    return {"ad": ad, "arketip": ark, "hedef": hedef, "ozet": ozet}


def xlsx_bul(slug: str) -> Path:
    klasor = URUNLER / slug
    adaylar = sorted(klasor.glob("*.xlsx"))
    if not adaylar:
        raise FileNotFoundError(f"{slug}: xlsx yok")
    return adaylar[0]


def metadata(xlsx: Path) -> dict:
    with zipfile.ZipFile(xlsx) as z:
        wb = z.read("xl/workbook.xml").decode("utf-8", "replace")
    sayfalar = re.findall(r'<sheet[^>]*name="([^"]+)"', wb)
    return {
        "sayfa_adlari": sayfalar,
        "sheetCount": len(sayfalar),
        "sizeMB": round(xlsx.stat().st_size / 1024 / 1024, 2),
        "fileFormat": "xlsx",
        "hasMacros": False,
    }


def sayfa_amaci(ad: str) -> tuple[str, str]:
    if ad in SAYFA_AMAC:
        return SAYFA_AMAC[ad]
    if any(x in ad for x in ("GIRDI", "LISTE", "KAYIT", "KART")):
        return (f"{ad} veri girişi", "input")
    if any(x in ad for x in ("MOTOR", "HESAP", "ANALIZ", "SENARYO", "KONTROL")):
        return (f"{ad} hesaplama", "calculation")
    if any(x in ad for x in ("PANO", "RAPOR", "KARAR", "KANIT")):
        return (f"{ad} çıktı", "output")
    return (f"{ad} sayfası", "input")


def mdx_uret(slug: str, bilgi: dict, meta: dict, iliskili: list[str]) -> str:
    kategori = ARKETIP_KATEGORI.get(bilgi["arketip"], "finansal-analiz")
    ad = bilgi["ad"]
    satir = [
        "---",
        f"name: '{yq(ad)}'",
        f"summary: '{yq(bilgi['ozet'])}'",
        f"category: '{kategori}'",
        "priceTL: 7900",
        "vatIncluded: true",
        f"fileFormat: {meta['fileFormat']}",
        f"sizeMB: {meta['sizeMB']}",
        f"sheetCount: {meta['sheetCount']}",
        f"hasMacros: {str(meta['hasMacros']).lower()}",
        "minExcelVersion: 'Excel 2016 ve üzeri'",
        "macCompatible: true",
        "sheetsCompatibility: full",
        "version: '1.0.0'",
        "updatedAt: '2026-08-11'",
        "sheetMap: ",
    ]
    for sayfa in meta["sayfa_adlari"]:
        amac, kind = sayfa_amaci(sayfa)
        satir += [f"  - name: '{yq(sayfa)}'", f"    purpose: '{yq(amac)}'", f"    kind: '{kind}'"]
    girdiler = [
        "Dönem ve işletme kimlik bilgileri",
        "Ana işlem / kalem listesi",
        "Eşik ve parametre ayarları",
    ]
    ciktilar = [
        "Karar kapısı (UYGUN / İNCELE / DURDUR)",
        "Yönetici panosu KPI özeti",
        "Yazdırılabilir kanıt / rapor çıktısı",
    ]
    uygun = [x.strip() for x in bilgi["hedef"].split(",")][:3]
    while len(uygun) < 3:
        uygun.append("Karar destek çıktısı isteyen işletmeler")
    satir += ["inputs: "] + [f"  - '{yq(g)}'" for g in girdiler]
    satir += ["outputs: "] + [f"  - '{yq(c)}'" for c in ciktilar]
    satir += ["suitableFor: "] + [f"  - '{yq(u)}'" for u in uygun]
    satir += [
        "notSuitableFor: ",
        "  - 'Bu alanda danışmanlık yerine geçen hukuki/vergi beyannamesi arayanlar'",
        "  - 'Tek hücrelik basit hesap ihtiyacı olanlar'",
        "requirements: ",
        "  - 'Excel 2016 veya üzeri'",
        "updatePolicy: 'Yapı değişmediği sürece güncel sürüm aynıdır; mevzuat veya Excel davranışı değişirse güncel sürüm satın alma döneminden itibaren 12 ay ücretsiz sunulur.'",
        "faq: ",
        f"  - question: '{yq(ad + ' ne işe yarar?')}'",
        f"    answer: '{yq(bilgi['ozet'])}'",
        "  - question: 'Demo ile tam sürüm farkı nedir?'",
        "    answer: 'Demo değerlendirme satırlarıyla karar mantığını gösterir; premium motor, tam ayarlar ve analitik katman yalnızca satın alınan dosyadadır.'",
        "  - question: 'Kendi verilerimle çalışır mı?'",
        "    answer: 'Evet. Örnek veriyi silip kendi kayıtlarınızı girdi sayfalarına yazmanız yeterlidir.'",
        "  - question: 'Karar nasıl üretilir?'",
        "    answer: 'Eşiklerle karşılaştırılan metrikler UYGUN, İNCELE veya DURDUR kararını ve gerekçeyi üretir.'",
        "  - question: 'Rapor yöneticiye sunulabilir mi?'",
        "    answer: 'Evet. RAPOR / KANIT sayfaları yazdırılabilir yönetici özeti olarak PDF çıktısına uygundur.'",
        "  - question: 'Fiyat neden Exclusive seviyesinde?'",
        "    answer: 'Ürün v6 SEVK kanıt paketini geçen kurumsal karar destek sistemidir; Shopier Exclusive seviyesinden teslim edilir.'",
        "screenshots: ",
        f"  - src: '/screenshots/{slug}-1.png'",
        f"    alt: '{yq(ad)} dosyasının giriş sayfası — veri girişi ve parametreler'",
        f"  - src: '/screenshots/{slug}-2.png'",
        f"    alt: '{yq(ad)} dosyasının karar sayfası — karar kapısı ve gerekçe'",
        f"  - src: '/screenshots/{slug}-3.png'",
        f"    alt: '{yq(ad)} dosyasının pano sayfası — KPI ve yönetici özeti'",
        "related: ",
    ]
    for r in iliskili[:3]:
        satir.append(f"  - '{r}'")
    satir += [
        "---",
        "",
        "Satın almadan önce demo dosyasıyla inceleyin. Ödeme Shopier altyapısıyla güvenli şekilde işlenir, teslimat e-posta ile yapılır.",
        "",
    ]
    return "\n".join(satir)


def proof_blogu(slug: str, ad: str) -> str:
    return f"""  '{slug}': {{
    karar: '{yq(ad)} için örnek girdilerle karar ve risk özetini gösterir.',
    girisBasliklari: ['Kalem', 'Tutar (₺)', 'Oran (%)', 'Risk', 'Not'],
    ornek: [
      ['Kalem A', 120000, 12, 'Düşük', 'Örnek'],
      ['Kalem B', 85000, 8, 'Orta', 'Örnek'],
      ['Kalem C', 64000, 15, 'Yüksek', 'Örnek'],
      ['Kalem D', 41000, 5, 'Düşük', 'Örnek'],
      ['Kalem E', 98000, 10, 'Orta', 'Örnek'],
    ],
    metrikler: [
      ['Toplam tutar', '=SUM(DEMO_GIRIS!B6:B25)', 'para'],
      ['Ortalama oran', '=AVERAGE(DEMO_GIRIS!C6:C25)', 'yuzde'],
      ['Yüksek risk sayısı', '=COUNTIF(DEMO_GIRIS!D6:D25,"Yüksek")', 'sayi'],
      ['Kritik eşik aşımı', '=MAX(0,B6-250000)', 'para'],
      ['Demo karar', '=IF(B8>=2,"DURDUR",IF(B6>200000,"İNCELE","UYGUN"))', 'metin'],
    ],
    aksiyonlar: ['Yüksek risk kalemlerini önce inceleyin.', 'Eşik aşımında senaryoyu yeniden çalıştırın.', 'Tam sürümde motor, kanıt raporu ve analitik katman birlikte açılır.'],
  }},
"""


def seo_blogu(slug: str, ad: str) -> str:
    kisa = ad if len(ad) <= 42 else ad[:39] + "..."
    title = f"{kisa} Excel | Karar Destek"
    if len(title) > 70:
        title = title[:70]
    desc = f"{ad} Excel sistemiyle girdilerinizi işleyin; karar, risk ve yönetici özetini tek dosyada görün."
    if len(desc) > 160:
        desc = desc[:157] + "..."
    if len(desc) < 100:
        desc = desc + " Demo ile inceleyin; satın alma sonrası tam sürüm teslim edilir."
    pq = (ad.split("(")[0].strip().lower() + " excel")[:80]
    return (
        f"  '{slug}': {{ title:'{title}', description:'{desc}', "
        f"primaryQuery:'{pq}' }},\n"
    )


def main() -> None:
    sluglar = portfoy_sluglari()
    if len(sluglar) != 54:
        raise SystemExit(f"PORTFOY slug sayısı {len(sluglar)}, 54 beklenirdi")

    katalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    proof_text = PROOF.read_text(encoding="utf-8")
    seo_text = SEO.read_text(encoding="utf-8")

    kayitlar = []
    for i, slug in enumerate(sluglar):
        if not (URUNLER / slug / "KANIT" / "SEVK_KARARI.md").exists():
            raise SystemExit(f"{slug}: SEVK_KARARI yok")
        bilgi = spec_oku(slug)
        kaynak = xlsx_bul(slug)
        hedef = TESLIM / slug / "current.xlsx"
        hedef.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(kaynak, hedef)
        meta = metadata(hedef)
        iliskili = [s for s in sluglar if s != slug][i % 50 : i % 50 + 3]
        if len(iliskili) < 3:
            iliskili = [s for s in sluglar if s != slug][:3]
        (MDX_DIR / f"{slug}.mdx").write_text(mdx_uret(slug, bilgi, meta, iliskili), encoding="utf-8")

        katalog["products"][slug] = {
            "name": bilgi["ad"],
            "tier": "EXCLUSIVE",
            "fileFormat": "xlsx",
            "storageKey": f"paid-products/{slug}/current.xlsx",
            "satista": True,
        }

        if f"'{slug}'" not in proof_text:
            proof_text = proof_text.replace(
                "});\n\nfunction getProofDemoSpec",
                proof_blogu(slug, bilgi["ad"]) + "});\n\nfunction getProofDemoSpec",
                1,
            )
        if f"'{slug}'" not in seo_text:
            seo_text = seo_text.replace(
                "};\n\nexport function getProductSeoByPath",
                seo_blogu(slug, bilgi["ad"]) + "};\n\nexport function getProductSeoByPath",
                1,
            )

        # Yer tutucu ekran görüntüsü: mevcut bir ürün görselini kopyala (sonra LO ile yenilenecek)
        kaynak_ss = SS_DIR / "aylik-patron-finans-paneli-1.png"
        for n in (1, 2, 3):
            hedef_ss = SS_DIR / f"{slug}-{n}.png"
            if not hedef_ss.exists() and kaynak_ss.exists():
                shutil.copy2(SS_DIR / f"aylik-patron-finans-paneli-{n}.png", hedef_ss)

        kayitlar.append(slug)
        print(f"bağlandı: {slug} ({meta['sheetCount']} sayfa, {meta['sizeMB']} MB)")

    CATALOG.write_text(json.dumps(katalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    shutil.copy2(CATALOG, FCATALOG)
    PROOF.write_text(proof_text, encoding="utf-8")
    SEO.write_text(seo_text, encoding="utf-8")
    print(f"TAMAM: {len(kayitlar)} ürün mağazaya bağlandı (catalog ürün={len(katalog['products'])})")


if __name__ == "__main__":
    main()
