/* ==========================================================================
   JW Bait & Tackle — the Google Sheet layer

   Everything the owners can edit lives in one Google Sheet, one tab per
   thing: Specials, Hours, Menu, Coffee. This file knows how to fetch a tab
   and hand back clean rows. The other scripts decide what to do with them.

   SETUP
   -----
   1. The sheet must be shared: Share > General access >
      "Anyone with the link" > Viewer. That is all — there is no
      "Publish to web" step and no per-tab links to copy.
   2. Put the sheet's id in SHEET_ID below. It is the long string in the
      sheet's own address bar, between /d/ and /edit.

   Because the sheet is link-readable, treat everything in it as public.
   Do not add a tab with anything private on it.

   HOW EVERY PAGE BEHAVES
   ----------------------
   The pages already contain the real hours, the real menu and the call-us
   fallback as plain HTML. The sheet only ever *replaces* what is already
   there. So if the sheet is slow, deleted, unshared, renamed, or the visitor
   has no JavaScript, the site still shows a complete, correct page — just
   the version that was last committed. Nothing ever renders empty.
   ========================================================================== */

window.JWSheet = (function () {
  "use strict";

  /* --------------------------------------------------------- settings ---- */

  // The long id from the sheet's address bar, between /d/ and /edit.
  var SHEET_ID = "1Z0-_H37r53mMeB7hunssjloqrU4P-sPEDBkLuGrI7FY";

  // Tab names, exactly as they are spelled on the tabs at the bottom of the
  // sheet. Renaming a tab in the sheet without changing it here means that
  // section simply keeps using the version built into the page.
  var TABS = {
    specials: "Specials",
    hours: "Hours",
    menu: "Menu",
    coffee: "Coffee"
  };

  // Google's export is cached for around five minutes, so an edit made on a
  // phone is not instant. Two seconds is all we are willing to wait for it.
  var TIMEOUT_MS = 2000;

  // A tab with hundreds of rows would be a mistake, not a menu.
  var MAX_ROWS = 300;

  /* ------------------------------------------------------------- url ----- */

  /**
   * Google's "gviz" export hands back a named tab as CSV, with the CORS
   * header a browser needs, for any sheet that is readable by link.
   *
   * Careful: if the tab name does not exist, Google does NOT return an
   * error — it quietly returns the *first* tab in the document instead.
   * That is why every read below is checked against the columns it expects.
   */
  function tabUrl(tab) {
    return "https://docs.google.com/spreadsheets/d/" +
      encodeURIComponent(SHEET_ID) +
      "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(tab);
  }

  function isConfigured() {
    return typeof SHEET_ID === "string" &&
           SHEET_ID.indexOf("PASTE_") !== 0 &&
           SHEET_ID.length > 20;
  }

  /* -------------------------------------------------------- csv parsing -- */

  /**
   * Parse CSV into an array of arrays. Handles quoted fields, commas and
   * newlines inside quotes, doubled quotes as an escaped quote, and CRLF or
   * LF line endings.
   */
  function parseCSV(text) {
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    var i = 0;

    // A leading byte order mark would otherwise become part of the first header.
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

    while (i < text.length) {
      var c = text.charAt(i);

      if (inQuotes) {
        if (c === '"') {
          if (text.charAt(i + 1) === '"') {
            field += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          i++;
          continue;
        }
        field += c;
        i++;
        continue;
      }

      if (c === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (c === ",") {
        row.push(field);
        field = "";
        i++;
        continue;
      }
      if (c === "\r") {
        i++;
        continue;
      }
      if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i++;
        continue;
      }
      field += c;
      i++;
    }

    row.push(field);
    rows.push(row);
    return rows;
  }

  function normalise(value) {
    return String(value == null ? "" : value).trim();
  }

  function isBlankRow(cells) {
    for (var i = 0; i < cells.length; i++) {
      if (normalise(cells[i]) !== "") return false;
    }
    return true;
  }

  /**
   * A sheet that was un-shared answers with a Google sign-in page rather than
   * a spreadsheet, and that is still an HTTP 200.
   */
  function looksLikeHtml(text) {
    return /^\s*(<!doctype|<html|<\?xml|<head|<body)/i.test(text);
  }

  /**
   * Rows of cells -> rows of objects keyed by the lower-cased header name.
   * The header row is required; without it there is no way to tell one tab
   * from another, and telling them apart is the whole safety net here.
   */
  function toObjects(rows) {
    if (!rows || !rows.length) return { columns: [], rows: [] };

    // Note that a tab holding nothing but its header row still reports its
    // columns. That is the difference between "this tab is the right shape
    // and nobody has filled it in yet" and "this is not the tab we asked
    // for", and the two want different answers on the page.
    var header = rows[0].map(function (c) { return normalise(c).toLowerCase(); });
    var out = [];

    for (var r = 1; r < rows.length && out.length < MAX_ROWS; r++) {
      if (isBlankRow(rows[r])) continue;
      var o = {};
      for (var c = 0; c < header.length; c++) {
        if (header[c]) o[header[c]] = normalise(rows[r][c]);
      }
      out.push(o);
    }
    return { columns: header, rows: out };
  }

  /**
   * Prices are free text on purpose: "$10", "10.00" and "Sm $5 / Lg $7.50"
   * are all things they really write on the board, and all pass through
   * untouched. The one exception is a cell holding nothing but a number:
   * Google types those as numbers and hands back "12" as "12.0", which is
   * not what anybody typed. Those get printed as money instead.
   */
  function cleanPrice(value) {
    var v = normalise(value);
    if (/^\d+(\.\d+)?$/.test(v)) return "$" + parseFloat(v).toFixed(2);
    return v;
  }

  /* ------------------------------------------------------------- fetch --- */

  function fetchText(url) {
    function check(response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      var type = (response.headers && response.headers.get
        ? response.headers.get("content-type") : "") || "";
      if (/html/i.test(type)) throw new Error("not a CSV: " + type);
      return response.text();
    }

    // No AbortController on very old browsers; fetch without a timeout there
    // rather than not fetching at all. The page already reads correctly
    // while it waits, so a slow request costs nothing but freshness.
    if (typeof AbortController !== "function") {
      return fetch(url, { credentials: "omit" }).then(check);
    }

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

    // The timer stays armed until the body has been read, not just until the
    // headers land. A server that answers instantly and then dribbles the
    // body would otherwise never time out at all.
    return fetch(url, { credentials: "omit", signal: controller.signal })
      .then(check)
      .then(
        function (text) { clearTimeout(timer); return text; },
        function (error) { clearTimeout(timer); throw error; }
      );
  }

  /* -------------------------------------------------------------- load --- */

  /**
   * Read one tab.
   *
   * @param {string} key      a key of TABS: "specials", "hours", "menu", "coffee"
   * @param {string[]} needs  column names the tab must have, lower case
   * @returns {Promise<Object[]>} one object per row, keyed by column name
   *
   * Rejects — rather than returning something half-right — if the sheet is
   * unreachable, slow, not shared, empty, or if the columns do not match.
   * That last check is what stops a renamed or missing tab from quietly
   * pouring the Specials tab into the menu.
   */
  function load(key, needs) {
    var tab = TABS[key];

    if (!isConfigured() || !tab) {
      return Promise.reject(fail("sheet not configured", "unconfigured"));
    }
    if (typeof fetch !== "function") {
      return Promise.reject(fail("no fetch", "unsupported"));
    }

    return fetchText(tabUrl(tab)).then(function (text) {
      if (looksLikeHtml(text)) throw new Error("not a CSV: got a web page");

      var parsed = toObjects(parseCSV(text));

      for (var i = 0; i < needs.length; i++) {
        // An entry may be a single column name, or an array of names any one
        // of which will do — so a sheet headed "Flavor" and one headed
        // "Flavor" are both accepted.
        var alts = [].concat(needs[i]);
        var got = false;
        for (var a = 0; a < alts.length; a++) {
          if (parsed.columns.indexOf(alts[a]) >= 0) { got = true; break; }
        }
        if (!got) {
          // Either the tab was renamed and Google handed back a different one,
          // or somebody edited the header row. Either way this is not the
          // data we asked for, so the page keeps what it already had.
          throw fail('tab "' + tab + '" has no "' + alts.join('" or "') +
            '" column (got: ' + parsed.columns.join(", ") + ")", "wrong-columns");
        }
      }
      if (!parsed.rows.length) {
        throw fail('tab "' + tab + '" is empty', "empty");
      }

      return parsed.rows;
    });
  }

  /**
   * "Nobody has filled this in yet" and "something went wrong" want different
   * answers on the page, so failures carry a code the callers can read.
   * Codes: unconfigured | unsupported | empty | wrong-columns | (none, for
   * network, timeout, HTTP and parse failures).
   */
  function fail(message, code) {
    var e = new Error(message);
    e.code = code;
    return e;
  }

  return {
    load: load,
    isConfigured: isConfigured,
    tabUrl: tabUrl,
    cleanPrice: cleanPrice,
    // Exposed for the test harness.
    parseCSV: parseCSV,
    toObjects: toObjects,
    normalise: normalise,
    looksLikeHtml: looksLikeHtml,
    TABS: TABS
  };
})();
