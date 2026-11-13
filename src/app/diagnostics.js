// Original error capture and fatal-error presentation. Imported once at startup.

window.__frames = 0;

window.__ready = !1;

window.__fatal = null;

window.__errors = [];

function showFatalError(i) {
  ((window.__fatal = String(i)), console.error("[fatal] " + i));
  let e = document.getElementById("fatal");
  (e ||
    ((e = document.createElement("div")),
    (e.id = "fatal"),
    document.getElementById("app").appendChild(e)),
    (e.textContent = "Saltline could not start: " + i));
}

window.addEventListener("error", (i) => {
  window.__errors.push(String(i.message));
});

{
  let i = console.error.bind(console);
  console.error = (...e) => {
    try {
      window.__errors.push(
        e
          .map((t) => (t && t.stack) || String(t))
          .join(" ")
          .slice(0, 400),
      );
    } catch {}
    i(...e);
  };
}

export { showFatalError };
