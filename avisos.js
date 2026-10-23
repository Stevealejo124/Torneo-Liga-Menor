/* =====================================================================
   AVISOS (notificaciones) — "Te avisamos cuando se actualicen las tablas"
   Se carga SOLO cuando alguien toca "Activar avisos" (o para renovar el
   permiso de quien ya los activó). Usa Firebase Cloud Messaging.
   Los avisos los manda GitHub automáticamente (ver enviar-avisos.mjs).
   No hace falta editar este archivo.
   ===================================================================== */

const CDN = "https://www.gstatic.com/firebasejs/10.14.1";
const CLAVE = "reddfut-avisos";          // localStorage: token de este dispositivo
const CLAVE_FECHA = "reddfut-avisos-renovado";

let fb = null;

async function cargar() {
  if (fb) return fb;
  const CFG = window.QUINIELA || {};
  const [mApp, mMsg, mFs] = await Promise.all([
    import(`${CDN}/firebase-app.js`),
    import(`${CDN}/firebase-messaging.js`),
    import(`${CDN}/firebase-firestore.js`)
  ]);
  if (!(await mMsg.isSupported())) throw new Error("no-soportado");
  const app = mApp.getApps().length ? mApp.getApp() : mApp.initializeApp(CFG.firebase);
  const db = mFs.getFirestore(app);
  if (CFG.usarEmulador && !db._emuladorListo) {
    try { mFs.connectFirestoreEmulator(db, "127.0.0.1", 8085); } catch (e) { /* ya conectado */ }
    db._emuladorListo = true;
  }
  fb = { ...mMsg, ...mFs, messaging: mMsg.getMessaging(app), db };
  return fb;
}

function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function guardar(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* nada */ } }

/** ¿Este dispositivo ya tiene los avisos activados? */
export function activos() {
  return !!leer(CLAVE) && typeof Notification !== "undefined" && Notification.permission === "granted";
}

async function registrarToken() {
  const f = await cargar();
  const reg = await navigator.serviceWorker.ready;
  const token = await f.getToken(f.messaging, { serviceWorkerRegistration: reg });
  if (!token) throw new Error("sin-token");
  const anterior = leer(CLAVE);
  await f.setDoc(f.doc(f.db, "avisos", token), { creado: f.serverTimestamp() });
  if (anterior && anterior !== token) {
    f.deleteDoc(f.doc(f.db, "avisos", anterior)).catch(() => {});
  }
  guardar(CLAVE, token);
  guardar(CLAVE_FECHA, String(Date.now()));
  return token;
}

/** Pide permiso (solo cuando la persona toca el botón) y guarda el dispositivo. */
export async function activar() {
  if (!("serviceWorker" in navigator) || typeof Notification === "undefined" || !("PushManager" in window)) {
    throw new Error("no-soportado");
  }
  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") throw new Error(permiso === "denied" ? "bloqueado" : "sin-permiso");
  return registrarToken();
}

/** Quita los avisos de este dispositivo. */
export async function desactivar() {
  const token = leer(CLAVE);
  guardar(CLAVE, null);
  guardar(CLAVE_FECHA, null);
  try {
    const f = await cargar();
    if (token) await f.deleteDoc(f.doc(f.db, "avisos", token)).catch(() => {});
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe().catch(() => {});
  } catch (e) { /* sin internet: igual queda apagado en este dispositivo */ }
}

/** Cada 7 días, en silencio, confirma que el dispositivo sigue registrado. */
export async function renovarSiHaceFalta() {
  if (!activos()) return;
  const ultima = +leer(CLAVE_FECHA) || 0;
  if (Date.now() - ultima < 7 * 864e5) return;
  try { await registrarToken(); } catch (e) { /* se intentará la próxima visita */ }
}

/** Texto amable para cada error. */
export function mensajeError(e) {
  const m = String(e && e.message || e);
  if (m.includes("bloqueado") || m.includes("permission-blocked")) {
    return "Los avisos están bloqueados en este navegador. Para activarlos, toca el candado junto a la dirección del sitio → Notificaciones → Permitir.";
  }
  if (m.includes("sin-permiso") || m.includes("permission-default")) return "No se activaron los avisos. Puedes intentarlo cuando quieras.";
  if (m.includes("no-soportado") || m.includes("unsupported")) return "Este navegador no permite avisos. Prueba con Chrome.";
  return "No se pudieron activar los avisos. Revisa tu conexión a internet e inténtalo otra vez.";
}
