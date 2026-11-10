/* =====================================================================
   QUINIELA REDDFUT  —  pronósticos por diversión (sin apuestas)
   Se carga solo al abrir la pestaña "Quiniela". Usa Firebase:
   - Inicio de sesión con Google (Firebase Authentication)
   - Pronósticos guardados en Cloud Firestore
   La configuración está en firebase-config.js. No hace falta editar este archivo.
   ===================================================================== */

const VERSION_FB = "10.14.1";
const CDN = `https://www.gstatic.com/firebasejs/${VERSION_FB}`;
const ZONA = "-06:00";            // hora de El Salvador (no cambia en el año)
const OPC = { L: "Local", E: "Empate", V: "Visitante" };
const MAX_POR_CAT = 2;            // partidos que cada quien puede pronosticar por categoría
const DIA_MS = 864e5;

let fb = null;                    // módulos de Firebase + auth + db
let api = null;                   // utilidades que pasa app.js
let CFG = null;                   // window.QUINIELA
let cont = null;                  // contenedor actual en pantalla
let listo = null;                 // promesa de arranque (una sola vez)

const st = {
  user: null,
  cfg: {},                        // config/jornadas en Firestore
  todos: [],                      // todos los jugadores
  yo: null,                       // mi documento
  borrador: {},                   // pronósticos que estoy editando { j3: {clave: "L"} }
  vista: "general",               // ranking: "general" o "j3"
  catQ: "",                       // categoría que se está viendo en la jornada abierta
  avisoPick: "",                  // "ya elegiste 2 en Sub-9…"
  error: "",
  aviso: "",
  guardado: "",
  editandoApodo: false,
  sincro: ""
};

/* ------------------------------------------------------------------ */
export async function montar(contenedor, utilidades) {
  cont = contenedor;
  api = utilidades;
  CFG = window.QUINIELA || {};
  try {
    if (!listo) listo = arrancar();
    await listo;
  } catch (e) {
    listo = null;
    cont.innerHTML = cajaMensaje("No se pudo cargar la quiniela",
      "Revisa tu conexión a internet y vuelve a abrir esta pestaña.", String(e && e.message || e));
    return;
  }
  pintar();
}

/* El organizador publica las horas de apertura/cierre aunque no abra la
   pestaña Quiniela: app.js llama esto en segundo plano si ya entró antes. */
export async function sincronizarEnSegundoPlano(utilidades) {
  if (!api) api = utilidades;
  if (!CFG) CFG = window.QUINIELA || {};
  if (!listo) listo = arrancar();
  await listo;
  return st.sincro;
}

async function arrancar() {
  const [mApp, mAuth, mFs] = await Promise.all([
    import(`${CDN}/firebase-app.js`),
    import(`${CDN}/firebase-auth.js`),
    import(`${CDN}/firebase-firestore.js`)
  ]);
  fb = { ...mApp, ...mAuth, ...mFs };
  const app = fb.getApps().length ? fb.getApp() : fb.initializeApp(CFG.firebase);
  fb.auth = fb.getAuth(app);
  fb.auth.languageCode = "es";
  fb.db = fb.getFirestore(app);
  if (CFG.usarEmulador) {
    fb.connectAuthEmulator(fb.auth, "http://127.0.0.1:9099", { disableWarnings: true });
    try { fb.connectFirestoreEmulator(fb.db, "127.0.0.1", 8085); } catch (e) { /* ya conectado por avisos.js */ }
    window.__quiniela = { fb, st, recargar: async () => { await cargar(); pintar(); } };
  }
  fb.getRedirectResult(fb.auth).catch((e) => { st.error = traducir(e); });

  await new Promise((resolver) => {
    let primera = true;
    fb.onAuthStateChanged(fb.auth, async (u) => {
      st.user = u;
      st.editandoApodo = false;
      await cargar();
      if (primera) { primera = false; resolver(); } else pintar();
    });
  });
}

