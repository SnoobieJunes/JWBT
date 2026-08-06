"""Build the img/ directory for the JW Bait & Tackle site.

Sources are the real shop photos in the project root. Every output is
resized to its display size, sharpened, and written as WebP + JPEG.
The two stock-photography files are deliberately not referenced here.
"""
import os
from PIL import Image, ImageDraw, ImageEnhance

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.join(REPO, "photos-original")
IMG = os.path.join(REPO, "img")
# The social-preview image is drawn with the same Bitter face the site uses.
# Pillow cannot read woff2, so tools/bitter700.ttf is the same font unpacked to
# TrueType. It is committed so this script runs with nothing but Pillow. To
# regenerate it after a font change:
#   pip install fonttools brotli
#   python -c "from fontTools.ttLib import TTFont; \
#              f=TTFont('css/fonts/bitter-700-latin.woff2'); f.flavor=None; \
#              f.save('tools/bitter700.ttf')"
# Bitter is licensed under the SIL Open Font License; see css/fonts/OFL.txt.
BITTER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bitter700.ttf")

GREEN = (4, 76, 57)
CREAM = (242, 233, 216)
INK = (18, 17, 16)

os.makedirs(IMG, exist_ok=True)


def crop_to(im, aspect, anchor_y=0.5, anchor_x=0.5):
    """Center-crop to `aspect` (w/h), biased toward the given anchor."""
    w, h = im.size
    target_h = w / aspect
    if target_h <= h:
        new_w, new_h = w, int(round(target_h))
    else:
        new_h, new_w = h, int(round(h * aspect))
    x = int(round((w - new_w) * anchor_x))
    y = int(round((h - new_h) * anchor_y))
    return im.crop((x, y, x + new_w, y + new_h))


def emit(im, name, widths, jpeg_q=76, webp_q=72):
    """Write name-<w>.webp and name-<w>.jpg for each width."""
    results = []
    for w in widths:
        h = int(round(im.height * w / im.width))
        r = im.resize((w, h), Image.LANCZOS)
        r = ImageEnhance.Sharpness(r).enhance(1.15)
        jpg = os.path.join(IMG, f"{name}-{w}.jpg")
        webp = os.path.join(IMG, f"{name}-{w}.webp")
        r.convert("RGB").save(jpg, "JPEG", quality=jpeg_q, optimize=True,
                              progressive=True, subsampling=2)
        r.convert("RGB").save(webp, "WEBP", quality=webp_q, method=6)
        results.append((w, h, os.path.getsize(jpg), os.path.getsize(webp)))
    for w, h, sj, sw in results:
        print(f"  {name}-{w}  {w}x{h}  jpg {sj//1024}K  webp {sw//1024}K")
    return results


# ---------------------------------------------------------------- photographs
# The commented-out entries are photographs the owners replaced with better
# ones. The originals are still in photos-original/; uncomment a line and
# re-run to bring one back.
PHOTOS = [
    # (source, output name, aspect, anchor_y, widths, pre-crop box or None)
    ("storefront-summer.jpg",
     "storefront-summer", 1858 / 980, 0.50, [800, 1400], (190, 305, 2048, 1285)),
#    ("storefront-live-bait.jpg",
#     "storefront-bait", 4 / 3, 0.50, [560, 900], (600, 365, 1400, 965)),
    ("storefront-night.jpg",
     "storefront-night", 16 / 9, 0.50, [800, 1400], (60, 0, 1990, 1128)),
    ("bakery-case.jpg",
     "bakery-case", 4 / 3, 0.50, [560, 900], (150, 170, 1930, 1505)),
    ("deli-case.jpg",
     "deli-case", 4 / 3, 0.50, [560, 900], (90, 280, 2000, 1400)),
#    ("pies.jpg",
#     "pies", 4 / 3, 0.48, [560, 900], (0, 20, 2048, 1330)),
#    ("parfaits.jpg",
#     "parfaits", 4 / 3, 0.30, [560, 900], (110, 300, 1460, 1700)),
#    ("coffee-flavors-board.jpg",
#     "coffee-board", 3 / 4, 0.48, [480, 760], (40, 10, 1470, 2020)),

    # Added after the first pass, when the owners supplied better photographs.
    ("GetHooked.jpg",      "get-hooked",      4 / 3, 0.50, [560, 900], None),
    ("LiveBait.jpg",       "live-bait",       4 / 3, 0.50, [560, 640], None),
    ("Lures.jpg",          "lures",           4 / 3, 0.50, [560, 640], None),
    ("CoffeeFlavors.jpg",  "coffee-flavors",  4 / 3, 0.50, [560, 900], None),
    ("DinnerSpecials.jpg", "dinner-specials", 4 / 3, 0.12, [560, 900], None),
    ("CayugaLake.jpg",     "cayuga-lake",     4 / 3, 0.51, [560, 900], None),
]

