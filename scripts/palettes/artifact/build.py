"""Builds the palette artifact: out/index.html plus out/<palette>/<page>-{desk,phone,thumb}.webp."""
import json, os, sys
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
REPO = sys.argv[1]
CAP = os.path.join(REPO, 'design/palettes/out/captures')
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
PAGES = [('about', 'About'), ('service', 'A service page'), ('profile', 'A team profile'),
         ('self-assessment', 'Self-assessment'), ('questionnaire', 'A questionnaire'), ('contact', 'Contact')]
palettes = json.load(open(os.path.join(REPO, 'design/palettes/palettes.json')))['palettes']
keep = ('id', 'name', 'family', 'character', 'core', 'ink')
data = {'palettes': [{k: p[k] for k in keep if k in p} for p in palettes],
        'pages': [{'id': i, 'name': n} for i, n in PAGES]}

def save(im, path, width, q=72):
    h = round(im.height * width / im.width)
    im.convert('RGB').resize((width, h), Image.LANCZOS).save(path, 'WEBP', quality=q, method=6)

for p in palettes:
    src, dst = os.path.join(CAP, p['id']), os.path.join(OUT, p['id'])
    os.makedirs(dst, exist_ok=True)
    home = Image.open(os.path.join(src, 'home-1440.png'))
    save(home, os.path.join(dst, 'home-desk.webp'), 1200)
    save(home.crop((0, 0, 1440, 900)), os.path.join(dst, 'home-thumb.webp'), 720, 78)
    save(Image.open(os.path.join(src, 'home-390.png')), os.path.join(dst, 'home-phone.webp'), 560)
    for pid, _ in PAGES:
        save(Image.open(os.path.join(src, f'{pid}-1440.png')), os.path.join(dst, f'{pid}-desk.webp'), 1200)
    print('built', p['id'])

html = open(os.path.join(HERE, 'template.html')).read().replace('/*DATA*/null', json.dumps(data, ensure_ascii=False))
open(os.path.join(OUT, 'index.html'), 'w').write(html)
total = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(OUT) for f in fs)
print('total MB', round(total / 1e6, 1))
