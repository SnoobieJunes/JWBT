# JW Bait & Tackle Website - Build Plan

## Project context

Building a website on spec for JW Bait & Tackle, a family-run bait shop and cafe
in Union Springs, NY, on Cayuga Lake. The owners do not know yet. Goal: build
something good enough that they want it, then hand it over.

The business is nominally a bait and tackle shop but the food is the real draw,
especially breakfast. The regulars' ritual: grab a breakfast sandwich and coffee,
grab bait, hit the lake. The whole site is built around that ritual.

Audience: small-town, working-class customers on cheap phones and rural cell
connections. The site must feel like a hand-painted sign, not a tech product.
Fast, plain, warm, zero gimmicks.

Their tagline (from their own t-shirts): "Live Bait & Great Food, Union Springs N.Y."

## Hard requirements

1. Static site. No backend, no database, no CMS, no admin login. Nothing running
   means nothing to hack or maintain.
2. Hosted on GitHub Pages from the developer's account for now. Custom domain
   (likely jwbaitandtackle.com) comes later; do not hardcode any domain.
3. Weekly specials populated from a published Google Sheet CSV, fetched
   client-side. Owners will edit the sheet from the Google Sheets phone app.
4. A Facebook section using the official Facebook Page Plugin embed, with a
   plain "Follow us on Facebook" link/button that works if the embed fails.
5. Mobile-first. Test mentally against a cheap Android on a weak connection.
6. Plain HTML, CSS, and vanilla JS. No frameworks, no build step. One repo,
   push to deploy.
7. Do NOT use stock photography anywhere. Only the real shop photos provided
   (referenced below). If a section lacks a photo, use color/typography instead.

## Business facts (verified)

- Name: JW Bait & Tackle
- Address: 145 Cayuga St, Union Springs, NY 13160
- Phone: (315) 209-8832 (this is also the food pre-order line)
- Facebook page: https://www.facebook.com/profile.php?id=100092317033661
- Hours: SUPERSEDED. The hours below were taken from the Google listing when
  this plan was written. The owner-confirmed hours are now 5:30 AM daily,
  closing 2:00 PM Mon-Fri, 3:00 PM Saturday, 1:00 PM Sunday, and 7:00 PM
  Thursday. They live in the Hours tab of the shop's Google Sheet and in the
  footer table of both pages; see README.md. The list below is kept only as a
  record of the original brief.
- Hours (per Google listing, confirmed to use these):
  - Monday: 6:00 AM - 3:00 PM
  - Tuesday: 6:00 AM - 3:00 PM
  - Wednesday: 6:00 AM - 3:00 PM
  - Thursday: 6:00 AM - 7:00 PM
  - Friday: 6:00 AM - 3:00 PM
  - Saturday: 6:00 AM - 3:00 PM
  - Sunday: 6:00 AM - 3:00 PM
- 4.8 stars on Google (46 reviews). Facebook: 100% recommend (8 reviews).
- Services: takeout, pre-orders by phone. They also cater community events and
  sponsored a local fishing tournament.
- Thursday evenings feature housemade dinner specials for pre-order (recently:
  9-inch chicken pot pies $20, 3 Reuben egg rolls $15, cheesecake with optional
  chocolate/caramel/raspberry drizzle). These rotate, so present Thursday night
  dinner as a recurring thing to call about, not a fixed menu.

## Site structure

Two pages: `index.html` and `menu.html`. Shared CSS in `css/style.css`,
JS in `js/main.js` and `js/specials.js`. Images in `img/`.

### index.html, sections top to bottom

1. **Hero.** Logo, business name, tagline "Live Bait & Great Food", Union
   Springs N.Y. Open/closed indicator computed client-side from the hours table
   and the device clock (e.g. "Open now, until 3:00 PM" / "Closed, opens 6:00 AM").
   Tap-to-call phone button (`tel:+13152098832`). Address with Google Maps link.
2. **This Week's Specials.** Populated from the Google Sheet (spec below).
3. **The Ritual.** Three beats: "Grab breakfast" / "Grab bait" / "Hit the lake."
   Short copy, real photos.
