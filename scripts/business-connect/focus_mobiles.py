import sys, os
W=os.environ.get('BC_WORK','.')  # dossier de travail : photos *_t.png + sfr.png
SEM=os.environ.get('BC_SEM','du 20 octobre 2026')
from playwright.sync_api import sync_playwright
CSS="""*{box-sizing:border-box;margin:0}body{width:1080px;background:#0b0b0b;color:#eee;font-family:Inter,sans-serif;padding:52px 52px 44px}
.top{display:flex;align-items:center;gap:26px;padding-bottom:26px;border-bottom:2px solid #c9a24a55}.top img{height:92px;border-radius:8px}
.k{color:#c9a24a;letter-spacing:5px;font-size:21px;font-weight:600}h1{font-family:'Bitstream Charter',serif;font-weight:400;font-size:54px;color:#fff;margin-top:6px;line-height:1.1}
.intro{font-size:28px;color:#cfc7b0;margin:26px 0 22px}
.row{display:flex;gap:22px;background:linear-gradient(135deg,#1b1914,#121110);border:1px solid #3a321f;border-radius:26px;padding:22px;margin-bottom:20px;align-items:center}
.ph{flex:none;width:270px;height:270px;border-radius:50%;background:radial-gradient(circle at 50% 55%,#4a3a14 0%,#241c0b 45%,rgba(22,21,19,0) 72%);display:flex;align-items:center;justify-content:center;margin-left:-6px}.ph img{height:96%;width:auto;filter:drop-shadow(0 14px 22px rgba(0,0,0,.7))}
.tx{flex:1}.nm{font-family:'Bitstream Charter',serif;font-size:40px;color:#e5c26a;line-height:1.1}
.calc{font-size:24px;color:#bdb6a2;margin:8px 0 12px}.calc b{color:#fff}.calc s{color:#8b8573}
.price{display:inline-flex;align-items:baseline;gap:12px;background:linear-gradient(135deg,#e5c26a,#b98d33);border-radius:16px;padding:8px 22px;color:#15110a}.price span{font-size:56px;font-weight:800;line-height:1.05}.price small{font-size:21px;opacity:.9}
.or{font-size:25px;color:#ddd;margin-top:10px}.or b{color:#fff}
.bonus{display:inline-block;margin-top:12px;background:transparent;border:2px solid #c9a24a;color:#e5c26a;font-weight:800;font-size:23px;border-radius:999px;padding:7px 18px}
.odr{background:linear-gradient(135deg,#2b2210,#171309);border:2px solid #c9a24a;border-radius:26px;padding:24px 30px;margin-top:6px}
.odr b.h{font-family:'Bitstream Charter',serif;font-weight:400;font-size:38px;color:#e5c26a;display:block;margin-bottom:8px}.odr p{font-size:27px;line-height:1.4}.odr p b{color:#fff}
.note{margin-top:20px;font-size:23px;color:#bdb6a2;text-align:center}.foot{margin-top:22px;color:#8b8573;font-size:21px;text-align:center}"""
def row(img,name,init,rem,odr,price,sub,alt,bonus):
    remtxt=f' · Remise <b>−{rem}€</b>' if rem else ''
    b=f'<div class="bonus">♻ +{bonus}€ de bonus si reprise d\'un mobile</div>' if bonus else ''
    return f'<div class="row"><div class="ph"><img src="{img}_t.png"></div><div class="tx"><div class="nm">{name}</div><div class="calc">Prix initial <s>{init}€</s>{remtxt} · ODR SFR <b>−{odr}€</b></div><div class="price"><span>{price}</span><small>{sub}</small></div><div class="or">{alt}</div>{b}</div></div>'
def page(kicker,title,intro,rows,extra,out):
    h=f'<html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="top"><img src="sfr.png"><div><div class="k">{kicker}</div><h1>{title}</h1></div></div><div class="intro">{intro}</div>{rows}{extra}<div class="foot">GRADICOM · AMR — d\'après la « Business Connect » SFR {SEM}</div></body></html>'
    open(W+'/tmp.html','w').write(h)
    with sync_playwright() as p:
        b=p.chromium.launch(); pg=b.new_page(viewport={'width':1080,'height':1000}); pg.goto('file://'+W+'/tmp.html'); pg.wait_for_timeout(500)
        pg.screenshot(path=out,full_page=True); b.close()
