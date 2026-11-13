// DRAFT mockup helper. Throwaway.
// - injects the icon sprite and the shared header (so it is changed in one place)
// - switches visible states: elements with data-show="a b" are visible only in those states
// - demo layer toggle, dialogs and the "Reset demo" confirmation
(function () {
  var body = document.body;

  // ---------- icons ----------
  var sprite =
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' +
    '<symbol id="i-insights" viewBox="0 0 24 24"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-4"/></symbol>' +
    '<symbol id="i-list" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></symbol>' +
    '<symbol id="i-upload" viewBox="0 0 24 24"><path d="M12 15V3"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></symbol>' +
    '<symbol id="i-review" viewBox="0 0 24 24"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></symbol>' +
    '<symbol id="i-saved" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></symbol>' +
    '<symbol id="i-arrow" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></symbol>' +
    '<symbol id="i-play" viewBox="0 0 24 24"><path d="m8 5 11 7-11 7z"/></symbol>' +
    '<symbol id="i-reset" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></symbol>' +
    '<symbol id="i-github" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></symbol>' +
    "</svg>";
  body.insertAdjacentHTML("afterbegin", sprite);

  window.icon = function (name, extra) {
    return '<svg class="icon ' + (extra || "") + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  };

  // ---------- shared header ----------
  var host = document.getElementById("app-header");
  if (host) {
    var page = host.dataset.page;
    var nav = [
      ["insights", "4-insights.html", "Insights", "insights"],
      ["transactions", "2-transactions-table.html", "Transactions", "list"],
      ["import", "1-import-review.html", "Import", "upload"]
    ];
    var links = nav.map(function (n) {
      return '<a href="' + n[1] + '"' + (n[0] === page ? ' aria-current="page"' : "") + ">" +
        icon(n[3]) + '<span class="nav-label">' + n[2] + "</span></a>";
    }).join("");
    host.outerHTML =
      '<header class="app-header"><div class="app-header-inner">' +
      '<a class="logo" href="4-insights.html"><span class="logo-mark" aria-hidden="true">M</span>Moneo</a>' +
      '<nav class="nav" aria-label="Main">' + links + "</nav>" +
      '<div class="header-actions">' +
      '<a class="btn small primary demo-only" id="start-demo" href="1-import-review.html">' + icon("play", "fill") + '<span>Start import demo</span></a>' +
      '<button class="btn small danger demo-only" id="reset-demo" aria-label="Reset demo">' + icon("reset") + '<span class="reset-text">Reset demo</span></button>' +
      '<a class="btn small repo-link" href="https://github.com/evolveris/moneo" target="_blank" rel="noopener">' + icon("github", "fill") + '<span class="repo-text">Project repo</span></a>' +
      "</div></div></header>";
  }

  // ---------- states ----------
  // Pages list the states in which the visitor has no data yet. There the header offers
  // "Start import demo" instead of "Reset demo" (nothing to reset).
  var emptyStates = (body.dataset.emptyStates || "").split(" ");

  function setState(state) {
    body.dataset.state = state;
    body.dataset.data = emptyStates.indexOf(state) === -1 ? "some" : "none";
    document.querySelectorAll("[data-show]").forEach(function (el) {
      el.hidden = el.dataset.show.split(" ").indexOf(state) === -1;
    });
    document.querySelectorAll("[data-state-btn]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.stateBtn === state));
    });
  }

  document.querySelectorAll("[data-state-btn]").forEach(function (b) {
    b.addEventListener("click", function () { setState(b.dataset.stateBtn); });
  });

  var demo = document.getElementById("demo-toggle");
  if (demo) {
    demo.addEventListener("click", function () {
      var off = body.classList.toggle("no-demo");
      demo.setAttribute("aria-pressed", String(!off));
      demo.textContent = off ? "Demo layer: off (user mode)" : "Demo layer: on (demo mode)";
    });
  }

  // ---------- dialogs ----------
  document.querySelectorAll("[data-open-dialog]").forEach(function (b) {
    b.addEventListener("click", function () {
      var d = document.getElementById(b.dataset.openDialog);
      if (d && d.showModal) {
        d.showModal();
      }
    });
  });
  document.addEventListener("click", function (e) {
    var close = e.target.closest("[data-close-dialog]");
    if (close) {
      close.closest("dialog").close();
    }
  });

  // ---------- reset demo: confirm, wipe, land on Import > Choose source ----------
  var reset = document.getElementById("reset-demo");
  if (reset) {
    var dlg = document.createElement("dialog");
    dlg.innerHTML =
      "<h2>Reset demo?</h2>" +
      '<p class="muted" style="margin-top:6px">This deletes all your demo data: transactions, categories and context. It only affects your own copy. It can\'t be undone.</p>' +
      '<div class="actions"><button class="btn" data-close-dialog>Cancel</button>' +
      '<a class="btn danger" href="1-import-review.html">Reset and start again</a></div>';
    body.appendChild(dlg);
    reset.addEventListener("click", function () { dlg.showModal(); });
  }

  setState(body.dataset.initial || "default");
})();
