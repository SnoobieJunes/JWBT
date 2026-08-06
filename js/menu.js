/* ==========================================================================
   JW Bait & Tackle — the menu, from the sheet

   Rebuilds the priced parts of menu.html from two tabs of the shop's Google
   Sheet, so the owners can change a price without anybody touching code.

     Menu    Section | Group | Item | Description | Price | Note
     Coffee  Flavor (or Flavour)

   Section must match a container on the page: Breakfast, Lunch, Coffee.
   Group is the sub-heading ("Sandwiches", "For the Cold Day"); leave it
   blank for a list with no heading of its own.
   A row with a Note and no Item becomes a note box at the end of its group.

   This only ever REPLACES a menu that is already on the page. menu.html
   ships with the full menu written out in HTML, so the page is complete and
   correct before this file runs, without JavaScript, and if the sheet is
   slow, empty, unshared or renamed. Nothing here can leave the page blank:
   every failure path simply returns and leaves the committed menu alone.
   ========================================================================== */

(function () {
  "use strict";

  var Sheet = window.JWSheet;
  if (!Sheet) return;

  /* ---------------------------------------------------------- rendering -- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    // Always textContent, never innerHTML: this is spreadsheet content.
    if (text) node.appendChild(document.createTextNode(text));
    return node;
  }

  function renderItem(item, nameTag) {
    var li = document.createElement("li");
    var head = el("div", "item__head");

    head.appendChild(el(nameTag, "item__name", item.name));

    var leader = el("span", "item__leader");
    leader.setAttribute("aria-hidden", "true");
    head.appendChild(leader);

    if (item.price) head.appendChild(el("span", "item__price", item.price));
    li.appendChild(head);

    if (item.description) li.appendChild(el("p", "item__desc", item.description));
    return li;
  }

  function renderGroup(group, isFirst) {
    var wrap = el("div", "menu-group");
    if (isFirst) wrap.style.marginTop = "2.25rem";

    // The section heading is an h2. A group heading takes the h3 and pushes
    // its items to h4; a group with no heading leaves its items at h3.
    if (group.name) wrap.appendChild(el("h3", "menu-group__title", group.name));
    var nameTag = group.name ? "h4" : "h3";

    if (group.items.length) {
      var list = el("ul", "pricelist");
      for (var i = 0; i < group.items.length; i++) {
        list.appendChild(renderItem(group.items[i], nameTag));
      }
      wrap.appendChild(list);
    }

    if (group.notes.length) {
      var note = el("div", "note");
      for (var n = 0; n < group.notes.length; n++) {
        note.appendChild(el("p", null, group.notes[n]));
      }
      wrap.appendChild(note);
    }
    return wrap;
  }

  /* ------------------------------------------------------------- shape --- */

  /**
   * Rows -> { sectionName: [ {name, items[], notes[]} ] }, keeping the order
   * the owners see in the spreadsheet. Sorting it any other way would make
   * the page disagree with the sheet, which is how people lose confidence in
   * a thing like this.
   */
  function group(rows) {
    // Section and Group names come out of the spreadsheet, so they can be any
    // string at all — including "__proto__", "constructor" or "toString". On a
    // plain object those collide with things already on Object.prototype and
    // the grouping throws. Null-prototype maps have no such names to collide
    // with, so a strange heading is just a strange heading.
    var sections = Object.create(null);
    var order = Object.create(null);

    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var sectionName = String(r.section || "").trim();
      if (!sectionName) continue;

      var groupName = String(r.group || "").trim();
      var itemName = String(r.item || "").trim();
      var note = String(r.note || "").trim();
      if (!itemName && !note) continue; // spacer row

      if (!sections[sectionName]) {
        sections[sectionName] = [];
        // Null-prototype here too: this one is keyed by Group, and a group
        // called "toString" would otherwise already appear to exist.
        order[sectionName] = Object.create(null);
      }
      var list = sections[sectionName];
      var seen = order[sectionName];

      if (!(groupName in seen)) {
        seen[groupName] = list.length;
        list.push({ name: groupName, items: [], notes: [] });
      }
      var g = list[seen[groupName]];

      if (itemName) {
        g.items.push({
          name: itemName,
          description: String(r.description || "").trim(),
          price: Sheet.cleanPrice(r.price)
        });
      } else {
        g.notes.push(note);
      }
    }
    return sections;
  }

  /* ---------------------------------------------------------------- go --- */

  function applyMenu(rows) {
    var sections = group(rows);
    var containers = document.querySelectorAll("[data-menu-section]");
    var replaced = 0;

    for (var c = 0; c < containers.length; c++) {
      var container = containers[c];
      var name = container.getAttribute("data-menu-section");
      var groups = sections[name];

      // A section the sheet says nothing about keeps what the page shipped
      // with, rather than being emptied.
      if (!groups || !groups.length) continue;

      var frag = document.createDocumentFragment();
      for (var g = 0; g < groups.length; g++) {
        // Only Breakfast's first group carries the extra top margin, matching
        // the committed markup, where a note box sits above it.
        frag.appendChild(renderGroup(groups[g], g === 0 && name === "Breakfast"));
      }
      container.textContent = "";
      container.appendChild(frag);
      replaced++;
    }
    return replaced;
  }

  function applyFlavors(rows) {
    var list = document.getElementById("coffee-flavors");
    if (!list) return 0;

    var names = [];
    for (var i = 0; i < rows.length; i++) {
      // The column may be headed "Flavor" or "Flavour" — the live sheet was
      // set up with the British spelling. Accept either.
      var f = String(rows[i].flavor || rows[i]["flavour"] || "").trim();
      if (f) names.push(f);
    }
    if (!names.length) return 0;

    var frag = document.createDocumentFragment();
    for (var n = 0; n < names.length; n++) {
      frag.appendChild(el("li", null, names[n]));
    }
    list.textContent = "";
    list.appendChild(frag);
    return 1;
  }

  function start() {
    if (!document.querySelector("[data-menu-section]")) return;

    Sheet.load("menu", ["section", "item", "price"])
      .then(applyMenu)
      .catch(function () { /* keep the menu the page shipped with */ });

    Sheet.load("coffee", [["flavor", "flavour"]])
      .then(applyFlavors)
      .catch(function () { /* keep the flavors the page shipped with */ });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  // Exposed only so the test harness can exercise the logic.
  window.JW_MENU = { group: group, applyMenu: applyMenu, applyFlavors: applyFlavors };
})();
