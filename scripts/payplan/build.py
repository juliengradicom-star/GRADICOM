# Payplan novembre 2026 : MÊME présentation que le PowerPoint de Julien (page de garde, frise, flèches, tableaux,
# options, petites lignes) mais refaite : formes, couleurs et polices. PDF A4 paysage, peu d'encre.
import sys, os
from playwright.sync_api import sync_playwright
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
HERE = os.path.dirname(os.path.abspath(__file__))

CSS = '''<style>
@page{size:A4 landscape;margin:0}
*{box-sizing:border-box;margin:0}
body{font-family:Inter,sans-serif;color:#222;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{position:relative;width:297mm;height:210mm;padding:10mm 14mm 8mm;page-break-after:always;overflow:hidden}
.hd{display:flex;justify-content:space-between;align-items:baseline;padding-bottom:3mm;border-bottom:.5mm solid #b8892b}
.hd .s{font-family:'Bitstream Charter',serif;font-size:19pt;color:#8a6414;letter-spacing:.3mm}
.hd .r{font-size:12pt;letter-spacing:1.4mm;font-weight:700;color:#555}
.hd .ti{font-family:'Bitstream Charter',serif;font-size:22pt;color:#1a1a1a;text-align:center;flex:1}
.frame{position:relative;border:.5mm solid #b8892b;border-radius:3mm;background:#fdfaf1}
.tag{position:absolute;top:-.5mm;right:-.5mm;background:#8a6414;color:#fff;font-weight:800;letter-spacing:.6mm;font-size:13pt;padding:1.5mm 6mm;border-radius:0 3mm 0 3mm}
.maxp{display:inline-block;border:.5mm solid #8a6414;border-radius:2mm;padding:1.2mm 7mm;font-weight:800;font-size:12pt;color:#5c430a;background:#fff}
/* bloc 1 */
.b1{margin-top:14mm;height:150mm;padding:14mm 9mm 0}
.g1{display:grid;grid-template-rows:repeat(4,24mm);row-gap:5mm;align-items:stretch}
.pill{background:#f4e7c4;border:.35mm dashed #b8892b;border-radius:3mm;display:flex;align-items:center;padding:0 4mm;font-size:11.5pt;line-height:1.15;white-space:nowrap}
.pill b{font-size:15pt;margin:0 1.2mm}.pill small{font-size:8.5pt;margin-left:2mm;color:#444;font-weight:600}
.arw{display:flex;align-items:center;justify-content:center;color:#8a6414;font-size:15pt;font-weight:800}
.pct,.res{border-radius:3mm;display:flex;align-items:center;justify-content:center;font-weight:800;color:#8a6414;border:.35mm dashed #b8892b}
.pct{background:#fff;font-size:21pt}.pct small,.res small{font-size:11pt;margin-left:.8mm;font-weight:600}
.res{background:#e9cd85;color:#4a3507;font-size:23pt}
.mid{border:.5mm solid #8a6414;border-radius:5mm;background:#f9f1dc;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:11pt;line-height:1.5;padding:2mm 3mm;position:relative}
.mid b{font-size:13.5pt;color:#1a1a1a}.mid i{font-style:normal;font-size:9.5pt;color:#555}.mid .pl{color:#8a6414;font-weight:800;font-size:12pt;line-height:1.1}
.mid .x2{position:absolute;top:-8mm;left:50%;transform:translateX(-50%);background:#8a6414;color:#fff;font-weight:800;font-size:17pt;padding:.5mm 6mm;border-radius:2mm 2mm 0 0;white-space:nowrap}
.plus{position:relative}.plus::after{content:'+';position:absolute;left:50%;bottom:-4.6mm;transform:translateX(-50%);width:5mm;height:5mm;line-height:4.6mm;text-align:center;background:#1a1a1a;color:#fff;font-weight:800;border-radius:50%;font-size:11pt;z-index:3}
.eq{font-size:34pt;font-weight:800;color:#1a1a1a;display:flex;align-items:center;justify-content:center}
.tot{background:#e9cd85;border:.5mm dashed #8a6414;border-radius:5mm;display:flex;align-items:center;justify-content:center;font-size:40pt;font-weight:800;color:#4a3507}
.big{position:absolute;left:9mm;right:9mm;bottom:7mm;height:11mm;background:linear-gradient(90deg,#fdf6e0,#d4ae55);clip-path:polygon(0 18%,95% 18%,95% 0,100% 50%,95% 100%,95% 82%,0 82%)}
/* bloc 2 */
.top2{display:flex;margin-top:3mm;gap:0}
.top2 .frame{border-radius:0}
.tb{width:100%;border-collapse:collapse;font-size:9.5pt}
.tb td{border:.3mm solid #8a6414;padding:1.2mm 2mm;text-align:center;background:#fff}
.tb td.n{font-weight:700;width:38%}.tb td.n small{font-weight:400;font-size:8pt;display:block}
.tb td.p{font-weight:800}
.lab{font-weight:800;font-size:13pt;text-decoration:underline;color:#1a1a1a}
.coll{font-size:11pt;line-height:1.7}.coll .k{font-weight:700;display:inline-block;width:42mm}
.fr2{position:relative;margin-top:4mm;height:56mm;border:.5mm solid #b8892b;background:#fdfaf1}
.steps{position:absolute;left:0;right:0;top:0;bottom:0}
.step{position:absolute;top:0;width:0}
.step .t{position:absolute;left:-14mm;top:4mm;width:28mm;text-align:center;color:#fff;font-weight:800;font-size:12pt;padding:.8mm 0}
.step .l{position:absolute;left:-.2mm;top:10mm;height:12mm;width:.5mm;background:#1a1a1a}
.step .e{position:absolute;left:-20mm;top:18mm;height:25mm;width:40mm;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:800;font-size:25pt;color:#1a1a1a;z-index:2}
.arrow2{position:absolute;left:3mm;right:2mm;top:18mm;height:25mm;background:linear-gradient(90deg,#fdf6e0,#d4ae55 90%,#a67c1f);clip-path:polygon(0 0,96% 0,96% -20%,100% 50%,96% 120%,96% 100%,0 100%,3% 50%)}
.hl{position:absolute;top:3mm;bottom:3mm;border:1.1mm solid #8a6414}
.dn{position:absolute;top:-1mm}
.cond{position:absolute;background:#1a1a1a;color:#fff;font-weight:700;font-size:11pt;padding:1.6mm 7mm}
.foot{position:absolute;left:14mm;bottom:9mm;font-weight:700;font-style:italic;font-size:11pt}
/* options */
.opt{display:grid;grid-template-columns:90mm 1fr;gap:6mm;margin-top:6mm}
.ot{width:100%;border-collapse:collapse;font-size:10.5pt;text-align:center}
.ot th{padding:2mm;font-weight:800;border-bottom:.3mm solid #1a1a1a}.ot td{padding:2mm;background:#f9f1dc;font-size:11pt}
.bl{position:absolute;border:.4mm solid #b8892b;border-radius:50%;background:#fdf6e0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:5mm 8mm;font-size:11.5pt;line-height:1.5}
.bl h3{font-size:12pt;letter-spacing:.8mm;font-weight:800;color:#8a6414;margin-bottom:2mm}
.bl .red{color:#b00;font-size:8pt;font-weight:700;margin:1.5mm 0;line-height:1.35}.bl small{font-size:8.5pt;color:#555}
/* conditions */
.txt{font-size:8.6pt;line-height:1.38;margin-top:4mm;padding:0 6mm}
.txt p{margin-bottom:2.6mm}.txt u{font-weight:800}.txt .rd{color:#c00;font-weight:800}
/* cover */
.cov{position:absolute;inset:10mm;border:1mm solid #b8892b;border-radius:3mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10mm}
.cov h1{font-family:'Bitstream Charter',serif;font-weight:400;font-size:54pt;line-height:1.1;color:#1a1a1a}
.cov img{height:46mm}.cov .st{font-size:22pt;font-weight:800;letter-spacing:1mm;color:#8a6414}
</style>'''

