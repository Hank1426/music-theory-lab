from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
os.makedirs(OUT, exist_ok=True)

for size in (192, 512):
    s = size / 512
    img = Image.new('RGB', (size, size), '#4f46e5')
    d = ImageDraw.Draw(img)
    for i in range(5):
        y = (170 + i * 44) * s
        d.line([(64 * s, y), (448 * s, y)], fill='white', width=max(2, int(8 * s)))
    cx, cy, rx, ry = 256 * s, 302 * s, 62 * s, 44 * s
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill='white')
    d.rectangle([cx + rx - 14 * s, 110 * s, cx + rx, cy], fill='white')
    img.save(os.path.join(OUT, f'icon-{size}.png'))
    print('saved', size)
