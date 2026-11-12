/* ============================================================
   LFFU · Motor del sitio (pestañas + wipe + reveal + reloj)
   ============================================================ */
(function () {
"use strict";
const T = window.LFFU;
const app = document.getElementById("app");
const EQ = new Map(T.equipos.map(e => [e.nombre, e]));
const NJ = T.totalJornadas;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dos2 = n => String(n).padStart(2, "0");
const esperar = ms => new Promise(r => setTimeout(r, ms));
const sinMov = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function fecha(iso, opts) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-SV", opts || { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function horaTxt(h) {               // "15:30" → "3:30 p.m."
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(h || "").trim());
  if (!m) return h || "";
  const hh = +m[1];
  return `${hh % 12 || 12}:${m[2]} ${hh < 12 ? "a.m." : "p.m."}`;
}
function diaCorto(iso) {             // "2026-09-11" → "Vie. 11"
  const t = fecha(iso, { weekday: "short", day: "numeric" }).replace(",", "");
  return t.charAt(0).toUpperCase() + t.slice(1).replace(/^(\S+?)\.?\s/, "$1. ");
}
function fechasJornada(j) {          // una o varias fechas (viernes y sábado, reprogramados)
  const ds = [...new Set([j.fecha, ...j.partidos.map(p => p.fecha).filter(Boolean)])].sort();
  const txt = ds.map(d => fecha(d, { weekday: "long", day: "numeric", month: "long" })).join(" · ");
  return j.porConfirmar ? `Fecha estimada: ${txt} · por confirmar` : txt;
}
function parseRes(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const m = s.match(/^(\d+)\s*[-–:]\s*(\d+)\s*(.*)$/);
  if (!m) return { texto: s };
  return { gl: +m[1], gv: +m[2], nota: (m[3] || "").trim() };
}
function escudo(nombre, grande) {
  const e = EQ.get(nombre);
  if (!e) return `<span class="escudo${grande ? " grande" : ""}" style="background:#cbd2db">?</span>`;
  return `<span class="escudo${grande ? " grande" : ""}" style="background:linear-gradient(160deg,${e.color},${e.color2})">${esc(e.corto)}</span>`;
}

/* ---------- Tabla ---------- */
function calcularTabla() {
  const filas = T.equipos.map(e => ({ nombre: e.nombre, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, forma: [] }));
  const por = new Map(filas.map(f => [f.nombre, f]));
  // en orden de fecha real (un partido reprogramado cuenta cuando se jugó, para "Últimos 5")
  const todos = [];
  T.jornadas.forEach(j => j.partidos.forEach((p, i) => todos.push({ p, f: (p.fecha || j.fecha) + String(j.numero).padStart(2, "0") + i })));
  todos.sort((x, y) => x.f.localeCompare(y.f)).forEach(({ p }) => {
    const r = parseRes(p.resultado);
    if (!r || r.gl == null) return;
    const L = por.get(p.local), V = por.get(p.visitante);
    if (!L || !V) return;
    L.pj++; V.pj++; L.gf += r.gl; L.gc += r.gv; V.gf += r.gv; V.gc += r.gl;
    if (r.gl > r.gv) { L.g++; V.p++; L.forma.push("G"); V.forma.push("P"); }
    else if (r.gl < r.gv) { V.g++; L.p++; V.forma.push("G"); L.forma.push("P"); }
    else { L.e++; V.e++; L.forma.push("E"); V.forma.push("E"); }
  });
  filas.forEach(f => { f.dg = f.gf - f.gc; f.pts = f.g * 3 + f.e; });
  filas.sort((a, b) => b.pts - a.pts || b.g - a.g || b.dg - a.dg || b.gf - a.gf || a.nombre.localeCompare(b.nombre, "es"));
  return filas;
}
function jornadaActual() {
  let ult = 0;
  T.jornadas.forEach(j => {
    if (j.partidos.some(p => { const r = parseRes(p.resultado); return r && r.gl != null; })) ult = Math.max(ult, j.numero);
  });
  return ult;
}
const JA = jornadaActual();

/* ---------- Reloj / próxima jornada ---------- */
function inicioJornada(j) {
  const horas = j.partidos.map(p => p.hora).filter(Boolean).sort();
  return new Date(j.fecha + "T" + (horas[0] || "14:00") + ":00").getTime();
}
function proxima() {
  const ahora = Date.now();
  const pend = T.jornadas.filter(j => !j.partidos.some(p => { const r = parseRes(p.resultado); return r && r.gl != null; }));
  const vivo = pend.find(j => ahora >= inicioJornada(j) && ahora < inicioJornada(j) + 6 * 3600e3);
  if (vivo) return { modo: "vivo", j: vivo };
  const prox = pend.find(j => inicioJornada(j) > ahora);
  return prox ? { modo: "cuenta", j: prox, t: inicioJornada(prox) } : null;
}
function partes(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
}
function tic() {
  const P = proxima();
  const fc = document.getElementById("fr-cuenta");
  if (fc) {
    if (!P) fc.innerHTML = "";
    else if (P.modo === "vivo") { fc.className = "franja-cuenta vivo"; fc.innerHTML = `<i></i>J${P.j.numero} en juego`; }
    else {
      const c = partes(P.t - Date.now());
      fc.className = "franja-cuenta";
      fc.innerHTML = `J${P.j.numero} en <b>${c.d}d ${dos2(c.h)}h ${dos2(c.m)}m</b>`;
    }
  }
  document.querySelectorAll("[data-cuenta]").forEach(el => {
    const c = partes(+el.dataset.cuenta - Date.now());
    el.querySelectorAll("b[data-k]").forEach(b => {
      const v = b.dataset.k === "d" ? String(c.d) : dos2(c[b.dataset.k]);
      if (b.textContent !== v) b.textContent = v;
    });
  });
}
setInterval(tic, 1000);

/* ---------- Estado + router ---------- */
const estado = { tab: "inicio", jornada: Math.min(JA + 1, NJ), cancha: null };
let animando = false;

async function conCortina(tab, cambiar) {
  if (animando) return;
  const ov = document.getElementById("wipe");
  if (!ov || sinMov()) { cambiar(); return; }
  animando = true;
  const btn = document.querySelector(`#tabs button[data-tab="${tab}"]`);
  document.getElementById("wipe-titulo").textContent = btn ? btn.textContent.trim() : tab;
  ov.classList.remove("leave");
  ov.classList.add("is-active", "cover");
  await esperar(560);
  try { cambiar(); } catch (e) { console.error(e); }
  await esperar(160);
  ov.classList.remove("cover");
  ov.classList.add("leave");
  await esperar(560);
  ov.classList.remove("is-active", "leave");
  animando = false;
}
function irATab(tab, extra) {
  if (tab === estado.tab) { if (extra) extra(); render(); return; }
  conCortina(tab, () => {
    estado.tab = tab;
    if (extra) extra();
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
  });
}

/* ---------- Reveal ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: .12, rootMargin: "0px 0px -40px 0px" });
function observar() {
  app.querySelectorAll("[data-reveal]").forEach(el => { el.classList.remove("in"); io.observe(el); });
}

/* ---------- Render helpers ---------- */
function formaHTML(f) {
  return `<span class="forma">${f.slice(-5).map(x => `<i class="${x}">${x}</i>`).join("")}</span>`;
}
function tickerHTML() {
  const items = [];
  const ult = T.jornadas.find(j => j.numero === JA);
  if (ult) ult.partidos.forEach(p => {
    const r = parseRes(p.resultado);
    if (r && r.gl != null) items.push(`<span class="ticker-item"><em>J${JA} FINAL</em> ${esc(p.local)} <b>${r.gl}–${r.gv}</b> ${esc(p.visitante)}</span>`);
  });
  const P = proxima();
  if (P && P.modo === "cuenta") P.j.partidos.forEach(p =>
    items.push(`<span class="ticker-item"><em>J${P.j.numero}</em> ${esc(p.local)} vs ${esc(p.visitante)}${p.hora ? " · " + esc(horaTxt(p.hora)) : ""}</span>`));
  const html = items.join("");
  return `<div class="ticker" data-reveal="up"><div class="ticker-track">${html}${html}</div></div>`;
}

