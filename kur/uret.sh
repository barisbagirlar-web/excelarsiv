#!/usr/bin/env bash
# kur/uret.sh — KASA-PRO üretim zinciri: üret → LibreOffice hesapla → cache enjekte
# Kullanım: bash kur/uret.sh [SPEC.yaml] [çıktı.xlsx]
set -euo pipefail
KOK="$(cd "$(dirname "$0")/.." && pwd)"
PY="$KOK/.venv-dogrula/bin/python"
SPEC="${1:-$KOK/delivery/paid-products/akilli-kasa-defteri-ve-nakit-kontrol-sistemi/SPEC.yaml}"
CIKTI="${2:-$KOK/cikti/akilli-kasa-defteri-ve-nakit-kontrol-sistemi.xlsx}"
HESAPLI="$(mktemp -t kasa-hesapli-XXXX).xlsx"
trap 'rm -f "$HESAPLI"' EXIT

"$PY" "$KOK/kur/ana.py" "$SPEC" "$CIKTI"
"$PY" "$KOK/yeni_calisma_ilkeleri/recalc.py" "$CIKTI" 180 --cikti "$HESAPLI" | tail -1
"$PY" "$KOK/kur/cache_yaz.py" "$CIKTI" "$HESAPLI"
echo "[uret] TAMAM → $CIKTI"