/* ------------------------------------------------------------------ */
/* Datos                                                              */
/* ------------------------------------------------------------------ */
async function cargar() {
  try {
    const [cfgSnap, jugSnap] = await Promise.all([
      fb.getDoc(fb.doc(fb.db, "config", "jornadas")),
      fb.getDocs(fb.collection(fb.db, "jugadores"))
    ]);
    st.cfg = cfgSnap.exists() ? cfgSnap.data() : {};
    st.todos = jugSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    st.yo = st.user ? st.todos.find((j) => j.uid === st.user.uid) || null : null;
    st.borrador = JSON.parse(JSON.stringify((st.yo && st.yo.picks) || {}));
    st.error = "";
    try { esAdmin() ? localStorage.setItem("reddfut-admin", "1") : (st.user && localStorage.removeItem("reddfut-admin")); } catch (e) { /* nada */ }
    if (esAdmin()) await sincronizar();
  } catch (e) {
    st.error = traducir(e);
  }
}

function esAdmin() {
  const correo = st.user && st.user.email && st.user.email.toLowerCase();
  return !!correo && (CFG.administradores || []).map((c) => String(c).toLowerCase()).includes(correo);
}

/* "2026-11-14 07:00" (hora de El Salvador) -> Date */
function aFecha(txt) {
  const m = String(txt || "").match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})/);
  const d = m ? new Date(`${m[1]}T${m[2].padStart(2, "0")}:${m[3]}:00${ZONA}`) : null;
  return d && !isNaN(d) ? d : null;
}
/* Hora en que empiezan los juegos (la más temprana de "horarios" en datos.js) */
function horaInicio() {
  const hs = Object.values(api.T.horarios || {}).filter((h) => /^\d{1,2}:\d{2}$/.test(h))
    .sort((a, b) => a.split(":")[0] * 60 + +a.split(":")[1] - (b.split(":")[0] * 60 + +b.split(":")[1]));
  return hs[0] || "08:00";
}
function diasAntes() { const n = Number(CFG.diasAntes); return Number.isFinite(n) && n >= 0 ? n : 2; }

/* Jornadas con fecha en datos.js. Cada una se ABRE sola "diasAntes" días antes
   de que empiecen los juegos (jueves 8:00 a. m. si se juega el sábado a las 8)
   y se CIERRA el día de la jornada a la hora de cierre (7:00 a. m.). */
function jornadasQuiniela() {
  return api.JORNADAS
    .filter((j) => (j.partidos || []).length && (j.cierre || j.fecha))
    .map((j) => {
      const cierre = aFecha(j.cierre ? String(j.cierre) : `${j.fecha} ${CFG.horaCierre || "07:00"}`);
      const inicio = j.fecha ? aFecha(`${j.fecha} ${horaInicio()}`) : cierre;
      const apertura = j.apertura ? aFecha(j.apertura) : inicio && new Date(inicio.getTime() - diasAntes() * DIA_MS);
      return { j, clave: "j" + j.numero, cierre, apertura };
    })
    .filter((x) => x.cierre && x.apertura);
}

/* El organizador publica las horas de cierre (las reglas de Firebase las usan
   para que nadie pueda pronosticar después de que empiecen los partidos). */
async function sincronizar() {
  const deseado = {};
  jornadasQuiniela().forEach((x) => {
    deseado[x.clave] = { apertura: fb.Timestamp.fromDate(x.apertura), cierre: fb.Timestamp.fromDate(x.cierre) };
  });
  const ks = Object.keys(deseado);
  const mismo = (a, b) => a && b && a.toMillis && a.toMillis() === b.toMillis();
  const igual = ks.length === Object.keys(st.cfg).length &&
    ks.every((k) => st.cfg[k] && mismo(st.cfg[k].cierre, deseado[k].cierre) && mismo(st.cfg[k].apertura, deseado[k].apertura));
  if (igual) { st.sincro = "al día"; return; }
  await fb.setDoc(fb.doc(fb.db, "config", "jornadas"), deseado);
  st.cfg = deseado;
  st.sincro = "actualizado";
}

function cierreDe(clave) {
  const c = st.cfg[clave] && st.cfg[clave].cierre;
  return c && c.toMillis ? c.toMillis() : null;
}
function aperturaDe(clave) {
  const a = st.cfg[clave] && st.cfg[clave].apertura;
  return a && a.toMillis ? a.toMillis() : null;
}
function estaAbierta(clave) {
  const c = cierreDe(clave), a = aperturaDe(clave);
  return c != null && Date.now() < c && Date.now() >= (a || 0);
}

