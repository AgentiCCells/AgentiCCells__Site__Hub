# Makes assets/og/<id>.jpg (1200x630) for every cell that has a desktop screenshot, from the committed
# 1366 px screenshot: the top 1366x717 px, resized. Run with: python3 -I build/og/make-og.py
# The home image comes from build/og/home.html, screenshotted at 1200x630 (see REALITY.md).
import json, os
from PIL import Image
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
d = json.load(open(os.path.join(root, 'data/screenshots.json')))
for r in d['shots']:
    src = os.path.join(root, r['shots']['1366']['file'].lstrip('/'))
    im = Image.open(src).convert('RGB').crop((0, 0, 1366, 717)).resize((1200, 630), Image.LANCZOS)
    out = os.path.join(root, 'assets/og', r['id'] + '.jpg')
    for q in (84, 76, 68, 60):
        im.save(out, 'JPEG', quality=q, optimize=True, progressive=True)
        if os.path.getsize(out) < 280 * 1024: break
    print(r['id'], os.path.getsize(out))
