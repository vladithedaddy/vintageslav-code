<!-- ===== PERCENT LOADING SCREEN (vintageslav.com only on / and /shop) ===== -->
<script>
  document.addEventListener("DOMContentLoaded", function () {
    const host = window.location.hostname.toLowerCase();
    const path = window.location.pathname.toLowerCase();

    // Only run on vintageslav.com or www.vintageslav.com
    const allowedHost = (host === "vintageslav.com" || host === "www.vintageslav.com");
    // Only on homepage or /shop
    const allowedPath = (path === "/" || path === "/shop");

    if (!allowedHost || !allowedPath) return;

    // Create loader container
    const loader = document.createElement("div");
    loader.id = "loader";
    loader.innerHTML = '<div id="percent">0%</div>';
    document.body.appendChild(loader);

    // Prevent scroll while loading
    document.documentElement.classList.add("loading");
    document.body.classList.add("loading");

    // Animate percentage
    const percentEl = loader.querySelector("#percent");
    let pct = 0;
    const interval = setInterval(() => {
      pct++;
      percentEl.textContent = pct + "%";

      if (pct >= 100) {
        clearInterval(interval);
        loader.classList.add("done");
        setTimeout(() => {
          loader.remove();
          document.documentElement.classList.remove("loading");
          document.body.classList.remove("loading");
        }, 500); // fade duration
      }
    }, 13); // adjust speed here
  });
</script>

<style>
  /* Fullscreen black background with white percentage */
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

  /* Fade-out when complete */
  #loader.done {
    opacity: 0;
    pointer-events: none;
  }

  /* Disable scrolling during load */
  html.loading,
  body.loading {
    overflow: hidden;
  }
</style>
<!-- ===== END LOADING SCREEN ===== -->