def header(store, role, mid=''):
    return '<div class="hd"><span class="s">%s</span>%s<span class="r">%s</span></div>' % (store, mid, role)

def cover(store):
    return '<div class="page"><div class="cov"><h1>PAYPLAN<br>NOVEMBRE 2026</h1><img src="file://%s/assets/sfr.png"><div class="st">%s</div></div></div>' % (HERE, store)

def pct(v): return '<div class="pct">%s<small>%%</small></div>' % v
def res(v): return '<div class="res">%s<small>%%</small></div>' % v

def bloc1_gradignan(store, role, rows, cond_html):
    g = ''
    for i, (lab, pts, a, b) in enumerate(rows):
        r = i + 1
        g += '<div class="pill" style="grid-column:1;grid-row:%d">R/O <b>MARGE ≥ %s</b><small>+ %s</small></div>' % (r, lab, pts)
        g += '<div class="arw" style="grid-column:2;grid-row:%d">→</div><div style="grid-column:3;grid-row:%d">%s</div>' % (r, r, pct(a).replace('class="pct"', 'class="pct" style="height:100%"'))
        g += '<div style="grid-column:5;grid-row:%d">%s</div>' % (r, res(b).replace('class="res"', 'class="res" style="height:100%"'))
    g += '<div class="mid" style="grid-column:4;grid-row:1/5;margin:0 5mm"><div class="x2">× 2</div>%s</div>' % cond_html
    return '<div class="page">%s<div class="frame b1"><div class="tag">BLOC 1</div><div class="g1" style="grid-template-columns:1fr 12mm 30mm 52mm 30mm">%s</div><div class="big"></div></div></div>' % (header(store, role), g)

