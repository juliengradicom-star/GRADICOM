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

// ---- 1. Couverture
let s = pres.addSlide({ masterName: 'Couverture' });
s.addText('POINT BUSINESS', { placeholder: 'titre' }); s.addText(D.mois, { placeholder: 'mois' }); s.addText(D.dateCouverture, { placeholder: 'date' });
s.addNotes('Pour modifier : touche un texte et écris. Les graphiques se modifient en faisant clic droit > Modifier les données.');

// ---- 2. Actus & rappel (visuels SFR tels quels)
s = pres.addSlide({ masterName: 'Page' });
s.addText('ACTUS & RAPPEL', { placeholder: 'titre' });
[['offre_fixe_pro.png', 0.3, 2.45, 3.4, 2.82], ['offre_box_5g.png', 3.85, 2.45, 3.35, 2.82], ['offres_mobile_pro_1.png', 0.3, 5.45, 3.4, 3.0], ['offres_mobile_pro_2.png', 3.85, 5.45, 3.35, 3.0], ['iphone_duo.png', 0.6, 8.75, 6.3, 3.42]]
  .forEach(([f, x, y, w, h]) => { s.addShape(pres.shapes.RECTANGLE, { x: x - 0.07, y: y - 0.07, w: w + 0.14, h: h + 0.14, fill: { color: GOLD }, line: { color: GOLD, width: 0 }, objectName: 'Cadre ' + f }); s.addImage({ path: A(f), x, y, w, h, sizing: { type: 'contain', w, h }, objectName: f }); });

// ---- 3. R/O (2 tableaux empilés pour rester lisibles sur téléphone)
s = pres.addSlide({ masterName: 'Page' });
s.addText('R/O ' + D.dateRO, { placeholder: 'titre' });
function roTable(y) {
  const bd = { type: 'solid', color: '3A3426', pt: 0.5 };
  const cols = D.ro.colonnes, n = cols.length, nameW = 0.85, cw = (W - 0.2 - nameW) / n;
  const rows = [['', ...cols].map(t => ({ text: '', options: { fill: { color: DARK }, border: bd } }))];
  D.ro.lignes.forEach(l => {
    const r = [{ text: l[0], options: { bold: true, color: WHITE, fill: { color: DARK }, fontSize: 9.5, align: 'left', border: bd } }];
    for (let i = 1; i <= n; i++) {
      const v = l[i];
      if (v === null || v === undefined) r.push({ text: '#DIV/0!', options: { color: GREY, fill: { color: DARK }, fontSize: 7, align: 'center', border: bd } });
      else r.push({ text: fmt(v) + '%', options: { color: WHITE, bold: true, fill: { color: v < 100 ? RED : GREEN }, fontSize: 8.5, align: 'center', border: bd } });
    }
    rows.push(r);
  });
  s.addTable(rows, { x: 0.1, y, w: W - 0.2, colW: [nameW, ...cols.map(() => cw)], rowH: [1.3, ...D.ro.lignes.map(() => 0.5)], fontFace: 'Calibri', margin: [0, 0.01, 0, 0.01], valign: 'middle', objectName: 'Tableau R/O' });
}
roTable(2.4);
{ // titres des colonnes : zones de texte tournées de 270°, centrées exactement sur chaque colonne
  const n = D.ro.colonnes.length, nameW = 0.85, cw = (W - 0.2 - nameW) / n, hh = 1.3, cy = 2.4 + hh / 2;
  D.ro.colonnes.forEach((t, i) => {
    const cx = 0.1 + nameW + cw * (i + 0.5);
    s.addText(t, { x: cx - hh / 2, y: cy - cw / 2, w: hh, h: cw, rotate: 270, fontFace: 'Calibri', fontSize: 11, bold: true, color: GOLD2, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'Titre ' + t });
  });
}

