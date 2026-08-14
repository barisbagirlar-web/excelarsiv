#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
seo_gate.py — excelarsiv.com SEO Düzeltme Mandatosu / Makine Doğrulayıcı
Kullanim:
    python3 seo_gate.py                      # canli siteyi denetler
    python3 seo_gate.py --base http://localhost:4321   # local build denetler
    python3 seo_gate.py --json rapor.json    # makine okunur cikti
Cikis kodu: 0 = tum invariantlar gecti, 1 = en az bir INV kirildi.
Bagimlilik yok (yalnız Python 3.9+ stdlib).
"""
import argparse, json, re, sys, html as _html, collections, urllib.request, urllib.error, gzip, io

UA = "excelarsiv-seo-gate/1.0"
FAILS, WARNS, INFO = [], [], []


def fail(inv, msg):
    FAILS.append((inv, msg))


def warn(inv, msg):
    WARNS.append((inv, msg))


def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "gzip"})
    try:
        r = urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError as e:
        try:
            eb = e.read()
            if (e.headers.get("Content-Encoding") or "").lower() == "gzip":
                eb = gzip.GzipFile(fileobj=io.BytesIO(eb)).read()
            body = eb.decode("utf-8", "ignore")
        except Exception:
            body = ""
        return e.code, dict(e.headers), (b"" if binary else body)
    except Exception:
        return 0, {}, (b"" if binary else "")
    raw = r.read()
    if (r.headers.get("Content-Encoding") or "").lower() == "gzip":
        raw = gzip.GzipFile(fileobj=io.BytesIO(raw)).read()
    return r.status, dict(r.headers), raw if binary else raw.decode("utf-8", "ignore")


def head_only(url):
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": UA})
    try:
        r = urllib.request.urlopen(req, timeout=20)
        return r.status, {k.lower(): v for k, v in r.headers.items()}
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in e.headers.items()}
    except Exception:
        return 0, {}


def no_redirect(url):
    class NR(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k):
            return None
    op = urllib.request.build_opener(NR)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        r = op.open(req, timeout=20)
        return r.status, r.headers.get("Location", "")
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Location", "")
    except Exception:
        return 0, ""


def ld_nodes(h):
    out = []
    for b in re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', h, re.S):
        try:
            o = json.loads(b)
        except Exception:
            out.append({"@type": "__PARSE_FAIL__"})
            continue
        g = o.get("@graph", [o]) if isinstance(o, dict) else o
        out += (g if isinstance(g, list) else [g])
    return out


def by_type(nodes, t):
    return [n for n in nodes if isinstance(n, dict) and n.get("@type") == t]


def visible_words(h):
    x = re.sub(r'<script.*?</script>', ' ', h, flags=re.S)
    x = re.sub(r'<style.*?</style>', ' ', x, flags=re.S)
    return len(_html.unescape(re.sub(r'<[^>]+>', ' ', x)).split())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="https://excelarsiv.com")
    ap.add_argument("--json", default="")
    a = ap.parse_args()
    B = a.base.rstrip("/")

    # ---------- sitemap toplama ----------
    st, _, sm = get(B + "/sitemap.xml")
    if st != 200:
        fail("INV-10", f"sitemap.xml HTTP {st}")
        print("KRITIK: sitemap alinamadi, denetim durduruldu.")
        sys.exit(1)
    children = re.findall(r"<loc>([^<]+)</loc>", sm)
    urls, child_maps = [], {}
    for c in children:
        cs, _, cx = get(c)
        if cs != 200:
            fail("INV-10", f"alt sitemap {c} HTTP {cs}")
            continue
        locs = re.findall(r"<loc>([^<]+)</loc>", cx)
        lastmods = re.findall(r"<lastmod>([^<]+)</lastmod>", cx)
        child_maps[c] = (locs, lastmods)
        urls += locs
    urls = list(dict.fromkeys(urls))
    INFO.append(f"sitemap URL sayisi: {len(urls)}")

    # ---------- INV-10..13 sitemap ----------
    for c, (locs, lms) in child_maps.items():
        if len(lms) != len(locs):
            fail("INV-11", f"{c}: her <url> icin <lastmod> yok ({len(lms)}/{len(locs)})")
        if "product" in c and len(set(lms)) < 5:
            fail("INV-12", f"{c}: lastmod tekduzeligi — {len(set(lms))} benzersiz tarih (min 5). "
                           "Build damgasi yerine icerik hash'i kullanilmali.")
    if not any("image" in c for c in child_maps):
        fail("INV-13", "sitemap-images.xml yok veya index'e bagli degil.")

    # ---------- routing invariantlari ----------
    for u, why in [("http://" + B.split("://")[1] + "/", "http->https"),
                   (B.replace("://", "://www.") + "/", "www->apex"),
                   (B + "/sablonlar/", "trailing slash"),
                   (B + "/index.html", "index.html")]:
        code, loc = no_redirect(u)
        if code != 301:
            fail("INV-01", f"{why}: HTTP {code} (301 bekleniyor)")
        else:
            nxt = loc if loc.startswith("http") else (B + loc if loc else "")
            c2, l2 = no_redirect(nxt) if nxt else (200, "")
            if c2 in (301, 302, 307, 308):
                fail("INV-01", f"{why}: yonlendirme zinciri ({u} -> {loc} -> {l2})")

    c404, _, b404 = get(B + "/bu-sayfa-kesinlikle-yok-9x8y7z")
    if c404 != 404:
        fail("INV-02", f"bilinmeyen URL HTTP {c404} (404 bekleniyor / soft-404)")
    else:
        m = re.search(r'<meta name="robots" content="(.*?)"', b404)
        if not m or "noindex" not in m.group(1):
            fail("INV-02", "404 sayfasinda robots=noindex yok")

    st, _, rb = get(B + "/robots.txt")
    if st != 200:
        fail("INV-03", f"robots.txt HTTP {st}")
    else:
        if "Sitemap:" not in rb:
            fail("INV-03", "robots.txt icinde Sitemap satiri yok")
        for bot in ["GPTBot", "ClaudeBot", "PerplexityBot", "OAI-SearchBot",
                    "Google-Extended", "Applebot-Extended", "Amazonbot",
                    "meta-externalagent", "CCBot", "Bytespider", "cohere-ai"]:
            if bot not in rb:
                fail("INV-03", f"robots.txt icinde {bot} icin acik kural yok")

    for f in ["/llms.txt", "/llms-full.txt"]:
        st, _, body = get(B + f)
        if st != 200:
            fail("INV-04", f"{f} HTTP {st}")
        elif "Son guncelleme" not in body and "Son güncelleme" not in body:
            fail("INV-04", f"{f} icinde 'Son güncelleme: <ISO tarih>' satiri yok")

    # ---------- sayfa sayfa ----------
    pages = {}
    for u in urls:
        st, hd, h = get(u)
        if st != 200:
            fail("INV-05", f"sitemap URL'i 200 donmuyor: {u} -> {st}")
            continue
        p = u.replace(B, "") or "/"
        nodes = ld_nodes(h)
        pages[p] = dict(h=h, hd=hd, nodes=nodes)

    titles, descs = collections.Counter(), collections.Counter()

    for p, d in pages.items():
        h, nodes = d["h"], d["nodes"]
        g = lambda pat: (re.search(pat, h, re.S).group(1).strip()
                         if re.search(pat, h, re.S) else "")
        t = g(r'<title[^>]*>(.*?)</title>')
        de = g(r'<meta name="description" content="(.*?)"')
        can = g(r'<link rel="canonical" href="(.*?)"')
        titles[t] += 1
        descs[de] += 1

        # INV-20 metadata
        if not t or not (25 <= len(t) <= 62):
            fail("INV-20", f"{p}: title uzunlugu {len(t)} (25-62 bekleniyor)")
        if not de or not (70 <= len(de) <= 165):
            fail("INV-20", f"{p}: description uzunlugu {len(de)} (70-165 bekleniyor)")
        if can.replace(B, "") not in (p, p + "/"):
            fail("INV-21", f"{p}: canonical uyusmuyor -> {can}")

        # INV-22 basliklar
        hs = [int(x[1]) for x in re.findall(r'<(h[1-6])[^>]*>', h)]
        if hs.count(1) != 1:
            fail("INV-22", f"{p}: H1 sayisi {hs.count(1)} (1 bekleniyor)")
        skips = [(hs[i], hs[i + 1]) for i in range(len(hs) - 1) if hs[i + 1] - hs[i] > 1]
        if skips:
            fail("INV-23", f"{p}: baslik sirasi atlamasi {skips[:3]}")

        # INV-24 SSR bos-durum sizintisi
        for leak in ["Sonuç bulunamadı", "Sonuc bulunamadi"]:
            if leak in re.sub(r'<script.*?</script>', '', h, flags=re.S):
                fail("INV-24", f"{p}: SSR ciktisinda bos-durum metni ('{leak}') render ediliyor")
                break

        # INV-25 gorseller
        for img in re.findall(r'<img[^>]+>', h):
            if 'alt=' not in img:
                fail("INV-25", f"{p}: alt'siz <img>")
            if 'width=' not in img or 'height=' not in img:
                fail("INV-26", f"{p}: width/height'siz <img> (CLS)")
            if 'loading=' not in img:
                warn("INV-26", f"{p}: loading yok <img>")

        # INV-30 JSON-LD parse
        if any(n.get("@type") == "__PARSE_FAIL__" for n in nodes):
            fail("INV-30", f"{p}: JSON-LD parse hatasi")

        # INV-31 Organization tam entity
        orgs = by_type(nodes, "Organization")
        if not orgs:
            fail("INV-31", f"{p}: Organization node'u yok")
        else:
            o = orgs[0]
            req = ["name", "url", "logo", "description", "email", "address", "contactPoint"]
            miss = [k for k in req if k not in o]
            if miss:
                fail("INV-31", f"{p}: Organization eksik alan {miss}")
            if isinstance(o.get("logo"), dict) and o["logo"].get("@type") != "ImageObject":
                fail("INV-31", f"{p}: Organization.logo ImageObject degil")
            if "sameAs" in o and (not o["sameAs"]):
                fail("INV-32", f"{p}: sameAs bos dizi — alan hic yazilmamali")

        # INV-33 WebSite SearchAction
        ws = by_type(nodes, "WebSite")
        if ws and "potentialAction" not in ws[0]:
            fail("INV-33", f"{p}: WebSite.potentialAction (SearchAction) yok")

        # INV-34 @id referans butunlugu (ic-sayfa; capraz sayfa referansi mesru)
        defined = set()

        def collect(x):
            if isinstance(x, dict):
                if x.get("@id") and x.get("@type"):
                    defined.add(x["@id"])
                for v in x.values():
                    collect(v)
            elif isinstance(x, list):
                for v in x:
                    collect(v)

        collect(nodes)
        page_abs = B + (p if p != "/" else "/")
        refs = set(re.findall(r'"@id"\s*:\s*"([^"]+)"', json.dumps(nodes, ensure_ascii=False)))
        broken = {r for r in refs
                  if "#" in r and r not in defined
                  and (r.split("#")[0].rstrip("/") in (page_abs.rstrip("/"), B))}
        if broken:
            fail("INV-34", f"{p}: kirik @id referansi {sorted(broken)[:3]}")

        # INV-40 urun sayfalari
        if p.startswith("/sablon/"):
            pr = by_type(nodes, "Product")
            if not pr:
                fail("INV-40", f"{p}: Product node'u yok")
            else:
                n = pr[0]
                for k in ["name", "description", "image", "brand", "sku", "offers"]:
                    if k not in n:
                        fail("INV-40", f"{p}: Product.{k} yok")
                of = n.get("offers", {})
                for k in ["price", "priceCurrency", "availability", "url",
                          "priceValidUntil", "itemCondition", "hasMerchantReturnPolicy"]:
                    if k not in of:
                        fail("INV-41", f"{p}: Offer.{k} yok")
                # fiyat DOM ile ayni mi
                vis = re.sub(r'<script.*?</script>', ' ', h, flags=re.S)
                vis = _html.unescape(re.sub(r'<[^>]+>', ' ', vis))
                vis = re.sub(r'\s+', ' ', vis)
                dom = re.findall(r'([\d]{1,3}(?:\.[\d]{3})*)\s*(?:TL|₺)', vis)
                if of.get("price") is not None and dom:
                    want = str(of["price"]).replace(".0", "")
                    norm = {x.replace(".", "") for x in dom}
                    if want not in norm:
                        fail("INV-42", f"{p}: JSON-LD price={want} DOM'da bulunamadi (ilk 5: {dom[:5]})")
                if "aggregateRating" in n or "review" in n:
                    fail("INV-43", f"{p}: gercek yorum yokken aggregateRating/review yazilmis")
            if not by_type(nodes, "BreadcrumbList"):
                fail("INV-44", f"{p}: BreadcrumbList yok")

        # INV-50 liste sayfalari
        if p == "/" or p == "/sablonlar" or p == "/rehber" or p.startswith("/sablonlar/"):
            need = ["ItemList"] + (["CollectionPage", "BreadcrumbList"]
                                   if p not in ("/",) else [])
            for t2 in need:
                if not by_type(nodes, t2):
                    fail("INV-50", f"{p}: {t2} node'u yok")
            il = by_type(nodes, "ItemList")
            if il:
                n = il[0]
                items = n.get("itemListElement", [])
                shown = len(set(re.findall(r'href="(/sablon/[^"#?]+)"', h))) if "sablon" in p or p == "/" else len(items)
                if "numberOfItems" not in n:
                    fail("INV-51", f"{p}: ItemList.numberOfItems yok")
                elif p.startswith("/sablonlar") and n.get("numberOfItems") != len(items):
                    fail("INV-51", f"{p}: numberOfItems={n.get('numberOfItems')} != itemListElement={len(items)}")

        # INV-52 iletisim
        if p == "/iletisim" and not by_type(nodes, "ContactPage"):
            fail("INV-52", "/iletisim: ContactPage node'u yok")

        # INV-53 olu schema
        if by_type(nodes, "HowTo"):
            fail("INV-53", f"{p}: HowTo schema (Google 2023'te kaldirdi) — Article/FAQPage kullan")

        # INV-60 render yolu
        head = h.split("</head>")[0]
        css = re.search(r'<link[^>]+rel="stylesheet"', head)
        ga = re.search(r'gtag|googletagmanager|G-[A-Z0-9]{8,}', head)
        if ga and css and ga.start() < css.start():
            fail("INV-60", f"{p}: olcum scripti stylesheet'ten ONCE (render blokluyor)")
        for s in re.findall(r'<script[^>]*src=[^>]*>', h):
            if 'defer' not in s and 'async' not in s and 'type="module"' not in s:
                fail("INV-61", f"{p}: defer/async'siz harici script")

    # INV-70 benzersizlik
    for t, c in titles.items():
        if c > 1:
            fail("INV-70", f"duplicate title x{c}: {t[:60]}")
    for de, c in descs.items():
        if c > 1:
            fail("INV-70", f"duplicate description x{c}: {de[:60]}")

    # INV-80 header
    st, hd = head_only(B + "/sablonlar")
    cc = hd.get("cache-control", "")
    if "no-cache" in cc or "no-store" in cc:
        fail("INV-80", f"HTML Cache-Control edge cache'i devre disi birakiyor: '{cc}'")
    for hn in ["strict-transport-security", "x-content-type-options", "referrer-policy"]:
        if hn not in hd:
            fail("INV-81", f"{hn} header'i yok")

    # ---------- rapor ----------
    print("=" * 72)
    print("EXCELARSIV SEO GATE — SONUC")
    print("=" * 72)
    for i in INFO:
        print("  bilgi:", i)
    print(f"\n  Denetlenen sayfa: {len(pages)}")
    print(f"  KIRIK invariant : {len(FAILS)}")
    print(f"  Uyari           : {len(WARNS)}\n")
    grouped = collections.defaultdict(list)
    for inv, m in FAILS:
        grouped[inv].append(m)
    for inv in sorted(grouped):
        print(f"[{inv}] x{len(grouped[inv])}")
        for m in grouped[inv][:6]:
            print("   -", m)
        if len(grouped[inv]) > 6:
            print(f"   ... +{len(grouped[inv]) - 6} tane daha")
    if a.json:
        json.dump({"fails": FAILS, "warns": WARNS, "pages": len(pages)},
                  open(a.json, "w"), ensure_ascii=False, indent=1)
    print("\nKAPI:", "GECTI ✅" if not FAILS else "KIRILDI ❌")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