const slug = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const numCat = (cat) => String(cat).replace(/\D/g, "") || String(cat);
const claveM = (p) => `${slug(p.local)}__${slug(p.visitante)}`;
const claveP = (p, cat) => `${claveM(p)}~${numCat(cat)}`;          // formato viejo (plano)
/* Pronósticos de una jornada: { "9": { "berlin__la-noria": "L", ... }, "13": {...} } */
function pickDe(mis, p, cat) {
  if (!mis) return null;
  const g = mis[numCat(cat)];
  if (g && typeof g === "object" && g[claveM(p)]) return g[claveM(p)];
  const viejo = mis[claveP(p, cat)];
  return typeof viejo === "string" ? viejo : null;
}
const cuantosEn = (mis, cat) => { const g = mis && mis[numCat(cat)]; return g && typeof g === "object" ? Object.keys(g).length : 0; };
function catsDe(p) {
  return api.CATS.filter((c) => ![p.local, p.visitante].some((n) => {
    const e = api.ESCUELAS.get(n);
    return e && (e.sinCategorias || []).includes(c);
  }));
}
function resultadoReal(p, cat) {
  const r = api.parseRes(p.resultados && p.resultados[cat]);
  if (!r || r.gl == null) return null;
  return r.gl > r.gv ? "L" : r.gl < r.gv ? "V" : "E";
}

function puntuar(jug, soloClave) {
  let ac = 0, tot = 0;
  const porJ = {};
  for (const x of jornadasQuiniela()) {
    if (soloClave && x.clave !== soloClave) continue;
    const mis = (jug.picks || {})[x.clave];
    if (!mis) continue;
    let a = 0, t = 0;
    for (const p of x.j.partidos || []) for (const c of catsDe(p)) {
      const pick = pickDe(mis, p, c);
      const real = pick && resultadoReal(p, c);
      if (!real) continue;
      t++;
      if (pick === real) a++;
    }
    porJ[x.clave] = { a, t };
    ac += a; tot += t;
  }
  return { pts: ac, ac, tot, porJ };
}

function ranking(clave) {
  return st.todos
    .map((j) => ({ j, ...puntuar(j, clave === "general" ? null : clave) }))
    .filter((f) => f.tot > 0 || (clave === "general" && Object.keys(f.j.picks || {}).length))
    .sort((a, b) => b.pts - a.pts || (b.tot ? b.ac / b.tot : 0) - (a.tot ? a.ac / a.tot : 0) ||
      String(a.j.apodo).localeCompare(String(b.j.apodo), "es"));
}

/* ------------------------------------------------------------------ */
/* Guardar                                                            */
/* ------------------------------------------------------------------ */
let temporizador = null;
function programarGuardado(clave) {
  st.guardado = "Guardando…";
  pintarEstadoGuardado();
  clearTimeout(temporizador);
  temporizador = setTimeout(() => guardar(clave), 700);
}

async function guardar(clave) {
  if (!st.user || !st.yo) return;
  const picks = JSON.parse(JSON.stringify(st.yo.picks || {}));
  const nuevos = JSON.parse(JSON.stringify(st.borrador[clave] || {}));
  Object.keys(nuevos).forEach((c) => { if (nuevos[c] && typeof nuevos[c] === "object" && !Object.keys(nuevos[c]).length) delete nuevos[c]; });
  if (Object.keys(nuevos).length) picks[clave] = nuevos; else delete picks[clave];
  try {
    const datos = { apodo: st.yo.apodo, picks, ultimaJornada: clave, actualizado: fb.serverTimestamp() };
    await fb.setDoc(fb.doc(fb.db, "jugadores", st.user.uid), datos);
    st.yo = { ...st.yo, picks, ultimaJornada: clave };
    const i = st.todos.findIndex((j) => j.uid === st.user.uid);
    if (i >= 0) st.todos[i] = st.yo;
    const h = new Date().toLocaleTimeString("es-SV", { hour: "numeric", minute: "2-digit" });
    st.guardado = `Guardado ✓ ${h}`;
  } catch (e) {
    st.guardado = "";
    st.error = traducir(e);
    st.borrador = JSON.parse(JSON.stringify(st.yo.picks || {}));
    pintar();
    return;
  }
  pintarEstadoGuardado();
}

