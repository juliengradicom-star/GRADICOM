// Point business hebdomadaire GRADICOM • AMR — génère le PowerPoint (format téléphone) à partir de data.json
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
const A = f => path.join(__dirname, 'assets', f);
const OUT = process.argv[2] || 'Point_business.pptx';
const W = 7.5, H = 13.333, M = 0.4;
const BLACK = '0C0C0D', DARK = '17140D', GOLD = 'C9A65B', GOLD2 = 'E5C26A', WHITE = 'FFFFFF', GREY = '9A968B', GREEN = '1F7A4D', RED = 'C0392B';
const pres = new pptxgen();
pres.defineLayout({ name: 'TEL', width: W, height: H });
pres.layout = 'TEL';
pres.theme = { headFontFace: 'Cambria', bodyFontFace: 'Calibri' };
pres.title = 'Point business GRADICOM • AMR';
const ph = (name, type, o, text) => ({ placeholder: { options: Object.assign({ name, type, margin: 0 }, o), text } });
const fmt = (n, d = 2) => n.toFixed(d).replace('.', ',');

// ---- mises en page
pres.defineSlideMaster({ title: 'Couverture', background: { path: A('cover_RPV.png') }, objects: [
  { text: { text: 'GRADICOM  •  AMR', options: { x: M, y: 1.0, w: 6.4, h: 0.5, fontFace: 'Calibri', fontSize: 18, bold: true, color: GOLD2, charSpacing: 5, margin: 0 } } },
  ph('titre', 'title', { x: M + 0.15, y: 6.0, w: 6.6, h: 1.0, fontFace: 'Cambria', fontSize: 50, bold: true, color: WHITE, align: 'left', valign: 'top', fit: 'shrink' }, 'POINT BUSINESS'),
  ph('mois', 'body', { x: M + 0.15, y: 7.05, w: 6.4, h: 0.7, fontFace: 'Calibri', fontSize: 30, bold: true, color: GOLD2, charSpacing: 6, align: 'left' }, 'SPECIAL RPV'),
  { text: { text: 'LANGON  •  GRADIGNAN  •  MARMANDE  •  COGNAC', options: { x: 0, y: 12.5, w: W, h: 0.4, fontFace: 'Calibri', fontSize: 14, bold: true, color: BLACK, charSpacing: 2, align: 'center', valign: 'middle', margin: 0 } } },
  ph('date', 'body', { x: M + 0.15, y: 10.65, w: 6.4, h: 0.8, fontFace: 'Calibri', fontSize: 34, bold: true, color: BLACK, align: 'left' }, 'au 17-10-2026')
] });
pres.defineSlideMaster({ title: 'Page', background: { color: BLACK }, objects: [
  { text: { text: 'GRADICOM  •  AMR', options: { x: M, y: 0.3, w: 6.7, h: 0.35, fontFace: 'Calibri', fontSize: 12, bold: true, color: GREY, charSpacing: 3, margin: 0 } } },
  ph('titre', 'title', { x: M, y: 0.85, w: 6.7, h: 1.2, fontFace: 'Cambria', fontSize: 22, bold: true, color: GOLD2, align: 'left', valign: 'middle', fit: 'shrink' }, 'Titre')
] });
pres.defineSlideMaster({ title: 'Page vide', background: { color: BLACK }, objects: [
  { text: { text: 'GRADICOM  •  AMR', options: { x: M, y: 0.3, w: 6.7, h: 0.35, fontFace: 'Calibri', fontSize: 12, bold: true, color: GREY, charSpacing: 3, margin: 0 } } }
] });
pres.defineSlideMaster({ title: 'Fin', background: { path: A('cover_E.png') }, objects: [
  ph('titre', 'title', { x: M + 0.15, y: 6.0, w: 6.6, h: 1.4, fontFace: 'Cambria', fontSize: 66, bold: true, color: WHITE, align: 'left', valign: 'top' }, 'MERCI !'),
  { text: { text: 'GRADICOM  •  AMR', options: { x: M + 0.15, y: 10.65, w: 6.4, h: 0.7, fontFace: 'Calibri', fontSize: 30, bold: true, color: BLACK, margin: 0 } } }
] });