O=os.environ.get('BC_OUT','/home/claude/gradicom/actus/')
# Semaine S44 (du 27 octobre au 2 novembre 2026) — prix recopiés du PDF tels quels
duo='<div class="row" style="padding:26px"><div class="ph" style="width:470px;height:240px;border-radius:30px;background:none;margin-left:0"><img src="duo_t.png" style="height:100%"></div><div class="tx"><div class="nm">iPhone Duo</div><div class="calc">Ciel Nocturne · Blanc Stellaire · 256 Go</div><div class="price"><span>2339€</span><small>téléphone seul</small></div></div></div>'
duo+='<div class="row"><div class="tx"><div class="nm">Avec forfait Illimité 5G+</div><div class="price"><span>1549€</span><small>+ 8€/mois pendant 24 mois</small></div><div class="or">ODR SFR de <b>200€</b> déduite</div></div></div>'
duo+='<div class="row"><div class="tx"><div class="nm">Avec forfait sans engagement</div><div class="price"><span>2139€</span><small>ODR SFR de 200€ déduite</small></div><div class="or">ou <b>4× 584,75€</b> sans frais, puis ODR 200€ remboursés</div></div></div>'
if os.environ.get('BC_DUO'): page('NOUVEAUTÉ · LANCEMENT LE 21/10','iPhone Duo','Les prix à connaître pour la précommande 👇',duo,'<div class="odr"><b class="h">⚠️ À retenir</b><p>L\'ODR SFR de <b>200€</b> est valable <b>uniquement pendant la période de précommande</b>.</p></div>',O+'business-connect-s44-iphone-duo.png')
r1=''.join([
 row('r17c','Redmi 17C',199,0,20,'179€','ODR 20€ déduite','ou <b>4× 49,75€</b> sans frais, puis ODR 20€ remboursés',0),
 row('r17','Redmi 17',249,0,50,'199€','ODR 50€ déduite','ou <b>4× 62,25€</b> sans frais, puis ODR 50€ remboursés',0),
 row('note17','Xiaomi Redmi Note 17',349,80,50,'219€','ODR 50€ déduite','ou <b>4× 67,25€</b> sans frais, puis ODR 50€ remboursés',0),
 row('x17t','Xiaomi 17T',749,200,100,'449€','ODR 100€ déduite','ou <b>4× 137,25€</b> sans frais, puis ODR 100€ remboursés',70)])
page('FOCUS MOBILES · BONS PLANS','Forfait sans engagement','4 bons plans à connaître par cœur 👇',r1,'<div class="note">ODR = offre de remboursement SFR. Paiement possible en 4 fois sans frais.</div>',O+'business-connect-s44-mobiles-1.png')
r2=''.join([
 row('note17pm','Redmi Note 17 Pro Max',293,192,100,'1€','ODR 100€ déduite','Le bon plan à <b>1€</b> !',50),
 row('x17t_b','Xiaomi 17T',441,340,100,'1€','ODR 100€ déduite','Le bon plan à <b>1€</b> !',70),
 row('x17tpro','Xiaomi 17T Pro',671,280,100,'99€','+ 8€/mois pendant 24 mois','ou <b>4× 97,75€</b> sans frais, puis ODR 100€ remboursés',100),
 row('s26','Galaxy S26',641,250,100,'99€','+ 8€/mois pendant 24 mois','ou <b>4× 97,75€</b> sans frais, puis ODR 100€ remboursés',100)])
odr='<div class="odr"><b class="h">🎁 Et aussi : les ODR constructeurs</b><p><b>Google Pixel 11</b> (du 1er au 31/10, <b>derniers jours</b>) : jusqu\'à <b>300€ remboursés</b> sur Pixel 11, 11 Pro, 11 Pro XL ou 11 Pro Fold.<br><b>Xiaomi</b> (du 17/09 au 03/01) : jusqu\'à <b>70€ remboursés</b> + chargeur 33W ou 120W jusqu\'à <b>100% remboursé</b>.</p></div>'
page('FOCUS MOBILES · BONS PLANS','Forfait Illimité 5G+','4 bons plans pour les clients qui veulent le top 👇',r2,odr,O+'business-connect-s44-mobiles-2.png')