/* ---------- Datos de la temporada (se calculan solos) ---------- */
function datosTemporadaHTML(tabla) {
  const jugados = [];
  T.jornadas.forEach(j => j.partidos.forEach(p => { const r = parseRes(p.resultado); if (r && r.gl != null) jugados.push({ p, r, j }); }));
  if (!jugados.length) return "";
  const goles = jugados.reduce((n, x) => n + x.r.gl + x.r.gv, 0);
  const goleada = jugados.slice().sort((a, b) => (Math.abs(b.r.gl - b.r.gv) - Math.abs(a.r.gl - a.r.gv)) || ((b.r.gl + b.r.gv) - (a.r.gl + a.r.gv)))[0];
  const invictos = tabla.filter(f => f.pj && f.p === 0).map(f => f.nombre);
  const ataque = tabla.slice().sort((a, b) => b.gf - a.gf)[0];
  const defensa = tabla.slice().sort((a, b) => a.gc - b.gc)[0];
  const empates = jugados.filter(x => x.r.gl === x.r.gv).length;
  const items = [
    ["⚽", "Promedio de gol", `${(goles / jugados.length).toFixed(2)} por partido`],
    ["🔥", "Mayor goleada", `${goleada.p.local} ${goleada.r.gl}–${goleada.r.gv} ${goleada.p.visitante} (J${goleada.j.numero})`],
    ["🛡️", invictos.length === 1 ? "Única invicta" : "Invictas", invictos.length ? invictos.join(", ") : "Ninguna"],
    ["👑", "Mejor ataque", `${ataque.nombre}: ${ataque.gf} goles`],
    ["🧱", "Defensa menos vencida", `${defensa.nombre}: ${defensa.gc} en contra`],
    ["🤝", "Empates", String(empates)]
  ];
  return `<section class="bloque" data-reveal="up">
    <h2 class="titulo-bloque">Datos de la temporada <small>Tras la jornada ${JA}</small></h2>
    <div class="datos-temp">${items.map(([i, t, v]) => `<div class="tarjeta dato-t"><span class="dato-ico">${i}</span><span><small>${esc(t)}</small><b>${esc(v)}</b></span></div>`).join("")}</div>
  </section>`;
}

/* ---------- Vistas ---------- */
function renderInicio() {
  const tabla = calcularTabla();
  const P = proxima();
  const jugados = T.jornadas.reduce((n, j) => n + j.partidos.filter(p => { const r = parseRes(p.resultado); return r && r.gl != null; }).length, 0);
  const goles = tabla.reduce((n, f) => n + f.gf, 0);
  let cuenta = "";
  if (P) {
    const j = P.j;
    const cruces = j.partidos.map(p =>
      `<div class="cruce">${escudo(p.local)}<span>${esc(p.local)}</span><em>vs</em><span>${esc(p.visitante)}</span>${escudo(p.visitante)}<span class="h">${esc(horaTxt(p.hora))}</span></div>`).join("");
    const reloj = P.modo === "vivo"
      ? `<div class="en-vivo-bandera"><i></i>Se está jugando hoy</div>`
      : (() => { const c = partes(P.t - Date.now());
          return `<div class="cuenta-reloj" data-cuenta="${P.t}" role="timer">
            ${[["d", "Días"], ["h", "Horas"], ["m", "Min"], ["s", "Seg"]].map(([k, t]) =>
              `<div class="dig"><b data-k="${k}">${k === "d" ? c[k] : dos2(c[k])}</b><span>${t}</span></div>`).join("")}
          </div>`; })();
    cuenta = `<section class="cuenta ${P.modo === "vivo" ? "en-vivo" : ""}" data-reveal="up">
      <div class="cuenta-cab"><span class="cuenta-tit">${P.modo === "vivo" ? "En juego" : "Próxima jornada"}</span><span class="cuenta-num">J${dos2(j.numero)}</span></div>
      ${reloj}
      <p class="cuenta-fecha">${esc(fechasJornada(j))}</p>
      <div class="cuenta-cruces">${cruces}</div>
      <button class="cuenta-ver" data-ir="resultados" data-jor="${j.numero}">Ver los ${j.partidos.length} partidos y canchas ›</button>
    </section>`;
  }
  app.innerHTML = `
    <div class="inicio-grid">
      <div class="tarjeta fase-caja" data-reveal="left">
        <span class="fase-etq"><i></i>Fase regular · Primera y segunda vuelta</span>
        <div class="fase-num"><b>${dos2(JA)}</b><span>Jornada<small>de ${NJ} jugadas</small></span></div>
        <div class="fase-barra">${Array.from({ length: NJ }, (_, i) => `<i class="${i < JA ? "ok" : ""}"></i>`).join("")}</div>
        <p class="fase-fecha">Actualizado el ${esc(fecha(T.actualizado, { day: "numeric", month: "long", year: "numeric" }))}</p>
        <div class="fase-btns">
          <button class="btn" data-ir="posiciones">Ver posiciones</button>
          <button class="btn btn--fantasma" data-ir="resultados" data-jor="${JA}">Resultados J${JA}</button>
        </div>
      </div>
      <div class="lideres" data-reveal="right" style="--d:.1s">
        <div class="lideres-cab"><h2>Tabla <span>· J${JA}</span></h2><small>Toca para ver completa</small></div>
        ${tabla.slice(0, T.clasificados).map((f, i) => `
          <button class="lider-fila" data-ir="posiciones">
            <span class="lider-pos">${i + 1}º</span>${escudo(f.nombre, true)}
            <span class="lider-info"><b>${esc(f.nombre)}</b><small>DG ${f.dg > 0 ? "+" : ""}${f.dg} · ${f.g}G ${f.e}E ${f.p}P</small></span>
            <span class="lider-pts">${f.pts}<small>pts</small></span>
          </button>`).join("")}
      </div>
    </div>
    ${cuenta}
    ${tickerHTML()}
    <div class="stats">
      ${[[T.equipos.length, "Equipos"], [NJ, "Jornadas"], [jugados, "Partidos jugados"], [goles, "Goles anotados"]].map(([n, l], i) =>
        `<div class="stat" data-reveal="up" style="--d:${i * .08}s"><b data-contador="${n}">0</b><span>${l}</span></div>`).join("")}
    </div>
    ${datosTemporadaHTML(tabla)}
    ${(T.reconocimientos || []).length ? `<section class="bloque" data-reveal="up">
      <h2 class="titulo-bloque">Reconocimientos <small>Oficiales de la liga</small></h2>
      ${T.reconocimientos.map(r => `<div class="tarjeta recon"><span class="recon-ico">🎖️</span><p><b>${esc(fecha(r.fecha, { day: "numeric", month: "long" }))}:</b> ${esc(r.texto)}</p></div>`).join("")}
    </section>` : ""}
    <section class="bloque" data-reveal="up">
      <h2 class="titulo-bloque">Los ${T.equipos.length} equipos <small>Temporada ${esc(T.temporada)}</small></h2>
      <div class="equipos-chips">
        ${T.equipos.map(e => `<span class="eq-chip">${escudo(e.nombre)}${esc(e.nombre)}</span>`).join("")}
      </div>
    </section>`;
  animarContadores();
}