// ---- 3b. Goodays + Notes Google
s = pres.addSlide({ masterName: 'Page' });
s.addText('GOODAYS\n& NOTES GOOGLE', { placeholder: 'titre' });
s.addImage({ path: A('goodays.png'), x: (W - 2.9) / 2, y: 2.3, w: 2.9, h: 2.9 * 0.1852 });
barChart(s, D.goodays, { y: 2.85, h: 5.6, name: 'Goodays', extra: { valAxisMinVal: 4.2, valAxisMaxVal: 5.1, dataLabelFormatCode: '0.00' } });
s.addText('NOTES', { x: 1.7, y: 8.85, w: 1.9, h: 0.6, fontFace: 'Calibri', fontSize: 22, bold: true, color: WHITE, align: 'right', valign: 'middle', isTextBox: true });
s.addImage({ path: A('google.png'), x: 3.8, y: 8.92, w: 1.5, h: 1.5 * 0.3135 });
{
  const hd = ['', '', 'Note moyenne', 'Réponses'].map((t, i) => ({ text: t, options: { bold: true, color: GOLD2, fill: { color: DARK }, fontSize: 12, align: i > 1 ? 'right' : 'left' } }));
  const rows = [hd].concat(D.notesGoogle.map(r => r.map((t, i) => ({ text: t, options: { color: WHITE, fill: { color: BLACK }, fontSize: 14, bold: i > 1, align: i > 1 ? 'right' : 'left', border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', color: '3A3426', pt: 0.75 }, { type: 'none' }] } }))));
  s.addTable(rows, { x: 0.6, y: 9.55, w: 6.3, colW: [0.5, 2.9, 1.7, 1.2], rowH: 0.45, fontFace: 'Calibri', margin: [0, 0.08, 0, 0.08], valign: 'middle', objectName: 'Notes Google' });
  s.addImage({ path: A('warning.png'), x: 4.7, y: 11.35 + (0.45 - 0.34) / 2 + 0.0, w: 0.34, h: 0.34, objectName: 'Alerte Gradignan' });
}

// ---- 4. Scoring général
s = pres.addSlide({ masterName: 'Page' });
s.addText('SCORING GENERAL\n' + D.dateScoring, { placeholder: 'titre' });
barChart(s, D.scoring.valeurs, { y: 2.3, h: 5.3, name: 'Score', extra: { valAxisMinVal: 0, valAxisMaxVal: 22, dataLabelFormatCode: '0.00' } });
s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 7.7, w: 6.7, h: 1.7, fill: { color: DARK }, line: { color: GOLD, width: 1.25 }, objectName: 'Méthode' });
s.addText(D.scoring.methode.map((t, i) => ({ text: t, options: { bold: true, color: i === 0 ? GOLD2 : WHITE, underline: i === 0 ? { style: 'sng' } : undefined, breakLine: i < D.scoring.methode.length - 1 } })),
  { x: 0.5, y: 7.75, w: 6.5, h: 1.6, fontFace: 'Calibri', fontSize: 12, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
podium(s, D.scoring.podium, 12.6);

// ---- 5. Suivi des points
s = pres.addSlide({ masterName: 'Page' });
s.addText('SUIVI DES POINTS ' + D.datePoints + '\nBLOC n°2 du Payplan', { placeholder: 'titre' });
barChart(s, D.points.valeurs, { y: 2.3, h: 6.2, name: 'Points', extra: { valAxisMinVal: 0, valAxisMaxVal: 35, dataLabelFormatCode: 'General' } });
podium(s, D.points.podium, 12.6);

// ---- 6. Challenge Google (chèque cadeau)
const CH = D.challenges;
const goldHead = (t, o = {}) => ({ text: t, options: Object.assign({ bold: true, color: GOLD2, fill: { color: DARK }, align: 'center', valign: 'middle', fontSize: 10, border: { type: 'solid', color: '3A3426', pt: 0.5 } }, o) });
const cell = (t, o = {}) => ({ text: String(t), options: Object.assign({ color: WHITE, fill: { color: BLACK }, align: 'center', valign: 'middle', fontSize: 11, border: { type: 'solid', color: '3A3426', pt: 0.5 } }, o) });
const eur = v => cell(v + ' €', { bold: true, fill: { color: v > 0 ? GREEN : 'B5651D' } });
s = pres.addSlide({ masterName: 'Page' });
s.addText('CHALLENGE GOOGLE\ndu 1er au 31 octobre 2026', { placeholder: 'titre' });
s.addImage({ path: A('google.png'), x: 5.4, y: 1.15, w: 1.7, h: 1.7 * 0.3135, objectName: 'Logo Google' });
{
  const g = CH.googleMagasins;
  const rows = [[goldHead(''), ...g.colonnes.map(c => goldHead(c, { fontSize: 11 }))],
    [goldHead('PDM GOOGLE', { align: 'left' }), ...g.pdm.map(v => cell(v, { fontSize: 13 }))],
    [goldHead('TOTAL GOOGLE (× 5 €)', { align: 'left' }), ...g.total.map(v => cell(v, { bold: true, fontSize: 13 }))],
    [goldHead('€', { align: 'left' }), ...g.euros.map(v => Object.assign(eur(v), {}))]];
  rows[3].slice(1).forEach(c => { c.options.fontSize = 14; });
  s.addTable(rows, { x: 0.4, y: 2.45, w: 6.7, colW: [1.9, 1.2, 1.2, 1.2, 1.2], rowH: 0.42, fontFace: 'Calibri', margin: [0, 0.05, 0, 0.05], objectName: 'Google magasins' });
  const hd = ['', 'PDM GOOGLE', 'TOTAL GOOGLE', 'PIXEL 10A (15€)', 'PIXEL 10 (20€)', 'PIXEL SERIES 11 (20€)', '€'].map((t, i) => goldHead(t, { fontSize: 8.5, align: i ? 'center' : 'left' }));
  const vr = CH.googleVendeurs.map(r => [cell(r[0], { bold: true, align: 'left', fontSize: 11.5, fill: { color: DARK } }), cell(r[1]), cell(r[2], { bold: true }), cell(r[3]), cell(r[4]), cell(r[5]), eur(r[6])]);
  s.addTable([hd, ...vr], { x: 0.4, y: 4.45, w: 6.7, colW: [1.35, 0.85, 0.85, 0.9, 0.9, 1.0, 0.85], rowH: [0.6, ...vr.map(() => 0.42)], fontFace: 'Calibri', margin: [0, 0.04, 0, 0.04], objectName: 'Google vendeurs' });
}

// ---- 7. Bonus Match France - Turquie
s = pres.addSlide({ masterName: 'Page' });
s.addText('BONUS Match France - Turquie\ndu 16 au 31 octobre 2026', { placeholder: 'titre' });
{ // ticket
  const x = 0.4, y = 2.3, w = 6.7, h = 2.5, stub = 1.9;
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: DARK }, line: { color: GOLD, width: 2.5 }, objectName: 'Ticket' });
  s.addShape(pres.shapes.RECTANGLE, { x, y, w: stub, h, fill: { color: GOLD }, line: { color: GOLD, width: 2.5 }, objectName: 'Ticket souche' });
  s.addText([{ text: '2', options: { fontSize: 72, bold: true, fontFace: 'Cambria', color: BLACK, breakLine: true } }, { text: 'PLACES', options: { fontSize: 16, bold: true, color: BLACK, charSpacing: 4 } }], { x, y, w: stub, h, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
  for (let k = 0; k < 9; k++) s.addShape(pres.shapes.RECTANGLE, { x: x + stub - 0.015, y: y + 0.12 + k * 0.265, w: 0.03, h: 0.14, fill: { color: BLACK }, line: { color: BLACK, width: 0 } });
  s.addShape(pres.shapes.OVAL, { x: x + stub - 0.17, y: y - 0.17, w: 0.34, h: 0.34, fill: { color: BLACK }, line: { color: GOLD, width: 2.5 } });
  s.addShape(pres.shapes.OVAL, { x: x + stub - 0.17, y: y + h - 0.17, w: 0.34, h: 0.34, fill: { color: BLACK }, line: { color: GOLD, width: 2.5 } });
  s.addText([{ text: 'FRANCE – TURQUIE', options: { fontSize: 24, bold: true, fontFace: 'Cambria', color: GOLD2, breakLine: true } },
    { text: 'Stade Matmut Atlantique • Bordeaux', options: { fontSize: 12.5, bold: true, color: WHITE, breakLine: true } },
    { text: 'Novembre 2026', options: { fontSize: 12.5, bold: true, color: WHITE, breakLine: true } },
    { text: '1 place par vendeur • minimum 5 mobiles Google', options: { fontSize: 11, color: GREY, breakLine: true } },
    { text: 'PDM Google du groupe ≥ 20 % sur octobre', options: { fontSize: 11, color: GREY } }],
    { x: x + stub + 0.25, y, w: w - stub - 0.4, h, align: 'left', valign: 'middle', margin: 0, isTextBox: true });
}
s.addText(CH.matchPeriode, { x: 0.4, y: 5.0, w: 6.7, h: 0.4, fontFace: 'Calibri', fontSize: 13, bold: true, color: GOLD2, align: 'center', valign: 'middle', isTextBox: true });
barChart(s, CH.matchVendeurs, { y: 5.4, h: 4.5, name: 'Quantité Google', extra: { valAxisMinVal: 0, valAxisMaxVal: 3.5, dataLabelFormatCode: '0' } });
{
  const m = CH.matchPdm;
  const rows = [[goldHead(''), ...m.colonnes.map(c => goldHead(c, { fontSize: 11 }))],
    [goldHead('PDM GOOGLE', { align: 'left', fontSize: 11 }), ...m.valeurs.map((v, i) => cell(v, { fontSize: 14, bold: true, fill: i === m.valeurs.length - 1 ? { color: 'E0955B' } : { color: BLACK }, color: i === m.valeurs.length - 1 ? BLACK : WHITE }))]];
  s.addTable(rows, { x: 0.4, y: 10.3, w: 6.7, colW: [1.5, 1.04, 1.04, 1.04, 1.04, 1.04], rowH: 0.5, fontFace: 'Calibri', margin: [0, 0.04, 0, 0.04], objectName: 'PDM Google' });
}

// ---- 8. Challenge TCS
s = pres.addSlide({ masterName: 'Page' });
s.addText('CHALLENGE TCS\ndu 1er octobre au 30 novembre 2026', { placeholder: 'titre' });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.95, y: 0.85, w: 1.15, h: 1.15, fill: { color: 'F4EBD3' }, line: { color: GOLD, width: 1.5 }, rectRadius: 0.1, objectName: 'Plaque logo' });
s.addImage({ path: A('telecablesat.png'), x: 6.02, y: 0.92, w: 1.0, h: 1.0, sizing: { type: 'contain', w: 1.0, h: 1.0 }, objectName: 'Logo Télécâble Sat' });
{
  const yellowHead = (t, o = {}) => goldHead(t, Object.assign({ fill: { color: GOLD2 }, color: BLACK, fontSize: 11 }, o));
  const mk = rowsData => rowsData.map(r => [cell(r[0], { bold: true, align: 'left', fontSize: 11.5, fill: { color: DARK } }), cell(r[1], { bold: true }), cell(r[2]), cell(r[3])]);
  const hd = ['', 'TCS', '€ QUALITÉ >55%', '€ QUALITÉ >60%'].map((t, i) => yellowHead(t, { align: i ? 'center' : 'left' }));
  const st = mk(CH.tcsMagasins), ve = mk(CH.tcsVendeurs);
  s.addTable([hd, ...st], { x: 0.4, y: 2.45, w: 6.7, colW: [2.2, 1.0, 1.75, 1.75], rowH: [0.42, ...st.map(() => 0.36)], fontFace: 'Calibri', margin: [0, 0.06, 0, 0.06], objectName: 'TCS magasins' });
  s.addText(CH.tcsMagasinsNote, { x: 0.4, y: 4.35, w: 6.7, h: 0.4, fontFace: 'Calibri', fontSize: 13, bold: true, italic: true, color: GOLD2, align: 'center', valign: 'middle', isTextBox: true });
  s.addTable([hd, ...ve], { x: 0.4, y: 4.95, w: 6.7, colW: [2.2, 1.0, 1.75, 1.75], rowH: [0.42, ...ve.map(() => 0.3)], fontFace: 'Calibri', margin: [0, 0.06, 0, 0.06], objectName: 'TCS vendeurs' });
  s.addText(CH.tcsVendeursNote, { x: 0.4, y: 10.3, w: 6.7, h: 0.4, fontFace: 'Calibri', fontSize: 13, bold: true, italic: true, color: GOLD2, align: 'center', valign: 'middle', isTextBox: true });
}

// ---- 9. Fin
s = pres.addSlide({ masterName: 'Fin' });
s.addText('MERCI !', { placeholder: 'titre' });

pres.writeFile({ fileName: OUT }).then(() => console.log('ok', OUT));
