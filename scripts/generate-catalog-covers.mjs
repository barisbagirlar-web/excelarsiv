import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.env.CATALOG_COVER_ROOT ?? process.cwd();
const DATA = process.env.CATALOG_COVER_DATA ?? join(ROOT, 'src/data/catalog-covers.json');
const OUT = process.env.CATALOG_COVER_OUT ?? join(ROOT, 'public/catalog-covers');
const W = 800;
const H = 600;

const PALET = {
  'Nakit Akışı': [['#0B5FFF', '#E8F0FF', '#062C7A'], ['#0369A1', '#E0F2FE', '#0C4A6E']],
  'Finansal Analiz': [['#7C3AED', '#F1EBFE', '#3B1D80'], ['#4F46E5', '#EAEAFE', '#241C7A']],
  'Muhasebe ve Vergi': [['#B91C1C', '#FDECEC', '#651010'], ['#C2410C', '#FEEDE3', '#6B2308']],
  'Bütçe ve Planlama': [['#047857', '#E3F5EE', '#023D2C'], ['#0F766E', '#E0F2F0', '#0A4640']],
  'Stok ve Üretim': [['#A16207', '#FBF1DC', '#563405'], ['#854D0E', '#FAF0DA', '#432706']],
  'Satış ve Fiyatlama': [['#BE185D', '#FDE9F2', '#661032'], ['#9D174D', '#FCE7F0', '#4E0A28']],
  'Personel ve Bordro': [['#1D4ED8', '#E6EDFD', '#102C78'], ['#0E7490', '#E2F4F8', '#083B49']],
};

const NOTR_KOYU = '#111827';
const NOTR_ORTA = '#5B6478';
const NOTR_CIZGI = '#DDE1E9';
const ZEMIN = ['beyaz_ust_bant', 'renkli_panel', 'sol_ray', 'beyaz_sade'];
const FONT = 'Inter, Segoe UI, DejaVu Sans, Arial, sans-serif';

function tohum(slug) {
  return BigInt(`0x${createHash('sha256').update(slug).digest('hex')}`);
}
function bit(t, shift, mod) {
  return Number((t >> BigInt(shift)) % BigInt(mod));
}
function sec(t, list, kaydir = 0) {
  return list[bit(t, kaydir * 5, list.length)];
}
function esc(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
function sar(text, max = 34) {
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= max || !current) current = next;
    else { lines.push(current); current = word; }
    if (lines.length === 3) break;
  }
  if (current && lines.length < 3) lines.push(current);
  return lines.slice(0, 3);
}
function n(v) { return Number(v).toFixed(1); }