def bloc1_items(store, role, rows, mid_html, total):
    g = ''
    for i, (lab, a, b) in enumerate(rows):
        r = i + 1
        g += '<div class="pill" style="grid-column:1;grid-row:%d;font-size:11pt">%s</div><div class="arw" style="grid-column:2;grid-row:%d">→</div>' % (r, lab, r)
        g += '<div style="grid-column:3;grid-row:%d">%s</div>' % (r, pct(a).replace('class="pct"', 'class="pct" style="height:100%"'))
        g += '<div style="grid-column:5;grid-row:%d" class="%s">%s</div>' % (r, 'plus' if i < 3 else '', res(b).replace('class="res"', 'class="res" style="height:100%"'))
    g += '<div class="mid" style="grid-column:4;grid-row:1/5;margin:0 5mm"><div class="x2">× 2</div>%s</div>' % mid_html
    g += '<div class="eq" style="grid-column:6;grid-row:1/5">=</div><div class="tot" style="grid-column:7;grid-row:1/5;height:44mm;align-self:center">%s<small style="font-size:18pt;margin-left:1mm">%%</small></div>' % total
    return '<div class="page">%s<div class="frame b1"><div class="tag">BLOC 1</div><div class="g1" style="grid-template-columns:1fr 10mm 26mm 40mm 26mm 12mm 36mm">%s</div><div class="big"></div></div></div>' % (header(store, role), g)

COLL = '''<div class="lab">Obj collectif :</div><div class="coll" style="margin-top:2mm">
<span class="k">Goodays trimestre →</span>4,6 = <b>5 pts</b><br><span class="k"></span>4,7 = <b>10 pts</b><br>
<i style="font-size:9.5pt;font-weight:600">(Trimestre de référence SFR : juillet, août &amp; septembre 2026)</i><br>
<span style="display:block;height:2mm"></span>
<span class="k">Google mensuel →</span>4,8 = <b>2,5 pts</b><br><span class="k"><i style="font-size:9.5pt;font-weight:600">(30 notes minimum)</i></span>4,9 = <b>5 pts</b></div>'''

def table(rows):
    h = '<table class="tb">'
    for nom, tiers in rows:
        for i, (s, p) in enumerate(tiers):
            h += '<tr>'
            if i == 0: h += '<td class="n" rowspan="%d">%s</td>' % (len(tiers), nom)
            h += '<td><i>%s</i></td><td class="p">%s</td></tr>' % (s, p)
    return h + '</table>'

G_ROWS = [('Fixe VR', [('100 %', '2,5 pts')]), ('Abos<small>(mix 2h &lt; 17 %)</small>', [('100 %', '2,5 pts')]), ('Canal +', [('100 %', '2 pts')]),
          ('Maisons sécurisées', [('100 %', '2 pts')]), ('Offres PRO', [('100 %', '3 pts')]), ('Options*', [('100 %', '5 pts')])]
