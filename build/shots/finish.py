# Turns the PNGs from build/shots/take.mjs into the hub's images and records them in data/screenshots.json:
#   assets/shots/<id>-1366.webp, <id>-390.webp   the two screenshots
#   assets/shots/<id>-thumb.webp                 the whole 1366x768 viewport, resized to 720x405, for cards
#   assets/og/<id>.jpg                           the top 1366x717, resized to 1200x630, for link previews
# Extra designs already recorded for a cell (its "more" list) are kept as they are.
# Run with: python3 -I build/shots/finish.py <the folder take.mjs wrote>
import json, os, sys
from PIL import Image
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
src = sys.argv[1]
record = json.load(open(os.path.join(src, 'record.json')))
path = os.path.join(root, 'data/screenshots.json')
data = json.load(open(path))
old = {s['id']: s for s in data['shots']}
for r in record:
    if set(r['shots']) != {'1366', '390'}:
        print('skipped', r['id'], r.get('error')); continue
    entry = {'id': r['id'], 'source': r['source'], 'version_at_capture': r['version_at_capture'], 'shots': {}}
    for w, s in r['shots'].items():
        im = Image.open(s['png']).convert('RGB')
        rel = f'/assets/shots/{r["id"]}-{w}.webp'
        out = os.path.join(root, rel.lstrip('/'))
        im.save(out, 'WEBP', quality=78, method=6)
        entry['shots'][w] = {k: s[k] for k in ('taken_at', 'viewport', 'console_errors_on_source')}
        entry['shots'][w].update(file=rel, bytes=os.path.getsize(out), width=im.width, height=im.height)
        if w == '1366':
            t = im.resize((720, 405), Image.LANCZOS)
            trel = f'/assets/shots/{r["id"]}-thumb.webp'
            t.save(os.path.join(root, trel.lstrip('/')), 'WEBP', quality=76, method=6)
            entry['thumb'] = {'file': trel, 'width': 720, 'height': 405, 'bytes': os.path.getsize(os.path.join(root, trel.lstrip('/'))), 'crop': 'the whole 1366x768 screenshot, resized'}
            og = im.crop((0, 0, 1366, 717)).resize((1200, 630), Image.LANCZOS)
            ogp = os.path.join(root, 'assets/og', r['id'] + '.jpg')
            for q in (84, 76, 68, 60):
                og.save(ogp, 'JPEG', quality=q, optimize=True, progressive=True)
                if os.path.getsize(ogp) < 280 * 1024: break
    for k in ('more', 'main_label'):
        if k in old.get(r['id'], {}): entry[k] = old[r['id']][k]
    old[r['id']] = entry
    print(r['id'], entry['shots']['1366']['bytes'])
data['_about'] = 'Screenshots taken with Playwright and Chromium by the hub agent of each live address, top of the home page, one viewport each (build/shots/take.mjs, then build/shots/finish.py). Times are UTC. A screenshot is a snapshot: the live site may have changed since.'
data['shots'] = sorted(old.values(), key=lambda s: s['id'])
json.dump(data, open(path, 'w'), indent=1, ensure_ascii=False)
open(path, 'a').write('\n')
