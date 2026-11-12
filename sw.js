/* Permite usar el sitio sin internet después de abrirlo una vez.
   Con internet siempre muestra la versión más reciente; sin internet usa la copia guardada.
   Si agregas archivos nuevos, súbele el número a VERSION. */
const VERSION = "reddfut-v19";
const CACHE_MUSICA = "reddfut-musica";   // aparte: no se borra al cambiar VERSION (la canción pesa)
const ARCHIVOS = [
  "./", "index.html", "estilos.css", "app.js", "datos.js", "manifest.webmanifest",
  "logo.png", "logo-escuelitas.png", "escudo-topiltzin.png", "favicon.png", "icono-192.png", "icono-512.png", "apple-touch-icon.png",
  "letra-600.woff2", "letra-800.woff2", "firebase-config.js", "quiniela.js", "avisos.js",
  "femenino.html", "femenino-app.js", "femenino-datos.js", "femenino-estilos.css"
];

self.addEventListener("install", (e) => {
  // cache:"reload" = bajar siempre la versión nueva, nunca la copia vieja del navegador
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION && k !== CACHE_MUSICA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (/\.(mp3|mp4|m4a|aac|ogg|oga|wav|webm)$/i.test(new URL(req.url).pathname)) {
    e.respondWith(responderMusica(req, e));
    return;
  }
  // Con internet: preguntar siempre a GitHub si hay algo nuevo (no-cache).
  // Sin internet: usar la copia guardada.
  e.respondWith(
    fetch(req, { cache: "no-cache" })
      .then((resp) => {
        if (resp && resp.ok && !/sin_internet\.html$/i.test(new URL(req.url).pathname)) {   // el archivo grande para descargar no se guarda
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

/* ---------- Música de fondo ----------
   La canción se baja completa UNA vez y se guarda; después suena aunque no haya
   internet. Los reproductores piden la canción "por pedazos" (Range), así que
   aquí se entregan esos pedazos desde la copia guardada (iPhone lo exige). */
const bajandoMusica = new Map();
function bajarMusica(clave) {
  if (!bajandoMusica.has(clave)) {
    const p = fetch(clave, { cache: "no-cache" })
      .then(async (r) => {
        if (!r.ok || r.status !== 200) return null;
        const c = await caches.open(CACHE_MUSICA);
        await c.put(clave, r);
        return true;
      })
      .finally(() => bajandoMusica.delete(clave));
    bajandoMusica.set(clave, p);
  }
  return bajandoMusica.get(clave);
}

// Si en GitHub cambió el archivo (mismo nombre), se borra la copia vieja para la próxima vez.
function revisarMusica(clave, guardada) {
  return fetch(clave, { method: "HEAD", cache: "no-cache" }).then((r) => {
    if (!r.ok) return;
    const a = guardada.headers, b = r.headers;
    const cambio = (a.get("ETag") && b.get("ETag") && a.get("ETag") !== b.get("ETag")) ||
      (a.get("Content-Length") && b.get("Content-Length") && a.get("Content-Length") !== b.get("Content-Length"));
    if (cambio) return caches.open(CACHE_MUSICA).then((c) => c.delete(clave));
  }).catch(() => {});
}

async function responderMusica(req, evento) {
  const u = new URL(req.url); u.search = ""; u.hash = "";
  const clave = u.href;
  const cache = await caches.open(CACHE_MUSICA);
  let guardada = await cache.match(clave);
  if (guardada) evento.waitUntil(revisarMusica(clave, guardada.clone()));
  else {
    try {
      const r = await bajarMusica(clave);
      if (!r) return fetch(req);
      guardada = await cache.match(clave);
      if (!guardada) return fetch(req);
    } catch (err) {
      return Response.error();
    }
  }
  const blob = await guardada.blob();
  const total = blob.size;
  const tipo = guardada.headers.get("Content-Type") || "audio/mp4";
  const rango = req.headers.get("Range");
  const m = rango && /bytes=(\d*)-(\d*)/.exec(rango);
  if (!m) {
    return new Response(blob, { status: 200, headers: { "Content-Type": tipo, "Content-Length": String(total), "Accept-Ranges": "bytes" } });
  }
  let ini, fin;
  if (m[1] === "" && m[2] !== "") { ini = Math.max(0, total - Number(m[2])); fin = total - 1; }   // "bytes=-500"
  else { ini = Number(m[1] || 0); fin = m[2] !== "" ? Math.min(Number(m[2]), total - 1) : total - 1; }
  if (ini >= total || ini > fin) {
    return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + total } });
  }
  return new Response(blob.slice(ini, fin + 1), {
    status: 206,
    headers: {
      "Content-Type": tipo, "Content-Length": String(fin - ini + 1),
      "Content-Range": "bytes " + ini + "-" + fin + "/" + total, "Accept-Ranges": "bytes"
    }
  });
}

/* ---------- Avisos (notificaciones) ----------
   Llegan desde Firebase Cloud Messaging cuando GitHub publica resultados nuevos. */
function mostrarAviso(datos) {
  const x = Object.assign({}, (datos && datos.notification) || {}, (datos && datos.data) || {});
  const titulo = x.titulo || x.title || "Torneo REDDFUT";
  return self.registration.showNotification(titulo, {
    body: x.cuerpo || x.body || "Hay novedades en el torneo.",
    icon: "icono-192.png",
    tag: x.tag || "reddfut",
    renotify: true,
    data: { url: x.url || "./" }
  });
}

self.addEventListener("push", (e) => {
  let datos = {};
  try { datos = e.data ? e.data.json() : {}; }
  catch (err) { datos = { data: { cuerpo: e.data ? e.data.text() : "" } }; }
  e.waitUntil(mostrarAviso(datos));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((v) => v.url.startsWith(self.registration.scope));
      if (abierta) return abierta.navigate(url).then((v) => (v || abierta).focus()).catch(() => abierta.focus());
      return self.clients.openWindow(url);
    })
  );
});
