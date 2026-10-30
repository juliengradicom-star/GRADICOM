import sys
from playwright.sync_api import sync_playwright
src,out=sys.argv[1],sys.argv[2]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1080,'height':1000}); pg.goto('file://'+src); pg.wait_for_timeout(700)
    pg.screenshot(path=out,full_page=True); b.close()
