# Payplan novembre 2026 -> 2 PDF A4 paysage (style clair, doré, peu d'encre)
import sys, os, html
from playwright.sync_api import sync_playwright
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
E = html.escape

CSS = '''<style>
@page{size:A4 landscape;margin:0}
*{box-sizing:border-box;margin:0}
body{font-family:Inter,sans-serif;color:#222;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:9mm 12mm 6mm;display:flex;flex-direction:column;page-break-after:always;overflow:hidden}
.top{display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:3.5mm;border-bottom:.5mm solid #b8892b}
.k{color:#a67c1f;letter-spacing:1.6mm;font-size:10pt;font-weight:600}
h1{font-family:'Bitstream Charter',serif;font-weight:400;font-size:28pt;color:#1a1a1a;line-height:1.05;margin-top:.5mm}
.who{text-align:right}.who b{display:block;font-family:'Bitstream Charter',serif;font-weight:400;font-size:22pt;color:#8a6414;line-height:1.05}
.who span{font-size:10.5pt;letter-spacing:1mm;color:#555;font-weight:600}
.cols{display:flex;gap:8mm;margin-top:4mm;flex:1;min-height:0}
.c1{flex:1.05;display:flex;flex-direction:column}.c2{flex:1.15;display:flex;flex-direction:column}
.h2{font-family:'Bitstream Charter',serif;font-size:16pt;color:#8a6414;margin-bottom:2mm;display:flex;align-items:baseline;gap:3mm}
.h2 small{font-family:Inter,sans-serif;font-size:9pt;color:#777;letter-spacing:.3mm}
table{border-collapse:separate;border-spacing:0;width:100%}
th{font-size:8pt;letter-spacing:.5mm;color:#8a6414;font-weight:600;text-align:center;padding:1.4mm 2mm;border-bottom:.35mm solid #d9c08a}
th:first-child,td:first-child{text-align:left}
td{padding:1.7mm 2.4mm;font-size:10.5pt;border-bottom:.25mm solid #eadfc4;text-align:center}
td.l{font-weight:600;color:#1a1a1a}td.l small{display:block;font-weight:400;font-size:8.5pt;color:#666;margin-top:.4mm}
td.b{font-size:13pt;font-weight:800;color:#555}
td.g{font-size:14pt;font-weight:800;color:#8a6414;background:#f9f1dc}
tr.tot td{border-bottom:none;font-weight:800;color:#8a6414;font-size:11pt}tr.tot td.g{font-size:16pt}
.x2{margin-top:3mm;border:.4mm solid #b8892b;border-radius:3mm;padding:2.6mm 4mm;font-size:9.5pt;line-height:1.4;color:#333}
.x2 b{color:#8a6414;font-size:11pt}
.card{border:.35mm solid #d9c08a;border-radius:3.5mm;padding:2.6mm 4mm;margin-top:3mm;font-size:10pt;line-height:1.45}
.card .t{font-family:'Bitstream Charter',serif;font-size:13pt;color:#8a6414;margin-bottom:.8mm}
.card b{color:#1a1a1a}.card em{color:#666;font-size:8.5pt;font-style:normal}
.lad{margin-top:4mm;border-top:.5mm solid #b8892b;padding-top:3mm}
.lad .t{font-size:9pt;letter-spacing:1mm;color:#a67c1f;font-weight:600;margin-bottom:2mm}
.steps{display:flex;gap:3mm}
.st{flex:1;border:.5mm solid #b8892b;border-radius:3.5mm;text-align:center;padding:2mm 1mm}
.st span{display:block;font-size:9.5pt;color:#555;font-weight:600}.st b{display:block;font-size:20pt;color:#8a6414;font-weight:800;line-height:1.1}
.note{margin-top:2.6mm;font-size:10pt;color:#333;display:flex;justify-content:space-between;align-items:center}
.note .p{border:.4mm solid #b8892b;border-radius:99mm;padding:1.2mm 5mm;background:#f9f1dc;font-weight:700;color:#5c430a}
.note .m{font-size:9pt;color:#777;font-style:italic}
.opt{display:flex;gap:6mm;margin-top:6mm}
.opt .st{padding:5mm 3mm}.opt .st b{font-size:24pt}.opt .st span{font-size:11pt;line-height:1.35;margin-top:1.5mm}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:7mm}
.grid .card{margin-top:0;font-size:11.5pt;padding:4mm 5mm}.grid .card .t{font-size:15pt}
.red{color:#a33;font-size:9.5pt;margin-top:1.5mm}
</style>'''

