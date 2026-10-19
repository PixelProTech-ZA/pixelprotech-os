/* PixelProTech OS service worker v0.8
   - Precaches only the small shell (~300 KB) so first install is fast on mobile data.
   - Apps and their files are saved the first time they are opened (stale-while-revalidate).
   - The apps cache survives version bumps, so a new OS version does NOT re-download every app.
   - Settings > "Download all apps" sends PRECACHE with every file listed in os-files.json. */
const VERSION = "0-8-0";
const SHELL_CACHE = "pixelprotech-os-shell-v" + VERSION;
const APPS_CACHE = "pixelprotech-os-apps";
const SHELL_FILES = [
  "./", "./index.html", "./manifest.json", "./os-files.json",
  "./pixel-fx.css", "./pixel-fx.js", "./pixel-apps.js", "./pixel-repos.js",
  "./icon-192.png", "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => Promise.all(SHELL_FILES.map((u) => cache.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith("pixelprotech-os-") && k !== SHELL_CACHE && k !== APPS_CACHE)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isShell = SHELL_FILES.some((f) => new URL(f, self.location).pathname === url.pathname);
  event.respondWith(staleWhileRevalidate(req, isShell ? SHELL_CACHE : APPS_CACHE));
});

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req, { ignoreSearch: true });
  const network = fetch(req).then((res) => {
    if (res && res.ok && res.type === "basic") cache.put(req, res.clone()).catch(() => {});
    return res;
  });
  if (cached) { network.catch(() => {}); return cached; }
  try { return await network; }
  catch (e) {
    if (req.mode === "navigate") {
      const shell = await caches.match("./index.html");
      if (shell) return shell;
    }
    return new Response("Offline and not saved yet. Open this app once while online.", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

self.addEventListener("message", (event) => {
  const d = event.data;
  if (!d || d.type !== "PRECACHE" || !Array.isArray(d.urls)) return;
  const port = event.ports && event.ports[0];
  event.waitUntil((async () => {
    const cache = await caches.open(APPS_CACHE);
    const total = d.urls.length; let done = 0, failed = 0;
    const queue = d.urls.slice();
    async function worker() {
      while (queue.length) {
        const u = queue.shift();
        try {
          const res = await fetch(u, { cache: "reload" });
          if (!res.ok) throw new Error(res.status);
          await cache.put(u, res);
          done++;
        } catch (e) { failed++; }
        port && port.postMessage({ type: "progress", done: done, failed: failed, total: total });
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    port && port.postMessage({ type: "done", done: done, failed: failed, total: total });
  })());
});
