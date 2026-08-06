# JW Bait & Tackle — website

Static website for JW Bait & Tackle, 145 Cayuga St, Union Springs, NY 13160.
Phone **(315) 209-8832**.

Plain HTML, CSS and vanilla JavaScript. No framework, no build step, no
backend, no database, no admin login. Push the repo, it deploys. Nothing is
running, so there is nothing to patch and nothing to hack.

Everything the owners can change — the weekly specials, the opening hours,
every menu item and price, and the coffee flavors — lives in one Google
Sheet they edit from the Sheets app on their phone.

---

## Contents

- [Files](#files)
- [Deploying to GitHub Pages](#deploying-to-github-pages)
- [The Google Sheet](#the-google-sheet)
  - [One-time setup](#one-time-setup)
  - [How the tabs are shaped](#how-the-tabs-are-shaped)
  - [Instructions for the owners](#instructions-for-the-owners)
  - [Why it cannot break the site](#why-it-cannot-break-the-site)
- [Keeping the committed copy in step](#keeping-the-committed-copy-in-step)
- [Changing things that are not in the sheet](#changing-things-that-are-not-in-the-sheet)
- [Photographs](#photographs)
- [Pointing a custom domain at it later](#pointing-a-custom-domain-at-it-later)
- [Tests](#tests)
- [Still to do](#still-to-do)

---

## Files

```
index.html               Home page
menu.html                Full menu
css/style.css            The whole stylesheet
css/fonts/               Bitter 700, self-hosted (SIL Open Font License, included)

js/sheet.js              Reads the Google Sheet   <- the sheet id lives here
js/main.js               Open/closed sign, and the Hours tab
js/specials.js           The Specials tab
js/menu.js               The Menu and Coffee tabs

img/                     Web-sized images (WebP + JPEG), generated
photos-original/         The full-size originals the site was built from
sheet-setup/             CSVs to import as the sheet's tabs, plus the owners'
                         instructions to paste in
tools/build-images.py    Regenerates everything in img/ from photos-original/
tools/export-sheet-csvs.py  Regenerates sheet-setup/ from the site's own HTML
tools/bitter700.ttf      Bitter as TrueType, used only to draw og-image.jpg
tools/tests/             Browser test pages, see "Tests" below
```

To work on it locally, serve the folder over HTTP rather than opening the
files directly — `fetch` and the Facebook embed both need a real origin:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

---

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment**, source **Deploy from a
   branch**, branch `main`, folder `/ (root)`.
3. Wait a minute. The site is at `https://<user>.github.io/<repo>/`.

There is no `CNAME` file and no domain is written into any page, so the site
works unchanged from a project page, a user page, or a custom domain.

`.nojekyll` is present so GitHub serves the files as-is rather than running
them through Jekyll.

---

## The Google Sheet

One sheet, four tabs. The site reads them straight from Google, in the
browser, with no server in between.

| Tab | Drives | Columns |
|---|---|---|
| `Specials` | "This Week's Specials" on the homepage | Item, Description, Price, Day |
| `Hours` | The hours table in the footer **and** the open/closed sign | Day, Open, Close, Note |
| `Menu` | Every priced item on the menu page | Section, Group, Item, Description, Price, Note |
| `Coffee` | The coffee flavor list | Flavor |

### One-time setup

**1. Share the sheet.** In the sheet: **Share → General access → Anyone with
the link → Viewer**. That is the whole publishing step — there is no "Publish
to web", and no per-tab links to copy.

> Link-viewable means the entire document is publicly readable by anyone who
> has the address. That is how the website reads it. Do not put anything
> private on any tab.

**2. Create the tabs.** In the sheet, **File → Import → Upload**, pick a file
from `sheet-setup/`, and choose **Insert new sheet(s)**. Google names the new
tab after the file, which is why the filenames are exactly the tab names the
code looks for. Do all four:

```
sheet-setup/Specials.csv   sheet-setup/Hours.csv
sheet-setup/Menu.csv       sheet-setup/Coffee.csv
```

They are generated from the site's own HTML, so the sheet starts out
agreeing with the menu that is committed in `menu.html`.

Then freeze the header on each tab — **View → Freeze → 1 row** — and add a
dropdown to the Day column on `Specials` and `Hours`: select the column,
**Data → Data validation → Add rule → Dropdown**, and enter the seven days.

Format the `Price` column as **Format → Number → Plain text**. Google
otherwise treats a cell like `12` as a number and hands it back as `12.0`.
The site copes with that anyway — a bare number is printed as `$12.00` — but
plain text keeps what the owners typed exactly as they typed it.

**3. Paste the instructions.** Add a fifth tab called `Instructions` and
paste in `sheet-setup/Instructions.txt`. Nothing reads it; it is there for
the owners.

**4. Put the sheet id in the code.** Open `js/sheet.js` and set `SHEET_ID`
near the top. It is the long string in the sheet's own address bar, between
`/d/` and `/edit`:

```
https://docs.google.com/spreadsheets/d/THIS-PART-HERE/edit
```

Commit and push. That is the whole integration.

Nothing else needs changing if a tab is renamed back and forth, and there is
no link to regenerate. If the sheet is ever replaced with a new one, the only
edit is that single `SHEET_ID` line.

### How the tabs are shaped

**`Hours`** — one row per day.

| Day | Open | Close | Note |
|---|---|---|---|
| Monday | 5:30 AM | 2:00 PM | |
| Thursday | 5:30 AM | 7:00 PM | Late — dinner specials |
| Tuesday | Closed | Closed | |

Times are read the way people type them: `5:30 AM`, `5:30am`, `05:30`,
`14:00`, `7 PM`. `Closed` in either box, or both boxes left empty, closes the
shop for that day. `Note` appears under the day name on the page.

**`Menu`** — one row per item, in the order it should appear.

| Section | Group | Item | Description | Price | Note |
|---|---|---|---|---|---|
| Breakfast | Sandwiches | The Get Hooked | 2 eggs, American cheese… | $5.00 | |
| Breakfast | Sandwiches | | | | Add extra meat to any sandwich: $1.00. |
| Lunch | | Reuben | Corned beef, sauerkraut… | $8.50 | |

- `Section` must be `Breakfast`, `Lunch` or `Coffee` — these match the
  `data-menu-section` containers in `menu.html`. A section the sheet says
  nothing about keeps whatever is committed in the HTML.
- `Group` is the sub-heading. Leave it empty for a list with no heading of
  its own, like the main lunch list.
- A row with a `Note` and no `Item` becomes a grey note box at the end of its
  group.
- Prices are free text. `$5.00`, `Sm $5.00 / Lg $7.50` and `$1.75 each` all
  print exactly as typed.

**`Coffee`** — one column, `Flavor`, one flavor per row.

To add a new section or group to the menu, add rows here **and** add a
matching `<div data-menu-section="...">` to `menu.html` with the committed
version inside it.

### Instructions for the owners

`sheet-setup/Instructions.txt` is written to be read on a phone by somebody
who is not interested in websites. Paste it onto an `Instructions` tab.

### Why it cannot break the site

The pages already contain the real hours, the whole menu, the flavor list
and the call-us fallback, written out as plain HTML. **The sheet only ever
replaces what is already on the page.** So the site is complete and correct:

- before the sheet is fetched, so it is readable instantly on a slow phone
- with JavaScript switched off
- if the sheet is slow, deleted, un-shared, or Google is down
- if a tab is renamed or its header row is edited

In every one of those cases the visitor sees the version that was last
committed. Nothing renders empty and nothing shows an error.

Details worth knowing about:

- **Edits take about five minutes to appear.** Google serves the export from
  a cache. Warn the owners so nobody panics.
- **An empty Specials tab shows the "call us" callout, not old food.**
  Clearing the board for a quiet week is a normal thing for the owners to do,
  and the Instructions tab tells them to do exactly that. There is a
  `DEMO_UNTIL_SHEET_HAS_ROWS` flag at the top of `js/specials.js` which would
  instead render the board the site was built with. It ships **off** and must
  stay off against a live sheet — turning it on would put last season's food
  and prices in front of a customer under the heading "This Week's Specials".
- **A blank Open or Close cell does not close a day.** Only the word `Closed`
  in either cell, or *both* cells left empty, does. A half-finished edit
  caught by the five-minute cache leaves that day's committed hours standing
  rather than telling customers the shop is shut.
- **A `Flavor` or `Flavour` heading both work** on the Coffee tab, so the
  sheet does not have to be re-headed to match the site's spelling.
- **A tab name that does not exist does not fail.** Google quietly returns
  the *first* tab in the document instead. `js/sheet.js` therefore checks
  that every tab it reads has the columns it expects, and ignores it if not.
  Without that check a renamed `Hours` tab would pour the specials into the
  hours table.
- **A mistyped time is not treated as "closed".** A day whose hours cannot
  be read keeps the hours the page shipped with. Telling customers the shop
  is shut when it is open would be the worst thing this code could do.
- The fetch gives up after **2 seconds**, body included.
- Nothing from the sheet is ever inserted as HTML, so a stray `<` or a pasted
  link in a cell cannot break or hijack the page.

---

## Keeping the committed copy in step

Because the HTML is the fallback, it should not drift too far from the sheet.
It does not have to match day to day — that is the point of the sheet — but
after a real menu change it is worth re-committing the baseline so that
somebody with no signal sees current prices.

There is no automated pull. The honest workflow is:

1. Open the site, let the sheet load, and check the page looks right.
2. Edit the matching items in `menu.html`, or the hours table in both pages.
3. Run `python3 tools/export-sheet-csvs.py` to regenerate `sheet-setup/`.
4. Commit.

Worth doing a couple of times a year, or after any big menu change.

---

## Changing things that are not in the sheet

**Hours.** The hours table in the footer of **both** `index.html` and
`menu.html` is the baseline the sheet overrides, and it is what `js/main.js`
reads. Each row carries the machine-readable version:

```html
<tr data-day="4" data-open="05:30" data-close="19:00">
  <th scope="row">Thursday …</th><td>5:30 AM – 7:00 PM</td>
</tr>
```

`data-day` is 0 for Sunday through 6 for Saturday; times are 24-hour, shop
local. Change the visible text in the `<th>`/`<td>` to match. For a day the
shop is shut, drop the `data-open`/`data-close` attributes.

**The hours are written down in four other places**, none of which update
themselves. After a real hours change, do all of these too:

1. `index.html` and `menu.html` — the text inside
   `<p class="status" id="open-status">`. This is what a visitor with
   JavaScript switched off sees.
2. `index.html` — the `openingHoursSpecification` block in the JSON-LD at the
   bottom, which is what search engines read.
3. `menu.html` — *"Served from 5:30 AM, every day of the week"* under
   Breakfast.
4. `menu.html` — *"when the shop stays open until 7:00 PM"* in the Thursday
   Night Dinner section.

Grep for `5:30` and `7:00 PM` across the two HTML files to catch them all.

The clock is locked to `America/New_York`, so a visitor whose phone is set to
another timezone still gets the right answer. If the shop ever moves, change
`ZONE` at the top of `js/main.js`.

**Prose.** The bakery-case description, the Thursday Night Dinner copy, the
homepage sections and the "Plus weekly specials" note are all plain HTML.

**The homepage food teaser.** The five signature items under "The Food" on
`index.html` are a separate hand-picked list, not driven by the sheet. If a
price changes there, change it by hand.

---

## Photographs

Everything in `img/` is generated. Do not edit those files by hand.

Originals live in `photos-original/`. To add or re-crop a photo, drop the
original in there, add an entry to the `PHOTOS` list in
`tools/build-images.py`, and run it:

```sh
python3 -m venv .venv && .venv/bin/pip install pillow
.venv/bin/python tools/build-images.py
```

Each entry is `(filename, output name, aspect ratio, vertical anchor, widths,
optional pre-crop box)`. The script writes a WebP and a JPEG at every width,
and rebuilds the favicons and the social-preview image.

**Only real photographs of the shop go on this site.** Two images in the
supplied set were stock photography that had been reposted to the Facebook
page; they are parked in `photos-original/_excluded-stock/`, are excluded by
`.gitignore`, and must not be used. Where there is no real photograph for a
section — the lake, the minnow tanks — the design uses color and type
instead of borrowing a picture from somewhere else.

The logo's black background is not a backdrop, it is the artwork: the black
is the fish's outline. Knocking it out destroys the mark, so the logo is
always shown on a black field.

---

## Pointing a custom domain at it later

Nothing in the site hardcodes a domain, so this is only DNS and one GitHub
setting.

1. At the registrar for e.g. `jwbaitandtackle.com`, add:
   - `A` records for the apex `@` → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - a `CNAME` for `www` → `<user>.github.io`
2. GitHub → **Settings → Pages → Custom domain**, enter the domain, save.
   GitHub commits a `CNAME` file to the repo for you.
3. Wait for the certificate, then tick **Enforce HTTPS**.

Afterwards, two optional tidy-ups:

- The `og:image` tags in `index.html` and `menu.html` are relative paths.
  Facebook, iMessage and the rest resolve those fine, but if a shared link
  ever previews without the logo, make them absolute:
  `https://jwbaitandtackle.com/img/og-image.jpg`.
- Same for `"image"` and `"hasMenu"` in the JSON-LD block.

Both are marked with a comment in the HTML.

---

## Tests

Open these in a browser with the site being served over HTTP.

| Page | What it checks |
|---|---|
| `tools/tests/logic.html` | 82 assertions. The hours logic at every edge — 5:30 AM open, the 2:00 PM weekday close, Thursday's 7:00 PM, Saturday's 3:00, Sunday's 1:00, midnight rollover, a day off. Timezone locking through a DST change. Times typed as a human would type them. CSV parsing: quoted commas, escaped quotes, newlines in cells, CRLF, BOM, columns in any order, short rows, a header-only tab. Price cleanup. Specials day-matching. Menu grouping and ordering |
| `tools/tests/specials-failure-modes.html` | Runs the real `js/sheet.js` against a stubbed network and drives the real consumers. Specials: good sheet, header-only, blank rows, 404, 500, offline, a Google sign-in page returned instead of CSV, a server that sends headers then stalls the body, an attempted script injection. Hours: good sheet, wrong tab, offline, stalled body, a mistyped row, backwards times, a deliberate "Closed". Menu: good sheet, wrong tab, offline, empty tab, a sheet covering only one section |
| `tools/tests/viewports.html` | The homepage at 320, 360 and 412 px side by side, with a horizontal-overflow check. Run `check()` in the console |

`logic.html` puts PASS or FAIL in the page title.
`specials-failure-modes.html` leaves its results on `window.RESULTS`.

---

## Still to do

- **The About section is deliberately thin.** It says only what is already
  public. Ask the owners who runs the shop, what year it opened, and how the
  bait counter and the kitchen ended up in one room, then fill in the
  paragraph in `index.html` marked with a `TODO` comment. Nothing has been
  invented in the meantime.
- **Get a photograph of the minnow tanks**, and one of a breakfast sandwich.
  The Bait & Tackle section and the third beat of "The Ritual" are carried by
  type because there was no real photograph to use.
- **Fishing licence information** was left out of this version pending the
  details.