COLLECT = '''<div class="card"><div class="t">Objectif collectif</div>
<div><b>Goodays trimestre</b> : 4,6 = <b>5 pts</b> · 4,7 = <b>10 pts</b><br><em>Trimestre de référence SFR : juillet, août et septembre 2026</em></div>
<div style="margin-top:1.4mm"><b>Google mensuel</b> : 4,8 = <b>2,5 pts</b> · 4,9 = <b>5 pts</b> <em>(30 notes minimum)</em></div></div>'''

def items_table(label, rows):
    # rows: (nom, [(seuil, pts), ...])
    h = '<table><tr><th>%s</th><th>OBJECTIF</th><th>POINTS</th></tr>' % E(label)
    for nom, tiers in rows:
        for i, (s, p) in enumerate(tiers):
            h += '<tr>'
            if i == 0: h += '<td class="l" rowspan="%d">%s</td>' % (len(tiers), nom)
            h += '<td>%s</td><td class="b">%s</td></tr>' % (s, p)
    return h + '</table>'

def ladder(steps):
    return '<div class="lad"><div class="t">POINTS ATTEINTS  →  PRIME</div><div class="steps">' + ''.join(
        '<div class="st"><span>%s pts</span><b>%s €</b></div>' % (p, e) for p, e in steps) + '</div></div>'

def page(role, store, bloc1, bloc2, ladder_html, note=None, items_label='R/O magasin'):
    return '''<div class="page"><div class="top"><div><div class="k">PAYPLAN NOVEMBRE 2026</div><h1>%s</h1></div>
<div class="who"><b>%s</b><span>NOVEMBRE 2026</span></div></div>
<div class="cols"><div class="c1">%s</div><div class="c2">%s</div></div>%s%s</div>''' % (role, store, bloc1 + COLLECT, bloc2, ladder_html, note or '')

PRO_NOTE = '''<div class="note"><span class="p">Avoir atteint un R/O marge &gt; 90 % de l'objectif individuel</span><span class="m">*Liste des options en annexe</span></div>'''
OPT_NOTE = '''<div class="note"><span></span><span class="m">*Liste des options en annexe</span></div>'''

def b1_items(rows, total, cond):
    h = '<div class="h2">Bloc 1 <small>% de la marge</small></div><table><tr><th>R/O</th><th>BASE</th><th>AVEC ×2</th></tr>'
    for lab, a, b in rows:
        h += '<tr><td class="l">%s</td><td class="b">%s</td><td class="g">%s</td></tr>' % (lab, a, b)
    h += '<tr class="tot"><td>Total</td><td>%s</td><td class="g">%s</td></tr></table><div class="x2"><b>×2</b> si %s</div>' % (total[0], total[1], cond)
    return h

def b2(items_html):
    return '<div class="h2">Bloc 2 <small>32 points max</small></div>' + items_html

def b1_tiers(rows, cond, head):
    h = '<div class="h2">Bloc 1 <small>%% de la marge</small></div><table><tr><th>%s</th><th>+ POINTS BLOC 2</th><th>%%</th><th>AVEC ×2</th></tr>' % head
    for lab, pts, a, b in rows:
        h += '<tr><td class="l">%s</td><td>%s</td><td class="b">%s</td><td class="g">%s</td></tr>' % (lab, pts, a, b)
    return h + '</table><div class="x2"><b>×2</b> si %s</div>' % cond

G_TAB = items_table('R/O magasin', [('Fixe VR', [('100 %', '2,5 pts')]), ('Abos <small>(mix 2h &lt; 17 %)</small>', [('100 %', '2,5 pts')]),
    ('Canal +', [('100 %', '2 pts')]), ('Maisons sécurisées', [('100 %', '2 pts')]), ('Offres PRO', [('100 %', '3 pts')]), ('Options*', [('100 %', '5 pts')])])
A_TAB = items_table('R/O individuel', [('Fixe VR', [('100 %', '1,25 pt'), ('110 %', '2,5 pts')]), ('Abos <small>(mix 2h &lt; 17 %)</small>', [('100 %', '1,25 pt'), ('110 %', '2,5 pts')]),
    ('Canal +', [('100 %', '1 pt'), ('120 %', '2 pts')]), ('Maisons sécurisées', [('100 %', '1 pt'), ('120 %', '2 pts')]),
    ('Offres PRO', [('100 %', '1,5 pt'), ('120 %', '3 pts')]), ('Options*', [('100 %', '3 pts'), ('120 %', '5 pts')])])

COND_G_V = 'TCS individuel + taux CHUBB &gt; 42 % magasin + R/O accessoires + R/O services magasin'
COND_G_R = 'TCS + taux CHUBB &gt; 42 % + R/O accessoires + R/O services'
COND_A = 'R/O marge atteint + taux CHUBB &gt; 42 %'