4. **Menu teaser.** A few signature items with prices (The Get Hooked $5,
   Tackle Box $7.50, coffee flavors) and a prominent link to menu.html.
5. **Bait & Tackle.** Copy: live bait including fathead minnows and worms,
   rods, reels, tackle boxes, terminal tackle, and everyday supplies. Include
   the line "If we don't have it, ask." Photo of the minnow tanks.
6. **About.** Family-run, part of the Union Springs community, caters local
   events, sponsored a local fishing tournament. Keep it to a short paragraph.
   Do not invent owner names or history; leave a TODO comment for details.
7. **Facebook.** Heading, a "Follow us on Facebook" button linking to the page,
   then the Facebook Page Plugin iframe embed below it. The button must render
   regardless of whether the iframe loads.
8. **Footer.** Hours grid (call out Thursday's late close), address + maps link,
   phone, small logo.

### menu.html

Header with logo, name, phone tap-to-call, and "To place an order, call
(315) 209-8832" near the top. Then the full menu, transcribed below. Note near
the top: "Plus weekly specials, see the board in store or our homepage."
End with a short section: "Thursday Night Dinner. Housemade dinner specials
every Thursday, pre-order early: (315) 209-8832. Recent favorites: chicken pot
pies, Reuben egg rolls, cheesecake. Pies and desserts made in house."

## Full menu content (transcribed from their printed menus and boards)

### Breakfast - Sandwiches

| Item | Description | Price |
|---|---|---|
| The Get Hooked | 2 eggs, American cheese, choice of one (bacon, sausage, ham) on a hard roll | $5.00 |
| It's A Wrap | 2 eggs, cheese, choice of one meat in a wrap | $6.50 |
| The Hungry Bass | 3 eggs, three meats (sausage, bacon, ham) and cheese on a hero | $8.00 |
| Pike Bait | Bacon, sausage, ham and cheese on a hard roll | $6.50 |
| The Minnow | 1 egg and cheese cooked your way on your choice of bread (hard roll, white, English muffin) | $5.00 |

Add extra meat to any sandwich: $1.00. Add extra meat or veggies (It's A Wrap): $1.00.

### Breakfast - The Minnow Bucket

| Item | Description | Price |
|---|---|---|
| Tackle Box | Two eggs cooked your way, choice of one meat (sausage, bacon, ham) on a bed of home fries | $7.50 |
| Omelet | 3 eggs, cheese, choice of meat (sausage, bacon or ham) | $6.50 |

Tackle Box add-ons (anything you wish): $1.00. Omelet extra stuffings (peppers,
onions, tomato, mushrooms, salsa...): $0.75 each. "Don't see what you want? Just
ask." Add additional meat to all items: $1.00. Want it on a bagel: $1.25 upcharge.

### Breakfast - The By Catch (sides)

| Item | Price |
|---|---|
| Side of home fries | $3.00 |
| Bagel with butter or cream cheese | $4.00 |
| English muffin with butter | $2.00 |
| Hash brown (when available) | $1.75 each |
| Corned beef hash (when available) | $4.00 |
| Side of bacon | $3.75 |
| Jumbo muffin | $3.00 |
| Coffee | $2.00 |

### Lunch

| Item | Description | Price |
|---|---|---|
| Buffalo Chicken Wrap | Lettuce, tomato, onion | $8.25 |
| Chicken Finger Wrap or Sub | Lettuce, tomato, onion, with honey mustard | $8.25 |
| Reuben | Corned beef, sauerkraut, Swiss and Russian on marble rye | $8.50 |
| Ham and Swiss Melt | On choice of bread | $7.50 |
| Beef and Cheddar | Roast beef with cheddar cheese sauce on a roll | $8.50 |
| Triple Grilled Cheese | Provolone, Swiss and American on white Tuscan bread; add bacon $1 | $6.50 |
| Chicken Salad | On your choice of bread or wrap with lettuce, tomato (has red onion in it) | $8.00 |
| Chicken Caesar Salad Wrap | | $8.25 |
| BLT | On your choice of toast; add cheese $0.75 | $7.00 |
| Gianelli Sausage | With peppers and onions on a hero | $8.50 |
| Hoffman Hot Dog | | $3.75 |
| Angus Cheeseburger | | $5.75 |
| Double Cheeseburger | | $7.00 |
| Bacon Cheeseburger | | $6.75 |
| Cheeseburger Deluxe | Lettuce, tomato, onion on a kaiser roll | $8.25 |

For the cold day:

| Item | Description | Price |
|---|---|---|
| Chili and Corn Bread | With sour cream, chives and cheddar cheese | Sm $5.00 / Lg $6.00 |
| Soup of the Day | | Sm $4.75 / Lg $5.50 |

Deli salads (mac, potato, Italian pasta): 1/4 lb $2.00, 1/2 lb $4.00.
"Keep an eye out for special salads of the week."

### Coffee

Iced or hot, $4.50. Flavors: French Vanilla, Hazelnut, Salted Caramel, Brown
Sugar Cinnamon, Toasted Marshmallow, Blue Raspberry, Strawberry, Raspberry,
Strawberry Shortcake, Lavender, Lavender Lemon, Peppermint Mocha, Girl Scout
Toast-yay, Pistachio, White Chocolate.

Additional toppings, $1.00 each: whipped cream; caramel, chocolate, or raspberry
drizzle; sprinkles.

(Plain coffee is $2.00, listed under breakfast sides. The $4.50 price is for
flavored coffees.)

### Bakery / deli case (mention, don't price)

Fresh-baked jumbo muffins (rotating flavors like pistachio, pumpkin cheesecake,
blueberry, red velvet), cream puffs, mini fruit tarts, pies (apple, strawberry
chocolate, apple peach), cheesecake, fresh fruit, deli meats and cheeses,
macaroni/potato/pasta salads, coleslaw.

## Google Sheet specials system

### Sheet design (document this in the repo README for setup)

One Google Sheet, one data tab named `Specials` with a frozen header row:

```
Item, Description, Price, Day
```

- `Day` optional; blank means all week. Use data validation with the list:
  Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.
- Second tab `Instructions` with plain-language phone instructions for the
  owners (write these).
- Published to the web: File > Share > Publish to web > the Specials tab >
  CSV. That produces the fetch URL.

### Client implementation (`js/specials.js`)

- The published CSV URL lives in a single const at the top of the file with a
  placeholder value and a comment explaining how to generate it.
- On DOMContentLoaded, fetch the CSV with a 2-second timeout (AbortController).
- Parse defensively: handle quoted fields with commas, trim all cells, skip
  fully blank rows, skip the header row, accept prices written as `10`, `$10`,
  `10.00`, or free text like `Sm $5 / Lg $7.50` (render price text as-is after
  trimming; do not coerce to number).
- Render: items with no Day first under "All Week", then day-grouped items in
  weekday order. If every row has a Day, skip the "All Week" heading.
- Failure behavior (fetch error, timeout, empty sheet, or placeholder URL):
  replace the section content with "Call us for this week's specials:
  (315) 209-8832" as a tap-to-call link. Never show an error state, never show
  a spinner longer than the timeout, never let the section look broken.
- Note in README: Google caches the published CSV for up to ~5 minutes, so
  edits are not instant. This is fine for weekly specials.

### Example current specials for the demo (seed the sheet / fallback demo data)

- Housemade Hot Honey Fried Chicken Sandwich, with bacon, pepper jack, lettuce,
  red onion, topped with chipotle mayo on a toasted kaiser, $10.00
- Fresh Local Perch Sandwich, with lettuce and tartar, $9.50
- "Rito" Wrap, crispy chicken, bacon, cheddar, lettuce, red onion, Cool Ranch
  Doritos, topped with ranch dressing, $12.00
- Loaded Lamb or Chicken Gyro, $13.00
- Broccoli and Cheddar Soup, Sm $5.00 / Lg $7.50

## Facebook section

Use the official Facebook Page Plugin iframe (https://developers.facebook.com/docs/plugins/page-plugin/
pattern, no SDK needed, iframe variant):

```html
<iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D100092317033661&tabs=timeline&width=500&height=600&small_header=true&adapt_container_width=true&hide_cover=false"
  width="500" height="600" style="border:none;overflow:hidden" scrolling="no"
  frameborder="0" allowfullscreen="true"
  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
  loading="lazy"></iframe>
```

- Put the "Follow us on Facebook" button ABOVE the iframe so the section works
  even if the embed fails to render (numeric-ID pages sometimes don't).
- Lazy-load the iframe; it must not block or slow the rest of the page.
- If at build time the embed clearly renders nothing, keep the button and a
  short line ("See our latest specials and photos on Facebook") and drop the
  iframe. The section must not ship looking broken.

## Design direction

- Palette from the logo: deep green (sample from the provided logo, approx
  #1d4a38), cream/off-white (approx #f2e9d8), near-black. One accent only if
  needed (a warm red, like a bobber or the flannel in their shop photos).
- Typography: a sturdy slab or vintage-Americana display face for headings
  (system-safe or one self-hosted font file max, e.g. a slab like Zilla Slab
  or Bitter), humanist sans or system stack for body. Big sizes. High contrast.
- Feel: hand-painted sign, general store, lake town. Borders, thick rules,
  maybe a subtle paper texture on section backgrounds. No gradients-on-glass,
  no animation beyond trivial hover states, no carousels, no cookie banners,
  no popups of any kind.
- The fish logo is the identity. Use it in the hero, favicon, and OpenGraph
  image. The provided logo is on a black background; if a transparent version
  is needed, isolate it or place it on matching dark blocks rather than
  degrading it.
- Accessibility basics: real heading hierarchy, alt text on every photo,
  contrast-checked colors, focus states, hours in an actual table or dl.

## Assets provided (filenames from the working directory)

- `Logo.jpg`: the JW fish logo, green/cream on black.
- `Breakfast_menu.jpg`, `Lunch_menu.jpg`: printed menus (transcribed above).
- `Specials.jpg`: whiteboard specials (transcribed above as demo data).
- Coffee flavors board photo (transcribed above).
- Deli case photos (muffins, meats; desserts, salads, fruit).
- Shop interior: tackle wall + rod rack; window rod display; lure wall.
- Minnow tank photos (2) and minnows-in-net photos (2), worm cup photo.
- T-shirt photo with tagline.
- Facebook page screenshot (pot pie post, contact info).
- EXCLUDED: the chicken cordon bleu photo. Likely stock; do not use.

Optimize all images: resize to display dimensions, compress, serve as WebP with
JPEG fallback or just well-compressed JPEG, lazy-load everything below the hero.
Total page weight target: under 1 MB for index.html on first load excluding the
Facebook iframe.

## Build phases

1. **Static site.** Both pages complete, specials hardcoded from the demo data,
   all real content, full design. Demoable at the end of this phase.
2. **Sheet integration.** Create the sheet, publish, wire `specials.js`, test
   failure modes (bad URL, empty sheet, garbage rows, slow network).
3. **Facebook embed** with fallback behavior verified.
4. **Polish.** Image compression, favicon, OpenGraph/meta tags (texted links
   must show the logo and name), Lighthouse pass, test on a small/cheap
   Android viewport, README with setup instructions for the sheet and the
   eventual domain cutover.

## Acceptance criteria

- Loads fast on a throttled connection; usable with JS disabled except the
  specials section (which then shows the call-us fallback via noscript or
  server-rendered fallback text).
- Phone number is tap-to-call everywhere it appears.
- Open/closed indicator is correct across day boundaries and Thursday's late
  close (test around 3 PM and 7 PM edges; timezone America/New_York).
- Specials section never shows a broken or error state under any failure.
- Every price and item matches the transcription in this plan exactly.
- No stock photos, no placeholder lorem ipsum anywhere in the final output.
- Repo README covers: how the owners edit specials (phone instructions), how
  to regenerate the published CSV URL, how to point a custom domain later.

## Out of scope for v1 (do not build)

- Fishing license info (v2, pending details).
- Online ordering, payments, accounts, contact forms.
- Any admin interface.
- Owner names / detailed history in the About section (TODO comment only).
