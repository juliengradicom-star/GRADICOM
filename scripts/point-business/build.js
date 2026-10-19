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
pres.defineSlideMaster({ title: 'Couverture', background: { path: A('cover_A.png') }, objects: [
  { text: { text: 'GRADICOM  •  AMR', options: { x: M, y: 1.0, w: 6.4, h: 0.5, fontFace: 'Calibri', fontSize: 18, bold: true, color: GOLD2, charSpacing: 5, margin: 0 } } },
  ph('titre', 'title', { x: M + 0.15, y: 6.0, w: 6.6, h: 1.0, fontFace: 'Cambria', fontSize: 50, bold: true, color: WHITE, align: 'left', valign: 'top', fit: 'shrink' }, 'POINT BUSINESS'),
  ph('mois', 'body', { x: M + 0.15, y: 7.05, w: 6.4, h: 0.7, fontFace: 'Calibri', fontSize: 30, bold: true, color: GOLD2, charSpacing: 6, align: 'left' }, 'OCTOBRE 2026'),
  ph('date', 'body', { x: M + 0.15, y: 10.65, w: 6.4, h: 0.8, fontFace: 'Calibri', fontSize: 34, bold: true, color: BLACK, align: 'left' }, 'au 17-10-2026')
] });
pres.defineSlideMaster({ title: 'Page', background: { color: BLACK }, objects: [
  { text: { text: 'GRADICOM  •  AMR', options: { x: M, y: 0.3, w: 6.7, h: 0.35, fontFace: 'Calibri', fontSize: 12, bold: true, color: GREY, charSpacing: 3, margin: 0 } } },
  { image: { path: A('logo_sfr.png'), x: M, y: 0.95, w: 1.1, h: 1.1 } },
  ph('titre', 'title', { x: 1.7, y: 0.85, w: 5.4, h: 1.3, fontFace: 'Cambria', fontSize: 22, bold: true, color: GOLD2, align: 'left', valign: 'middle', fit: 'shrink' }, 'Titre')
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

// ---- 1. Couverture
let s = pres.addSlide({ masterName: 'Couverture' });
s.addText('POINT BUSINESS', { placeholder: 'titre' }); s.addText(D.mois, { placeholder: 'mois' }); s.addText(D.dateCouverture, { placeholder: 'date' });
s.addNotes('Pour modifier : touche un texte et écris. Les graphiques se modifient en faisant clic droit > Modifier les données.');

// ---- 2. Actus & rappel (visuels SFR tels quels)
s = pres.addSlide({ masterName: 'Page' });
s.addText('ACTUS & RAPPEL', { placeholder: 'titre' });
[['offre_fixe_pro.png', 0.3, 2.45, 3.4, 2.82], ['offre_box_5g.png', 3.85, 2.45, 3.35, 2.82], ['offres_mobile_pro_1.png', 0.3, 5.45, 3.4, 3.0], ['offres_mobile_pro_2.png', 3.85, 5.45, 3.35, 3.0], ['iphone_duo.png', 0.6, 8.75, 6.3, 3.42]]
  .forEach(([f, x, y, w, h]) => s.addImage({ path: A(f), x, y, w, h, sizing: { type: 'contain', w, h }, objectName: f }));

// ---- 3. R/O (2 tableaux empilés pour rester lisibles sur téléphone)
s = pres.addSlide({ masterName: 'Page' });
s.addText('R/O ' + D.dateRO, { placeholder: 'titre' });
function roTable(y, from, to, nameW, cw) {
  const bd = { type: 'solid', color: '3A3426', pt: 0.5 };
  const cols = D.ro.colonnes.slice(from, to);
  const rows = [['', ...cols].map(t => ({ text: t, options: { bold: true, color: GOLD2, fill: { color: DARK }, align: 'center', valign: 'middle', fontSize: 9.5, border: bd } }))];
  D.ro.lignes.forEach(l => {
    const r = [{ text: l[0], options: { bold: true, color: WHITE, fill: { color: DARK }, fontSize: 10, align: 'left', border: bd } }];
    for (let i = from + 1; i <= to; i++) {
      const v = l[i];
      if (v === null || v === undefined) r.push({ text: '#DIV/0!', options: { color: GREY, fill: { color: DARK }, fontSize: 9.5, align: 'center', border: bd } });
      else r.push({ text: fmt(v) + '%', options: { color: WHITE, bold: true, fill: { color: v < 100 ? RED : GREEN }, fontSize: 10.5, align: 'center', border: bd } });
    }
    rows.push(r);
  });
  s.addTable(rows, { x: 0.2, y, w: nameW + cw * cols.length, colW: [nameW, ...cols.map(() => cw)], rowH: [0.5, ...D.ro.lignes.map(() => 0.27)], fontFace: 'Calibri', margin: [0, 0.03, 0, 0.03], valign: 'middle', objectName: 'Tableau R/O ' + (from + 1) });
}
roTable(2.4, 0, 7, 1.05, 0.9);
roTable(6.5 + 0.1, 7, D.ro.colonnes.length, 1.05, 1.0);

// ---- 3b. Goodays + Notes Google
s = pres.addSlide({ masterName: 'Page' });
s.addText('GOODAYS\n& NOTES GOOGLE', { placeholder: 'titre' });
label(s, 'GOODAYS', 2.3); s.addImage({ path: A('goodays.png'), x: 4.6, y: 2.37, w: 0.38, h: 0.38 });
barChart(s, D.goodays, { y: 2.85, h: 5.6, name: 'Goodays', extra: { valAxisMinVal: 4.2, valAxisMaxVal: 5.1, dataLabelFormatCode: '0.00' } });
label(s, 'NOTES GOOGLE', 8.85); s.addImage({ path: A('google.png'), x: 4.95, y: 8.95, w: 1.08, h: 0.36 });
{
  const hd = ['', '', 'Note moyenne', 'Réponses'].map((t, i) => ({ text: t, options: { bold: true, color: GOLD2, fill: { color: DARK }, fontSize: 12, align: i > 1 ? 'right' : 'left' } }));
  const rows = [hd].concat(D.notesGoogle.map(r => r.map((t, i) => ({ text: t, options: { color: WHITE, fill: { color: BLACK }, fontSize: 14, bold: i > 1, align: i > 1 ? 'right' : 'left', border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', color: '3A3426', pt: 0.75 }, { type: 'none' }] } }))));
  s.addTable(rows, { x: 0.6, y: 9.55, w: 6.3, colW: [0.5, 2.9, 1.7, 1.2], rowH: 0.45, fontFace: 'Calibri', margin: [0, 0.08, 0, 0.08], valign: 'middle', objectName: 'Notes Google' });
}

// ---- 4. Scoring général
s = pres.addSlide({ masterName: 'Page' });
s.addText('SCORING GENERAL\n' + D.dateScoring, { placeholder: 'titre' });
barChart(s, D.scoring.valeurs, { y: 2.3, h: 5.3, name: 'Score', extra: { valAxisMinVal: 0, valAxisMaxVal: 22, dataLabelFormatCode: '0.00' } });
s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 7.7, w: 6.7, h: 1.7, fill: { color: DARK }, line: { color: GOLD, width: 1.25 }, objectName: 'Méthode' });
s.addText(D.scoring.methode.map((t, i) => ({ text: t, options: { bold: true, color: i === 0 ? GOLD2 : WHITE, underline: i === 0 ? { style: 'sng' } : undefined, breakLine: i < D.scoring.methode.length - 1 } })),
  { x: 0.5, y: 7.75, w: 6.5, h: 1.6, fontFace: 'Calibri', fontSize: 12, valign: 'top', margin: 0, isTextBox: true });
podium(s, D.scoring.podium, 12.6);

// ---- 5. Suivi des points
s = pres.addSlide({ masterName: 'Page' });
s.addText('SUIVI DES POINTS ' + D.datePoints + '\nBLOC n°2 du Payplan', { placeholder: 'titre' });
barChart(s, D.points.valeurs, { y: 2.3, h: 6.2, name: 'Points', extra: { valAxisMinVal: 0, valAxisMaxVal: 35, dataLabelFormatCode: 'General' } });
podium(s, D.points.podium, 12.6);

// ---- 6. Fin
s = pres.addSlide({ masterName: 'Fin' });
s.addText('MERCI !', { placeholder: 'titre' });

pres.writeFile({ fileName: OUT }).then(() => console.log('ok', OUT));