A_ROWS = [('Fixe VR', [('100 %', '1,25 pt'), ('110 %', '2,5 pts')]), ('Abos<small>(mix 2h &lt; 17 %)</small>', [('100 %', '1,25 pt'), ('110 %', '2,5 pts')]),
          ('Canal +', [('100 %', '1 pt'), ('120 %', '2 pts')]), ('Maisons sécurisées', [('100 %', '1 pt'), ('120 %', '2 pts')]),
          ('Offres PRO', [('100 %', '1,5 pt'), ('120 %', '3 pts')]), ('Options*', [('100 %', '3 pts'), ('120 %', '5 pts')])]
TAGC = ['#b8a470', '#9c8340', '#7a5f1a', '#5c430a', '#2e2204']

def bloc2(store, role, label, rows, steps, frame_from=None, vendeur=False):
    n = len(steps)
    pos = [ (i + .5) / n * 100 for i in range(n) ]
    st = ''
    for i, (p, e) in enumerate(steps):
        c = TAGC[min(len(TAGC) - 1, i + (5 - n))]
        st += '<div class="step" style="left:%.2f%%"><div class="t" style="background:%s">%s Pts</div><div class="l"></div><div class="e">%s€</div></div>' % (pos[i], c, p, e)
    hl = dn = cond = ''
    if frame_from is not None:
        left = (frame_from) / n * 100
        hl = '<div class="hl" style="left:%.2f%%;right:.8%%"></div>' % left
        cx = (left + 100) / 2
        dn = '<svg class="dn" style="left:calc(%.2f%% - 15mm);top:calc(100%% - 1mm)" width="30mm" height="14mm" viewBox="0 0 34 20"><path d="M10 0 H24 V9 H33 L17 20 L1 9 H10 Z" fill="#fff" stroke="#8a6414" stroke-width="1.1"/></svg>' % cx
        cond = '<div class="cond" style="left:calc(%.2f%% - 52mm);top:calc(100%% + 13mm)">Avoir atteint un R/O marge &gt;90%% de l\'objectif individuel</div>' % cx
    mid = '<div style="text-align:center;margin-top:3mm"><span class="maxp">32 points max</span></div>'
    return ('<div class="page">%s%s<div class="top2"><div class="frame" style="flex:1;padding:4mm 5mm;display:flex;gap:6mm"><div class="lab" style="width:38mm;white-space:nowrap">%s :</div><div style="flex:1">%s</div></div>'
            '<div class="frame" style="flex:1;padding:4mm 7mm;border-left:none"><div class="tag">BLOC 2</div>%s</div></div>'
            '<div class="fr2"><div class="arrow2"></div><div class="steps">%s</div>%s%s%s</div><div class="foot">*Liste des options en annexe</div></div>'
            % (header(store, role), mid, label, table(rows), COLL, st, hl, dn, cond))

def options(store):
    return ('<div class="page">' + header(store, '', '<span class="ti">LISTE DES OPTIONS NOVEMBRE 2026</span>') +
      '<div style="margin-top:8mm;width:128mm"><table class="ot"><tr><th>Ciné+ OCS /<br>Ligue 1+ / Disney+</th><th>SFR Cyber 5 équipements /<br>Pack Kids Watch Honor</th><th>Maison sécurisée</th></tr><tr><td>1 pt</td><td>2 pts</td><td>5 pts</td></tr></table></div>'
      '<div class="bl" style="left:150mm;top:24mm;width:130mm;height:78mm"><h3>SÉCURITÉ :</h3>-SFR Cybersécurité 5 équipements'
      '<div class="red">Si l\'option n\'est pas conservée par le client au-delà de 120 jours, celle-ci sera défacturée au(x) vendeur(s) concerné(s), dès lors que nous en aurons connaissance, soit jusqu\'à 4 mois plus tard.<br><u>Exemple</u> : si 10 options SFR Cyber sont résiliées avant 120 jours, cela entraînera un retrait de 250 € de marge en une seule fois.</div>-Maison sécurisée</div>'
      '<div class="bl" style="left:14mm;top:62mm;width:100mm;height:62mm"><h3>DIVERTISSEMENT :</h3>-Ciné + / OCS<br>-Disney+ <small>(hors Disney+ standard avec pub et bouquet famille)</small></div>'
      '<div class="bl" style="left:100mm;top:112mm;width:86mm;height:70mm"><h3>SPORT :</h3>-Ligue 1+</div>'
      '<div class="bl" style="left:196mm;top:112mm;width:86mm;height:70mm"><h3>ÉQUIPEMENT :</h3>-Pack Kids Watch Honor</div></div>')