async function guardarApodo(apodo) {
  apodo = apodo.replace(/\s+/g, " ").trim();
  if (apodo.length < 2 || apodo.length > 24) { st.aviso = "El apodo debe tener entre 2 y 24 letras."; pintar(); return; }
  try {
    const previo = st.yo || { picks: {}, ultimaJornada: "" };
    const datos = { apodo, picks: previo.picks || {}, ultimaJornada: previo.ultimaJornada || "", actualizado: fb.serverTimestamp() };
    await fb.setDoc(fb.doc(fb.db, "jugadores", st.user.uid), datos);
    st.yo = { uid: st.user.uid, ...datos };
    const i = st.todos.findIndex((j) => j.uid === st.user.uid);
    if (i >= 0) st.todos[i] = st.yo; else st.todos.push(st.yo);
    st.editandoApodo = false;
    st.aviso = "";
  } catch (e) {
    st.error = traducir(e);
  }
  pintar();
}

async function entrar() {
  const proveedor = new fb.GoogleAuthProvider();
  proveedor.setCustomParameters({ prompt: "select_account" });
  try {
    await fb.signInWithPopup(fb.auth, proveedor);
  } catch (e) {
    const c = e && e.code;
    if (c === "auth/popup-blocked" || c === "auth/operation-not-supported-in-this-environment") {
      await fb.signInWithRedirect(fb.auth, proveedor);
    } else if (c !== "auth/popup-closed-by-user" && c !== "auth/cancelled-popup-request") {
      st.error = traducir(e);
      pintar();
    }
  }
}

async function quitarJugador(uid) {
  const j = st.todos.find((x) => x.uid === uid);
  if (!j || !confirm(`¿Quitar a "${j.apodo}" de la quiniela? Se borrarán sus pronósticos.`)) return;
  try {
    await fb.deleteDoc(fb.doc(fb.db, "jugadores", uid));
    st.todos = st.todos.filter((x) => x.uid !== uid);
  } catch (e) { st.error = traducir(e); }
  pintar();
}

function traducir(e) {
  const c = (e && e.code) || "";
  if (c.includes("permission-denied")) return "No se pudo guardar: la jornada todavía no abre, ya cerró, o pasaste el límite de 2 partidos por categoría.";
  if (c.includes("unavailable") || c.includes("network")) return "Sin conexión. Revisa tu internet e inténtalo otra vez.";
  if (c.includes("unauthorized-domain")) return "Este sitio todavía no está autorizado en Firebase (Authentication → Configuración → Dominios autorizados).";
  if (c.includes("popup")) return "No se pudo abrir la ventana de Google. Inténtalo otra vez.";
  return "Ocurrió un problema: " + ((e && e.message) || c || "desconocido");
}

/* ------------------------------------------------------------------ */
/* Pintar                                                             */
/* ------------------------------------------------------------------ */
const esc = (s) => api.esc(s);
const nombreCorto = (n) => { const e = api.ESCUELAS.get(n); return e ? e.corto : n.slice(0, 3).toUpperCase(); };
const GOOGLE = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.2C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.9-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.2C6.6 42.6 14.6 48 24 48z"/></svg>';

function cajaMensaje(titulo, texto, detalle) {
  return `<div class="q-caja"><b>${esc(titulo)}</b><p>${esc(texto)}</p>${detalle ? `<small>${esc(detalle)}</small>` : ""}</div>`;
}

