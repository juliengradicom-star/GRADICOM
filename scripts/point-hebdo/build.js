// Point hebdo (avec le gérant) GRADICOM • AMR — format 16:9, style sobre (fond clair, bleu nuit + or)
const pptxgen = require('pptxgenjs');
const fs = require('fs'), path = require('path');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
const OUT = process.argv[2] || 'Point_Hebdo.pptx';
const W = 13.333, H = 7.5;
const NAVY = '1C1C1E', GOLD = 'B08D3C', BG = 'FFFFFF', INK = '1A1A1A', MUTED = '6B7280', LINE = 'C9CCD2', WHITE = 'FFFFFF';
const OKF = '1E8E4E', OKT = 'FFFFFF', KOF = 'D0112B', KOT = 'FFFFFF', TINT = 'FFF2CC';
const pres = new pptxgen();
pres.defineLayout({ name: 'W', width: W, height: H }); pres.layout = 'W';
pres.theme = { headFontFace: 'Calibri', bodyFontFace: 'Calibri' };
pres.title = 'Point hebdo GRADICOM • AMR';
const footer = `Point hebdo du ${D.date}`;
pres.defineSlideMaster({ title: 'Couverture', background: { color: '111111' }, objects: [] });
pres.defineSlideMaster({ title: 'Page', background: { color: BG }, slideNumber: { x: 12.3, y: 7.08, w: 0.6, h: 0.25, fontFace: 'Calibri', fontSize: 10, color: MUTED, align: 'right' }, objects: [
  { text: { text: 'GRADICOM  •  AMR', options: { x: 0.6, y: 0.28, w: 6, h: 0.25, fontFace: 'Calibri', fontSize: 10.5, bold: true, color: MUTED, charSpacing: 4, margin: 0 } } },
  { rect: { x: 0.6, y: 1.25, w: 12.15, h: 0.03, fill: { color: GOLD } } },
  { text: { text: footer, options: { x: 0.6, y: 7.08, w: 8, h: 0.25, fontFace: 'Calibri', fontSize: 10, color: MUTED, margin: 0 } } },
  { placeholder: { options: { name: 'titre', type: 'title', x: 0.6, y: 0.52, w: 11.5, h: 0.68, fontFace: 'Calibri', fontSize: 28, bold: true, color: NAVY, align: 'left', valign: 'middle', margin: 0 }, text: 'Titre' } }
] });

const bd = [{ type: 'solid', color: LINE, pt: 0.5 }, { type: 'none' }, { type: 'solid', color: LINE, pt: 0.5 }, { type: 'none' }];
const bdW = { type: 'solid', color: WHITE, pt: 2 };
const head = (t, o = {}) => ({ text: t, options: Object.assign({ bold: true, color: WHITE, fill: { color: NAVY }, align: 'center', valign: 'middle', fontSize: 12, border: bd }, o) });
const lab = (t, o = {}) => ({ text: t, options: Object.assign({ bold: true, color: NAVY, fill: { color: 'F3F4F6' }, align: 'center', valign: 'middle', fontSize: 12, border: bd }, o) });
const cel = (t, o = {}) => ({ text: String(t), options: Object.assign({ color: INK, fill: { color: WHITE }, align: 'center', valign: 'middle', fontSize: 12, border: bd }, o) });
const num = v => parseFloat(String(v).replace(/\s/g, '').replace(',', '.').replace('%', ''));
const ro = (v, o = {}) => {
  const n = num(v);
  if (isNaN(n)) return cel(v, Object.assign({ color: '9CA3AF', fill: { color: 'F3F4F6' } }, o));
  return cel(v, Object.assign({ bold: true, color: n < 100 ? KOT : OKT, fill: { color: n < 100 ? KOF : OKF }, border: bdW }, o));
};
const evol = (n, txt, o = {}) => cel(txt, Object.assign({ bold: true, color: n < 0 ? KOT : OKT, fill: { color: n < 0 ? KOF : OKF }, border: bdW }, o));

