#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KAPILAR — üç katmanı sırayla çalıştırır ve tek birleşik karar üretir.

    G katmanı (işçilik)      → denetci.py
    Ö katmanı (dayanıklılık) → olcek_testi.py
    D katmanı (değer)        → deger_kapilari.py

Sıra bağlayıcıdır: işçilik kırıkken ölçek/değer çalıştırmak zaman kaybıdır.
--devam bayrağı verilmezse ilk katman KALDI verince durur.

Kullanım:
    python kapilar.py <dosya.xlsx> --spec SPEC.yaml
    python kapilar.py <dosya.xlsx> --spec SPEC.yaml --devam --hizli
"""

import sys, os, argparse, subprocess, hashlib, datetime

KATMANLAR = [
    ("G", "denetci.py",         "İşçilik",      ["--spec"], "RAPOR_DENETIM.md"),
    ("Ö", "olcek_testi.py",     "Dayanıklılık", ["--spec"], "RAPOR_OLCEK.md"),
    ("D", "deger_kapilari.py",  "Değer",        ["--spec"], "RAPOR_DEGER.md"),
]


def parmak_izi(yol):
    h = hashlib.sha256()
    with open(yol, "rb") as f:
        for b in iter(lambda: f.read(65536), b""):
            h.update(b)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dosya")
    ap.add_argument("--spec", default=None)
    ap.add_argument("--betik-dizini", default=os.path.dirname(os.path.abspath(__file__)))
    ap.add_argument("--kanit-dizini", default="KANIT")
    ap.add_argument("--devam", action="store_true", help="KALDI olsa da sonraki katmana geç")
    ap.add_argument("--hizli", action="store_true", help="Ö katmanında ölçek testini atla")
    a = ap.parse_args()

    if not os.path.exists(a.dosya):
        print(f"Dosya yok: {a.dosya}"); sys.exit(2)
    os.makedirs(a.kanit_dizini, exist_ok=True)

    pi = parmak_izi(a.dosya)
    print("=" * 74)
    print(f"DOSYA   : {a.dosya}")
    print(f"SHA-256 : {pi}")
    print(f"TARİH   : {datetime.datetime.now():%d.%m.%Y %H:%M}")
    print("=" * 74)

    ozet, eksik_betik, toplam_kaldi = [], [], 0

    for kod, betik, ad, bayraklar, rapor_adi in KATMANLAR:
        yol = os.path.join(a.betik_dizini, betik)
        if not os.path.exists(yol):
            eksik_betik.append(betik)
            ozet.append((kod, ad, "BETİK YOK", None))
            print(f"\n[{kod}] {ad:14} — BETİK YOK: {betik}")
            continue

        rapor = os.path.join(a.kanit_dizini, rapor_adi)
        komut = [sys.executable, yol, a.dosya, "--rapor", rapor]
        if a.spec and "--spec" in bayraklar:
            komut += ["--spec", a.spec]
        if betik == "deger_kapilari.py":
            komut.append("--calisma-zamani")
        if betik == "olcek_testi.py" and a.hizli:
            komut.append("--atla-olcek")

        print(f"\n[{kod}] {ad:14} → {betik}")
        print("-" * 74)
        r = subprocess.run(komut, capture_output=True, text=True)
        print(r.stdout.rstrip() or r.stderr.rstrip())

        kaldi_sayisi = sum(1 for s in r.stdout.splitlines() if s.startswith("! KALDI"))
        toplam_kaldi += kaldi_sayisi
        ozet.append((kod, ad, "KALDI" if r.returncode else "TEMİZ", kaldi_sayisi))

        if r.returncode and not a.devam:
            print(f"\n>>> {kod} katmanı KALDI verdi. Sonraki katmanlar atlandı (--devam ile zorlayın).")
            break

    print("\n" + "=" * 74)
    print("KATMAN ÖZETİ")
    print("=" * 74)
    for kod, ad, durum, n in ozet:
        ek = f"({n} kapı)" if n else ""
        print(f"  {kod}  {ad:14} {durum:10} {ek}")

    if eksik_betik:
        print(f"\n!! EKSİK BETİK: {eksik_betik}")
        print("   Manda tam kapı setini şart koşuyor; eksik betikle SEVK KARARI VERİLEMEZ.")
        sys.exit(2)

    print("\n" + "=" * 74)
    if toplam_kaldi == 0 and len(ozet) == len(KATMANLAR):
        print(f"SONUÇ: 0 KALDI — SEVK EDİLEBİLİR")
        print(f"Kanıt paketi: {a.kanit_dizini}/  |  SHA-256: {pi}")
        sys.exit(0)
    print(f"SONUÇ: {toplam_kaldi} KALDI — SEVK EDİLEMEZ")
    sys.exit(1)


if __name__ == "__main__":
    main()