function fechaCierre(ms) {
  const d = new Date(ms);
  const dia = d.toLocaleDateString("es-SV", { weekday: "long", day: "numeric", month: "long", timeZone: "America/El_Salvador" });
  const hora = d.toLocaleTimeString("es-SV", { hour: "numeric", minute: "2-digit", timeZone: "America/El_Salvador" });
  return `${dia}, ${hora}`;
}
function falta(ms) {
  let s = Math.max(0, Math.floor((ms - Date.now()) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60);
  if (d) return `faltan ${d} d ${h} h`;
  if (h) return `faltan ${h} h ${m} min`;
  return `faltan ${m} min`;
}

function htmlSesion() {
  if (!st.user) {
    return `<div class="q-sesion">
      <div><b>Entra para jugar</b><span>Usa tu cuenta de Google. En la tabla solo se ve tu apodo, nunca tu correo.</span></div>
      <button class="q-google" data-q="entrar">${GOOGLE}<span>Entrar con Google</span></button>
    </div>`;
  }
  if (!st.yo || st.editandoApodo) {
    const sugerido = st.yo ? st.yo.apodo : (() => {
      const p = String(st.user.displayName || "").trim().split(/\s+/).filter(Boolean);
      return p.length ? (p[0] + (p[1] ? " " + p[1][0] + "." : "")) : "";
    })();
    return `<form class="q-apodo" data-q="form-apodo">
      <label for="q-apodo-in"><b>${st.yo ? "Cambiar apodo" : "¡Bienvenido! Elige tu apodo"}</b>
        <span>Es el nombre que verán los demás en la tabla de la quiniela.</span></label>
      <div class="q-apodo-fila">
        <input id="q-apodo-in" name="apodo" maxlength="24" minlength="2" required value="${esc(sugerido)}" autocomplete="nickname">
        <button class="btn-primario" type="submit">${st.yo ? "Guardar" : "Empezar a jugar"}</button>
        ${st.yo ? `<button class="btn-secundario" type="button" data-q="cancelar-apodo">Cancelar</button>` : ""}
      </div>
      ${st.aviso ? `<p class="q-error">${esc(st.aviso)}</p>` : ""}
    </form>`;
  }
  const mio = puntuar(st.yo);
  return `<div class="q-sesion q-sesion-on">
    <div><b>${esc(st.yo.apodo)}</b><span>${mio.pts} ${mio.pts === 1 ? "punto" : "puntos"} · ${mio.ac} de ${mio.tot} aciertos</span></div>
    <div class="q-sesion-acc">
      <button class="q-link" data-q="editar-apodo">Cambiar apodo</button>
      <button class="q-link" data-q="salir">Salir</button>
    </div>
  </div>`;
}

function catsJornada(x) {
  return api.CATS.filter((c) => (x.j.partidos || []).some((p) => catsDe(p).includes(c)));
}
function htmlJornadaAbierta(x) {
  const c = cierreDe(x.clave);
  const puedo = !!(st.user && st.yo);
  const mis = st.borrador[x.clave] || {};
  const cats = catsJornada(x);
  if (!cats.includes(st.catQ)) st.catQ = cats.find((k) => cuantosEn(mis, k) < MAX_POR_CAT) || cats[0];
  const cat = st.catQ;
  const total = cats.reduce((n, k) => n + cuantosEn(mis, k), 0);
  const lleno = cuantosEn(mis, cat) >= MAX_POR_CAT;
  const chips = cats.map((k) => {
    const n = cuantosEn(mis, k);
    return `<button class="q-chip ${n >= MAX_POR_CAT ? "completa" : ""}" data-q="qcat" data-c="${esc(k)}" aria-pressed="${k === cat}">
      <b>${esc(k)}</b><span>${n}/${MAX_POR_CAT}</span></button>`;
  }).join("");
  const filas = (x.j.partidos || []).filter((p) => catsDe(p).includes(cat)).map((p) => {
    const k = claveM(p), v = pickDe(mis, p, cat);
    const bloq = !puedo ? 'data-bloq="1"' : "";
    const cerrada = !v && lleno;
    const btn = (op, txt, extra) => `<button class="q-op ${extra}" data-q="pick" data-j="${x.clave}" data-c="${esc(numCat(cat))}" data-n="${esc(cat)}" data-k="${esc(k)}" data-v="${op}" aria-pressed="${v === op}" ${bloq} ${cerrada ? 'data-lleno="1"' : ""}>${txt}</button>`;
    return `<div class="q-m ${v ? "elegido" : ""} ${cerrada ? "lleno" : ""}">
      <div class="q-m-eq">${api.escudo(p.local, true)}<b>${esc(p.local)}</b><i>vs</i><b class="v">${esc(p.visitante)}</b>${api.escudo(p.visitante, true)}</div>
      <div class="q-m-ops">${btn("L", esc(nombreCorto(p.local)), "q-op-l")}${btn("E", "Empate", "q-op-e")}${btn("V", esc(nombreCorto(p.visitante)), "q-op-v")}</div>
    </div>`;
  }).join("");
  return `<section class="q-bloque" id="q-jornada-${x.clave}">
    <div class="q-jornada-cab">
      <h3 class="titulo-bloque">Jornada ${x.j.numero} <span class="q-abierta">Abierta</span></h3>
      <p class="q-cierre">Cierra el <b>${esc(fechaCierre(c))}</b> · ${esc(falta(c))}</p>
    </div>
    ${puedo ? `<p class="q-ayuda">Elige <b>hasta ${MAX_POR_CAT} partidos en cada categoría</b> y toca quién crees que gana. Se guarda solo y puedes cambiarlo hasta el cierre.
      <span class="q-guardado" id="q-guardado">${esc(st.guardado)}</span></p>`
      : `<p class="q-ayuda">Entra con tu cuenta de Google (arriba) para hacer tus pronósticos. Puedes elegir hasta ${MAX_POR_CAT} partidos por categoría.</p>`}
    <div class="q-chips" role="tablist" aria-label="Categorías">${chips}</div>
    <div class="q-panel tarjeta">
      <div class="q-panel-cab"><b>${esc(cat)}</b><span>${lleno ? `Ya elegiste tus ${MAX_POR_CAT} partidos. Toca uno elegido para quitarlo.` : `Elige ${MAX_POR_CAT - cuantosEn(mis, cat)} ${MAX_POR_CAT - cuantosEn(mis, cat) === 1 ? "partido más" : "partidos"}`}</span></div>
      ${st.avisoPick ? `<p class="q-aviso-pick" role="status">${esc(st.avisoPick)}</p>` : ""}
      ${filas}
    </div>
    <p class="q-total">Llevas <b>${total}</b> de ${cats.length * MAX_POR_CAT} pronósticos en esta jornada.</p>
  </section>`;
}

function repintarJornada(clave) {
  const x = jornadasQuiniela().find((y) => y.clave === clave);
  const el = cont && cont.querySelector(`#q-jornada-${clave}`);
  if (!x || !el) { pintar(); return; }
  el.outerHTML = htmlJornadaAbierta(x);
}

function htmlMisCerradas() {
  if (!st.yo) return "";
  const cerradas = jornadasQuiniela().filter((x) => !estaAbierta(x.clave) && (st.yo.picks || {})[x.clave]).reverse();
  if (!cerradas.length) return "";
  return `<section class="q-bloque">
    <h3 class="titulo-bloque">Mis pronósticos</h3>
    ${cerradas.map((x) => {
      const mis = st.yo.picks[x.clave];
      const pj = puntuar(st.yo, x.clave).porJ[x.clave] || { a: 0, t: 0 };
      const filas = (x.j.partidos || []).flatMap((p) => catsDe(p).map((cat) => {
        const pick = pickDe(mis, p, cat);
        if (!pick) return "";
        const real = resultadoReal(p, cat);
        const cls = !real ? "pend" : real === pick ? "ok" : "mal";
        const elegido = pick === "L" ? p.local : pick === "V" ? p.visitante : "Empate";
        return `<li class="${cls}"><span class="q-cat">${esc(cat)}</span><span class="q-m">${esc(nombreCorto(p.local))} vs ${esc(nombreCorto(p.visitante))}</span><span class="q-e">${esc(elegido)}</span><i>${cls === "ok" ? "✓" : cls === "mal" ? "✗" : "…"}</i></li>`;
      })).join("");
      return `<details class="q-mis tarjeta">
        <summary><b>Jornada ${x.j.numero}</b><span>${pj.t ? `${pj.a} de ${pj.t} aciertos` : "Esperando resultados"}</span></summary>
        <ul>${filas}</ul>
      </details>`;
    }).join("")}
  </section>`;
}

function htmlRanking() {
  const conRes = jornadasQuiniela().filter((x) => st.todos.some((j) => puntuar(j, x.clave).tot > 0));
  if (st.vista !== "general" && !conRes.some((x) => x.clave === st.vista)) st.vista = "general";
  const filas = ranking(st.vista);
  const yoUid = st.user && st.user.uid;
  const MAX = 30;
  let visibles = filas.slice(0, MAX);
  const miPos = filas.findIndex((f) => f.j.uid === yoUid);
  const admin = esAdmin();
  const fila = (f, i) => `<tr class="${f.j.uid === yoUid ? "yo" : ""} ${i < 3 ? "top" + (i + 1) : ""}">
      <td class="pos">${i + 1}</td>
      <td class="izq">${esc(f.j.apodo || "Jugador")}${f.j.uid === yoUid ? " <small>(tú)</small>" : ""}
        ${admin ? `<button class="q-quitar" data-q="quitar" data-uid="${esc(f.j.uid)}" title="Quitar jugador">✕</button>` : ""}</td>
      <td>${f.ac}/${f.tot}</td>
      <td class="pts">${f.pts}</td>
    </tr>`;
  let cuerpo = visibles.map(fila).join("");
  if (miPos >= MAX) cuerpo += `<tr class="sep"><td colspan="4">···</td></tr>` + fila(filas[miPos], miPos);
  return `<section class="q-bloque">
    <h3 class="titulo-bloque">Tabla de la quiniela <small>${st.todos.length} ${st.todos.length === 1 ? "jugador" : "jugadores"}</small></h3>
    <div class="q-vistas">
      <button data-q="vista" data-v="general" aria-pressed="${st.vista === "general"}">General</button>
      ${conRes.map((x) => `<button data-q="vista" data-v="${x.clave}" aria-pressed="${st.vista === x.clave}">J${x.j.numero}</button>`).join("")}
    </div>
    <div class="tarjeta">
      ${filas.length ? `<table class="tabla q-tabla">
        <thead><tr><th>#</th><th class="izq">Jugador</th><th title="Aciertos / pronósticos con resultado">Aciertos</th><th class="th-pts">Pts</th></tr></thead>
        <tbody>${cuerpo}</tbody></table>`
      : `<div class="vacio">Todavía no hay puntos. La tabla se llenará cuando haya resultados de una jornada con pronósticos.</div>`}
    </div>
  </section>`;
}

function htmlAdmin() {
  if (!esAdmin()) return "";
  const js = jornadasQuiniela();
  return `<section class="q-bloque q-admin">
    <h3 class="titulo-bloque">Panel del organizador <small>solo lo ves tú</small></h3>
    <div class="tarjeta">
      <p>Las horas de apertura y cierre se publican solas cuando entras al sitio con tu cuenta (${esc(st.sincro || "")}).
         Cada jornada se abre ${diasAntes()} días antes y se cierra el día de juego a las ${esc(CFG.horaCierre || "07:00")}. Si cambias una <code>fecha</code> en <code>datos.js</code>, solo entra aquí una vez.</p>
      <ul>${js.length ? js.map((x) => {
        const n = st.todos.filter((j) => (j.picks || {})[x.clave]).length;
        const ahora = Date.now();
        const estadoTxt = !cierreDe(x.clave) ? "Sin publicar" : estaAbierta(x.clave) ? "Abierta" : ahora < (aperturaDe(x.clave) || 0) ? "Por abrir" : "Cerrada";
        return `<li><b>Jornada ${x.j.numero}</b> · abre ${esc(fechaCierre(x.apertura.getTime()))} · cierra ${esc(fechaCierre(x.cierre.getTime()))} · <span class="q-est">${estadoTxt}</span> · ${n} con pronósticos</li>`;
      }).join("") : "<li>No hay jornadas con fecha en datos.js.</li>"}</ul>
      <p class="muted">Puedes quitar a un jugador (por ejemplo, por un apodo ofensivo) con la ✕ junto a su nombre en la tabla.</p>
    </div>
  </section>`;
}

function pintar() {
  if (!cont || !cont.isConnected) return;
  const js = jornadasQuiniela();
  const abiertas = js.filter((x) => estaAbierta(x.clave));
  const prox = js.find((x) => x.cierre.getTime() > Date.now() && !estaAbierta(x.clave));
  const abreMs = prox ? (aperturaDe(prox.clave) || prox.apertura.getTime()) : null;
  cont.innerHTML = `
    <div class="seccion-titulo">
      <h2>Quiniela${api.T.nombre.match(/\d{4}-\d{4}/) ? ` <span class="cat">${esc(api.T.nombre.match(/\d{4}-\d{4}/)[0])}</span>` : ""}</h2>
      <span class="muted">Solo por diversión: no se apuesta nada</span>
    </div>
    <div class="q-reglas">
      <div><b>1</b><span>Entra con Google y elige un apodo.</span></div>
      <div><b>2</b><span>${diasAntes()} días antes de cada jornada, elige hasta ${MAX_POR_CAT} partidos por categoría y toca quién gana.</span></div>
      <div><b>3</b><span>Ganas <strong>1 punto</strong> por cada acierto. ¡Sube en la tabla!</span></div>
    </div>
    ${st.error ? `<p class="q-error" role="alert">${esc(st.error)}</p>` : ""}
    ${htmlSesion()}
    ${abiertas.length ? abiertas.map(htmlJornadaAbierta).join("")
      : `<section class="q-bloque">${prox
          ? `<div class="q-caja q-proxima"><b>La jornada ${prox.j.numero} se abre el ${esc(fechaCierre(abreMs))}</b>
              <p>La quiniela se abre sola ${diasAntes()} días antes de cada jornada, con todos los partidos de todas las categorías. ${abreMs > Date.now() ? `<span class="q-falta">${esc(falta(abreMs).replace("faltan", "Faltan"))}</span>` : ""}</p></div>`
          : cajaMensaje("No hay jornada abierta ahora", "La quiniela de la próxima jornada se abrirá cuando se publiquen sus partidos. ¡Vuelve pronto!")}</section>`}
    ${htmlMisCerradas()}
    ${htmlRanking()}
    ${htmlAdmin()}`;
  conectar();
}

function pintarEstadoGuardado() {
  const el = cont && cont.querySelector("#q-guardado");
  if (el) el.textContent = st.guardado;
}

function conectar() {
  cont.onclick = (e) => {
    const b = e.target.closest("[data-q]");
    if (!b || b.tagName === "FORM") return;
    const q = b.dataset.q;
    if (q === "entrar") entrar();
    else if (q === "salir") fb.signOut(fb.auth);
    else if (q === "editar-apodo") { st.editandoApodo = true; pintar(); }
    else if (q === "cancelar-apodo") { st.editandoApodo = false; st.aviso = ""; pintar(); }
    else if (q === "vista") { st.vista = b.dataset.v; pintar(); }
    else if (q === "qcat") {
      st.catQ = b.dataset.c; st.avisoPick = "";
      const sec = b.closest("section[id^='q-jornada-']");
      if (sec) repintarJornada(sec.id.replace("q-jornada-", "")); else pintar();
    }
    else if (q === "quitar") quitarJugador(b.dataset.uid);
    else if (q === "pick") {
      if (b.dataset.bloq) {
        const s = cont.querySelector(".q-sesion, .q-apodo");
        if (s) { s.classList.remove("q-llamar"); void s.offsetWidth; s.classList.add("q-llamar"); s.scrollIntoView({ behavior: "smooth", block: "center" }); }
        return;
      }
      const { j, c, n, k, v } = b.dataset;
      if (!estaAbierta(j)) { st.error = "Esta jornada ya cerró."; pintar(); return; }
      const mis = st.borrador[j] || (st.borrador[j] = {});
      const g = (mis[c] && typeof mis[c] === "object") ? mis[c] : (mis[c] = {});
      st.avisoPick = "";
      if (g[k] === v) delete g[k];
      else if (!g[k] && Object.keys(g).length >= MAX_POR_CAT) {
        st.avisoPick = `Ya elegiste ${MAX_POR_CAT} partidos en ${n}. Quita uno (tocando tu elección) para elegir otro.`;
        repintarJornada(j);
        return;
      } else g[k] = v;
      if (!Object.keys(g).length) delete mis[c];
      repintarJornada(j);
      programarGuardado(j);
    }
  };
  const form = cont.querySelector('[data-q="form-apodo"]');
  if (form) form.onsubmit = (e) => { e.preventDefault(); guardarApodo(form.apodo.value); };
}
