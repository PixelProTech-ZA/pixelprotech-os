const CACHE_NAME = "pixelprotech-os-v0-6-0";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json", "./pixel-fx.css", "./pixel-fx.js", "./pixel-apps.js", "./pixel-repos.js",
  "./app-bulk-email.html", "./app-on-site-bios.html", "./app-onyx.html", "./app-pixel-calendar.html", "./app-office-hr.html", "./app-warehouse-pro.html", "./app-pixel-weather.html", "./app-mobile-academy.html", "./app-community-radar.html", "./app-invoice-pro.html", "./app-pixel-link.html", "./app-wake-os.html", "./app-smart-storage.html", "./app-pixelview-pro.html", "./app-technician-command.html", "./app-pixel-vault.html", "./app-free-tv.html", "./app-academy.html", "./app-cert-forge.html", "./app-cv-builder.html", "./app-diagnostic.html", "./app-remote-assistant.html", "./app-technician-os.html", "./app-html-workspace.html", "./app-pixel-code.html", "./app-pixel-diagnose.html", "./app-html-learning.html", "./app-pixel-rescue.html", "./app-pixel-wifi.html", "./app-pixel-office.html", "./app-globe-cameras.html",
  "./icon-192.png",
  "./icon-512.png",
  "./hamba-rides.html", "./hamba-rides.css", "./hamba-rides.js", "./hamba-rides-pwa.js", "./hamba-rides-icon.svg",
  "./homebase.html", "./homebase.css", "./homebase-icon.svg", "./homebase-00_core.js", "./homebase-10_audio.js", "./homebase-20_input.js", "./homebase-30_gfx.js", "./homebase-40_world.js", "./homebase-50_entities.js", "./homebase-60_ui.js", "./homebase-65_combat.js", "./homebase-70_ops.js", "./homebase-85_screens.js", "./homebase-88_aura.js", "./homebase-90_main.js",
  "./orchard-shift.html", "./orchard-shift.css", "./orchard-shift.js", "./orchard-shift-icon.svg",
];


self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// App-shell strategy: serve the local shell from cache so PixelProTech OS
// boots offline. This never intercepts or fakes third-party/network requests —
// only the exact local files this app shipped with are cached.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // don't touch fonts/CDN/external calls
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() =>
        caches.match("./index.html")
      );
    })
  );
});