// ---- 1. Couverture
let s = pres.addSlide({ masterName: 'Couverture' });
s.addText('GRADICOM  •  AMR', { x: 0.9, y: 1.0, w: 8, h: 0.4, fontFace: 'Calibri', fontSize: 16, bold: true, color: 'A8A8A8', charSpacing: 6, margin: 0, isTextBox: true });
s.addText('POINT HEBDO', { x: 0.9, y: 2.5, w: 11, h: 1.4, fontFace: 'Calibri', fontSize: 72, bold: true, color: WHITE, margin: 0, valign: 'middle', isTextBox: true });
s.addShape(pres.shapes.RECTANGLE, { x: 0.9, y: 4.15, w: 3.2, h: 0.03, fill: { color: GOLD }, line: { color: GOLD, width: 0 }, objectName: 'Filet' });
s.addText(D.date, { x: 0.9, y: 4.4, w: 8, h: 0.6, fontFace: 'Calibri', fontSize: 26, color: 'D4B15F', margin: 0, isTextBox: true });
s.addText('LANGON   •   GRADIGNAN   •   COGNAC   •   MARMANDE', { x: 0.9, y: 6.5, w: 10, h: 0.35, fontFace: 'Calibri', fontSize: 12, color: 'A8A8A8', charSpacing: 3, margin: 0, isTextBox: true });

// ---- 2. R/O Magasin (une ligne par item, 3 colonnes par magasin)
s = pres.addSlide({ masterName: 'Page' });
s.addText(`R/O Magasin au ${D.dateDonnees}`, { placeholder: 'titre' });
{
  const R = D.roMagasins;
  const rows = [[head('', { rowspan: 3 }), ...R.magasins.map(m => head(m, { colspan: 3, fontSize: 13 }))],
    [...R.jours.map(j => head(`${j} jours travaillés`, { colspan: 3, fontSize: 10, bold: false, fill: { color: '3A3A3C' } }))],
    [...R.magasins.flatMap(() => ['Obj', 'Réa', 'R/O'].map(t => head(t, { fontSize: 10.5, fill: { color: '3A3A3C' } })))]];
  R.items.forEach(r => rows.push([lab(r.item, { align: 'left', fontSize: 12 }), ...R.magasins.flatMap((m, i) => [cel(r.obj[i], { fontSize: 11.5 }), cel(r.rea[i], { fontSize: 11.5 }), ro(r.ro[i], { fontSize: 12.5 })])]));
  s.addTable(rows, { x: 0.6, y: 1.45, w: 12.15, colW: [1.95, ...R.magasins.flatMap(() => [0.9, 0.75, 0.9])], rowH: [0.4, 0.28, 0.3, ...R.items.map(() => 0.5)], fontFace: 'Calibri', margin: [0, 0.06, 0, 0.06], objectName: 'R/O magasins' });
}

// ---- 3. R/O Vendeurs
s = pres.addSlide({ masterName: 'Page' });
s.addText(`R/O Vendeurs au ${D.dateDonnees}`, { placeholder: 'titre' });
{
  const V = D.roVendeurs;
  const rows = [[head('', { fontSize: 10 }), ...V.colonnes.map(c => head(c, { fontSize: 9.5 }))]];
  V.lignes.forEach(l => rows.push([lab(l[0], { align: 'left', fontSize: 11.5 }), ...l.slice(1).map(v => v === null ? ro('#DIV/0!', { fontSize: 10 }) : ro(fmtPct(v), { fontSize: 11.5 }))]));
  s.addTable(rows, { x: 0.6, y: 1.45, w: 12.15, colW: [1.3, ...V.colonnes.map(() => (12.15 - 1.3) / V.colonnes.length)], rowH: [0.55, ...V.lignes.map(() => 0.345)], fontFace: 'Calibri', margin: [0, 0.05, 0, 0.05], objectName: 'R/O vendeurs' });
}
function fmtPct(v) { return v.toFixed(2).replace('.', ',') + '%'; }