def options_page(store):
    return '''<div class="page"><div class="top"><div><div class="k">PAYPLAN NOVEMBRE 2026</div><h1>Liste des options</h1></div><div class="who"><b>%s</b><span>NOVEMBRE 2026</span></div></div>
<div class="opt"><div class="st"><b>1 pt</b><span>Ciné+ OCS<br>Ligue 1+<br>Disney+</span></div><div class="st"><b>2 pts</b><span>SFR Cyber 5 équipements<br>Pack Kids Watch Honor</span></div><div class="st"><b>5 pts</b><span>Maison sécurisée</span></div></div>
<div class="grid">
<div class="card"><div class="t">Sécurité</div>SFR Cybersécurité 5 équipements<br>Maison sécurisée
<div class="red">Si l'option n'est pas conservée par le client au-delà de 120 jours, elle sera défacturée au(x) vendeur(s) concerné(s), dès lors que nous en aurons connaissance, soit jusqu'à 4 mois plus tard. Exemple : si 10 options SFR Cyber sont résiliées avant 120 jours, cela entraînera un retrait de 250 € de marge en une seule fois.</div></div>
<div class="card"><div class="t">Divertissement</div>Ciné+ / OCS<br>Disney+ <em>(hors Disney+ standard avec pub et bouquet famille)</em></div>
<div class="card"><div class="t">Sport</div>Ligue 1+</div>
<div class="card"><div class="t">Équipement</div>Pack Kids Watch Honor</div></div></div>''' % store

def build(store, pages, fname, p):
    doc = '<html><head><meta charset="utf-8">' + CSS + '</head><body>' + ''.join(pages) + '</body></html>'
    hp = os.path.join(OUT, fname + '.html'); open(hp, 'w').write(doc)
    pg = p.new_page(); pg.goto('file://' + os.path.abspath(hp)); pg.wait_for_timeout(600)
    pg.pdf(path=os.path.join(OUT, fname + '.pdf'), format='A4', landscape=True, print_background=True, prefer_css_page_size=True)

S = 'GRADICOM · GRADIGNAN'
GV = page('Vendeur', S, b1_tiers([('R/O marge ≥ 90 %', '17 pts', '2 %', '4 %'), ('R/O marge ≥ 100 %', '22 pts', '4 %', '8 %'), ('R/O marge ≥ 110 %', '24 pts', '5 %', '10 %'), ('R/O marge ≥ 120 %', '24 pts', '6 %', '12 %')], COND_G_V, 'PALIER'),
    b2(G_TAB), ladder([('17', '50'), ('22', '100'), ('27', '150'), ('32', '200')]), PRO_NOTE)
GR = page('Responsable', S, b1_tiers([('R/O marge ≥ 90 %', '17 pts', '1 %', '2 %'), ('R/O marge ≥ 100 %', '22 pts', '2 %', '4 %'), ('R/O marge ≥ 105 %', '24 pts', '2,35 %', '4,7 %'), ('R/O marge ≥ 110 %', '24 pts', '2,60 %', '5,2 %')], COND_G_R, 'PALIER'),
    b2(G_TAB), ladder([('17', '100'), ('22', '200'), ('27', '300'), ('32', '400')]), OPT_NOTE)
S2 = 'GRADICOM · AMR'
AV = page('Vendeur', S2, b1_items([('Fixe conquête VV + VR<br><small>+ R/O TCS</small>', '2 %', '4 %'), ('Terminaux', '1,5 %', '3 %'), ('Accessoires + Services', '1,5 %', '3 %'), ('Abos <small>(mix 2h &lt; 17 %)</small>', '1 %', '2 %')], ('6 %', '12 %'), COND_A),
    b2(A_TAB), ladder([('17', '50'), ('20', '100'), ('24', '150'), ('27', '200'), ('32', '300')]), PRO_NOTE)
AR = page('Responsable', S2, b1_items([('Fixe conquête VR<br><small>+ R/O TCS</small>', '0,85 %', '1,7 %'), ('Terminaux', '0,60 %', '1,2 %'), ('Accessoires + Services', '0,60 %', '1,2 %'), ('Abos <small>(mix 2h &lt; 17 %)</small>', '0,45 %', '0,9 %')], ('2,5 %', '5 %'), COND_A),
    b2(A_TAB), ladder([('17', '100'), ('20', '175'), ('24', '250'), ('27', '350'), ('32', '450')]), OPT_NOTE)

with sync_playwright() as p:
    b = p.chromium.launch()
    build(S, [GV, GR, options_page(S)], 'Payplan_GRADIGNAN_Novembre_2026', b)
    build(S2, [AV, AR, options_page(S2)], 'Payplan_GRADICOM_AMR_Novembre_2026', b)
    b.close()
