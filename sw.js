/* Permite usar el sitio sin internet después de abrirlo una vez.
   Con internet siempre muestra la versión más reciente; sin internet usa la copia guardada.
   Si agregas archivos nuevos, súbele el número a VERSION. */
const VERSION = "reddfut-v5";
const ARCHIVOS = [
  "./", "index.html", "estilos.css", "app.js", "datos.js", "manifest.webmanifest",
  "logo.png", "favicon.png", "icono-192.png", "icono-512.png", "apple-touch-icon.png",
  "letra-600.woff2", "letra-800.woff2", "firebase-config.js", "quiniela.js"
];

self.addEventListener("install", (e) => {
  // cache:"reload" = bajar siempre la versión nueva, nunca la copia vieja del navegador
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // Con internet: preguntar siempre a GitHub si hay algo nuevo (no-cache).
  // Sin internet: usar la copia guardada.
  e.respondWith(
    fetch(req, { cache: "no-cache" })
      .then((resp) => {
        if (resp && resp.ok) {
          const copia = resp.clone();
          caches.open(VERSION).then((c) => c.put(req, copia));
        }
        return resp;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then((r) => r || (req.mode === "navigate" ? caches.match("index.html") : undefined))
      )
  );
});
