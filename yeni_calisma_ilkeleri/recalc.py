#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RECALC — LibreOffice köprüsü (deger_kapilari.py / olcek_testi.py kullanır)

xlsx dosyasını headless LibreOffice ile yeniden hesaplar, değer cache'lerini
yerine yazar ve JSON özet basar (stdout'ta başka hiçbir şey olmaz).

Kullanım:
    python recalc.py <dosya.xlsx> [zaman_aşımı_sn]

JSON: {"total_errors": N, "error_summary": {...}, "saniye": x}
"""

import sys, os, json, time, shutil, subprocess, tempfile

HATA_DEGERLERI = ("#DIV/0!", "#VALUE!", "#REF!", "#NAME?", "#N/A", "#NUM!", "#NULL!", "#SPILL!")


def bul_soffice():
    adaylar = [
        shutil.which("soffice"),
        shutil.which("libreoffice"),
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
        "/usr/bin/soffice",
    ]
    for p in adaylar:
        if p and os.path.exists(p):
            return p
    return None


def hata_tara(yol):
    try:
        import openpyxl
        wb = openpyxl.load_workbook(yol, data_only=True)
    except Exception as e:
        return {"taramahatasi": str(e)}
    sayac = {}
    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for c in row:
                if c.value is None:
                    continue
                s = str(c.value).strip()
                if s in HATA_DEGERLERI:
                    sayac[s] = sayac.get(s, 0) + 1
    return sayac


def main():
    yol = os.path.abspath(sys.argv[1])
    timeout = 300
    cikti = None
    for i, a in enumerate(sys.argv[2:], 2):
        if a == "--cikti":
            cikti = os.path.abspath(sys.argv[i + 1])
        elif a.isdigit():
            timeout = int(a)
    if not os.path.exists(yol):
        print(json.dumps({"error": f"dosya yok: {yol}"}))
        sys.exit(1)

    soffice = bul_soffice()
    if soffice is None:
        print(json.dumps({"error": "LibreOffice bulunamadı"}))
        sys.exit(1)

    tmp = tempfile.mkdtemp(prefix="recalc-")
    t0 = time.time()
    try:
        komut = [
            soffice, "--headless", "--norestore", "--nolockcheck",
            f"-env:UserInstallation=file://{tmp}/loprofile",
            "--convert-to", "xlsx", "--outdir", tmp, yol,
        ]
        subprocess.run(komut, capture_output=True, text=True, timeout=timeout + 60)

        hesaplanan = os.path.join(tmp, os.path.basename(yol))
        if not os.path.exists(hesaplanan):
            print(json.dumps({"error": "LibreOffice çıktı üretmedi"}))
            sys.exit(1)

        hedef = cikti if cikti else yol  # orijinali bozmadan --cikti yoluna yazar
        shutil.copy(hesaplanan, hedef)
        ozet = hata_tara(hedef)
        print(json.dumps({
            "total_errors": sum(ozet.values()),
            "error_summary": ozet,
            "saniye": round(time.time() - t0, 2),
            "cikti": hedef,
        }))
        sys.exit(0)
    except subprocess.TimeoutExpired:
        print(json.dumps({"error": "LibreOffice zaman aşımı"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
