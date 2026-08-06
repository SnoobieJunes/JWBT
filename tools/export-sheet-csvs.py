"""Write sheet-setup/*.csv from the site's own HTML.

These are the files to import into the shop's Google Sheet as new tabs. They
are generated rather than typed so the starting contents of the sheet cannot
disagree with the menu that is committed in menu.html.

    python3 tools/export-sheet-csvs.py

Then in the sheet: File > Import > Upload, and choose "Insert new sheet(s)".
Google names the new tab after the file, which is why the filenames are
exactly the tab names js/sheet.js looks for.
"""
import csv
import html
import os
import re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "sheet-setup")
os.makedirs(OUT, exist_ok=True)


def text(raw):
    """HTML fragment -> the plain text a person would type into a cell."""
    s = re.sub(r"<[^>]+>", "", raw)
    s = html.unescape(s)
    s = s.replace("’", "'").replace("‘", "'")
    s = s.replace("“", '"').replace("”", '"')
    s = s.replace("…", "...").replace(" ", " ")
    return re.sub(r"\s+", " ", s).strip()


def write(name, header, rows):
    path = os.path.join(OUT, name + ".csv")
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(header)
        w.writerows(rows)
    print(f"  {name}.csv  {len(rows)} rows")


menu_html = open(os.path.join(REPO, "menu.html"), encoding="utf-8").read()
index_html = open(os.path.join(REPO, "index.html"), encoding="utf-8").read()

# ------------------------------------------------------------------- Menu --
# Each container marked data-menu-section holds a run of .menu-group blocks.
menu_rows = []
for section, body in re.findall(
        r'<div id="menu-[a-z]+" data-menu-section="([^"]+)">(.*?)</div><!-- /#menu-',
        menu_html, re.S):
    # Split the container into its .menu-group blocks.
    parts = re.split(r'<div class="menu-group"', body)[1:]
    for part in parts:
        title = re.search(r'<h3 class="menu-group__title">(.*?)</h3>', part, re.S)
        group = text(title.group(1)) if title else ""

        for li in re.findall(r"<li>\s*<div class=\"item__head\">(.*?)</li>", part, re.S):
            name = re.search(r'class="item__name">(.*?)</h\d>', li, re.S)
            price = re.search(r'class="item__price">(.*?)</span>', li, re.S)
            desc = re.search(r'class="item__desc">(.*?)</p>', li, re.S)
            if not name:
                continue
            menu_rows.append([section, group, text(name.group(1)),
                              text(desc.group(1)) if desc else "",
                              text(price.group(1)) if price else "", ""])

        note = re.search(r'<div class="note">(.*?)</div>', part, re.S)
        if note:
            for para in re.findall(r"<p>(.*?)</p>", note.group(1), re.S):
                menu_rows.append([section, group, "", "", "", text(para)])

write("Menu", ["Section", "Group", "Item", "Description", "Price", "Note"], menu_rows)

# ----------------------------------------------------------------- Coffee --
flavors = re.search(r'<ul class="flavors" id="coffee-flavors">(.*?)</ul>',
                     menu_html, re.S)
write("Coffee", ["Flavor"],
      [[text(f)] for f in re.findall(r"<li>(.*?)</li>", flavors.group(1), re.S)])

# ------------------------------------------------------------------ Hours --
DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def to_ampm(hhmm):
    h, m = (int(x) for x in hhmm.split(":"))
    suffix = "AM" if h < 12 else "PM"
    h12 = h % 12 or 12
    return f"{h12}:{m:02d} {suffix}"


rows = {}
hours_rows = []
for match in re.finditer(
        r'<tr(?P<attrs>[^>]*data-day="(?P<day>\d)"[^>]*)>(?P<body>.*?)</tr>',
        index_html, re.S):
    attrs, body = match.group("attrs"), match.group("body")
    day = int(match.group("day"))
    op = re.search(r'data-open="([\d:]+)"', attrs)
    cl = re.search(r'data-close="([\d:]+)"', attrs)
    flag = re.search(r'class="hours__flag">(.*?)</span>', body, re.S)
    rows[day] = [DAYS[day],
                 to_ampm(op.group(1)) if op else "Closed",
                 to_ampm(cl.group(1)) if cl else "Closed",
                 text(flag.group(1)) if flag else ""]

# Monday first on the page, so Monday first in the sheet.
for day in [1, 2, 3, 4, 5, 6, 0]:
    if day in rows:
        hours_rows.append(rows[day])

write("Hours", ["Day", "Open", "Close", "Note"], hours_rows)

# --------------------------------------------------------------- Specials --
# Seeded from the demo board in js/specials.js so the owners have working
# examples to edit rather than an empty grid.
specials_js = open(os.path.join(REPO, "js", "specials.js"), encoding="utf-8").read()
block = specials_js[specials_js.index("var DEMO_SPECIALS"):specials_js.index("// Monday first")]
specials_rows = []
for entry in re.findall(r"\{(.*?)\}", block, re.S):
    def field(key):
        m = re.search(key + r':\s*((?:"(?:[^"\\]|\\.)*"\s*\+?\s*)+)', entry, re.S)
        if not m:
            return ""
        return "".join(re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(1)))
    item = field("item")
    if item:
        specials_rows.append([text(item), text(field("description")),
                              text(field("price")), text(field("day"))])

# One seeded row carries two days, so the sheet shows by example that a Day
# cell may name more than one.
if len(specials_rows) > 1:
    specials_rows[1][3] = "Thursday, Friday"

write("Specials", ["Item", "Description", "Price", "Day"], specials_rows)

print(f"\nwritten to {OUT}")