function gKpiBar(veri, ana, koyu, x, y, w, h) {
  const max = Math.max(...veri.bar) || 1;
  const bw = w / (veri.bar.length * 1.7);
  const parts = veri.bar.map((v, i) => {
    const bh = (v / max) * h;
    const bx = x + i * (w / veri.bar.length) + (w / veri.bar.length - bw) / 2;
    const renk = i === veri.vurgu ? koyu : ana;
    return `<rect x="${n(bx)}" y="${n(y + h - bh)}" width="${n(bw)}" height="${n(bh)}" rx="3" fill="${renk}"/>`;
  });
  parts.push(`<line x1="${x}" y1="${y+h}" x2="${x+w}" y2="${y+h}" stroke="${NOTR_CIZGI}" stroke-width="2"/>`);
  return parts.join('');
}
function gAlan(veri, ana, acik, koyu, x, y, w, h) {
  const d = veri.seri; const max = Math.max(...d); const min = Math.min(...d); const range = max - min || 1;
  const pts = d.map((v, i) => [x + i * w / (d.length - 1), y + h - ((v-min)/range) * h * .85 - h * .08]);
  const line = pts.map(([px,py]) => `${n(px)},${n(py)}`).join(' ');
  const area = `${x},${y+h} ${line} ${x+w},${y+h}`;
  const last = pts.at(-1);
  return `<polygon points="${area}" fill="${acik}"/><polyline points="${line}" fill="none" stroke="${ana}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${n(last[0])}" cy="${n(last[1])}" r="6" fill="${koyu}"/>`;
}
function gIsi(veri, ana, x, y, w, h) {
  const sut=12, sat=6, cw=w/sut, ch=h/sat; const out=[];
  for (let r=0;r<sat;r++) for (let c=0;c<sut;c++) {
    const v=veri.isi[(r*sut+c)%veri.isi.length], op=.12+.88*v;
    out.push(`<rect x="${n(x+c*cw+1.5)}" y="${n(y+r*ch+1.5)}" width="${n(cw-3)}" height="${n(ch-3)}" rx="2.5" fill="${ana}" opacity="${op.toFixed(2)}"/>`);
  }
  return out.join('');
}
function gSerit(veri, ana, acik, koyu, x, y, w, h) {
  const out=[], rows=5, rh=h/rows;
  for (let i=0;i<rows;i++) {
    const [start,len]=veri.serit[i], renk=i===veri.vurgu%rows?koyu:ana;
    out.push(`<rect x="${n(x)}" y="${n(y+i*rh+rh*.22)}" width="${n(w)}" height="${n(rh*.56)}" rx="4" fill="${acik}"/>`);
    out.push(`<rect x="${n(x+start*w)}" y="${n(y+i*rh+rh*.22)}" width="${n(len*w)}" height="${n(rh*.56)}" rx="4" fill="${renk}"/>`);
  }
  return out.join('');
}
function polar(cx, cy, r, deg) { const a=deg*Math.PI/180; return [cx+r*Math.cos(a), cy+r*Math.sin(a)]; }
function gDonut(veri, ana, acik, koyu, x, y, w, h) {
  const cx=x+w/2, cy=y+h/2, r=Math.min(w,h)/2-6, inner=r*.58, colors=[ana,koyu,acik,'#94A3B8'];
  let angle=-90; const out=[];
  veri.donut.forEach((share,i)=>{
    const span=share*360, a2=angle+span, large=span>180?1:0;
    const [x1,y1]=polar(cx,cy,r,angle), [x2,y2]=polar(cx,cy,r,a2), [x3,y3]=polar(cx,cy,inner,a2), [x4,y4]=polar(cx,cy,inner,angle);
    out.push(`<path d="M${n(x1)},${n(y1)} A${n(r)},${n(r)} 0 ${large},1 ${n(x2)},${n(y2)} L${n(x3)},${n(y3)} A${n(inner)},${n(inner)} 0 ${large},0 ${n(x4)},${n(y4)} Z" fill="${colors[i%colors.length]}"/>`);
    angle=a2;
  });
  out.push(`<text x="${n(cx)}" y="${n(cy+7)}" text-anchor="middle" font-size="26" font-weight="700" fill="${NOTR_KOYU}">${Math.floor(veri.donut[0]*100)}%</text>`);
  return out.join('');
}
function gKadran(veri, ana, acik, koyu, x, y, w, h) {
  const cx=x+w/2, cy=y+h*.82, r=Math.min(w/2,h*.78)-8, ratio=veri.skor, a=(180-ratio*180)*Math.PI/180;
  const ex=cx+r*Math.cos(a), ey=cy-r*Math.sin(a); const out=[];
  out.push(`<path d="M${n(cx-r)},${n(cy)} A${n(r)},${n(r)} 0 0,1 ${n(cx+r)},${n(cy)}" fill="none" stroke="${acik}" stroke-width="26" stroke-linecap="round"/>`);
  out.push(`<path d="M${n(cx-r)},${n(cy)} A${n(r)},${n(r)} 0 0,1 ${n(ex)},${n(ey)}" fill="none" stroke="${ana}" stroke-width="26" stroke-linecap="round"/>`);
  if (veri.skorGoster) out.push(`<text x="${n(cx)}" y="${n(cy-6)}" text-anchor="middle" font-size="40" font-weight="800" fill="${koyu}">${Math.floor(ratio*100)}</text>`);
  return out.join('');
}
function gSelale(veri, ana, koyu, x, y, w, h) {
  const d=veri.selale, count=d.length, bw=w/(count*1.5), base=y+h; let cum=0; const out=[];
  const mx=Math.max(...d.map((_,i)=>Math.abs(d.slice(0,i+1).reduce((a,b)=>a+b,0))))||1;
  d.forEach((v,i)=>{ const y0=base-(cum/mx)*h*.9, y1=base-((cum+v)/mx)*h*.9, bx=x+i*(w/count)+(w/count-bw)/2, top=Math.min(y0,y1), bot=Math.max(y0,y1); const color=i===count-1?koyu:(v>=0?ana:'#DC2626'); out.push(`<rect x="${n(bx)}" y="${n(top)}" width="${n(bw)}" height="${n(Math.max(bot-top,4))}" rx="2" fill="${color}"/>`); cum+=v; });
  out.push(`<line x1="${x}" y1="${base}" x2="${x+w}" y2="${base}" stroke="${NOTR_CIZGI}" stroke-width="2"/>`); return out.join('');
}

