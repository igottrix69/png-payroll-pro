// electron/preload.cjs — intentionally minimal.
// The app runs entirely in the renderer (localStorage persistence, offline licence
// verification via Web Crypto). No Node APIs are exposed to the page.
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.setAttribute('data-runtime', 'desktop');
});
