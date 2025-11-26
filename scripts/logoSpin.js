/* Make header logo spin like a record */
.header-branding-logo-image img,
.header-title-logo img,
.header-title-logo-image img,
.site-title-logo img {
  animation: record-spin 12s linear infinite;
  transform-origin: center center;
  display: inline-block;
}

/* Optional: pause spin when hovered (desktop) */
.header-branding-logo-image img:hover,
.header-title-logo img:hover,
.header-title-logo-image img:hover,
.site-title-logo img:hover {
  animation-play-state: paused;
}

/* Keyframes for spinning logo */
@keyframes record-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
