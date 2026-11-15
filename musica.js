/* ------------------------------------------------------------------ */
/* Música de fondo: botón redondo abajo a la izquierda.                */
/* Sirve para los DOS torneos (Escuelitas y Femenino).                 */
/* Empieza APAGADA; la persona la enciende. Se pausa sola al salir de  */
/* la app y recuerda si la dejaste encendida. Al cambiar de torneo     */
/* sigue sonando desde donde iba.                                      */
/* Canciones: datos.js → musica: ["cancion1.mp3", ...]                 */
/*            femenino-datos.js → musica: ["cancion1.mp3", ...]        */
/* ------------------------------------------------------------------ */
(function musicaDeFondo() {
  "use strict";
  const T = window.TORNEO || window.LFFU || {};
  const lista = (T.musica || []).filter(Boolean);
  if (!lista.length || window.MODO_OFFLINE || location.protocol === "file:") return;   // el archivo sin internet no lleva música
  if (document.querySelector(".boton-musica")) return;

  const CLAVE = "reddfut-musica";              // encendida / apagada (igual para los dos torneos)
  const CLAVE_POS = "reddfut-musica-pos";      // por dónde iba la canción, para seguir al cambiar de torneo
  const leer = () => { try { return localStorage.getItem(CLAVE) === "1"; } catch (e) { return false; } };
  const guardar = (v) => { try { localStorage.setItem(CLAVE, v ? "1" : "0"); } catch (e) {} };

  let pista = 0, quiere = leer(), pausadaPorSalir = false, fallos = 0, sonando = false;
  const audio = new Audio();
  audio.preload = "none";
  audio.volume = 0.35;
  audio.loop = lista.length === 1;
  const ponerPista = (i) => { pista = (i + lista.length) % lista.length; audio.src = lista[pista]; };

  /* Retomar donde iba (si venimos del otro torneo hace poco) */
  let retomar = null;
  try {
    const g = JSON.parse(sessionStorage.getItem(CLAVE_POS) || "null");
    if (g && Date.now() - g.at < 10 * 60 * 1000 && g.pista < lista.length) {
      retomar = { pista: g.pista, t: g.t + (g.sonando ? (Date.now() - g.at) / 1000 : 0) };
    }
  } catch (e) {}
  ponerPista(retomar ? retomar.pista : 0);
  if (retomar && retomar.t > 0) {
    audio.addEventListener("loadedmetadata", function alCargar() {
      audio.removeEventListener("loadedmetadata", alCargar);
      const d = audio.duration;
      let t = retomar.t;
      if (isFinite(d) && d > 0) t = audio.loop ? t % d : Math.min(t, Math.max(0, d - 1));
      try { audio.currentTime = t; } catch (e) {}
    });
  }
  function guardarPosicion() {
    try {
      sessionStorage.setItem(CLAVE_POS, JSON.stringify({ pista, t: audio.currentTime || 0, sonando: sonando && quiere, at: Date.now() }));
    } catch (e) {}
  }

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton-musica";
  boton.hidden = true;
  boton.innerHTML =
    '<svg class="bm-nota" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M9 18.5a3 3 0 1 1-2-2.83V5.6l12-2.4v12.3a3 3 0 1 1-2-2.83V7.04l-8 1.6z"/><path class="bm-raya" d="M3 3l18 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' +
    '<span class="bm-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
  document.body.appendChild(boton);

  function pintar(est) {            // est: "apagada" | "cargando" | "sonando"
    boton.dataset.estado = est;
    boton.setAttribute("aria-pressed", est === "apagada" ? "false" : "true");
    const t = est === "apagada" ? "Encender música de fondo" : est === "cargando" ? "Cargando música…" : "Apagar música de fondo";
    boton.setAttribute("aria-label", t);
    boton.title = t;
  }
  pintar("apagada");

  function tocar() {
    pintar("cargando");
    const p = audio.play();
    if (p && p.catch) p.catch(() => { if (audio.paused) pintar("apagada"); });
  }
  function parar() { audio.pause(); pintar("apagada"); }

  audio.addEventListener("playing", () => { fallos = 0; sonando = true; pintar("sonando"); });
  audio.addEventListener("waiting", () => { if (!audio.paused) pintar("cargando"); });
  audio.addEventListener("pause", () => { if (!pausadaPorSalir) { sonando = false; pintar("apagada"); } });
  audio.addEventListener("ended", () => { if (!audio.loop) { ponerPista(pista + 1); tocar(); } });
  audio.addEventListener("error", () => {
    fallos++;
    if (fallos < lista.length) { ponerPista(pista + 1); if (quiere) tocar(); }
    else { pintar("apagada"); boton.hidden = true; }       // ninguna canción se pudo abrir: se esconde el botón
  });

  boton.addEventListener("click", () => {
    if (audio.paused) { quiere = true; guardar(true); tocar(); }
    else { quiere = false; guardar(false); parar(); }
  });

  // Al salir de la app (otra app, pantalla apagada) se pausa; al volver sigue.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      guardarPosicion();
      if (!audio.paused) { pausadaPorSalir = true; audio.pause(); }
    } else if (pausadaPorSalir) {
      pausadaPorSalir = false;
      if (quiere) tocar();
    }
  });
  // Al cambiar de torneo (o recargar) se guarda por dónde iba.
  window.addEventListener("pagehide", guardarPosicion);
  document.addEventListener("click", (ev) => {           // tocar el selector de torneos: guardar justo antes de salir
    if (ev.target.closest && ev.target.closest("#torneos a")) guardarPosicion();
  }, true);

  // Nombre en la pantalla de bloqueo / controles del teléfono
  if ("mediaSession" in navigator && window.MediaMetadata) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Música del torneo", artist: T.organizador || T.nombre || "REDDFUT Usulután",
        artwork: [{ src: "icono-512.png", sizes: "512x512", type: "image/png" }]
      });
    } catch (e) {}
  }

  // Solo se muestra el botón si la canción existe (o ya está guardada para usar sin internet).
  const url = new URL(lista[0], location.href).href;
  fetch(url, { method: "HEAD", cache: "no-cache" })
    .then((r) => r.ok)
    .catch(() => ("caches" in window ? caches.open("reddfut-musica").then((c) => c.match(url)).then(Boolean) : false))
    .then((existe) => {
      if (!existe) return;
      boton.hidden = false;
      document.body.classList.add("con-boton-musica");
      if (quiere) {
        // Si la dejó encendida: intentar seguir; si el navegador no deja sonar solo, arranca al primer toque.
        const p = audio.play();
        pintar("cargando");
        if (p && p.catch) p.catch(() => {
          pintar("apagada");
          const alTocar = (ev) => {
            document.removeEventListener("pointerdown", alTocar, true);
            document.removeEventListener("keydown", alTocar, true);
            if (boton.contains(ev.target)) return;           // tocó el botón: lo maneja el clic
            if (quiere && audio.paused) tocar();
          };
          document.addEventListener("pointerdown", alTocar, true);
          document.addEventListener("keydown", alTocar, true);
        });
      }
    });
})();
