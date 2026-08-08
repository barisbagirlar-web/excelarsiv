#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
kur/cache_yaz.py — LibreOffice hesaplı kopyasındaki değerleri ORİJİNAL xlsx'e
formül cache'i olarak enjekte eder.

Neden: openpyxl formül hücresine cache yazamaz; LibreOffice convert-to ise
koşullu biçimlendirmeyi düşürür. Bu araç ikisini birleştirir:
  orijinal (tam özellikli) + hesaplanmış değerler = tam dosya + canlı cache.

Kullanım:
    python kur/cache_yaz.py <orijinal.xlsx> <hesapli.xlsx>
"""
import sys, os, re, zipfile, shutil, tempfile, datetime
import xml.etree.ElementTree as ET

NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
RELS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKGREL = "http://schemas.openxmlformats.org/package/2006/relationships"


def sayfa_sirasi(zf):
    """workbook.xml + rels'ten: sheet adı → worksheets/sheetN.xml yol."""
    wb_xml = zf.read("xl/workbook.xml").decode("utf-8")
    rels_xml = zf.read("xl/_rels/workbook.xml.rels").decode("utf-8")
    ad_rid = {}
    for sh in re.finditer(r"<sheet\b[^>]*/>", wb_xml):
        tag = sh.group(0)
        nm = re.search(r'name="([^"]*)"', tag)
        rid = re.search(r'r:id="(rId\d+)"', tag)
        if nm and rid:
            ad_rid[nm.group(1)] = rid.group(1)
    rid_yol = {}
    for rel in re.finditer(r"<Relationship\b[^>]*/>", rels_xml):
        tag = rel.group(0)
        if "worksheet" not in tag:
            continue
        rid = re.search(r'Id="(rId\d+)"', tag)
        tgt = re.search(r'Target="([^"]*)"', tag)
        if rid and tgt:
            rid_yol[rid.group(1)] = tgt.group(1).lstrip("/")
    return {ad: rid_yol[rid] for ad, rid in ad_rid.items() if rid in rid_yol}


def cache_deger(v):
    if isinstance(v, bool):
        return "1" if v else "0", None
    if isinstance(v, (datetime.datetime, datetime.date)):
        from openpyxl.utils.datetime import to_excel
        return str(to_excel(v)), None
    if isinstance(v, str):
        return v, "str"
    return repr(v), None


def main(orijinal, hesapli, cikti=None):
    import openpyxl
    cikti = cikti or orijinal

    wbd = openpyxl.load_workbook(hesapli, data_only=True)
    degerler = {}
    for ws in wbd.worksheets:
        for row in ws.iter_rows():
            for c in row:
                if c.value is not None:
                    degerler[(ws.title, c.coordinate)] = c.value

    tmp = tempfile.mkdtemp(prefix="cache-yaz-")
    try:
        zf = zipfile.ZipFile(orijinal)
        try:
            sirasi = sayfa_sirasi(zf)
            adet = 0
            tmp_zip = os.path.join(tmp, "cikti.xlsx")
            with zipfile.ZipFile(tmp_zip, "w", zipfile.ZIP_DEFLATED) as zo:
                for item in zf.infolist():
                    data = zf.read(item.filename)
                    m = re.match(r"^xl/worksheets/sheet\d+\.xml$", item.filename)
                    if m:
                        sayfa_adi = next((ad for ad, y in sirasi.items()
                                          if y == item.filename), None)
                        if sayfa_adi:
                            data, adet = enjekte(data, sayfa_adi, degerler, adet)
                    zo.writestr(item, data)
        finally:
            zf.close()
        shutil.move(tmp_zip, cikti)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print(f"[cache] {adet} formül cache'i yazıldı → {cikti}")
    return adet


def enjekte(xml, sayfa_adi, degerler, adet):
    root = ET.fromstring(xml)
    for c in root.iter(f"{{{NS}}}c"):
        r = c.get("r")
        if not r or (sayfa_adi, r) not in degerler:
            continue
        if c.find(f"{{{NS}}}f") is None:
            continue  # sadece formül hücreleri
        v_el = c.find(f"{{{NS}}}v")
        deger = degerler[(sayfa_adi, r)]
        txt, tip = cache_deger(deger)
        if v_el is None:
            v_el = ET.SubElement(c, f"{{{NS}}}v")
        v_el.text = txt
        if tip == "str":
            c.set("t", "str")
        adet += 1
    return ET.tostring(root, encoding="unicode").encode("utf-8"), adet


if __name__ == "__main__":
    o = sys.argv[1]
    h = sys.argv[2]
    c = sys.argv[3] if len(sys.argv) > 3 else None
    main(o, h, c)
