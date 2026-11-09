// DRAFT mockup helper. Throwaway. Switches visible states and the demo layer.
// Elements with data-show="a b" are visible only in those states.
(function () {
  var body = document.body;

  function setState(state) {
    body.dataset.state = state;
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

  setState(body.dataset.initial || "default");
})();
