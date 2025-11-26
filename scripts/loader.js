(() => {
  const STYLE_ID = "vs-loader-style";

  const styleText = `
  #loader {
    position: fixed;
    inset: 0;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: clamp(48px, 12vw, 160px);
    font-weight: 700;
    z-index: 999999;
    opacity: 1;
    transition: opacity 0.4s ease;
  }

  #loader.done {
    opacity: 0;
    pointer-events: none;
  }

  html.loading,
  body.loading {
    overflow: hidden;
  }`;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = styleText;
    document.head.appendChild(style);
  }

  function createLoader() {
    if (document.getElementById("loader")) return null;
    const loader = document.createElement("div");
    loader.id = "loader";
    loader.innerHTML = '<div id="percent">0%</div>';
    document.body.appendChild(loader);
    return loader;
  }

  function startLoader() {
    const host = window.location.hostname.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    const allowedHost = host === "vintageslav.com" || host === "www.vintageslav.com";
    const allowedPath = path === "/" || path === "/shop";
    if (!allowedHost || !allowedPath) return;

    injectStyles();
    const loader = createLoader();
    if (!loader) return;

    document.documentElement.classList.add("loading");
    document.body.classList.add("loading");

    const percentEl = loader.querySelector("#percent");
    let pct = 0;
    const interval = setInterval(() => {
      pct += 1;
      if (percentEl) percentEl.textContent = `${pct}%`;

      if (pct >= 100) {
        clearInterval(interval);
        loader.classList.add("done");
        setTimeout(() => {
          loader.remove();
          document.documentElement.classList.remove("loading");
          document.body.classList.remove("loading");
        }, 500);
      }
    }, 13);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startLoader);
  } else {
    startLoader();
  }
})();
