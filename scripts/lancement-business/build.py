import sys,os
from playwright.sync_api import sync_playwright
H=os.path.dirname(os.path.abspath(__file__));A=H+'/assets/'
css="""@page{size:A4 landscape;margin:0}*{box-sizing:border-box;margin:0}
body{font-family:Inter,Arial,sans-serif;color:#1a1a1a}
.p{width:297mm;height:210mm;page-break-after:always;position:relative;overflow:hidden;background:#fff;padding:10mm 14mm}
.hd{display:flex;align-items:center;gap:6mm;border-bottom:.6mm solid #b8892b;padding-bottom:4mm;height:22mm}
.hd img{height:16mm}.hd h1{font-size:9mm;letter-spacing:.5mm;color:#8a6414;font-weight:800}
.hd .sub{margin-left:auto;font-size:4.6mm;font-weight:700;color:#b8892b;border:.4mm solid #d9c08a;background:#fdfaf1;padding:1.5mm 5mm;border-radius:6mm}
.body{position:absolute;left:14mm;right:14mm;top:36mm;bottom:12mm;display:flex;gap:6mm;align-items:center;justify-content:center}
.body img{min-width:0;flex:0 1 auto;max-width:100%;max-height:100%;object-fit:contain;border:.3mm solid #d9c08a;border-radius:2mm;background:#fff}
.col{display:flex;flex-direction:column;gap:4mm;height:100%;justify-content:center}
.ft{position:absolute;bottom:4mm;left:14mm;right:14mm;font-size:2.8mm;color:#8a6414;display:flex;justify-content:space-between}
.cover{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12mm;border:1mm solid #b8892b;margin:8mm;width:281mm;height:194mm;padding:0}
.cover h1{font-size:15mm;color:#5c430a;text-align:center;line-height:1.15;font-weight:800}
.cover h1 span{color:#b8892b;display:block;margin-top:3mm;font-size:12mm}
.cover img{height:48mm}.cover .g{font-size:9mm;font-weight:700;color:#8a6414;letter-spacing:1mm}
.rule{width:60mm;height:.8mm;background:#b8892b}"""
def page(t,body,sub=''):
    s=f'<div class="sub">{sub}</div>' if sub else ''
    return f'<div class="p"><div class="hd"><img src="file://{A}image1.png"><h1>{t}</h1>{s}</div><div class="body">{body}</div><div class="ft"><span>GRADICOM • AMR</span><span>Lancement business · Novembre 2026</span></div></div>'
im=lambda n,st='':f'<img src="file://{A}image{n}.png" style="{st}">'
pg=[f'<div class="p" style="padding:0"><div class="cover"><h1>LANCEMENT BUSINESS<span>NOVEMBRE 2026</span></h1><div class="rule"></div><img src="file://{A}image1.png"><div class="g">GRADICOM • AMR</div></div></div>',
page('BUSINESS MOBILE',im(4)),
page('BUSINESS TERMINAUX',im(6),'Forfait sans engagement'),
page('BUSINESS TERMINAUX',im(8),'Illimité 5G+'),
page('BUSINESS ACCESSOIRES',im(11)+f'<div class="col">{im(10)}{im(9)}</div>'),
page('BUSINESS FIXE',im(12)),
page('BUSINESS OPTIONS',im(13,'width:48%;height:auto;')+im(14,'width:48%;height:auto;max-height:100%;'))]
open('/tmp/lb.html','w').write(f'<html><head><style>{css}</style></head><body>{"".join(pg)}</body></html>')
out=sys.argv[1]
with sync_playwright() as p:
    b=p.chromium.launch();g=b.new_page();g.goto('file:///tmp/lb.html');g.pdf(path=out,format='A4',landscape=True,print_background=True,prefer_css_page_size=True);b.close()