// ---- 4. Évolution 2026 vs 2025
s = pres.addSlide({ masterName: 'Page' });
s.addText(`Evolution 2026 vs 2025 au ${D.dateDonnees}`, { placeholder: 'titre' });
{
  const E = D.evolution, rows = [[head('', { colspan: 2 }), ...E.magasins.map(m => head(m, { fontSize: 13 }))]];
  E.items.forEach(it => {
    const t = it.surligne ? { fill: { color: TINT } } : {};
    rows.push([lab(it.item, Object.assign({ rowspan: 3, fontSize: 12.5 }, t)), lab('2026', Object.assign({ bold: false, color: INK }, t)), ...it.y26.map(v => cel(v, { fontSize: 13 }))]);
    rows.push([lab('2025', Object.assign({ bold: false, italic: true, color: MUTED }, t)), ...it.y25.map(v => cel(v, { italic: true, color: MUTED, fontSize: 13 }))]);
    rows.push([lab('Evol', Object.assign({ bold: false, italic: true, color: INK }, t)), ...it.evol.map(n => evol(n, n + '%', { fontSize: 13 }))]);
  });
  s.addTable(rows, { x: 1.4, y: 1.5, w: 10.5, colW: [1.9, 1.0, ...E.magasins.map(() => 1.9)], rowH: [0.4, ...E.items.flatMap(() => [0.34, 0.34, 0.34])], fontFace: 'Calibri', margin: [0, 0.06, 0, 0.06], objectName: 'Evolution' });
}

// ---- 5. Évolution des flux
s = pres.addSlide({ masterName: 'Page' });
s.addText(`Evolution flux 2026 vs 2025 au ${D.dateDonnees}`, { placeholder: 'titre' });
{
  const F = D.flux;
  const rows = [[head(''), head('DILAX 2025', { fontSize: 13 }), head('DILAX 2026', { fontSize: 13 }), head('EVOL', { fontSize: 13 })]];
  F.forEach(r => rows.push([lab(r[0], { align: 'left', fontSize: 13 }), cel(r[1], { fontSize: 14 }), cel(r[2], { fontSize: 14 }), evol(num(r[3]), r[3], { fontSize: 14 })]));
  s.addTable(rows, { x: 0.6, y: 1.6, w: 6.2, colW: [1.9, 1.4, 1.4, 1.5], rowH: [0.5, ...F.map(() => 0.58)], fontFace: 'Calibri', margin: [0, 0.08, 0, 0.08], objectName: 'Flux' });
  const mag = F.filter(r => r[0] !== 'TDG');
  s.addChart(pres.charts.BAR, [{ name: 'DILAX 2025', labels: mag.map(r => r[0]), values: mag.map(r => r[1]) }, { name: 'DILAX 2026', labels: mag.map(r => r[0]), values: mag.map(r => r[2]) }], {
    x: 7.2, y: 1.45, w: 5.6, h: 4.6, barDir: 'col', barGapWidthPct: 60, chartColors: ['BFBFBF', GOLD], showValue: true, dataLabelFontSize: 10, dataLabelColor: INK, dataLabelPosition: 'outEnd',
    catAxisLabelColor: INK, catAxisLabelFontSize: 11, valAxisHidden: true, valGridLine: { style: 'none' }, showLegend: true, legendPos: 'b', legendFontSize: 11, legendColor: INK,
    showTitle: true, title: 'Flux par magasin', titleFontSize: 13, titleColor: NAVY, titleFontFace: 'Calibri' });
}