// ---- éléments réutilisables
const label = (s, text, y, icon) => {
  s.addText(text, { x: 0.4, y, w: 6.7, h: 0.5, fontFace: 'Calibri', fontSize: 22, bold: true, color: WHITE, align: 'center', valign: 'middle', isTextBox: true });
};
function barChart(s, rows, o) {
  const labels = rows.map(r => r[0]), vals = rows.map(r => r[1]);
  s.addChart(pres.charts.BAR, [{ name: o.name || 'Valeur', labels, values: vals }], Object.assign({
    x: 0.3, y: o.y, w: 6.9, h: o.h, barDir: 'bar', barGapWidthPct: 45, chartColors: [GOLD],
    catAxisOrientation: 'maxMin', catAxisLabelColor: WHITE, catAxisLabelFontSize: 12, catAxisLabelFontFace: 'Calibri', catAxisLineShow: false,
    valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
    showValue: true, dataLabelColor: GOLD2, dataLabelFontSize: 13, dataLabelFontBold: true, dataLabelFontFace: 'Calibri', dataLabelPosition: 'outEnd',
    showLegend: false, showTitle: false, plotArea: { fill: { color: BLACK } }
  }, o.extra || {}));
}
function podium(s, p, yBottom, scoreFirst) {
  // p = [1er, 2e, 3e] ; affichage : 2e à gauche, 1er au centre, 3e à droite
  const bw = 2.0, gap = 0.1, x0 = (W - 3 * bw - 2 * gap) / 2;
  const order = [[1, 1.25, 'B8B8B8'], [0, 1.7, GOLD], [2, 0.95, 'B07A4F']];
  order.forEach(([idx, h, col], k) => {
    const x = x0 + k * (bw + gap);
    s.addShape(pres.shapes.RECTANGLE, { x, y: yBottom - h, w: bw, h, fill: { color: col }, line: { color: col, width: 0 }, objectName: 'Marche ' + (idx + 1) });
    s.addText(String(idx + 1), { x, y: yBottom - h, w: bw, h, fontFace: 'Cambria', fontSize: 44, bold: true, color: BLACK, align: 'center', valign: 'middle', isTextBox: true });
    s.addShape(pres.shapes.RECTANGLE, { x, y: yBottom - h - 1.05, w: bw, h: 1.0, fill: { color: DARK }, line: { color: col, width: 1.5 }, objectName: 'Cartouche ' + (idx + 1) });
    s.addText([{ text: p[idx][0], options: { bold: true, fontSize: 15, color: GOLD2, breakLine: true } }, { text: p[idx][1], options: { bold: true, fontSize: 15, color: WHITE } }],
      { x: x + 0.05, y: yBottom - h - 1.05, w: bw - 0.1, h: 1.0, fontFace: 'Calibri', align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  });
}


const R = D.ro;
const cellB = { type: 'solid', color: '3A3426', pt: 0.5 };
// ---- 1. Couverture
let s = pres.addSlide({ masterName: 'Couverture' });
s.addText('POINT BUSINESS', { placeholder: 'titre' });
s.addText('SPECIAL RPV', { placeholder: 'mois' });
s.addText(D.dateCouverture, { placeholder: 'date' });

// ---- 2. R/O magasins
s = pres.addSlide({ masterName: 'Page' });
s.addText(D.roTitre, { placeholder: 'titre' });
{
  const hd = (t, o = {}) => ({ text: t, options: Object.assign({ bold: true, color: GOLD2, fill: { color: DARK }, align: 'center', valign: 'middle', fontSize: 12, border: cellB }, o) });
  const c = (t, o = {}) => ({ text: String(t), options: Object.assign({ color: WHITE, fill: { color: BLACK }, align: 'center', valign: 'middle', fontSize: 12, border: cellB }, o) });
  const rows = [[hd('Magasins', { colspan: 2, align: 'left' }), ...D.magasins.map(m => hd(m, { fontSize: 11 }))],
    [hd('Jours travaillés', { colspan: 2, align: 'left', bold: false, italic: true, fontSize: 10.5, color: GREY }), ...D.jours.map(j => c(j, { italic: true, color: GREY, fontSize: 11 }))]];
  R.forEach(r => {
    rows.push([hd(r.item, { rowspan: 3, fontSize: 11, align: 'center' }), hd('Obj', { fontSize: 10.5, color: GREY, bold: false }), ...r.obj.map(v => c(v))]);
    rows.push([hd('Réa', { fontSize: 10.5, color: GREY, bold: false }), ...r.rea.map(v => c(v))]);
    rows.push([hd('R/O', { fontSize: 10.5 }), ...r.ro.map(v => { const n = parseFloat(v.replace(',', '.')); return c(v, { bold: true, fontSize: 12.5, fill: { color: n < 100 ? RED : GREEN } }); })]);
  });
  s.addTable(rows, { x: 0.3, y: 2.2, w: 6.9, colW: [1.3, 0.6, 1.25, 1.25, 1.25, 1.25], rowH: [0.4, 0.34, ...R.flatMap(() => [0.34, 0.34, 0.36])], fontFace: 'Calibri', margin: [0, 0.04, 0, 0.04], objectName: 'R/O magasins' });
}

// ---- 3. Items non déclenchés
s = pres.addSlide({ masterName: 'Page' });
s.addText(D.nonDeclenches.titre + '\n' + D.nonDeclenches.date, { placeholder: 'titre' });
const LOGOS = { 'SFR PRO': { f: 'sfrpro.png', w: 1.3, r: 0.559, plate: true }, 'CANAL+': { f: 'canal.png', w: 1.5, r: 0.1857 }, 'MAISON SECURISEE': { f: 'maison.png', w: 1.2, r: 1 } };
D.nonDeclenches.lignes.forEach((l, i) => {
  const y = 2.6 + i * 2.7, h = 2.3;
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 6.7, h, fill: { color: DARK }, line: { color: GOLD, width: 1.5 }, objectName: 'Cadre ' + l[0] });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 0.12, h, fill: { color: GOLD }, line: { color: GOLD, width: 0 }, objectName: 'Liseré ' + l[0] });
  s.addText([{ text: l[0], options: { fontSize: 22, bold: true, fontFace: 'Cambria', color: GOLD2, breakLine: true } }, { text: l[1], options: { fontSize: 20, color: WHITE } }],
    { x: 0.8, y, w: 4.5, h, align: 'left', valign: 'middle', margin: 0, paraSpaceAfter: 8, isTextBox: true });
  const lg = LOGOS[l[0]];
  if (lg) {
    const lw = lg.w, lh = lg.w * lg.r, lx = 5.45 + (1.5 - lw) / 2, ly = y + (h - lh) / 2;
    if (lg.plate) s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: lx - 0.12, y: ly - 0.12, w: lw + 0.24, h: lh + 0.24, fill: { color: 'F4EBD3' }, line: { color: GOLD, width: 1 }, rectRadius: 0.08, objectName: 'Plaque logo' });
    s.addImage({ path: A(lg.f), x: lx, y: ly, w: lw, h: lh, objectName: 'Logo ' + l[0] });
  }
});