def conditions(store):
    return ('<div class="page">' + header(store, '') + '''<div class="txt">
<p><u>Abonnement FIXE Conquête VV &amp; VR</u> : Conquête et VLA<br>Seules les lignes raccordées seront rémunérées. Les souscriptions en RR* seront dé-rémunérées</p>
<p><u>Reprise de rémunération</u> : Conquête, VLA, Migration Fibre, <span class="rd">BOX 5G avec ou sans TV résilié dans les 6 mois de la souscription</span>, Option SFR Cybersécurité 5 équipements, CHUBB.<br>
La marge générée par les offres non raccordées seront déduites de la marge de référence pour le calcul de rémunération. (Exemple : 7000€ de marge générée, 280€ de marge fixe non raccordées = 7000-280 soit 6720€ ; Ce montant sera la base de référence pour le calcul de rémunération au pourcentage)<br>
La marge générée par SFR Cybersécurité 5 équipements sera déduite de la marge de référence pour le calcul de rémunération si l'option n'est pas conservée 120 jours minimum par le client dès lors que nous en aurons connaissance.<br>
Les CHUBB renoncées sous 30 jours ne seront pas rémunérées. (La marge générée par ces CHUBB sera retirée de la marge de référence pour le calcul des primes, dès lors que nous en aurons connaissance. Un décalage sur la reprise de rémunération est donc réalisé sur cet item)</p>
<p><u>Abonnement MOBILE</u> : Conquête et VLA<br>La rémunération sera versée sur les abonnements si et seulement si le taux de RR* du magasin est strictement inférieur à 7%</p>
<p><u>Assurance CHUBB</u> :<br>Calcul du taux -&gt; Total assurances mobile by Chubb / total actes éligibles** (**Terminal NU, Renouvellement, Pack ABO, Eco PACK, W2S)<br>
<span class="rd">L'item est validé si et seulement si le taux de renonciation du vendeur et du magasin sont strictement inférieurs à 10%.</span> Le délai de renonciation étant de 30 jours, une reprise de rémunération sera effectuée sur le ou les mois suivants le versement initial de la prime. Pour les responsables de magasin, c'est le taux des 3 mois glissants qui fait foi. Les taux pris en compte sont adressés par SFR dans les courriers de rémunération</p>
<p><u>Goodays</u> : La note est générée par l'outil Goodays.</p>
<p><u>Migration FIBRE VR</u> : Volume offres migration Raccordées ADSL vers FTTH, ADSL vers FTTB, FTTB vers FTTH, ADSL vers BOX 5G, FTTB vers BOX 5G et également les déménagements avec changement de technologie ADSL vers FIBRE (Seules les lignes raccordées seront rémunérées)</p>
<p><u>Conquête FIXE VR</u> : Une VR (vente raccordée), est déclarée raccordée dès lors que la mention « REM R OK DEFINITIF » est notifiée dans l'historique de la commande sous FAST. La date à laquelle cette mention est notifiée fait foi pour le jour de raccordement. (Un RDV de raccordement peut avoir lieu le 30 du mois en cours, avec un raccordement officialisé le 02 du mois suivant)<br>
Les BOX 5G offrent un raccordement le jour J, sous condition que cette ligne soit conservée pour une durée minimale de <b><i>six</i></b> mois. Dans le cas contraire, un recalcul d'objectif sera effectué en aval</p>
<p style="font-style:italic;font-weight:700">*RR : Résiliation / Réouverture</p></div></div>''')

def build(fname, pages, p):
    hp = os.path.join(OUT, fname + '.html')
    open(hp, 'w').write('<html><head><meta charset="utf-8">' + CSS + '</head><body>' + ''.join(pages) + '</body></html>')
    pg = p.new_page(); pg.goto('file://' + os.path.abspath(hp)); pg.wait_for_timeout(800)
    pg.pdf(path=os.path.join(OUT, fname + '.pdf'), format='A4', landscape=True, print_background=True, prefer_css_page_size=True)

