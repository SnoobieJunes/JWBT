/* ==========================================================================
   JW Bait & Tackle — this week's specials

   Reads the "Specials" tab of the shop's Google Sheet (see js/sheet.js) and
   renders it into the homepage. Columns: Item, Description, Price, Day.
   Day is optional; blank means the special runs all week.

   Whatever goes wrong — no sheet, no signal, a slow connection, an empty
   tab, rows full of nonsense — the section keeps the "call us" markup that
   is already in index.html. It never shows an error, a spinner or an empty
   box.
   ========================================================================== */

(function () {
  "use strict";

  var Sheet = window.JWSheet;

  // Before the sheet existed, an empty Specials tab showed the board that was
  // up when the site was built, so the site could be demonstrated. That is now
  // switched OFF and must stay off.
  //
  // The reason: once the sheet is real, "the tab is empty" no longer means
  // "nobody has set this up". It means the owners cleared the board for a
  // quiet week — which is exactly what the instructions on the Instructions
  // tab tell them to do. Showing last season's food, with prices, under the
  // heading "This Week's Specials" would be a lie told to a customer who then
  // drives to the shop for it. An empty tab must fall through to the "call us"
  // callout that is already in index.html.
  //
  // Only turn this on again against a sheet that has never been filled in.
  var DEMO_UNTIL_SHEET_HAS_ROWS = false;

  var DEMO_SPECIALS = [
    {
      item: "Housemade Hot Honey Fried Chicken Sandwich",
      description: "With bacon, pepper jack, lettuce, red onion, topped with " +
                   "chipotle mayo on a toasted kaiser",
      price: "$10.00",
      days: []
    },
    {
      item: "Fresh Local Perch Sandwich",
      description: "With lettuce and tartar",
      price: "$9.50",
      days: []
    },
    {
      item: "“Rito” Wrap",
      description: "Crispy chicken, bacon, cheddar, lettuce, red onion, " +
                   "Cool Ranch Doritos, topped with ranch dressing",
      price: "$12.00",
      days: []
    },
    {
      item: "Loaded Lamb or Chicken Gyro",
      description: "",
      price: "$13.00",
      days: []
    },
    {
      item: "Broccoli and Cheddar Soup",
      description: "",
      price: "Sm $5.00 / Lg $7.50",
      days: []
    }
  ];

  // Monday first, matching the dropdown the owners pick from in the sheet.
  var WEEK_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday",
                    "Friday", "Saturday", "Sunday"];

  /* ------------------------------------------------------------- rows ---- */

  /**
   * Read a Day cell and return every weekday it names.
   *
   * The owners really do write "Thursday", "Thu", "Wednesday, Monday" and
   * "Thursday, Monday, Tuesday" in a single cell, so one cell has to be able
   * to mean several days. An item that names three days is shown under all
   * three headings.
   *
   * An empty cell, or one naming nothing recognisable, comes back empty,
   * which means the special simply runs all week rather than landing under a
   * junk heading or disappearing.
   */
  function matchDays(value) {
    var tokens = String(value || "").toLowerCase()
      .split(/[,/;&+]|\band\b/)
      .map(function (t) { return t.replace(/[^a-z]/g, ""); })
      .filter(Boolean);

    // Walk the week rather than the cell, so the answer always comes back in
    // weekday order however the owner happened to type it, and duplicates
    // ("Monday, Mon") collapse on their own.
    var out = [];
    for (var i = 0; i < WEEK_ORDER.length; i++) {
      var full = WEEK_ORDER[i].toLowerCase();
      for (var t = 0; t < tokens.length; t++) {
        if (tokens[t] === full || tokens[t] === full.slice(0, 3)) {
          out.push(WEEK_ORDER[i]);
          break;
        }
      }
    }
    return out;
  }

  function toSpecials(rows) {
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var item = String(r.item || "").trim();
      if (!item) continue; // a row with no name is not a special
      out.push({
        item: item,
        description: String(r.description || "").trim(),
        price: Sheet.cleanPrice(r.price),
        days: matchDays(r.day)
      });
    }
    return out;
  }

  /* ---------------------------------------------------------- rendering -- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    // Always textContent, never innerHTML: this content comes from a
    // spreadsheet anyone with edit access can type into.
    if (text) node.appendChild(document.createTextNode(text));
    return node;
  }

  function renderSpecial(special, nameTag) {
    var li = el("li", "special");
    var head = el("div", "special__head");

    head.appendChild(el(nameTag, "special__name", special.item));
    if (special.price) {
      head.appendChild(el("span", "special__price", special.price));
    }
    li.appendChild(head);

    if (special.description) {
      li.appendChild(el("p", "special__desc", special.description));
    }
    return li;
  }

  function renderGroup(heading, specials) {
    var group = el("div", "specials__group");
    if (heading) group.appendChild(el("h3", "specials__day", heading));

    // The section itself is an h2. When a day heading takes the h3, the items
    // have to drop to h4 so the day actually reads as their parent — the same
    // nesting menu.html uses for its priced lists.
    var nameTag = heading ? "h4" : "h3";

    var list = el("ul", "specials__list");
    for (var i = 0; i < specials.length; i++) {
      list.appendChild(renderSpecial(specials[i], nameTag));
    }
    group.appendChild(list);
    return group;
  }

  function render(target, specials) {
    var allWeek = [];
    var byDay = {};

    for (var i = 0; i < specials.length; i++) {
      var s = specials[i];
      var on = s.days || [];
      if (!on.length) {
        allWeek.push(s);
      } else {
        // A special that names several days is listed under each of them.
        for (var k = 0; k < on.length; k++) {
          (byDay[on[k]] = byDay[on[k]] || []).push(s);
        }
      }
    }

    var days = WEEK_ORDER.filter(function (day) { return byDay[day]; });
    var frag = document.createDocumentFragment();

    if (allWeek.length) {
      // Only label the all-week items when there are day groups to tell them
      // apart from. A lone heading over the only list is just noise.
      frag.appendChild(renderGroup(days.length ? "All Week" : null, allWeek));
    }
    for (var d = 0; d < days.length; d++) {
      frag.appendChild(renderGroup(days[d], byDay[days[d]]));
    }

    target.textContent = "";
    target.appendChild(frag);
  }

  /* ---------------------------------------------------------------- go --- */

  function start() {
    var target = document.getElementById("specials-content");
    if (!target || !Sheet) return;

    // The markup already holds the "call us" fallback, which is also what
    // somebody with JavaScript switched off sees. Nothing here ever needs to
    // put the section into a loading or error state; it only ever upgrades.

    Sheet.load("specials", ["item", "day"])
      .then(function (rows) {
        var specials = toSpecials(rows);
        if (specials.length) render(target, specials);
        else showDemo(target); // header row present, no specials under it
      })
      .catch(function (err) {
        // Two different situations, two different answers.
        //
        // Nobody has filled the tab in yet: show the demo board, so the site
        // can be demonstrated before the sheet is in use.
        //
        // Anything else — offline, timeout, sheet unshared, tab renamed,
        // header edited — means we cannot say what this week's specials are,
        // and guessing with last year's food would be worse than useless.
        // The "call us" markup is already on the page. Leave it alone.
        var code = err && err.code;
        if (code === "empty" || code === "unconfigured") showDemo(target);
      });
  }

  function showDemo(target) {
    if (DEMO_UNTIL_SHEET_HAS_ROWS) render(target, DEMO_SPECIALS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  // Exposed only so the test harness can exercise the logic.
  window.JW_SPECIALS = {
    toSpecials: toSpecials,
    matchDays: matchDays,
    render: render
  };
})();