// ---- 4 et 5. Suivi des indicateurs
const indic = (g, y, h) => {
  s.addText(g.titre, { x: 0.4, y, w: 6.7, h: 0.45, fontFace: 'Calibri', fontSize: 17, bold: true, color: GOLD2, align: 'center', valign: 'middle', isTextBox: true });
  s.addChart(pres.charts.BAR, [{ name: g.titre, labels: g.valeurs.map(v => v[0]), values: g.valeurs.map(v => v[1]) }], {
    x: 0.3, y: y + 0.45, w: 6.9, h, barDir: 'bar', barGapWidthPct: 45, chartColors: g.valeurs.map(v => v[1] >= g.seuil ? GREEN : RED),
    catAxisOrientation: 'maxMin', catAxisLabelColor: WHITE, catAxisLabelFontSize: 12, catAxisLabelFontFace: 'Calibri', catAxisLineShow: false,
    valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: g.max, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
    showValue: true, dataLabelColor: WHITE, dataLabelFontSize: 13, dataLabelFontBold: true, dataLabelFontFace: 'Calibri', dataLabelPosition: 'outEnd', dataLabelFormatCode: g.format,
    showLegend: false, showTitle: false, plotArea: { fill: { color: BLACK } }
  });
  const n = g.valeurs.length, top = y + 0.45 + h * 0.04, rowH = h * 0.86 / n;
  g.valeurs.forEach((v, i) => { if (v[1] < g.seuil) s.addImage({ path: A('warning.png'), x: 6.8, y: top + (i + 0.5) * rowH - 0.19, w: 0.45, h: 0.45, objectName: 'Alerte ' + v[0] }); });
};
s = pres.addSlide({ masterName: 'Page' });
s.addText(D.indicateurs.titre, { placeholder: 'titre' });
D.indicateurs.graphiques.forEach((g, i) => indic(g, 2.15 + i * 2.75, 2.15));
s = pres.addSlide({ masterName: 'Page' });
s.addText(D.indicateurs.titre, { placeholder: 'titre' });
D.indicateurs.graphiques2.forEach((g, i) => indic(g, 2.3 + i * 4.8, 3.9));

// ---- 6. Fin
s = pres.addSlide({ masterName: 'Fin' });
s.addText('MERCI !', { placeholder: 'titre' });

pres.writeFile({ fileName: OUT }).then(() => console.log('ok', OUT));