CG_V = '<div><b>TCS</b> <i>individuel</i></div><div class="pl">+</div><div><i>Taux</i> <b>CHUBB</b> <i>&gt;42% magasin</i></div><div class="pl">+</div><div><i>R/O</i> <b>ACCESSOIRES</b></div><div><span class="pl">+</span> <i>R/O</i> <b>SERVICES</b> <i>magasin</i></div>'
CG_R = '<div><b>TCS</b></div><div class="pl">+</div><div><i>Taux</i> <b>CHUBB</b> <i>&gt;42%</i></div><div class="pl">+</div><div><i>R/O</i> <b>ACCESSOIRES</b></div><div><span class="pl">+</span> <i>R/O</i> <b>SERVICES</b></div>'
CA = '<div><i>R/O</i> <b>MARGE</b></div><div class="pl">+</div><div><i>Taux</i> <b>CHUBB</b> <i>&gt;42%</i></div>'

with sync_playwright() as p:
    b = p.chromium.launch()
    S = 'GRADICOM · GRADIGNAN'
    build('Payplan_GRADIGNAN_Novembre_2026', [
        cover('GRADICOM GRADIGNAN'),
        bloc1_gradignan(S, 'VENDEUR', [('90 %', '17 pts magasin sur le bloc 2', '2', '4'), ('100 %', '22 pts magasin sur le bloc 2', '4', '8'), ('110 %', '24 pts magasin sur le bloc 2', '5', '10'), ('120 %', '24 pts magasin sur le bloc 2', '6', '12')], CG_V),
        bloc2(S, 'VENDEUR', 'R/O magasin', G_ROWS, [('17', '50'), ('22', '100'), ('27', '150'), ('32', '200')], frame_from=1, vendeur=True),
        bloc1_gradignan(S, 'RESPONSABLE', [('90 %', '17 pts sur le bloc 2', '1', '2'), ('100 %', '22 pts sur le bloc 2', '2', '4'), ('105 %', '24 pts sur le bloc 2', '2,35', '4,7'), ('110 %', '24 pts sur le bloc 2', '2,60', '5,2')], CG_R),
        bloc2(S, 'RESPONSABLE', 'R/O magasin', G_ROWS, [('17', '100'), ('22', '200'), ('27', '300'), ('32', '400')]),
        options(S), conditions(S)], b)
    S2 = 'GRADICOM · AMR'
    build('Payplan_GRADICOM_AMR_Novembre_2026', [
        cover('GRADICOM &amp; AMR'),
        bloc1_items(S2, 'VENDEUR', [('R/O <b>FIXE</b> conquête VV + VR <span style="margin:0 1.5mm;color:#b8892b">+</span> R/O <b>TCS</b>', '2', '4'), ('R/O <b>TERMINAUX</b>', '1,5', '3'), ('R/O <b>ACCESSOIRES</b> + R/O <b>SERVICES</b>', '1,5', '3'), ('R/O <b>ABO</b> <small>(mix 2h &lt; 17%)</small>', '1', '2')], CA, '12'),
        bloc2(S2, 'VENDEUR', 'R/O individuel', A_ROWS, [('17', '50'), ('20', '100'), ('24', '150'), ('27', '200'), ('32', '300')], frame_from=2, vendeur=True),
        bloc1_items(S2, 'RESPONSABLE', [('R/O <b>FIXE</b> conquête VR <span style="margin:0 1.5mm;color:#b8892b">+</span> R/O <b>TCS</b>', '0,85', '1,7'), ('R/O <b>TERMINAUX</b>', '0,60', '1,2'), ('R/O <b>ACCESSOIRES</b> + R/O <b>SERVICES</b>', '0,60', '1,2'), ('R/O <b>ABO</b> <small>(mix 2h &lt; 17%)</small>', '0,45', '0,9')], CA, '5'),
        bloc2(S2, 'RESPONSABLE', 'R/O individuel', A_ROWS, [('17', '100'), ('20', '175'), ('24', '250'), ('27', '350'), ('32', '450')]),
        options(S2), conditions(S2)], b)
    b.close()