// ---- 6. Satisfaction client Goodays
s = pres.addSlide({ masterName: 'Page' });
s.addText(`SATISFACTION CLIENT – GOODAYS au ${D.dateDonnees}`, { placeholder: 'titre' });
D.goodays.forEach((g, i) => {
  const x = 0.6 + (i % 2) * 6.2, y = 1.45 + Math.floor(i / 2) * 2.8, w = 6.0, h = 2.65;
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: WHITE }, line: { color: LINE, width: 0.75 }, objectName: 'Carte ' + g.magasin });
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 0.4, fill: { color: NAVY }, line: { color: NAVY, width: 0 }, objectName: 'Bandeau ' + g.magasin });
  s.addText(g.magasin, { x: x + 0.2, y, w: w - 0.4, h: 0.4, fontFace: 'Calibri', fontSize: 13, bold: true, color: WHITE, charSpacing: 3, valign: 'middle', margin: 0, isTextBox: true });
  s.addText([{ text: g.note, options: { fontSize: 40, bold: true, fontFace: 'Calibri', color: NAVY } }, { text: ' /5', options: { fontSize: 16, color: MUTED } }], { x: x + 0.2, y: y + 0.6, w: 1.9, h: 0.9, valign: 'middle', margin: 0, isTextBox: true });
  s.addText(g.participations, { x: x + 0.2, y: y + 1.5, w: 1.9, h: 0.4, fontFace: 'Calibri', fontSize: 12, color: MUTED, margin: 0, isTextBox: true });
  const th = (t, al) => ({ text: t, options: { bold: true, color: NAVY, fontSize: 10.5, align: al, valign: 'middle', border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', color: GOLD, pt: 1 }, { type: 'none' }] } });
  const td = (t, al, b) => ({ text: t, options: { color: INK, bold: !!b, fontSize: 11.5, align: al, valign: 'middle', border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', color: 'F3F4F6', pt: 0.5 }, { type: 'none' }] } });
  const rows = [[th('', 'center'), th('Login vendeur', 'left'), th('Note satis.', 'center'), th('Part.', 'center')], ...g.lignes.map(l => [td(l[0], 'center'), td(l[1], 'left'), td(l[2], 'center', true), td(l[3], 'center')])];
  s.addTable(rows, { x: x + 2.2, y: y + 0.55, w: 3.6, colW: [0.4, 1.6, 0.95, 0.65], rowH: [0.3, ...g.lignes.map(() => Math.min(0.4, 2.0 / (g.lignes.length + 1)))], fontFace: 'Calibri', fill: { color: WHITE }, margin: [0, 0.05, 0, 0.05], objectName: 'Goodays ' + g.magasin });
});

// ---- 7. Actu : challenge de fin d'année (devis détaillé)
s = pres.addSlide({ masterName: 'Page' });
s.addText('ACTU', { placeholder: 'titre' });
{
  const A = D.actu, IM = f => path.join(__dirname, 'assets', f);
  s.addText(A.sousTitre, { x: 0.6, y: 1.38, w: 12.15, h: 0.4, fontFace: 'Calibri', fontSize: 20, bold: true, color: NAVY, margin: 0, isTextBox: true });
  s.addImage({ path: IM('djerba_piscine.png'), x: 0.6, y: 1.9, w: 4.4, h: 2.4, sizing: { type: 'cover', w: 4.4, h: 2.4 }, altText: "La piscine et l'hôtel le soir", objectName: 'Photo piscine' });
  s.addImage({ path: IM('djerba_plage.png'), x: 0.6, y: 4.45, w: 4.4, h: 2.4, sizing: { type: 'cover', w: 4.4, h: 2.4 }, altText: 'La plage de sable fin', objectName: 'Photo plage' });
  const rows = A.devis.map((r, i) => { const last = i === A.devis.length - 1; return [lab(r[0], { align: 'left', fontSize: 11.5, fill: { color: last ? 'F3E9CF' : 'F3F4F6' } }), cel(r[1], { align: 'left', fontSize: last ? 13 : 11.5, bold: last, fill: { color: last ? 'F3E9CF' : WHITE } })]; });
  s.addText(A.hotel, { x: 5.25, y: 1.9, w: 7.5, h: 0.3, fontFace: 'Calibri', fontSize: 12, italic: true, color: MUTED, margin: 0, isTextBox: true });
  s.addTable(rows, { x: 5.25, y: 2.25, w: 7.5, colW: [1.9, 5.6], rowH: rows.map(() => 0.29), fontFace: 'Calibri', margin: [0, 0.08, 0, 0.08], objectName: 'Devis' });
  const box = (x, titre, items, col) => {
    s.addShape(pres.shapes.RECTANGLE, { x, y: 4.7, w: 3.65, h: 2.15, fill: { color: WHITE }, line: { color: LINE, width: 0.75 }, objectName: 'Cadre ' + titre });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 4.7, w: 3.65, h: 0.32, fill: { color: col }, line: { color: col, width: 0 }, objectName: 'Bandeau ' + titre });
    s.addText(titre, { x: x + 0.12, y: 4.7, w: 3.4, h: 0.32, fontFace: 'Calibri', fontSize: 12, bold: true, color: WHITE, valign: 'middle', margin: 0, isTextBox: true });
    s.addText(items.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < items.length - 1 } })), { x: x + 0.1, y: 5.05, w: 3.45, h: 1.78, fontFace: 'Calibri', fontSize: 10.5, color: INK, valign: 'top', margin: 0, paraSpaceAfter: 2, isTextBox: true });
  };
  box(5.25, 'Ce qui est compris', A.compris, OKF);
  box(9.1, 'Ce qui n\'est pas compris', A.nonCompris, '6B7280');
}

pres.writeFile({ fileName: OUT }).then(() => console.log('ok', OUT));
