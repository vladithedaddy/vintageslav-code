(() => {
  const STYLE_ID = "vs-logo-spin-style";

  const styleText = `
  .header-branding-logo-image img,
  .header-title-logo img,
  .header-title-logo-image img,
  .site-title-logo img {
    animation: record-spin 12s linear infinite;
    transform-origin: center center;
    display: inline-block;
  }

  .header-branding-logo-image img:hover,
  .header-title-logo img:hover,
  .header-title-logo-image img:hover,
  .site-title-logo img:hover {
    animation-play-state: paused;
  }

  @keyframes record-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }`;

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = styleText;
    document.head.appendChild(style);
  }
})();
