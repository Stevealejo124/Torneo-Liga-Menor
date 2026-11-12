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
  T.jornadas.forEach(j => j.partidos.forEach(p => {
    const r = parseRes(p.resultado);
    if (!r || r.gl == null) return;
    const L = por.get(p.local), V = por.get(p.visitante);
    if (!L || !V) return;
    L.pj++; V.pj++; L.gf += r.gl; L.gc += r.gv; V.gf += r.gv; V.gc += r.gl;
    if (r.gl > r.gv) { L.g++; V.p++; L.forma.push("G"); V.forma.push("P"); }
    else if (r.gl < r.gv) { V.g++; L.p++; V.forma.push("G"); L.forma.push("P"); }
    else { L.e++; V.e++; L.forma.push("E"); V.forma.push("E"); }
  }));
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
    items.push(`<span class="ticker-item"><em>J${P.j.numero}</em> ${esc(p.local)} vs ${esc(p.visitante)} · ${esc(p.hora || "")}</span>`));
  const html = items.join("");
  return `<div class="ticker" data-reveal="up"><div class="ticker-track">${html}${html}</div></div>`;
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
      `<div class="cruce">${escudo(p.local)}<span>${esc(p.local)}</span><em>vs</em><span>${esc(p.visitante)}</span>${escudo(p.visitante)}<span class="h">${esc(p.hora || "")}</span></div>`).join("");
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
      <p class="cuenta-fecha">${esc(fecha(j.fecha))}</p>
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
        ${tabla.slice(0, 5).map((f, i) => `
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
    <section class="bloque" data-reveal="up">
      <h2 class="titulo-bloque">Los 8 equipos <small>Temporada ${esc(T.temporada)}</small></h2>
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
    <p class="tabla-nota" data-reveal="up"><i></i>Las primeras ${T.clasificados} posiciones clasifican a semifinales. Desempate: puntos → victorias → diferencia de gol → goles a favor.</p>`;
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
      <span class="fecha-j">${esc(fecha(j.fecha))}</span>
    </div>
    <div class="partidos">
      ${j.partidos.map((p, i) => {
        const r = parseRes(p.resultado);
        const jugado = r && r.gl != null;
        const marc = jugado
          ? `<div class="marcador">${r.gl}<span class="sep">–</span>${r.gv}</div>`
          : `<div class="marcador pendiente">${p.hora ? esc(p.hora) : "POR JUGAR"}</div>`;
        const pl = jugado && r.gl < r.gv ? " perdio" : "", pv = jugado && r.gv < r.gl ? " perdio" : "";
        return `<article class="tarjeta partido" data-reveal="up" style="--d:${i * .07}s">
          <div class="partido-meta">📍 <b>${esc(p.cancha || "")}</b>${p.hora ? " · " + esc(p.hora) : ""}</div>
          <div class="partido-fila">
            <div class="eq local${pl}"><span class="n">${esc(p.local)}</span>${escudo(p.local)}</div>
            ${marc}
            <div class="eq${pv}">${escudo(p.visitante)}<span class="n">${esc(p.visitante)}</span></div>
          </div>
          ${jugado && r.nota ? `<div class="nota-res">${esc(r.nota)}</div>` : ""}
        </article>`;
      }).join("")}
    </div>`;
}

function renderGoleadoras() {
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
  const seed = n => tabla[n - 1];
  const fila = (s, placeholder) => s
    ? `<div class="fila"><span class="seed">${s.pos}º</span>${escudo(s.nombre)}<span class="n">${esc(s.nombre)}</span></div>`
    : `<div class="fila"><span class="seed">–</span><span class="n por-definir">${placeholder}</span></div>`;
  const s = n => { const f = seed(n); return f ? { ...f, pos: n } : null; };
  app.innerHTML = `
    <div class="jornada-cab" data-reveal="left"><h2>Playoffs <span>LFFU</span></h2></div>
    <div class="aviso-proy" data-reveal="up">📊 <b>${completa ? "Cruces confirmados." : "Proyección:"}</b>
      ${completa ? "Así quedaron los cruces de la fase final." : `así quedarían los cruces si la fase regular terminara hoy (jornada ${JA} de ${NJ}). Se confirman al finalizar la jornada ${NJ}.`}</div>
    <div class="bracket-wrap" data-reveal="zoom">
      <div class="bracket">
        <div class="ronda"><h3>Semifinales</h3><div class="ronda-col">
          <div class="tarjeta llave"><div class="llave-id">Semifinal 1</div>${fila(s(1), "1º de la tabla")}${fila(s(4), "4º de la tabla")}</div>
          <div class="tarjeta llave"><div class="llave-id">Semifinal 2</div>${fila(s(2), "2º de la tabla")}${fila(s(3), "3º de la tabla")}</div>
        </div></div>
        <div class="ronda"><h3>Final</h3><div class="ronda-col">
          <div class="tarjeta llave final"><div class="llave-id">🏆 Gran Final</div>
            <div class="fila"><span class="n por-definir">Ganadora Semifinal 1</span></div>
            <div class="fila"><span class="n por-definir">Ganadora Semifinal 2</span></div>
          </div>
        </div></div>
        <div class="ronda"><h3>Campeona</h3><div class="ronda-col">
          <div class="campeon-caja"><b>Copa LFFU</b><p style="margin-top:6px;font-size:.9rem;color:#c6cdf0">La gloria espera en Usulután ✨</p></div>
        </div></div>
      </div>
    </div>`;
}

function renderCanchas() {
  const lista = T.canchas;
  app.innerHTML = `
    <div class="jornada-cab" data-reveal="left">
      <h2>Canchas <span>de la liga</span></h2>
      <span class="fecha-j">${lista.length} sedes · Departamento de Usulután</span>
    </div>
    <div class="canchas-grid">
      <figure class="tarjeta mapa" data-reveal="left">
        <svg viewBox="0 0 560 620" role="img" aria-label="Mapa de canchas de la LFFU en Usulután">
          <defs><pattern id="olas" width="26" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 10q6.5-6 13 0t13 0" fill="none" class="m-ola"/></pattern></defs>
          <rect class="m-mar" width="560" height="620"/>
          <rect width="560" height="620" fill="url(#olas)"/>
          <path class="m-dep m-usu" d="M40 60 L300 30 L520 80 L540 260 L500 380 L430 430 L340 470 L250 500 L150 470 L70 400 L30 250 Z"/>
          <text class="m-nom" x="120" y="150">USULUTÁN</text>
          <text class="m-mar-t" x="150" y="580">OCÉANO PACÍFICO</text>
          ${[
            ["federal", 150, 300, "FED", "izq"], ["el-palmo", 130, 340, "PAL", "izq"],
            ["galingagua", 400, 140, "GAL", "der"], ["usuluteca", 420, 290, "USU", "der"],
            ["guadalupano", 450, 255, "GUA", "der"], ["balboa", 390, 320, "VEN", "der"],
            ["el-nigre", 190, 430, "EST", "izq"], ["miramar", 230, 410, "CUS", "der"]
          ].map(([id, x, y, t, lado]) => {
            const c = lista.find(k => k.id === id); const e = c ? EQ.get(c.equipo) : null;
            return `<a class="m-punto${estado.cancha === id ? " sel" : ""}" data-cancha="${id}" href="#/canchas/${id}" aria-label="${esc(c ? c.cancha : id)}">
              <circle class="m-halo" cx="${x}" cy="${y}" r="26"/>
              <circle class="m-dot" cx="${x}" cy="${y}" r="11" style="--c:${e ? e.color : "#101c4e"}"/>
              <text class="m-etq" x="${lado === "izq" ? x - 18 : x + 18}" y="${y + 6}" text-anchor="${lado === "izq" ? "end" : "start"}">${t}</text>
            </a>`;
          }).join("")}
        </svg>
        <figcaption><span>Toca un punto para ver la ficha de la cancha.</span></figcaption>
      </figure>
      <div class="canchas-lista">
        ${lista.map((c, i) => `
          <article class="tarjeta cancha${estado.cancha === c.id ? " sel" : ""}" id="cancha-${c.id}" data-reveal="right" style="--d:${i * .05}s">
            <div class="cancha-cab">${escudo(c.equipo)}<b>${esc(c.cancha)}</b></div>
            <p class="cancha-lugar">📍 ${esc(c.lugar)}${c.alias ? " · «" + esc(c.alias) + "»" : ""}</p>
            <p class="cancha-det">${esc(c.detalle)}</p>
            <div class="cancha-tags">
              <span class="tag">${esc(c.equipo)}</span>
              ${c.superficie ? `<span class="tag">${esc(c.superficie)}</span>` : ""}
              <span class="tag ${c.exacta ? "exacta" : ""}">${c.exacta ? "Ubicación exacta" : "Ubicación aprox."}</span>
            </div>
            <a class="cancha-mapa-link" href="${esc(c.maps)}" target="_blank" rel="noopener">Abrir en Google Maps ↗</a>
          </article>`).join("")}
      </div>
    </div>`;
}

function renderLiga() {
  app.innerHTML = `
    <article class="tarjeta liga-art" data-reveal="up">
      <h2>La Liga · Formato y reglamento</h2>
      <p class="muted">LFFU · Temporada ${esc(T.temporada)} · Liga de Fútbol Femenino Usulután</p>
      <h3>1. Presentación</h3>
      <p>La LFFU es la liga de fútbol femenino de Usulután, abierta a todas las edades y a todos los equipos del departamento. Nació para que cada jugadora tenga una cancha, un calendario y una afición que la respalde. <b>Juntas por el fútbol femenino.</b></p>
      <h3>2. Sistema de competencia</h3>
      <div class="fases">
        <div class="fase"><span class="fase-num2">Fase I</span><h4>Temporada regular</h4>
          <ul><li><b>Participantes:</b> ${T.equipos.length} equipos.</li>
          <li><b>Formato:</b> todos contra todos, ida y vuelta (${NJ} jornadas).</li>
          <li><b>Puntuación:</b> 3 por victoria, 1 por empate, 0 por derrota.</li>
          <li><b>Desempate:</b> puntos → victorias → diferencia de gol → goles a favor.</li></ul></div>
        <div class="fase"><span class="fase-num2">Fase II</span><h4>Playoffs</h4>
          <ul><li>Clasifican las <b>${T.clasificados} primeras</b> de la tabla.</li>
          <li><b>Semifinales:</b> 1ª vs 4ª y 2ª vs 3ª.</li>
          <li><b>Gran final:</b> las dos ganadoras disputan la Copa LFFU.</li></ul></div>
      </div>
      <h3>3. Espíritu de la liga</h3>
      <p>Cada jornada es una fiesta deportiva: respeto a las árbitras, a las rivales y a la afición. Las transmisiones en vivo por la página oficial de la LFFU acercan cada jugada a quienes no pueden estar en la cancha.</p>
      <h3>4. Datos y correcciones</h3>
      <p>Este sitio se actualiza después de cada jornada. Si ves un resultado, nombre o fecha que no cuadra, avísanos y lo corregimos.</p>
      <div class="contacto-caja">
        <b>Contacto de la liga</b>
        <p style="margin:8px 0 4px">📱 WhatsApp: <a href="https://wa.me/15107798559" target="_blank" rel="noopener">${esc(T.contacto.whatsapp)}</a></p>
        <p>📍 ${esc(T.contacto.lugar)}</p>
      </div>
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
document.getElementById("fr-ja").textContent = JA;
document.getElementById("fr-ticks").innerHTML = Array.from({ length: NJ }, (_, i) => `<i class="${i < JA ? "ok" : ""}"></i>`).join("");
document.getElementById("pie-act").textContent = "Actualizado: " + fecha(T.actualizado, { day: "numeric", month: "long", year: "numeric" });
const h = location.hash.replace(/^#\//, "").split("/");
if (["inicio", "posiciones", "resultados", "goleadoras", "playoffs", "canchas", "liga"].includes(h[0])) {
  estado.tab = h[0];
  if (h[0] === "resultados" && +h[1]) estado.jornada = Math.min(NJ, Math.max(1, +h[1]));
  if (h[0] === "canchas" && h[1]) estado.cancha = h[1];
}
render();
})();