function dataFor(t, item) {
  const bar=Array.from({length:7},(_,i)=>.35+bit(t,i*7,100)/140);
  const seri=Array.from({length:9},(_,i)=>.3+bit(t,i*5,100)/130);
  const isi=Array.from({length:37},(_,i)=>bit(t,i*3,100)/100);
  const serit=Array.from({length:5},(_,i)=>[bit(t,i*11,40)/100,.25+bit(t,i*13,55)/100]);
  const raw=Array.from({length:4},(_,i)=>.2+bit(t,i*9,60)/100); const total=raw.reduce((a,b)=>a+b,0);
  const selale=[1,...Array.from({length:4},(_,i)=>-.35+bit(t,i*6,60)/100),0];
  return {bar,seri,isi,serit,donut:raw.map(v=>v/total),skor:item.skor ?? (.35+bit(t,9,55)/100),skorGoster:Object.hasOwn(item,'skor'),selale,vurgu:bit(t,17,7)};
}

function cover(item) {
  const t=tohum(item.slug), palettes=PALET[item.kategori] ?? PALET['Finansal Analiz'], [ana,acik,koyu]=sec(t,palettes,1), zem=sec(t,ZEMIN,4), ark=item.arketip, veri=dataFor(t,item);
  const titleLines=sar(item.kisa_baslik,34), bant=74+30*titleLines.length, panY=bant+34, panH=H-panY-45;
  const out=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">`,`<rect width="${W}" height="${H}" fill="#FFFFFF"/>`];
  let pan;
  if (zem==='renkli_panel') { out.push(`<rect width="${W}" height="${H}" fill="${acik}"/>`); pan=[40,panY,W-80,panH]; out.push(`<rect x="${pan[0]}" y="${pan[1]}" width="${pan[2]}" height="${pan[3]}" rx="14" fill="#FFFFFF"/>`); }
  else if (zem==='beyaz_ust_bant') { out.push(`<rect width="${W}" height="${bant}" fill="${ana}"/>`); pan=[40,panY,W-80,panH]; out.push(`<rect x="${pan[0]}" y="${pan[1]}" width="${pan[2]}" height="${pan[3]}" rx="14" fill="#FFFFFF" stroke="${NOTR_CIZGI}" stroke-width="1.5"/>`); }
  else if (zem==='sol_ray') { out.push(`<rect width="18" height="${H}" fill="${ana}"/><rect x="18" width="${W-18}" height="${H}" fill="#FBFCFE"/>`); pan=[60,130,W-100,H-175]; out.push(`<rect x="${pan[0]}" y="${pan[1]}" width="${pan[2]}" height="${pan[3]}" rx="14" fill="#FFFFFF" stroke="${NOTR_CIZGI}" stroke-width="1.5"/>`); }
  else { pan=[40,panY,W-80,panH]; out.push(`<rect x="${pan[0]}" y="${pan[1]}" width="${pan[2]}" height="${pan[3]}" rx="14" fill="#FBFCFE" stroke="${NOTR_CIZGI}" stroke-width="1.5"/>`); }
  const bx=zem==='sol_ray'?78:60, catColor=zem==='beyaz_ust_bant'?'#FFFFFF':ana, titleColor=zem==='beyaz_ust_bant'?'#FFFFFF':NOTR_KOYU;
  out.push(`<text x="${bx}" y="45" font-size="14" font-weight="700" letter-spacing="1.6" fill="${catColor}" opacity=".95">${esc(item.kategori.toUpperCase())}</text>`);
  titleLines.forEach((line,i)=>out.push(`<text x="${bx}" y="${78+i*30}" font-size="26" font-weight="700" fill="${titleColor}">${esc(line)}</text>`));
  const ix=pan[0]+28, iy=pan[1]+26, iw=pan[2]-56, ih=pan[3]-52, kpi=item.kpi;
  if (ark==='karar_rozeti') {
    const colors={UYGUN:'#047857','İNCELE':'#B45309',DURDUR:'#B91C1C'}, karar=item.karar ?? 'UYGUN', c=colors[karar] ?? '#047857';
    out.push(`<rect x="${ix}" y="${iy}" width="${iw}" height="96" rx="10" fill="${c}" opacity=".09"/><text x="${ix+26}" y="${iy+62}" font-size="44" font-weight="800" fill="${c}">${esc(karar)}</text>`);
    out.push(`<text x="${ix+iw-26}" y="${iy+40}" text-anchor="end" font-size="13" font-weight="700" fill="${NOTR_ORTA}" letter-spacing="1.2">KARAR ÇIKTISI</text><text x="${ix+iw-26}" y="${iy+64}" text-anchor="end" font-size="15" fill="${NOTR_ORTA}">${esc(item.rozet ?? 'formül temelli')}</text>`);
    out.push(gKadran(veri,ana,acik,koyu,ix,iy+118,iw*.42,ih-130));
    const gx=ix+iw*.5; kpi.slice(0,3).forEach(([et,dg],i)=>{const yy=iy+140+i*62; out.push(`<text x="${gx}" y="${yy}" font-size="13" font-weight="600" fill="${NOTR_ORTA}" letter-spacing=".6">${esc(et.toUpperCase())}</text><text x="${gx}" y="${yy+30}" font-size="27" font-weight="700" fill="${NOTR_KOYU}">${esc(dg)}</text>`);});
  } else if (ark==='buyuk_rakam_alan') {
    const [et,dg]=kpi[0]; out.push(`<text x="${ix}" y="${iy+22}" font-size="14" font-weight="700" fill="${NOTR_ORTA}" letter-spacing="1.2">${esc(et.toUpperCase())}</text><text x="${ix}" y="${iy+82}" font-size="58" font-weight="800" fill="${koyu}">${esc(dg)}</text>`);
    kpi.slice(1,4).forEach(([e,d],i)=>{const xx=ix+iw*.52+(i%2)*(iw*.24), yy=iy+26+Math.floor(i/2)*56; out.push(`<text x="${n(xx)}" y="${yy}" font-size="12" font-weight="600" fill="${NOTR_ORTA}">${esc(e.toUpperCase())}</text><text x="${n(xx)}" y="${yy+26}" font-size="21" font-weight="700" fill="${NOTR_KOYU}">${esc(d)}</text>`);});
    out.push(gAlan(veri,ana,acik,koyu,ix,iy+120,iw,ih-140));
  } else {
    const count=Math.min(kpi.length,4), kw=iw/count; kpi.slice(0,count).forEach(([et,dg],i)=>{const xx=ix+i*kw;if(i)out.push(`<line x1="${n(xx-10)}" y1="${iy}" x2="${n(xx-10)}" y2="${iy+72}" stroke="${NOTR_CIZGI}" stroke-width="1.5"/>`);out.push(`<text x="${n(xx)}" y="${iy+20}" font-size="12" font-weight="700" fill="${NOTR_ORTA}" letter-spacing=".8">${esc(et.toUpperCase())}</text><text x="${n(xx)}" y="${iy+56}" font-size="27" font-weight="800" fill="${koyu}">${esc(dg)}</text>`);});
    const gy=iy+96, gh=ih-110;
    if (ark==='kpi_bar') out.push(gKpiBar(veri,ana,koyu,ix,gy,iw,gh));
    else if (ark==='isi_haritasi') out.push(gIsi(veri,ana,ix,gy,iw,gh));
    else if (ark==='vade_seridi') out.push(gSerit(veri,ana,acik,koyu,ix,gy,iw,gh));
    else if (ark==='donut_dagilim') out.push(gDonut(veri,ana,acik,koyu,ix,gy,iw,gh));
    else if (ark==='gosterge_kadran') out.push(gKadran(veri,ana,acik,koyu,ix,gy,iw,gh));
    else if (ark==='selale') out.push(gSelale(veri,ana,koyu,ix,gy,iw,gh));
  }
  out.push(`<line x1="40" y1="${H-58}" x2="${W-40}" y2="${H-58}" stroke="${NOTR_CIZGI}" stroke-width="1.5"/><text x="${bx}" y="${H-30}" font-size="14" font-weight="700" fill="${ana}" letter-spacing="1.2">EXCEL ARŞİV</text><text x="${W-60}" y="${H-30}" text-anchor="end" font-size="14" fill="${NOTR_ORTA}">${item.sayfa} sayfa · XLSX · açık formül</text></svg>`);
  return out.join('');
}

const items = JSON.parse(await readFile(DATA, 'utf8'));
if (!Array.isArray(items) || items.length !== 50) throw new Error(`CATALOG_COVER_DATA_INVALID:${Array.isArray(items) ? items.length : 'not-array'}`);
const slugs = new Set();
for (const item of items) {
  if (!item?.slug || slugs.has(item.slug)) throw new Error(`CATALOG_COVER_SLUG_INVALID:${item?.slug ?? 'missing'}`);
  slugs.add(item.slug);
}
await rm(OUT,{recursive:true,force:true});
await mkdir(OUT,{recursive:true});
for (const item of items) await writeFile(join(OUT, `${item.slug}.svg`), cover(item), 'utf8');
console.log(`catalog covers generated: ${items.length}`);