function renderPosiciones() {
  const tabla = calcularTabla();
  app.innerHTML = `
    <div class="jornada-cab" data-reveal="left">
      <h2>Posiciones <span>· J${JA}</span></h2>
      <span class="fecha-j">Tras la jornada ${JA} de ${NJ}</span>
    </div>
    <div class="tabla-wrap" data-reveal="zoom">
      <table class="tabla">
        <thead><tr><th>#</th><th class="izq">Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th class="th-pts">PTS</th><th>Últimos 5</th></tr></thead>
        <tbody>
          ${tabla.map((f, i) => `
            <tr class="${i < T.clasificados ? "clasifica" : ""} ${i === T.clasificados - 1 ? "corte" : ""}">
              <td class="pos">${i + 1}</td>
              <td class="izq"><span class="equipo-celda">${escudo(f.nombre)}<span class="n">${esc(f.nombre)}</span></span></td>
              <td>${f.pj}</td><td>${f.g}</td><td>${f.e}</td><td>${f.p}</td><td>${f.gf}</td><td>${f.gc}</td>
              <td class="${f.dg > 0 ? "dg-pos" : f.dg < 0 ? "dg-neg" : ""}">${f.dg > 0 ? "+" : ""}${f.dg}</td>
              <td class="pts">${f.pts}</td><td>${formaHTML(f.forma)}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <p class="tabla-nota" data-reveal="up"><i></i>Las primeras ${T.clasificados} posiciones clasifican a cuartos de final. Desempate: puntos → victorias → diferencia de gol → goles a favor.</p>`;
}

function renderResultados() {
  const j = T.jornadas.find(x => x.numero === estado.jornada) || T.jornadas[0];
  const conDatos = n => {
    const jj = T.jornadas.find(x => x.numero === n);
    return jj && jj.partidos.some(p => { const r = parseRes(p.resultado); return r && r.gl != null; });
  };
  app.innerHTML = `
    <div class="jornadas-nav" data-reveal="up">
      <button class="flecha" data-jor-nav="-1" ${j.numero <= 1 ? "disabled" : ""} aria-label="Anterior">‹</button>
      <div class="jornadas-lista">
        ${Array.from({ length: NJ }, (_, i) => i + 1).map(n =>
          `<button data-jor="${n}" class="${conDatos(n) ? "" : "sin-datos"}" aria-pressed="${n === j.numero}">${n}</button>`).join("")}
      </div>
      <button class="flecha" data-jor-nav="1" ${j.numero >= NJ ? "disabled" : ""} aria-label="Siguiente">›</button>
    </div>
    <div class="jornada-cab" data-reveal="left">
      <h2>Jornada ${j.numero} <span>LFFU</span></h2>
      <span class="fecha-j">${esc(fechasJornada(j))}</span>
    </div>
    <div class="partidos">
      ${j.partidos.map((p, i) => {
        const r = parseRes(p.resultado);
        const jugado = r && r.gl != null;
        const marc = jugado
          ? `<div class="marcador">${r.gl}<span class="sep">–</span>${r.gv}</div>`
          : `<div class="marcador pendiente">${p.hora ? esc(horaTxt(p.hora)) : "POR JUGAR"}</div>`;
        const pl = jugado && r.gl < r.gv ? " perdio" : "", pv = jugado && r.gv < r.gl ? " perdio" : "";
        return `<article class="tarjeta partido" data-reveal="up" style="--d:${i * .07}s">
          <div class="partido-meta">📍 <b>${esc(p.cancha || "")}</b> · ${esc(diaCorto(p.fecha || j.fecha))}${p.hora ? " · " + esc(horaTxt(p.hora)) : ""}</div>
          <div class="partido-fila">
            <div class="eq local${pl}"><span class="n">${esc(p.local)}</span>${escudo(p.local)}</div>
            ${marc}
            <div class="eq${pv}">${escudo(p.visitante)}<span class="n">${esc(p.visitante)}</span></div>
          </div>
          ${(jugado && r.nota) || p.nota ? `<div class="nota-res">${esc([jugado ? r.nota : "", p.nota].filter(Boolean).join(" · "))}</div>` : ""}
        </article>`;
      }).join("")}
    </div>`;
}

function renderGoleadoras() {
  if (!(T.goleadoras || []).length) {
    app.innerHTML = `<div class="jornada-cab" data-reveal="left"><h2>Goleadoras</h2></div>
      <p class="tabla-nota" data-reveal="up">La tabla de goleadoras aparecerá aquí cuando la liga la publique.</p>`;
    return;
  }
  const max = Math.max(...T.goleadoras.map(g => g.goles), 1);
  app.innerHTML = `
    <div class="jornada-cab" data-reveal="left">
      <h2>Goleadoras <span>· J${JA}</span></h2>
      <span class="fecha-j">Tabla de artilleras de la temporada</span>
    </div>
    <div class="gol-lista">
      ${T.goleadoras.map((g, i) => `
        <div class="tarjeta gol-fila" data-reveal="left" style="--d:${i * .06}s">
          <span class="gol-pos">${i === 0 ? "👑" : i + 1}</span>
          ${escudo(g.equipo, true)}
          <span class="gol-info"><b>${esc(g.nombre)}</b><small>${esc(g.equipo)}</small></span>
          <span class="gol-barra"><i style="--w:${(g.goles / max).toFixed(2)}"></i></span>
          <span class="gol-num">${g.goles}<small>goles</small></span>
        </div>`).join("")}
    </div>
    <p class="tabla-nota" data-reveal="up">¿Falta una goleadora o un dato no cuadra? Escríbenos al WhatsApp de la liga y lo corregimos.</p>`;
}

function renderPlayoffs() {
  const tabla = calcularTabla();
  const completa = JA >= NJ;
  const s = n => { const f = tabla[n - 1]; return f ? { ...f, pos: n } : null; };
  const fila = (x, ph) => x
    ? `<div class="fila"><span class="seed">${x.pos}º</span>${escudo(x.nombre)}<span class="n">${esc(x.nombre)}</span></div>`
    : `<div class="fila"><span class="seed">–</span><span class="n por-definir">${ph}</span></div>`;
  const vacia = t => `<div class="fila"><span class="n por-definir">${t}</span></div>`;
  app.innerHTML = `
    <div class="jornada-cab" data-reveal="left"><h2>Playoffs <span>LFFU</span></h2><span class="fecha-j">Clasifican ${T.clasificados} equipos</span></div>
    <div class="aviso-proy" data-reveal="up">📊 <b>${completa ? "Cruces confirmados." : "Proyección:"}</b>
      ${completa ? "Así quedaron los cruces de la fase final." : `así quedarían los cuartos de final si la fase regular terminara hoy (jornada ${JA} de ${NJ}). Se confirman al finalizar la jornada ${NJ}.`}</div>
    <div class="bracket-wrap" data-reveal="zoom">
      <div class="bracket bracket-4">
        <div class="ronda"><h3>Cuartos <small>ida y vuelta</small></h3><div class="ronda-col">
          <div class="tarjeta llave"><div class="llave-id">Cuartos 1</div>${fila(s(1), "1º de la tabla")}${fila(s(6), "6º de la tabla")}</div>
          <div class="tarjeta llave"><div class="llave-id">Cuartos 2</div>${fila(s(2), "2º de la tabla")}${fila(s(5), "5º de la tabla")}</div>
          <div class="tarjeta llave"><div class="llave-id">Cuartos 3</div>${fila(s(3), "3º de la tabla")}${fila(s(4), "4º de la tabla")}</div>
        </div></div>
        <div class="ronda"><h3>Semifinales <small>ida y vuelta</small></h3><div class="ronda-col">
          <div class="tarjeta llave"><div class="llave-id">Semifinal 1</div>${vacia("Clasificada de cuartos")}${vacia("Clasificada de cuartos")}</div>
          <div class="tarjeta llave"><div class="llave-id">Semifinal 2</div>${vacia("Clasificada de cuartos")}${vacia("Clasificada de cuartos")}</div>
        </div></div>
        <div class="ronda"><h3>Final <small>un solo partido</small></h3><div class="ronda-col">
          <div class="tarjeta llave final"><div class="llave-id">🏆 Gran Final · 3:30 p.m.</div>${vacia("Ganadora Semifinal 1")}${vacia("Ganadora Semifinal 2")}</div>
          <div class="tarjeta llave"><div class="llave-id">🥉 Tercer lugar · 1:30 p.m.</div>${vacia("Perdedora Semifinal 1")}${vacia("Perdedora Semifinal 2")}</div>
        </div></div>
        <div class="ronda"><h3>Campeona</h3><div class="ronda-col">
          <div class="campeon-caja"><b>Campeona LFFU</b><p style="margin-top:6px;font-size:.9rem;color:#c6cdf0">${esc(T.temporada)}</p></div>
        </div></div>
      </div>
    </div>
    <section class="tarjeta formato-final" data-reveal="up">
      <h3>Cómo se juega la fase final</h3>
      <ul>
        <li><b>Cuartos de final (ida y vuelta):</b> juegan los ${T.clasificados} primeros de la fase regular. El 1º, 2º y 3º eligen si juegan de local o de visita el primer partido. Si hay empate, pasa el equipo mejor ubicado en la tabla.</li>
        <li><b>Semifinales (ida y vuelta):</b> las 3 ganadoras de cuartos y la mejor perdedora. Los 2 equipos mejor ubicados en la tabla eligen la localía del primer partido. Si hay empate global, se va directo a penales.</li>
        <li><b>Gran final (un solo partido):</b> si hay empate, se va directo a penales. Ese mismo día se juega el partido por el tercer y cuarto lugar.</li>
      </ul>
      <p class="muted" style="font-size:.85rem">Los cruces de cuartos se muestran por posición en la tabla (1º–6º, 2º–5º, 3º–4º); la liga los confirma al cerrar la fase regular.</p>
    </section>`;
}

/* Mapa base REAL del departamento: lo genera herramientas/canchas/generar_mapa_femenino.py */
/* MAPA-USU-INICIO */ const MAPA_USU = {"w":1000,"h":836,"lng0":-88.845,"lat0":13.735,"k":1370.819,"kx":0.97265,"usu":"M473.3 68.3L468.4 75.1L460.5 81.9L430.7 97.1L427.7 99.9L425.7 107.0L409.3 114.8L399.7 127.1L391.9 132.1L389.9 147.7L386.5 152.0L381.1 153.2L379.0 154.9L377.0 159.3L373.3 163.2L369.8 171.0L368.9 176.6L370.2 179.7L364.5 188.3L361.7 190.1L350.6 193.2L342.5 197.3L340.0 200.0L333.5 200.7L326.3 203.1L316.6 202.2L310.0 205.8L302.8 207.8L298.8 208.0L296.6 205.5L290.3 202.8L284.2 202.7L281.8 204.6L280.3 208.2L282.7 217.4L281.8 221.7L279.2 226.1L274.7 226.7L268.1 233.5L267.2 236.2L268.8 245.4L266.9 249.0L260.4 255.4L257.8 255.3L253.4 251.5L247.9 250.0L244.9 250.9L239.5 256.7L234.0 266.9L238.7 278.3L238.9 285.2L235.4 294.4L231.7 300.4L229.7 324.1L225.2 337.5L224.3 350.4L221.7 356.0L224.9 369.8L224.6 373.8L221.6 379.2L211.0 384.6L208.1 386.5L205.8 389.9L198.1 421.4L196.9 423.7L184.4 433.4L179.5 435.4L176.1 441.9L169.1 449.9L165.7 474.0L155.9 492.7L152.7 501.0L152.6 515.7L154.3 519.0L161.5 528.1L163.7 532.6L164.5 542.8L163.5 544.7L159.3 548.3L150.9 552.5L135.0 562.9L132.4 565.6L124.1 580.0L99.4 597.6L91.7 606.4L68.7 621.8L59.3 625.5L50.1 634.1L42.0 642.9L41.4 645.1L44.3 662.2L51.0 665.6L108.0 685.8L144.0 695.0L245.1 711.7L297.2 721.7L440.7 756.0L478.3 768.5L497.1 773.5L503.3 773.6L570.8 783.3L590.8 787.8L594.0 787.5L596.0 785.1L600.2 783.4L623.2 777.7L632.1 777.2L635.0 775.2L660.1 770.8L681.2 769.1L730.3 772.4L788.0 780.3L795.4 778.3L798.4 781.6L801.8 782.6L822.4 785.6L823.6 787.1L825.9 786.4L826.1 788.4L827.5 789.3L830.1 785.5L832.6 786.4L834.2 785.7L835.8 786.7L836.5 788.8L839.1 785.4L841.4 785.4L844.8 787.5L846.5 786.5L848.2 787.3L849.2 783.5L853.6 784.4L854.7 782.4L856.5 781.6L856.8 780.1L859.3 780.8L861.8 778.9L865.0 778.9L868.0 781.1L869.6 779.9L871.8 781.4L873.6 778.4L875.4 778.2L876.2 776.8L881.9 777.5L891.1 776.9L892.3 778.6L893.0 777.6L897.7 777.9L901.6 779.6L906.9 776.7L910.8 775.8L915.6 776.4L918.1 778.1L918.4 775.9L923.8 776.2L952.2 780.1L953.5 781.4L956.1 781.5L957.0 780.7L957.9 781.9L959.9 780.4L960.0 777.7L961.9 777.0L963.0 778.4L964.6 778.5L961.6 769.8L950.1 756.6L948.2 752.0L943.2 746.9L939.4 744.9L937.6 741.2L909.6 710.2L905.4 709.3L908.1 697.4L903.9 698.0L898.7 696.1L898.6 693.9L896.9 691.6L894.2 692.1L883.6 688.0L883.5 688.9L880.1 688.9L879.3 690.3L873.8 686.3L866.4 684.3L846.6 683.6L843.1 685.6L841.7 684.3L839.5 684.1L828.9 684.7L828.5 677.6L829.7 670.8L834.7 661.2L837.3 659.8L839.4 656.2L841.4 655.3L842.1 652.1L843.3 653.1L845.5 650.8L848.6 650.8L863.4 640.5L873.8 631.4L869.7 629.5L864.2 622.6L852.9 620.7L850.0 624.6L848.1 624.1L845.0 625.4L838.7 622.4L834.1 621.7L834.9 616.4L832.7 614.7L831.0 606.1L829.0 604.0L824.0 594.5L824.7 590.9L822.9 590.7L822.1 592.0L821.1 592.0L819.0 588.7L819.7 587.4L818.9 586.0L818.0 588.4L816.9 588.3L816.1 586.5L816.9 584.2L815.5 581.8L814.1 583.9L814.5 586.7L811.4 585.8L810.3 586.7L813.9 591.2L807.0 592.6L804.3 594.6L803.6 594.1L804.7 591.0L804.2 589.7L800.1 590.3L800.1 592.3L797.6 593.5L794.4 590.0L788.0 586.7L781.7 580.7L776.7 580.2L776.3 581.8L773.8 581.3L773.4 583.7L772.0 584.5L768.8 583.2L768.0 581.5L770.5 578.1L769.5 574.7L767.8 578.2L762.2 580.4L762.4 583.1L759.5 580.9L758.6 581.2L758.3 583.3L760.0 585.9L758.3 586.9L756.1 585.3L755.0 585.6L756.1 590.0L755.3 591.0L753.9 590.7L750.5 586.5L749.3 586.8L748.4 588.7L743.0 591.6L741.3 594.3L743.7 597.1L746.1 603.2L744.0 608.6L737.0 614.8L736.5 619.4L734.7 619.6L734.2 622.3L735.1 625.4L734.2 630.2L736.1 635.5L752.2 650.5L741.5 657.4L734.9 655.3L701.3 663.2L697.0 642.5L688.2 625.1L692.6 612.1L727.5 577.2L731.8 564.1L725.3 555.3L731.8 544.5L725.3 535.8L714.4 531.4L701.3 540.1L692.2 538.6L679.5 540.1L653.3 540.1L655.6 524.8L653.3 513.9L640.3 509.6L618.5 496.5L607.6 487.8L611.9 468.2L614.1 446.4L614.1 411.5L611.9 405.0L603.3 411.5L592.4 413.7L592.4 400.7L605.5 376.7L611.9 357.0L611.9 341.8L618.5 333.1L629.4 328.7L629.4 317.9L618.5 289.6L618.5 261.3L605.5 228.5L605.5 202.5L611.9 191.5L625.0 180.6L629.4 172.0L629.4 165.4L618.5 152.3L614.1 139.2L622.9 124.0L622.9 106.6L616.4 91.4L609.8 93.6L596.7 102.3L581.5 102.3L561.9 93.6L546.6 78.4L527.0 52.2L509.6 54.4L494.8 62.5L476.9 52.2L466.0 39.8L466.0 39.8L472.7 50.3L478.4 56.5L478.4 58.6Z","muni":"M406.9 199.5L408.0 202.2L421.7 201.8L428.2 193.2L424.8 192.4L424.4 183.8L429.3 174.1L432.8 172.9L437.7 180.3L455.2 179.1L455.6 183.8L481.9 183.8L481.5 169.4L487.6 158.4L493.3 154.1L496.7 138.4L508.9 136.9L505.8 122.4L491.0 123.6L489.1 118.5L484.5 115.0L478.8 93.8L446.2 82.4L428.6 85.3L413.7 100.6L401.6 104.4L398.8 112.0L388.6 123.5L389.5 129.2L384.9 133.1L381.2 146.4L369.1 146.4L360.5 157.1L361.3 173.9L361.3 173.9L370.7 176.4L381.8 187.0L387.5 195.6ZM357.5 219.1L375.8 226.0L394.1 226.0L395.4 238.6L402.9 245.5L413.0 243.4L416.4 256.0L445.5 253.2L452.3 257.3L482.7 251.1L489.5 257.3L509.1 261.5L509.1 241.3L518.6 230.9L507.1 230.2L498.3 219.8L496.2 180.8L489.5 172.5L481.6 173.9L481.9 183.8L455.6 183.8L455.2 179.1L437.7 180.3L432.8 172.9L429.3 174.1L424.4 183.8L424.8 192.4L428.2 193.2L421.7 201.8L408.0 202.2L406.9 199.5L387.5 195.6L381.8 187.0L370.7 176.4L361.3 173.9L356.7 187.9L333.8 195.6L333.8 195.6L337.2 204.5L347.4 214.9L352.8 213.5ZM268.2 305.3L260.1 310.2L257.4 322.0L263.5 324.1L273.7 317.9L287.2 313.7L296.0 319.3L301.4 319.3L314.9 308.1L327.1 311.6L327.8 322.7L323.0 325.5L329.1 337.3L335.2 339.4L339.3 336.6L356.2 336.6L371.8 355.4L383.9 355.4L380.5 363.1L383.3 374.2L399.5 374.2L403.6 355.4L397.5 346.4L399.5 334.6L422.5 329.0L424.5 324.8L424.5 310.9L418.4 294.9L417.1 255.9L413.0 243.4L402.9 245.5L395.4 238.6L394.1 226.0L375.8 226.0L357.5 219.1L352.8 213.5L347.4 214.9L337.2 204.5L333.8 195.6L325.2 193.4L306.8 200.7L284.8 191.6L266.3 215.4L267.5 236.2L255.0 241.7L235.4 245.4L225.3 262.5L229.1 278.0L229.1 278.0L254.0 285.2L261.5 291.4L265.5 297.7ZM270.3 342.9L293.9 352.6L310.2 348.5L312.9 355.4L300.7 359.6L297.3 379.8L229.7 390.9L229.0 399.2L236.4 399.2L241.2 406.9L249.3 433.3L246.6 451.4L254.7 463.9L262.8 468.8L275.0 470.2L290.6 468.1L292.6 447.9L317.0 434.7L315.6 429.2L343.3 408.3L349.4 396.5L348.7 383.2L364.3 365.9L365.0 357.5L371.8 355.4L356.2 336.6L339.3 336.6L335.2 339.4L329.1 337.3L323.0 325.5L327.8 322.7L327.1 311.6L314.9 308.1L301.4 319.3L296.0 319.3L287.2 313.7L273.7 317.9L263.5 324.1L257.4 322.0L260.1 310.2L268.2 305.3L265.5 297.7L261.5 291.4L254.0 285.2L229.1 278.0L221.9 293.4L216.6 339.6L213.5 342.6L213.5 342.6L224.9 341.7L234.4 346.4L239.8 340.8ZM210.8 706.0L212.1 690.7L228.3 668.4L223.6 662.9L217.5 662.9L208.7 647.6L195.8 648.3L174.9 655.9L157.3 646.9L152.5 628.8L135.6 618.4L139.7 607.2L156.6 612.8L162.7 621.1L173.5 619.7L186.4 610.7L202.6 621.1L224.3 623.2L225.6 626.0L235.8 626.7L252.7 617.7L243.9 606.5L239.8 606.5L229.0 596.8L232.4 593.3L260.1 592.6L256.1 584.3L271.6 582.9L282.4 594.0L293.9 592.6L299.4 601.0L305.4 601.0L309.5 595.4L317.6 595.4L327.8 604.4L342.0 606.5L347.4 598.2L352.1 584.3L358.9 583.6L369.0 572.4L377.8 570.4L422.5 571.8L422.5 582.9L436.0 583.6L442.1 568.3L449.6 564.1L446.9 548.1L421.8 543.2L414.4 537.0L409.0 528.6L416.4 516.1L413.7 503.6L396.8 485.5L387.3 486.2L367.7 468.1L352.1 485.5L316.3 474.4L311.5 478.5L290.6 468.1L275.0 470.2L262.8 468.8L254.7 463.9L246.6 451.4L249.3 433.3L241.2 406.9L236.4 399.2L229.0 399.2L229.7 390.9L297.3 379.8L300.7 359.6L312.9 355.4L310.2 348.5L293.9 352.6L270.3 342.9L239.8 340.8L234.4 346.4L224.9 341.7L224.3 350.4L221.7 356.0L224.9 369.8L223.4 376.7L206.9 387.9L196.9 423.7L179.5 435.4L169.1 449.9L165.7 474.0L152.7 501.0L152.6 515.7L163.7 532.6L163.5 544.7L135.0 562.9L124.1 580.0L99.4 597.6L91.7 606.4L68.7 621.8L59.3 625.5L50.1 634.1L41.4 645.1L44.3 662.2L44.3 662.2L89.8 679.7L125.7 690.8L162.3 698.6ZM384.6 639.2L397.5 654.5L404.2 654.5L411.0 664.3L415.7 664.3L415.7 645.5L425.9 612.1L435.5 583.5L422.5 582.9L422.5 571.8L377.8 570.4L369.0 572.4L358.9 583.6L352.1 584.3L347.4 598.2L342.0 606.5L342.0 606.5L354.2 619.1L368.4 619.7L381.9 629.5ZM349.4 396.5L343.3 408.3L315.6 429.2L317.0 434.7L292.6 447.9L290.6 468.1L311.5 478.5L316.3 474.4L352.1 485.5L366.0 470.0L377.8 454.9L377.2 436.8L381.2 424.3L389.3 425.0L376.5 396.5L377.2 388.1L390.0 381.2L397.5 374.2L383.3 374.2L380.5 363.1L383.9 355.4L371.8 355.4L371.8 355.4L365.0 357.5L364.3 365.9L348.7 383.2ZM422.5 329.0L399.5 334.6L397.5 346.4L403.6 355.4L417.8 357.5L420.5 363.1L425.9 363.8L442.8 360.3L448.2 339.4L461.7 340.8L463.1 331.8L472.6 326.2L493.5 308.1L510.4 307.4L519.9 284.5L515.9 281.0L517.9 272.0L515.2 264.3L509.1 261.5L489.5 257.3L482.7 251.1L452.3 257.3L445.5 253.2L417.1 255.9L417.1 255.9L418.4 294.9L424.5 310.9L424.5 324.8ZM389.3 425.0L387.5 424.8L391.4 434.0L421.8 444.5L436.7 455.6L444.8 455.6L451.6 449.3L463.1 430.5L492.2 427.1L488.1 412.5L488.1 397.9L480.0 381.2L472.6 379.8L472.6 366.6L480.7 361.7L482.7 356.1L481.4 350.6L466.5 350.6L459.1 340.4L453.6 339.4L448.2 339.4L442.8 360.3L425.9 363.8L420.5 363.1L417.8 357.5L403.6 355.4L399.5 374.2L397.5 374.2L397.5 374.2L390.0 381.2L377.2 388.1L376.5 396.5ZM470.5 518.2L461.1 488.3L461.1 473.7L475.3 460.5L482.0 459.8L480.7 442.4L492.2 427.1L463.1 430.5L451.6 449.3L444.8 455.6L436.7 455.6L421.8 444.5L391.4 434.0L387.5 424.8L381.2 424.3L377.2 436.8L377.8 454.9L366.0 470.0L367.7 468.1L387.3 486.2L396.8 485.5L413.7 503.6L416.4 516.1L409.0 528.6L411.5 532.5L411.5 532.5L421.8 533.5L427.9 527.9L465.8 528.6ZM480.7 361.7L493.5 363.8L494.9 355.4L523.3 357.5L533.5 361.0L537.5 349.9L549.0 334.6L551.7 326.2L551.0 293.5L559.8 285.9L559.2 275.4L548.3 274.7L547.0 281.0L519.6 284.2L510.4 307.4L493.5 308.1L472.6 326.2L463.1 331.8L461.7 340.8L459.1 340.4L459.1 340.4L466.5 350.6L481.4 350.6L482.7 356.1ZM517.9 380.5L521.3 371.4L532.2 360.6L523.3 357.5L494.9 355.4L493.5 363.8L480.7 361.7L472.6 366.6L472.6 379.8L480.0 381.2L488.1 397.9L488.1 412.5L492.2 427.1L492.2 427.1L511.8 412.5L513.8 399.2L506.4 390.9ZM491.0 123.6L505.8 122.4L508.9 136.9L496.7 138.4L493.3 154.1L487.6 158.4L481.5 169.4L481.6 173.9L489.5 172.5L496.2 180.8L498.3 219.8L507.1 230.2L518.6 230.9L521.0 211.8L531.4 202.4L539.2 198.4L542.2 183.7L558.3 165.5L569.1 143.2L558.3 119.6L563.0 84.0L559.1 77.8L553.1 77.8L544.0 68.0L543.1 63.1L528.4 53.7L521.9 52.8L493.8 66.6L470.3 66.4L470.8 68.4L457.9 87.2L457.9 87.2L478.8 93.8L484.5 115.0L489.1 118.5ZM540.9 260.8L549.7 258.0L563.9 249.0L559.2 237.9L553.1 236.5L549.0 229.5L546.3 212.1L549.7 203.1L588.3 166.2L601.1 162.7L609.9 151.6L604.5 146.7L602.5 132.1L617.3 134.9L624.8 130.1L625.3 106.1L620.7 106.4L613.3 93.2L605.2 88.3L597.0 93.2L573.4 91.1L563.0 84.0L558.3 119.6L569.1 143.2L558.3 165.5L542.2 183.7L539.2 198.4L531.4 202.4L521.0 211.8L518.6 230.9L509.1 241.3L509.1 261.5L509.1 261.5L515.2 264.3L516.5 268.0L529.4 260.8ZM559.8 285.9L551.0 293.5L551.7 326.2L549.0 334.6L537.5 349.9L533.6 360.5L559.8 363.8L566.6 374.2L565.9 382.6L573.4 397.9L584.2 404.8L606.5 397.9L606.5 381.9L586.9 380.5L583.5 368.6L584.9 355.4L606.5 349.9L611.9 325.5L624.8 315.8L623.4 258.0L608.6 265.0L588.9 264.3L563.9 249.0L549.7 258.0L540.9 260.8L529.4 260.8L516.5 268.0L517.9 272.0L515.9 281.0L519.6 284.2L519.6 284.2L547.0 281.0L548.3 274.7L559.2 275.4ZM619.4 248.3L614.6 243.4L614.0 236.5L602.5 233.0L598.4 226.7L606.5 216.3L605.2 187.8L631.6 187.1L632.9 161.4L615.3 146.7L616.4 134.7L602.5 132.1L604.5 146.7L609.9 151.6L601.1 162.7L588.3 166.2L549.7 203.1L546.3 212.1L549.0 229.5L553.1 236.5L559.2 237.9L563.9 249.0L563.9 249.0L588.9 264.3L608.6 265.0L623.4 258.0ZM510.4 464.6L517.9 468.8L517.9 475.1L522.0 479.9L528.7 479.9L537.5 490.4L542.2 493.2L545.6 498.7L584.2 500.1L609.2 484.8L605.8 476.5L605.8 441.7L614.3 407.4L606.4 397.9L584.2 404.8L573.4 397.9L565.9 382.6L566.6 374.2L559.8 363.8L532.2 360.6L521.3 371.4L517.9 380.5L506.4 390.9L513.8 399.2L511.8 412.5L491.7 427.9L491.7 427.9L502.3 431.9L501.7 444.5L505.0 454.9ZM528.8 671.1L529.7 622.2L524.1 604.4L524.1 581.3L508.0 572.4L497.2 577.3L479.0 572.4L473.0 564.4L449.7 566.2L456.3 582.2L455.0 601.7L467.8 615.6L468.4 622.2L468.4 622.2L476.6 631.6L480.7 631.6L505.7 647.6ZM497.2 577.3L508.0 572.4L524.1 581.3L524.1 604.4L529.7 622.2L528.8 671.1L530.1 680.5L550.9 687.2L601.1 697.0L621.5 688.6L623.2 673.4L615.0 660.5L604.6 651.2L601.1 651.2L595.9 644.0L592.0 644.0L587.7 638.7L584.2 638.7L580.4 632.0L575.6 633.4L570.0 630.7L568.7 626.2L563.9 627.1L561.7 625.3L561.7 607.1L577.8 583.5L593.3 580.8L602.4 574.6L601.6 564.8L586.4 566.6L570.4 558.1L572.1 547.4L545.7 536.3L538.8 523.8L543.5 509.6L543.8 495.7L528.7 479.9L522.0 479.9L517.9 475.1L517.9 468.8L510.4 464.6L505.0 454.9L501.7 444.5L502.3 431.9L491.7 427.9L480.7 442.4L482.0 459.8L475.3 460.5L461.1 473.7L461.1 488.3L470.5 518.2L465.8 528.6L427.9 527.9L421.8 533.5L411.5 532.5L414.4 537.0L421.8 543.2L446.9 548.1L449.0 564.4L449.0 564.4L449.7 566.2L473.0 564.4L479.0 572.4ZM545.6 498.7L543.8 495.7L543.5 509.6L538.8 523.8L545.7 536.3L572.0 548.3L572.0 548.3L580.4 541.6L575.6 514.5L578.6 499.9ZM570.4 558.1L586.4 566.6L601.6 564.8L611.5 548.8L611.1 521.6L617.2 510.5L623.2 510.9L629.7 519.8L642.7 523.8L643.1 507.8L608.9 484.0L584.2 500.1L578.6 499.9L578.6 499.9L575.6 514.5L580.4 541.6L572.0 548.3ZM691.1 649.7L684.3 636.4L686.4 607.2L705.3 588.4L720.2 579.4L724.9 571.8L710.0 541.1L693.1 533.5L649.1 532.8L642.7 523.8L629.7 519.8L623.2 510.9L617.2 510.5L611.1 521.6L611.5 548.8L601.6 564.8L602.4 574.6L593.3 580.8L577.8 583.5L561.7 607.1L561.7 625.3L563.9 627.1L568.7 626.2L570.0 630.7L575.6 633.4L580.4 632.0L584.2 638.7L587.7 638.7L592.0 644.0L595.9 644.0L601.1 651.2L604.6 651.2L615.0 660.5L623.2 673.4L622.0 684.5L622.0 684.5L630.2 690.0L651.2 685.8L666.7 693.5ZM724.9 571.8L720.2 579.4L705.3 588.4L686.4 607.2L684.3 636.4L688.7 645.1L701.9 651.1L736.4 637.8L731.7 623.9L732.4 588.4L735.1 575.9L750.0 567.6L759.4 566.2L756.0 564.1L758.1 552.3L770.9 540.5L789.9 542.5L794.6 533.5L795.3 520.3L778.4 519.6L773.6 500.1L756.7 491.1L750.0 483.4L743.9 461.2L703.3 460.5L698.5 473.7L687.7 473.7L681.6 482.0L668.8 474.4L655.2 474.4L655.9 480.6L635.6 485.5L631.5 498.6L643.1 507.8L642.7 523.8L642.7 523.8L649.1 532.8L693.1 533.5L710.0 541.1ZM634.9 748.4L636.0 775.0L674.3 769.3L712.3 770.7L788.0 780.3L795.4 778.3L801.8 782.6L825.9 786.4L827.5 789.3L830.1 785.5L834.2 785.7L836.5 788.8L839.1 785.4L848.2 787.3L849.2 783.5L853.6 784.4L856.8 780.1L859.3 780.8L861.8 778.9L871.8 781.4L876.2 776.8L891.1 776.9L892.3 778.6L897.7 777.9L901.6 779.6L910.8 775.8L918.1 778.1L918.4 775.9L923.8 776.2L951.7 779.5L957.9 781.9L960.0 777.7L964.6 778.5L961.6 769.8L948.2 752.0L939.4 744.9L908.3 691.4L890.7 668.4L844.0 667.1L833.8 674.7L821.0 674.7L810.2 662.9L810.8 656.6L833.8 622.5L826.4 612.1L806.8 601.0L803.3 567.3L779.7 580.1L772.3 578.7L761.5 566.9L746.8 569.3L735.1 575.9L732.4 588.4L731.7 623.9L736.4 637.8L701.9 651.1L688.7 645.1L691.1 649.7L666.7 693.5L666.7 693.5L678.9 718.5L677.6 727.6L643.7 737.3Z","vecinos":{"San Vicente":"M14.2 217.9L24.9 232.1L24.3 249.5L30.5 262.3L42.5 277.1L39.4 290.9L40.5 297.0L36.1 301.7L34.9 310.3L27.7 318.3L26.2 323.0L28.8 329.9L24.3 344.7L27.2 349.4L30.4 366.2L26.7 373.7L28.9 378.1L32.4 380.0L34.8 397.3L45.2 405.0L52.0 405.6L55.3 421.5L63.6 427.2L66.5 434.4L68.9 434.4L70.8 437.6L74.4 434.5L77.1 435.4L77.8 442.1L80.5 444.0L79.4 450.4L86.7 460.0L81.5 469.5L85.4 473.6L83.6 476.1L85.4 487.6L83.3 493.2L78.2 498.6L79.5 499.2L78.6 507.9L75.9 510.1L76.4 513.6L68.5 519.1L55.5 522.6L51.7 534.9L53.7 542.3L68.8 557.0L69.9 564.6L60.7 572.0L58.5 576.6L52.8 579.3L45.3 579.8L42.4 582.5L39.6 581.3L38.3 586.3L27.3 593.9L26.5 596.0L28.6 599.8L26.7 604.2L24.5 608.3L17.7 612.9L16.9 618.5L19.9 621.6L15.8 622.5L15.1 624.9L17.5 632.9L12.2 634.6L14.8 646.2L9.4 647.1L1.8 637.0L-5.8 635.8L-14.2 633.2L-14.7 636.2L15.2 653.7L32.1 656.9L44.3 662.2L41.4 645.1L50.1 634.1L59.3 625.5L68.7 621.8L91.7 606.4L99.4 597.6L124.1 580.0L135.0 562.9L163.5 544.7L163.7 532.6L152.6 515.7L152.7 501.0L165.7 474.0L169.1 449.9L179.5 435.4L196.9 423.7L205.8 389.9L211.0 384.6L221.6 379.2L224.6 373.8L221.7 356.0L224.3 350.4L225.2 337.5L229.7 324.1L231.7 300.4L238.9 285.2L238.7 278.3L234.0 266.9L238.3 258.6L246.3 250.3L250.7 250.3L259.2 255.5L266.9 249.0L268.8 245.4L268.1 233.5L274.7 226.7L279.2 226.1L281.8 221.7L282.7 217.4L280.3 208.2L284.2 202.7L290.3 202.8L298.8 208.0L302.8 207.8L316.6 202.2L326.3 203.1L340.0 200.0L350.6 193.2L364.5 188.3L370.2 179.7L369.8 171.0L373.3 163.2L379.0 154.9L386.5 152.0L389.9 147.7L391.9 132.1L399.7 127.1L409.3 114.8L425.7 107.0L427.7 99.9L430.7 97.1L460.5 81.9L468.4 75.1L478.7 57.8L459.5 30.4L457.7 24.7L447.4 19.3L435.7 21.5L428.1 19.0L424.6 1.3L423.4 -19.4L413.2 -19.7L406.4 -15.5L403.1 -16.1L395.5 -12.3L374.6 -12.5L371.5 -17.6L363.3 -10.1L355.0 -14.4L347.3 -10.2L339.6 -10.5L337.5 -19.3L339.6 -20.0L-20.0 -20.0L-20.0 191.9L-3.0 196.8L9.3 189.7Z","San Miguel":"M972.3 771.0L977.1 770.5L978.1 772.6L980.4 770.7L1003.9 771.7L1004.2 755.6L1020.0 717.0L1020.0 248.9L1004.7 245.0L995.8 251.3L987.0 261.7L979.5 242.0L957.1 224.1L948.3 221.8L949.9 219.5L942.8 217.8L939.6 205.8L946.6 201.3L950.6 193.0L945.2 185.8L944.9 182.8L950.6 182.4L941.4 173.7L941.8 169.9L937.2 168.4L940.9 164.4L937.1 160.3L934.6 163.2L934.1 161.6L927.7 160.5L927.9 162.7L894.7 174.1L893.7 162.1L889.6 159.3L879.3 160.0L873.4 165.2L854.9 164.2L857.4 162.4L862.4 163.2L861.2 156.6L824.9 142.7L819.5 118.7L804.2 103.7L801.2 91.1L790.2 85.7L790.4 82.6L786.2 78.1L778.3 85.7L778.6 83.4L772.5 77.1L764.8 42.3L770.2 23.3L771.4 10.9L775.3 8.6L780.1 10.6L782.2 7.9L791.4 9.3L809.5 5.0L818.5 0.1L829.0 -13.2L828.8 -20.0L423.3 -20.0L424.6 1.3L428.1 19.0L435.7 21.5L447.4 19.3L457.7 24.7L466.0 39.8L476.9 52.2L494.8 62.5L509.6 54.4L527.0 52.2L546.6 78.4L561.9 93.6L581.5 102.3L596.7 102.3L609.8 93.6L616.4 91.4L622.9 106.6L622.9 124.0L614.1 139.2L618.5 152.3L629.4 165.4L629.4 172.0L625.0 180.6L611.9 191.5L605.5 202.5L605.5 228.5L618.5 261.3L618.5 289.6L629.4 317.9L629.4 328.7L618.5 333.1L611.9 341.8L611.9 357.0L605.5 376.7L592.4 400.7L592.4 413.7L603.3 411.5L611.9 405.0L614.1 411.5L614.1 446.4L611.9 468.2L607.6 487.8L640.3 509.6L653.3 513.9L655.6 524.8L653.3 540.1L692.2 538.6L701.3 540.1L714.4 531.4L725.3 535.8L731.8 544.5L725.3 555.3L731.8 564.1L727.5 577.2L692.6 612.1L688.2 625.1L697.0 642.5L701.3 663.2L734.9 655.3L741.5 657.4L752.2 650.5L736.1 635.5L734.2 630.2L734.7 619.6L736.5 619.4L737.0 614.8L744.0 608.6L746.1 603.2L741.3 594.3L749.3 586.8L755.3 591.0L755.0 585.6L760.0 585.9L758.6 581.2L762.4 583.1L762.2 580.4L767.8 578.2L769.5 574.7L770.5 578.1L768.0 581.5L768.8 583.2L772.0 584.5L773.8 581.3L781.7 580.7L797.6 593.5L800.1 592.3L800.1 590.3L804.2 589.7L804.3 594.6L813.9 591.2L810.3 586.7L814.5 586.7L815.5 581.8L816.9 588.3L818.9 586.0L821.1 592.0L824.7 590.9L824.0 594.5L834.9 616.4L834.1 621.7L845.0 625.4L850.0 624.6L852.9 620.7L864.2 622.6L869.7 629.5L873.8 631.4L848.6 650.8L845.5 650.8L843.3 653.1L842.1 652.1L829.7 670.8L828.9 684.7L866.4 684.3L873.8 686.3L879.3 690.3L883.6 688.0L894.2 692.1L896.9 691.6L898.7 696.1L908.1 697.4L905.4 709.3L909.6 710.2L939.4 744.9L948.2 752.0L950.1 756.6L961.6 769.8L964.6 778.5L964.6 778.5L965.5 776.5L968.1 777.0L968.0 772.5Z","La Unión":"M1004.2 755.6L1004.4 770.5L1004.4 770.5L1008.1 772.8L1020.0 774.2L1020.0 717.0Z","Morazán":"M829.0 -13.2L818.5 0.1L809.5 5.0L791.4 9.3L782.2 7.9L780.1 10.6L775.3 8.6L771.4 10.9L770.2 23.3L764.8 42.3L772.5 77.1L778.6 83.4L778.3 85.7L786.2 78.1L790.4 82.6L790.2 85.7L801.2 91.1L804.2 103.7L819.5 118.7L824.9 142.7L861.2 156.6L862.4 163.2L857.4 162.4L854.7 164.0L873.8 165.1L879.3 160.0L884.3 160.5L887.4 158.3L893.6 161.8L894.7 174.1L927.9 162.7L927.7 160.5L934.1 161.6L934.6 163.2L937.1 160.3L940.9 164.4L937.2 168.4L941.8 169.9L941.4 173.7L950.6 182.4L944.9 182.8L945.2 185.8L950.6 193.0L946.6 201.3L939.6 205.8L942.8 217.8L949.9 219.5L948.3 221.8L957.1 224.1L979.5 242.0L987.0 261.7L995.8 251.3L1004.7 245.0L1020.0 248.9L1020.0 -20.0L828.8 -20.0Z","La Paz":"M1.3 636.7L9.5 647.2L14.8 646.2L12.2 634.6L17.5 632.9L15.1 624.9L15.8 622.5L19.9 621.6L16.9 618.5L17.7 612.9L24.5 608.3L26.7 604.2L28.6 599.8L26.5 596.0L27.3 593.9L38.3 586.3L39.6 581.3L42.2 582.5L45.6 579.7L52.8 579.3L58.5 576.6L60.7 572.0L63.2 571.1L69.9 564.6L69.6 558.5L53.4 541.8L51.4 537.1L52.2 531.7L55.0 527.8L55.5 522.6L68.5 519.1L76.4 513.6L75.9 510.1L78.6 507.9L79.5 499.2L78.2 498.6L83.3 493.2L85.4 487.6L83.6 476.1L85.4 473.6L81.5 469.5L86.7 460.0L79.4 450.4L80.5 444.0L77.8 442.1L77.1 435.4L74.4 434.5L70.8 437.6L68.9 434.4L66.5 434.4L63.6 427.2L55.3 421.5L52.0 405.6L45.2 405.0L34.8 397.3L32.4 380.0L28.9 378.1L26.7 373.7L30.4 366.2L27.2 349.4L24.3 344.7L28.8 329.9L26.2 323.0L27.7 318.3L34.9 310.3L36.1 301.7L40.5 297.0L39.4 290.9L42.5 277.1L30.5 262.3L24.3 249.5L24.9 232.1L14.2 217.9L9.3 189.7L-3.0 196.8L-20.0 191.9L-20.0 633.9L-14.7 636.2L-14.2 633.2Z","Cabañas":"M337.5 -19.3L339.6 -10.5L347.3 -10.2L355.0 -14.4L363.3 -10.1L371.5 -17.6L374.6 -12.5L395.5 -12.3L403.1 -16.1L406.4 -15.5L413.2 -19.7L423.9 -19.1L423.8 -20.0L339.6 -20.0Z"}}; /* MAPA-USU-FIN */

const PRECISION = {
  exacta:    { tag: "Ubicación exacta", cls: "exacta" },
  zona:      { tag: "Cantón ubicado",   cls: "zona" },
  municipio: { tag: "Municipio ubicado · cancha por confirmar", cls: "muni" }
};
function enlaceCancha(c) {
  if (c.maps) return c.maps;
  const q = typeof c.lat === "number" ? `${c.lat},${c.lng}` : `${c.cancha}, ${/^por confirmar/i.test(c.lugar || "") ? "" : c.lugar + ", "}Usulután, El Salvador`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
function mapaUsulutanHTML(lista) {
  if (typeof MAPA_USU === "undefined") return "";
  const M = MAPA_USU;
  const X = (lng) => ((lng - M.lng0) * M.k * M.kx), Y = (lat) => ((M.lat0 - lat) * M.k);
  const txt = (lng, lat, t, cls, anc = "middle") => `<text class="${cls}" x="${X(lng).toFixed(0)}" y="${Y(lat).toFixed(0)}" text-anchor="${anc}">${t}</text>`;
  // Cabeceras de referencia (coordenadas reales)
  const pueblos = [["Jiquilisco", 13.3197, -88.5728, "izq"],
    ["Santiago de María", 13.4861, -88.4711, "der"], ["Berlín", 13.4978, -88.5300, "izq"],
    ["Jucuarán", 13.2539, -88.2486, "der"], ["Santa Elena", 13.3833, -88.4167, "der"]];
  const conPunto = lista.filter((c) => typeof c.lat === "number");
  return `<svg viewBox="0 0 ${M.w} ${M.h}" role="img" aria-label="Mapa real del departamento de Usulután con las canchas de la LFFU">
      <defs>
        <pattern id="olas" width="34" height="18" patternUnits="userSpaceOnUse"><path d="M0 13q8.5-8 17 0t17 0" fill="none" class="m-ola"/></pattern>
        <clipPath id="clip-usu"><path d="${M.usu}"/></clipPath>
      </defs>
      <rect class="m-mar" width="${M.w}" height="${M.h}"/>
      <rect width="${M.w}" height="${M.h}" fill="url(#olas)"/>
      ${Object.values(M.vecinos).map((d) => `<path class="m-otro" d="${d}"/>`).join("")}
      <path class="m-usu" d="${M.usu}"/>
      <path class="m-muni" d="${M.muni}" clip-path="url(#clip-usu)"/>
      <path class="m-usu-borde" d="${M.usu}"/>
      ${txt(-88.70, 13.69, "SAN VICENTE", "m-vec-t")}${txt(-88.19, 13.70, "SAN MIGUEL", "m-vec-t")}
      ${txt(-88.50, 13.152, "OCÉANO PACÍFICO", "m-mar-t")}
      ${txt(-88.36, 13.635, "USULUTÁN", "m-nom")}
      ${pueblos.map(([n, lat, lng, lado]) => `<g class="m-pueblo"><circle cx="${X(lng).toFixed(1)}" cy="${Y(lat).toFixed(1)}" r="6"/>
        <text x="${(X(lng) + (lado === "izq" ? -11 : 11)).toFixed(1)}" y="${(Y(lat) + 22).toFixed(1)}" text-anchor="${lado === "izq" ? "end" : "start"}">${n}</text></g>`).join("")}
      ${conPunto.map((c) => {
        const x = X(c.lng).toFixed(1), y = Y(c.lat).toFixed(1), e = EQ.get(c.equipo);
        const izq = c.etiqueta === "izq", t = e ? e.corto : c.cancha.slice(0, 3).toUpperCase();
        const aprox = c.precision !== "exacta" && c.precision !== "zona";
        return `<a class="m-punto${aprox ? " aprox" : ""}${estado.cancha === c.id ? " sel" : ""}" data-cancha="${c.id}" href="#/canchas/${c.id}" aria-label="${esc(c.cancha)} (${esc(c.equipo)})">
          <circle class="m-halo" cx="${x}" cy="${y}" r="40"/>
          ${aprox ? `<circle class="m-zona" cx="${x}" cy="${y}" r="32"/>` : ""}
          <circle class="m-dot" cx="${x}" cy="${y}" r="16" style="--c:${e ? e.color : "#101c4e"}"/>
          <text class="m-etq" x="${(+x + (izq ? -24 : 24)).toFixed(1)}" y="${(+y + 10).toFixed(1)}" text-anchor="${izq ? "end" : "start"}">${t}</text>
        </a>`;
      }).join("")}
    </svg>`;
}

function renderCanchas() {
  const lista = T.canchas;
  const pendientes = lista.filter((c) => typeof c.lat !== "number");
  app.innerHTML = `
    <div class="jornada-cab" data-reveal="left">
      <h2>Canchas <span>de la liga</span></h2>
      <span class="fecha-j">${lista.length} sedes · Departamento de Usulután</span>
    </div>
    <div class="canchas-grid">
      <figure class="tarjeta mapa" data-reveal="left">
        ${mapaUsulutanHTML(lista)}
        <figcaption>
          <span class="ley"><i class="ley-dot"></i>Cantón ubicado</span>
          <span class="ley"><i class="ley-dot aprox"></i>Solo municipio (aprox.)</span>
          <span class="ley-nota">Mapa real del departamento · toca un punto para ver la ficha</span>
        </figcaption>
        ${pendientes.length ? `<div class="canchas-pend">
          <b>Aún sin punto en el mapa</b>
          <p>No hay registro público de dónde quedan estas canchas; se marcarán apenas la liga comparta su ubicación.</p>
          <div class="pend-chips">${pendientes.map((c) => `<a class="eq-chip" href="#/canchas/${c.id}" data-cancha="${c.id}">${escudo(c.equipo)}${esc(c.cancha.replace(/^Cancha /, ""))}</a>`).join("")}</div>
        </div>` : ""}
      </figure>
      <div class="canchas-lista">
        ${lista.map((c, i) => {
          const pr = PRECISION[c.precision] || { tag: "Ubicación por confirmar", cls: "pend" };
          return `
          <article class="tarjeta cancha${estado.cancha === c.id ? " sel" : ""}" id="cancha-${c.id}" data-reveal="right" style="--d:${i * .05}s">
            <div class="cancha-cab">${escudo(c.equipo)}<b>${esc(c.cancha)}</b></div>
            <p class="cancha-lugar">📍 ${esc(c.lugar)}${c.alias ? " · «" + esc(c.alias) + "»" : ""}</p>
            <p class="cancha-det">${esc(c.detalle)}</p>
            ${c.fuente ? `<p class="cancha-fuente">${esc(c.fuente)}</p>` : ""}
            <div class="cancha-tags">
              <span class="tag">${esc(c.equipo)}</span>
              ${c.superficie ? `<span class="tag">${esc(c.superficie)}</span>` : ""}
              <span class="tag ${pr.cls}">${pr.tag}</span>
            </div>
            <a class="cancha-mapa-link" href="${esc(enlaceCancha(c))}" target="_blank" rel="noopener">${typeof c.lat === "number" ? "Abrir en Google Maps ↗" : "Buscar en Google Maps ↗"}</a>
          </article>`;
        }).join("")}
      </div>
    </div>`;
}

function renderLiga() {
  const partidos = T.jornadas.reduce((n, j) => n + j.partidos.length, 0);
  app.innerHTML = `
    <article class="tarjeta liga-art" data-reveal="up">
      <h2>La Liga · Información general</h2>
      <p class="muted">${esc(T.siglas)} · ${esc(T.temporada)} · ${esc(T.nombre)}</p>
      <h3>1. El torneo</h3>
      <p>La <b>${esc(T.nombre)}</b> reúne a <b>${T.equipos.length} equipos</b> del departamento de Usulután en el torneo <b>${esc(T.temporada)}</b>.
        Los partidos son de <b>11 contra 11</b>, en <b>dos tiempos de 45 minutos</b>, y se juegan los viernes y sábados por la tarde en la cancha del equipo local.</p>
      <div class="equipos-chips" style="margin:10px 0 4px">${T.equipos.map(e => `<span class="eq-chip">${escudo(e.nombre)}${esc(e.nombre)}</span>`).join("")}</div>
      <h3>2. Formato</h3>
      <div class="fases">
        <div class="fase"><span class="fase-num2">Fase I</span><h4>Fase regular</h4>
          <ul><li><b>Todos contra todos, ida y vuelta:</b> ${NJ} jornadas y ${partidos} partidos.</li>
          <li><b>Puntos:</b> 3 por victoria, 1 por empate y 0 por derrota.</li>
          <li><b>Desempate en la tabla:</b> puntos → victorias → diferencia de gol → goles a favor.</li>
          <li>Los <b>${T.clasificados} primeros</b> clasifican a la fase final.</li></ul></div>
        <div class="fase"><span class="fase-num2">Fase II</span><h4>Fase final</h4>
          <ul><li><b>Cuartos de final:</b> ida y vuelta.</li>
          <li><b>Semifinales:</b> las 3 ganadoras de cuartos y la mejor perdedora, ida y vuelta.</li>
          <li><b>Tercer lugar:</b> un partido, 1:30 p.m.</li>
          <li><b>Gran final:</b> un partido, 3:30 p.m. La organiza la ${esc(T.siglas)}.</li></ul></div>
      </div>
      <p><a href="#/playoffs" data-ir="playoffs">Ver cómo van los cruces de la fase final ›</a></p>
      <h3>3. Datos y correcciones</h3>
      <p>Este sitio se actualiza después de cada jornada con los resultados oficiales de la liga. Si ves un dato que no cuadra, avísanos y lo corregimos.</p>
      <div class="contacto-caja">
        <b>Contacto de la liga</b>
        <p style="margin:8px 0 4px">📱 WhatsApp: <a href="https://wa.me/15107798559" target="_blank" rel="noopener">${esc(T.contacto.whatsapp)}</a></p>
        <p>📍 ${esc(T.contacto.lugar)}</p>
      </div>
      ${T.lema ? `<p class="liga-lema">“${esc(T.lema)}”</p>` : ""}
    </article>`;
}

/* ---------- Contadores ---------- */
function animarContadores() {
  app.querySelectorAll("[data-contador]").forEach(el => {
    const target = +el.dataset.contador, t0 = performance.now(), dur = 1300;
    (function paso(t) {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e);
      if (p < 1) requestAnimationFrame(paso);
    })(t0);
  });
}

/* ---------- Render maestro ---------- */
function render() {
  document.querySelectorAll("#tabs button").forEach(b =>
    b.setAttribute("aria-selected", b.dataset.tab === estado.tab ? "true" : "false"));
  ({ inicio: renderInicio, posiciones: renderPosiciones, resultados: renderResultados,
     goleadoras: renderGoleadoras, playoffs: renderPlayoffs, canchas: renderCanchas, liga: renderLiga })[estado.tab]();
  observar();
  let h = "#/" + estado.tab;
  if (estado.tab === "resultados") h += "/" + estado.jornada;
  if (estado.tab === "canchas" && estado.cancha) h += "/" + estado.cancha;
  try { history.replaceState(null, "", h); } catch (e) {}
  tic();
}

/* ---------- Eventos ---------- */
document.getElementById("tabs").addEventListener("click", e => {
  const b = e.target.closest("button[data-tab]");
  if (b) irATab(b.dataset.tab);
});
document.addEventListener("click", e => {
  const ir = e.target.closest("[data-ir]");
  if (ir) {
    e.preventDefault();
    const jor = ir.dataset.jor ? +ir.dataset.jor : null;
    irATab(ir.dataset.ir, jor ? () => { estado.jornada = jor; } : null);
    return;
  }
  const jn = e.target.closest("[data-jor-nav]");
  if (jn && !jn.disabled) { estado.jornada = Math.min(NJ, Math.max(1, estado.jornada + (+jn.dataset.jorNav))); render(); return; }
  const jb = e.target.closest(".jornadas-lista button[data-jor]");
  if (jb) { estado.jornada = +jb.dataset.jor; render(); return; }
  const mp = e.target.closest(".m-punto[data-cancha]");
  if (mp) {
    e.preventDefault();
    estado.cancha = mp.dataset.cancha;
    app.querySelectorAll(".m-punto.sel,.cancha.sel").forEach(x => x.classList.remove("sel"));
    mp.classList.add("sel");
    const card = document.getElementById("cancha-" + estado.cancha);
    if (card) { card.classList.add("sel"); card.scrollIntoView({ behavior: sinMov() ? "auto" : "smooth", block: "center" }); }
  }
});

/* ---------- Arranque ---------- */
if (!(T.goleadoras || []).length) {
  const bg = document.querySelector('#tabs button[data-tab="goleadoras"]');
  if (bg) bg.remove();
}
document.getElementById("fr-ja").textContent = JA;
document.getElementById("fr-ticks").innerHTML = Array.from({ length: NJ }, (_, i) => `<i class="${i < JA ? "ok" : ""}"></i>`).join("");
document.getElementById("pie-act").textContent = "Actualizado: " + fecha(T.actualizado, { day: "numeric", month: "long", year: "numeric" });
const h = location.hash.replace(/^#\//, "").split("/");
if (["inicio", "posiciones", "resultados", "playoffs", "canchas", "liga"].concat((T.goleadoras || []).length ? ["goleadoras"] : []).includes(h[0])) {
  estado.tab = h[0];
  if (h[0] === "resultados" && +h[1]) estado.jornada = Math.min(NJ, Math.max(1, +h[1]));
  if (h[0] === "canchas" && h[1]) estado.cancha = h[1];
}
render();
})();