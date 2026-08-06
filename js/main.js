/* ==========================================================================
   JW Bait & Tackle — open / closed indicator

   Reads the opening hours straight out of the footer hours table, so this
   file never needs editing when the hours change — the table drives it.

   Note that the table is not the *only* place the hours are written down.
   The static text inside <p id="open-status"> (what a visitor without
   JavaScript sees), the JSON-LD block at the bottom of index.html, and a
   couple of sentences on menu.html all state the hours in prose. README.md
   lists them under "Changing the opening hours"; keep that list honest.

   The shop is in Union Springs, New York. The clock used is always
   America/New_York, never the visitor's own timezone, so somebody checking
   from a phone still set to Pacific time gets the right answer.
   ========================================================================== */

(function () {
  "use strict";

  var ZONE = "America/New_York";
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday",
                   "Thursday", "Friday", "Saturday"];

  /* ------------------------------------------------------------ hours ---- */

  /**
   * Pull the week's hours off the footer table.
   * Returns an array indexed 0..6 (Sunday..Saturday); a null entry means
   * closed all day. Times are minutes past midnight.
   */
  function readHours(root) {
    var rows = root.querySelectorAll("[data-day]");
    if (!rows.length) return null;

    var week = [null, null, null, null, null, null, null];

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var day = parseInt(row.getAttribute("data-day"), 10);
      var open = toMinutes(row.getAttribute("data-open"));
      var close = toMinutes(row.getAttribute("data-close"));
      if (isNaN(day) || day < 0 || day > 6) continue;
      if (open === null || close === null || close <= open) continue;
      week[day] = { open: open, close: close };
    }

    // A week where every day is closed is a real answer, not a missing one:
    // the shop has shut for a holiday. Only the absence of the table itself,
    // caught above, means "this page has no hours, say nothing".
    return week;
  }

  /** "06:00" -> 360. Returns null on anything unparseable. */
  function toMinutes(value) {
    if (!value) return null;
    var m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (!m) return null;
    var h = parseInt(m[1], 10);
    var min = parseInt(m[2], 10);
    if (h > 24 || min > 59) return null;
    return h * 60 + min;
  }

  /** 900 -> "3:00 PM" */
  function formatTime(minutes) {
    var h = Math.floor(minutes / 60) % 24;
    var m = minutes % 60;
    var suffix = h < 12 ? "AM" : "PM";
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return h12 + ":" + (m < 10 ? "0" : "") + m + " " + suffix;
  }

  /* ------------------------------------------------------------- clock --- */

  /**
   * The current weekday and minutes-past-midnight in Union Springs.
   * Falls back to the device's own clock if the browser cannot do
   * timezone-aware formatting, which is better than showing nothing.
   */
  function shopClock() {
    var now = new Date();
    try {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: ZONE,
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).formatToParts(now);

      var bag = {};
      for (var i = 0; i < parts.length; i++) bag[parts[i].type] = parts[i].value;

      var dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        .indexOf(bag.weekday);
      var hour = parseInt(bag.hour, 10);
      var minute = parseInt(bag.minute, 10);

      if (dow >= 0 && !isNaN(hour) && !isNaN(minute)) {
        // Some engines report midnight as 24 rather than 0.
        if (hour === 24) hour = 0;

        // A conformant engine honours hourCycle and emits no dayPeriod at
        // all, so this is a no-op. If one ever ignores it and hands back a
        // 12-hour clock, the AM/PM marker is there to put it right — without
        // this, 1 PM would read as 1 AM and the banner would lie.
        if (bag.dayPeriod) {
          var isPM = /p/i.test(bag.dayPeriod);
          if (hour === 12) hour = isPM ? 12 : 0;
          else if (isPM) hour += 12;
        }

        return { day: dow, minutes: hour * 60 + minute };
      }
    } catch (e) {
      /* fall through to the device clock */
    }
    return { day: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() };
  }

  /* ------------------------------------------------------------- state --- */

  /**
   * Work out whether the shop is open, and what to say about it.
   * Handles the roll over midnight and the Thursday late close by looking
   * forward day by day rather than assuming anything about the schedule.
   */
  function currentState(week, clock) {
    var today = week[clock.day];

    if (today && clock.minutes >= today.open && clock.minutes < today.close) {
      return {
        open: true,
        headline: "Open now",
        note: "Until " + formatTime(today.close) + " today"
      };
    }

    if (today && clock.minutes < today.open) {
      return {
        open: false,
        headline: "Closed right now",
        note: "Opens today at " + formatTime(today.open)
      };
    }

    // Either the shop has already closed for the day or it never opened
    // today. Walk forward to the next day that has hours.
    for (var ahead = 1; ahead <= 7; ahead++) {
      var day = (clock.day + ahead) % 7;
      var next = week[day];
      if (!next) continue;
      var when = ahead === 1 ? "tomorrow" : "on " + DAY_NAMES[day];
      return {
        open: false,
        headline: "Closed right now",
        note: "Opens " + when + " at " + formatTime(next.open)
      };
    }

    // Every day of the week is closed — a holiday shutdown, or the owners
    // clearing the sheet. Say so plainly rather than leaving a stale "Open
    // now" from the last render, and promise no reopening time we do not have.
    return {
      open: false,
      headline: "Closed",
      note: "Please call before coming in"
    };
  }

  /* ------------------------------------------------------------ render --- */

  function render(el, state) {
    el.className = "status " + (state.open ? "status--open" : "status--closed");

    var dot = document.createElement("span");
    dot.className = "status__dot";
    dot.setAttribute("aria-hidden", "true");

    var text = document.createElement("span");
    text.appendChild(document.createTextNode(state.headline));

    var note = document.createElement("span");
    note.className = "status__note";
    note.appendChild(document.createTextNode(state.note));
    text.appendChild(note);

    el.textContent = "";
    el.appendChild(dot);
    el.appendChild(text);
  }

  function update() {
    var el = document.getElementById("open-status");
    if (!el) return;

    var week = readHours(document);
    if (!week) return; // no hours table found; the static text stands

    var state = currentState(week, shopClock());
    if (state) render(el, state);
  }

  /* ------------------------------------------------- hours from the sheet */

  function isBlank(value) {
    return String(value || "").trim() === "";
  }

  /**
   * A cell that deliberately says the shop is shut that day, as opposed to
   * one that is simply mistyped or half-typed. The difference matters a great
   * deal: neither a typo nor an unfinished edit may put "Closed" against a
   * day they are open.
   *
   * @param wordsOnly when true, only the literal words count — a blank cell
   *                  does not, because on its own it is ambiguous.
   */
  function isClosedWord(value, wordsOnly) {
    var v = String(value || "").trim().toUpperCase().replace(/\./g, "");
    if (v === "") return !wordsOnly;
    return v === "CLOSED" || v === "SHUT";
  }

  /**
   * Read a time the way somebody would actually type it into a spreadsheet:
   * "5:30 AM", "5:30am", "05:30", "14:00", "1 PM". Returns minutes past
   * midnight, or null for a blank cell, the word "closed", or anything
   * unreadable.
   */
  function parseClock(value) {
    var v = String(value || "").trim().toUpperCase().replace(/\./g, "");
    if (isClosedWord(value)) return null;

    var m = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/.exec(v);
    if (!m) return null;

    var h = parseInt(m[1], 10);
    var min = m[2] ? parseInt(m[2], 10) : 0;

    if (m[3]) {
      if (h < 1 || h > 12) return null;
      if (h === 12) h = 0;
      if (m[3] === "PM") h += 12;
    }
    if (h > 24 || min > 59) return null;
    return h * 60 + min;
  }

  /**
   * Rewrite the footer hours table from the sheet's Hours tab, then recompute
   * the banner from it. The table stays the thing everything reads, so there
   * is still only one path through this code whether the hours came from the
   * sheet or from the markup.
   *
   * If a single row is unusable it is skipped and that day keeps what the
   * page shipped with. If nothing usable comes back, nothing is touched.
   */
  function applySheetHours(rows) {
    var table = document.querySelector("table.hours tbody");
    if (!table) return;

    var byDay = {};
    var found = 0;

    for (var i = 0; i < rows.length; i++) {
      var name = String(rows[i].day || "").trim().toLowerCase();
      var dow = -1;
      for (var d = 0; d < DAY_NAMES.length; d++) {
        var full = DAY_NAMES[d].toLowerCase();
        if (name === full || name === full.slice(0, 3)) dow = d;
      }
      if (dow < 0) continue;

      var note = String(rows[i].note || "").trim();

      // Only two things close a day: the word "Closed" in either cell, or
      // BOTH cells left empty. One empty cell beside a real time is a
      // half-finished edit — somebody tapped Close to retype it and the
      // five-minute cache caught them mid-thought — and must not put
      // "Closed" against the shop's busiest day.
      var shut = isClosedWord(rows[i].open, true) ||
                 isClosedWord(rows[i].close, true) ||
                 (isBlank(rows[i].open) && isBlank(rows[i].close));

      if (shut) {
        byDay[dow] = { closed: true, note: note };
        found++;
        continue;
      }

      var open = parseClock(rows[i].open);
      var close = parseClock(rows[i].close);

      // Somebody typed something we cannot read, or put the closing time
      // before the opening one. Skip the row so that day keeps the hours the
      // page shipped with. Printing "Closed" against a day the shop is
      // actually open would be far worse than being slightly out of date.
      if (open === null || close === null || close <= open) continue;

      byDay[dow] = { open: open, close: close, note: note, closed: false };
      found++;
    }
    if (!found) return;

    // Monday first on the page; Sunday last.
    var order = [1, 2, 3, 4, 5, 6, 0];
    var existing = table.querySelectorAll("[data-day]");
    var keep = {};
    for (var e = 0; e < existing.length; e++) {
      keep[existing[e].getAttribute("data-day")] = existing[e];
    }

    var frag = document.createDocumentFragment();
    for (var o = 0; o < order.length; o++) {
      var day = order[o];
      var info = byDay[day];

      if (!info) {                       // no usable row: keep the shipped one
        if (keep[day]) frag.appendChild(keep[day]);
        continue;
      }

      var tr = document.createElement("tr");
      tr.setAttribute("data-day", String(day));

      var th = document.createElement("th");
      th.setAttribute("scope", "row");
      th.appendChild(document.createTextNode(DAY_NAMES[day] + " "));

      if (info.note) {
        tr.className = "is-late";
        var flag = document.createElement("span");
        flag.className = "hours__flag";
        flag.appendChild(document.createTextNode(info.note));
        th.appendChild(flag);
      }

      var td = document.createElement("td");
      if (info.closed) {
        td.appendChild(document.createTextNode("Closed"));
      } else {
        tr.setAttribute("data-open", pad(info.open));
        tr.setAttribute("data-close", pad(info.close));
        td.appendChild(document.createTextNode(
          formatTime(info.open) + " – " + formatTime(info.close)));
      }

      tr.appendChild(th);
      tr.appendChild(td);
      frag.appendChild(tr);
    }

    table.textContent = "";
    table.appendChild(frag);
    update();
  }

  /** 330 -> "05:30", for the data- attributes readHours() reads back. */
  function pad(minutes) {
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  /* --------------------------------------------------------------- go ---- */

  update();

  // Let the owners change the hours from the sheet. The markup already has
  // the right answer, so this only ever corrects it; every failure leaves
  // the committed hours standing.
  if (window.JWSheet) {
    window.JWSheet.load("hours", ["day", "open", "close"])
      .then(applySheetHours)
      .catch(function () { /* keep the hours the page shipped with */ });
  }

  // A phone left on the counter shouldn't drift into saying "Open" after
  // close. Re-check every minute, and immediately when the tab wakes up.
  setInterval(update, 60000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) update();
  });

  // Exposed only so the test harness can exercise the edge cases.
  window.JW_HOURS = {
    readHours: readHours,
    toMinutes: toMinutes,
    formatTime: formatTime,
    currentState: currentState,
    parseClock: parseClock,
    applySheetHours: applySheetHours
  };
})();
