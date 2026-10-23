/* =====================================================================
   ENVÍA EL AVISO "TABLAS ACTUALIZADAS"
   Lo ejecuta GitHub automáticamente (archivo .github/workflows/avisos.yml)
   cada vez que se sube un datos.js nuevo. No hay que abrirlo ni editarlo.

   - Si datos.js trae resultados NUEVOS → "Jornada N: tablas actualizadas"
   - Si solo se corrigió algo           → no manda nada

   Necesita el secreto FIREBASE_CUENTA (la clave de la cuenta de servicio
   de Firebase). Ver GUIA_AVISOS.md.
   ===================================================================== */

import { readFileSync, appendFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { createSign } from "node:crypto";
import vm from "node:vm";

const env = process.env;
const URL_TOKEN = env.URL_TOKEN || "https://oauth2.googleapis.com/token";
const URL_FIRESTORE = env.URL_FIRESTORE || "https://firestore.googleapis.com/v1";
const URL_FCM = env.URL_FCM || "https://fcm.googleapis.com/v1";
const SIN_ENVIAR = env.SIN_ENVIAR === "1";        // para pruebas: solo dice qué mandaría

function resumen(txt) {
  console.log(txt);
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, txt + "\n");
}

/* ---------- Leer datos.js (actual y el de la subida anterior) ---------- */
function leerTorneo(codigo) {
  if (!codigo) return null;
  const ctx = { window: {} };
  try { vm.runInNewContext(codigo, ctx, { timeout: 2000 }); } catch (e) { return null; }
  return ctx.window.TORNEO || null;
}
function datosAnteriores() {
  if (env.DATOS_ANTERIOR) return readFileSync(env.DATOS_ANTERIOR, "utf8");
  try { return execSync("git show HEAD~1:datos.js", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); }
  catch (e) { return ""; }
}
const esMarcador = (r) => /^\s*\d+\s*[-–]\s*\d+/.test(String(r || ""));
function jugadosPorJornada(T) {
  const m = new Map();
  for (const j of (T && T.jornadas) || []) {
    let n = 0;
    for (const p of j.partidos || []) for (const r of Object.values(p.resultados || {})) if (esMarcador(r)) n++;
    m.set(j.numero, n);
  }
  return m;
}
function urlSitio(T, ruta) {
  const base = (T && T.urlSitio) || "./";
  return base.replace(/#.*$/, "") + ruta;
}

/* ---------- Decidir si hay que avisar ---------- */
function avisoTablas(T, num) {
  return {
    titulo: `📊 Jornada ${num}: tablas actualizadas`,
    cuerpo: `Ya están los resultados de la jornada ${num} y las nuevas posiciones de todas las categorías. ¡Mira cómo va tu escuela!`,
    url: urlSitio(T, "#/posiciones"),
    tag: `jornada-${num}`
  };
}
function decidir() {
  const T = leerTorneo(readFileSync(env.DATOS || "datos.js", "utf8"));
  if (!T) throw new Error("No se pudo leer datos.js (¿tiene algún error de escritura?)");
  const jN = jugadosPorJornada(T);

  // Prueba manual (Actions → Run workflow): repite el aviso de la última jornada con resultados.
  if (env.EVENTO === "workflow_dispatch") {
    const conRes = [...jN].filter(([, n]) => n > 0).map(([num]) => num);
    if (!conRes.length) { resumen("Todavía no hay resultados: no se envía aviso."); return null; }
    return avisoTablas(T, Math.max(...conRes));
  }

  const antes = leerTorneo(datosAnteriores());
  if (!antes) { resumen("No hay versión anterior de datos.js para comparar: no se envía aviso."); return null; }
  const jA = jugadosPorJornada(antes);
  const conNuevos = [...jN].filter(([num, n]) => n > (jA.get(num) || 0)).map(([num]) => num);
  if (conNuevos.length) return avisoTablas(T, Math.max(...conNuevos));

  resumen("datos.js cambió, pero no hay resultados nuevos: no se envía aviso.");
  return null;
}

/* ---------- Google: permiso con la cuenta de servicio ---------- */
const b64url = (x) => Buffer.from(x).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
async function tokenDeAcceso(cuenta) {
  const ahora = Math.floor(Date.now() / 1000);
  const cab = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const cuerpo = b64url(JSON.stringify({
    iss: cuenta.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: cuenta.token_uri || "https://oauth2.googleapis.com/token",
    iat: ahora, exp: ahora + 3600
  }));
  const firma = createSign("RSA-SHA256").update(`${cab}.${cuerpo}`).sign(cuenta.private_key);
  const jwt = `${cab}.${cuerpo}.${b64url(firma)}`;
  const r = await fetch(URL_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error("Google rechazó la clave FIREBASE_CUENTA: " + JSON.stringify(j));
  return j.access_token;
}

/* ---------- Dispositivos suscritos (colección "avisos" en Firestore) ---------- */
async function dispositivos(proyecto, acceso) {
  const lista = [];
  let pagina = "";
  do {
    const u = `${URL_FIRESTORE}/projects/${proyecto}/databases/(default)/documents/avisos?pageSize=300&mask.fieldPaths=creado${pagina ? "&pageToken=" + encodeURIComponent(pagina) : ""}`;
    const r = await fetch(u, { headers: { Authorization: `Bearer ${acceso}` } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error("No se pudo leer la lista de dispositivos: " + JSON.stringify(j));
    for (const d of j.documents || []) lista.push(d.name.split("/").pop());
    pagina = j.nextPageToken || "";
  } while (pagina);
  return lista;
}
async function borrarDispositivo(proyecto, acceso, token) {
  await fetch(`${URL_FIRESTORE}/projects/${proyecto}/databases/(default)/documents/avisos/${encodeURIComponent(token)}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${acceso}` } }).catch(() => {});
}

/* ---------- Enviar ---------- */
async function enviarUno(proyecto, acceso, token, aviso) {
  const r = await fetch(`${URL_FCM}/projects/${proyecto}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${acceso}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        data: { titulo: aviso.titulo, cuerpo: aviso.cuerpo, url: aviso.url, tag: aviso.tag },
        webpush: { headers: { Urgency: "high", TTL: "172800" } }
      }
    })
  });
  if (r.ok) return "ok";
  const j = await r.json().catch(() => ({}));
  const err = j.error || {};
  const codigo = ((err.details || []).find((d) => d.errorCode) || {}).errorCode || err.status || String(r.status);
  // Dispositivo que ya no existe (desinstaló, borró datos, quitó el permiso): se borra de la lista.
  if (r.status === 404 || ["UNREGISTERED", "SENDER_ID_MISMATCH"].includes(codigo)
      || (r.status === 400 && /token/i.test(err.message || ""))) return "viejo";
  return "error:" + codigo;
}

async function main() {
  const aviso = decidir();
  if (!aviso) return;
  resumen(`Aviso: «${aviso.titulo}» — ${aviso.cuerpo}`);
  if (SIN_ENVIAR) { resumen("(prueba: no se envió)"); return; }

  if (!env.FIREBASE_CUENTA) {
    console.log("::warning::Falta el secreto FIREBASE_CUENTA en GitHub (Settings → Secrets and variables → Actions). Ver GUIA_AVISOS.md");
    resumen("No se envió: falta el secreto FIREBASE_CUENTA.");
    return;
  }
  let cuenta;
  try { cuenta = JSON.parse(env.FIREBASE_CUENTA); }
  catch (e) { throw new Error("El secreto FIREBASE_CUENTA no es el archivo .json completo. Vuelve a pegarlo entero, desde { hasta }."); }
  const proyecto = cuenta.project_id;
  const acceso = await tokenDeAcceso(cuenta);
  const tokens = await dispositivos(proyecto, acceso);
  if (!tokens.length) { resumen("Todavía nadie ha activado los avisos."); return; }

  const cuenta_ = { ok: 0, viejo: 0, error: 0 };
  const errores = new Set();
  let i = 0;
  async function trabajador() {
    while (i < tokens.length) {
      const t = tokens[i++];
      const res = await enviarUno(proyecto, acceso, t, aviso).catch((e) => "error:" + e.message);
      if (res === "ok") cuenta_.ok++;
      else if (res === "viejo") { cuenta_.viejo++; await borrarDispositivo(proyecto, acceso, t); }
      else { cuenta_.error++; errores.add(res); }
    }
  }
  await Promise.all(Array.from({ length: Math.min(20, tokens.length) }, trabajador));
  resumen(`Enviado a ${cuenta_.ok} de ${tokens.length} dispositivos.` +
    (cuenta_.viejo ? ` Se quitaron ${cuenta_.viejo} que ya no existen.` : "") +
    (cuenta_.error ? ` Fallaron ${cuenta_.error} (${[...errores].join(", ")}).` : ""));
  if (cuenta_.error && !cuenta_.ok) process.exitCode = 1;
}

main().catch((e) => { console.error("::error::" + e.message); process.exitCode = 1; });
