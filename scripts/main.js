// === Vintage Slav Main Entry File ===
// Loads all modules in a clean, modular way.

import { VS_CONFIG } from "./config.js";

if (window.VS_DEV) {
  console.warn("[VS] Dev mode enabled – modules will not be cached.");
}

if (VS_CONFIG.enableFilters) {
  import("./filters.js").then(() => {
    if (VS_CONFIG.debug) console.log("Filters loaded.");
  });
}

if (VS_CONFIG.enableLoader) {
  import("./loader.js").then(() => {
    if (VS_CONFIG.debug) console.log("Loader loaded.");
  });
}

if (VS_CONFIG.enableLogoSpin) {
  import("./logoSpin.js").then(() => {
    if (VS_CONFIG.debug) console.log("Logo spin loaded.");
  });
}