print("photos:")
for src, name, aspect, ay, widths, box in PHOTOS:
    im = Image.open(os.path.join(ROOT, src)).convert("RGB")
    if box:
        im = im.crop(box)
    emit(crop_to(im, aspect, ay), name, widths)

# ---------------------------------------------------------------------- logo
# The black in this mark is structural (it is the outline, not just a
# backdrop), so the logo is always shown on a black field.
logo = Image.open(os.path.join(ROOT, "logo-original.jpg")).convert("RGB")
sq = Image.new("RGB", (max(logo.size),) * 2, (0, 0, 0))
sq.paste(logo, ((sq.width - logo.width) // 2, (sq.height - logo.height) // 2))

print("logo:")
for w in (128, 256, 512):
    r = sq.resize((w, w), Image.LANCZOS)
    r.save(os.path.join(IMG, f"logo-{w}.jpg"), "JPEG", quality=88,
           optimize=True, progressive=True)
    r.save(os.path.join(IMG, f"logo-{w}.webp"), "WEBP", quality=86, method=6)
    print(f"  logo-{w}  jpg {os.path.getsize(os.path.join(IMG, f'logo-{w}.jpg'))//1024}K"
          f"  webp {os.path.getsize(os.path.join(IMG, f'logo-{w}.webp'))//1024}K")

# ------------------------------------------------------------------- favicons
for size, fname in ((32, "favicon-32.png"), (180, "apple-touch-icon.png")):
    sq.resize((size, size), Image.LANCZOS).save(os.path.join(IMG, fname), "PNG",
                                                optimize=True)
    print(f"  {fname}  {os.path.getsize(os.path.join(IMG, fname))//1024}K")

# ------------------------------------------------------------ OpenGraph image
try:
    from PIL import ImageFont
    og = Image.new("RGB", (1200, 630), GREEN)
    d = ImageDraw.Draw(og)

    # cream keyline, like the border of a painted sign
    d.rectangle([22, 22, 1177, 607], outline=CREAM, width=6)

    mark = sq.resize((330, 330), Image.LANCZOS)
    og.paste(mark, (78, 150))
    d.rectangle([78, 150, 78 + 329, 150 + 329], outline=CREAM, width=4)

    f_name = ImageFont.truetype(BITTER, 86)
    f_tag = ImageFont.truetype(BITTER, 44)
    f_town = ImageFont.truetype(BITTER, 34)

    x = 470
    d.text((x, 196), "JW BAIT", font=f_name, fill=CREAM)
    d.text((x, 292), "& TACKLE", font=f_name, fill=CREAM)
    d.line([x + 3, 404, x + 470, 404], fill=CREAM, width=5)
    d.text((x, 424), "Live Bait & Great Food", font=f_tag, fill=CREAM)
    d.text((x, 486), "UNION SPRINGS, N.Y.", font=f_town, fill=(190, 214, 200))

    og.save(os.path.join(IMG, "og-image.jpg"), "JPEG", quality=86,
            optimize=True, progressive=True)
    print(f"  og-image.jpg  {os.path.getsize(os.path.join(IMG, 'og-image.jpg'))//1024}K")
except Exception as e:  # pragma: no cover
    print("!! OG image NOT regenerated:", e)
    print("!! img/og-image.jpg is unchanged. See the note above BITTER.")

print("\ntotal img/ size:",
      sum(os.path.getsize(os.path.join(IMG, f)) for f in os.listdir(IMG)
          if os.path.isfile(os.path.join(IMG, f))) // 1024, "K")
