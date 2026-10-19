/* Lógica del sitio. No es necesario editar este archivo:
   todos los datos se cambian en datos.js */
(function () {
  "use strict";

  const T = window.TORNEO;
  const app = document.getElementById("app");
  if (!T) {
    app.innerHTML = '<div class="aviso aviso-error"><b>No se pudo cargar datos.js.</b> ' +
      "Revisa que el archivo exista junto a index.html y que no tenga errores de escritura " +
      "(una coma o comilla faltante suele ser la causa).</div>";
    return;
  }

  /* ------------------------------------------------------------------ */
  /* Configuración básica                                               */
  /* ------------------------------------------------------------------ */
  const CATS = T.categorias || [];
  const NJ = T.totalJornadas || Math.max(1, (T.escuelas || []).length - 1);
  const NCLAS = T.clasificados || 8;
  const JORNADAS = [...(T.jornadas || [])].sort((a, b) => a.numero - b.numero);
  const PALETA = ["#0b6e3f", "#13315c", "#b45309", "#7c3aed", "#be123c", "#0e7490", "#4d7c0f",
    "#9d174d", "#1d4ed8", "#a16207", "#0f766e", "#6d28d9", "#c2410c", "#334155"];

  const ESCUELAS = new Map();
  (T.escuelas || []).forEach((e, i) => {
    ESCUELAS.set(e.nombre, {
      nombre: e.nombre,
      corto: e.corto || siglas(e.nombre),
      color: e.color || PALETA[i % PALETA.length],
      sinCategorias: e.sinCategorias || []
    });
  });

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
  };

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function siglas(nombre) {
    const limpio = nombre.replace(/^(E\.?\s*F\.?|Escuela( de)? F[uú]tbol|Academia)\s*/i, "").trim();
    const palabras = limpio.split(/\s+/).filter((w) => /^[A-ZÁÉÍÓÚÑ0-9]/.test(w));
    if (palabras.length >= 2) return palabras.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
    return (palabras[0] || limpio).slice(0, 3).toUpperCase();
  }

  function fecha(f, opciones) {
    if (!f) return "";
    const m = String(f).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return String(f);
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.toLocaleDateString("es-SV", opciones || { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  /* "2-1", "3-0 W.O.", "1-1 (4-3)", "Suspendido", "" */
  function parseRes(v) {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s) return null;
    const m = s.match(/^(\d+)\s*[-–:]\s*(\d+)(?:\s*\(\s*(\d+)\s*[-–:]\s*(\d+)\s*\))?\s*(.*)$/);
    if (!m) return { texto: s };
    return {
      gl: +m[1], gv: +m[2],
      pl: m[3] != null ? +m[3] : null,
      pv: m[4] != null ? +m[4] : null,
      nota: (m[5] || "").trim()
    };
  }

  function escudo(nombre, grande) {
    const e = ESCUELAS.get(nombre);
    if (!e) return `<span class="escudo${grande ? " grande" : ""}" style="background:#cbd2db">?</span>`;
    return `<span class="escudo${grande ? " grande" : ""}" style="background:${esc(e.color)}" aria-hidden="true">${esc(e.corto)}</span>`;
  }

  /* ------------------------------------------------------------------ */
  /* Validación de datos (ayuda a quien edita datos.js)                 */
  /* ------------------------------------------------------------------ */
  const errores = [];
  (function validar() {
    if (ESCUELAS.size !== (T.escuelas || []).length) errores.push("Hay escuelas repetidas en la lista de escuelas.");
    const cruces = new Map();
    JORNADAS.forEach((j) => {
      const vistos = new Set();
      (j.partidos || []).forEach((p) => {
        [p.local, p.visitante].forEach((n) => {
          if (!ESCUELAS.has(n)) errores.push(`Jornada ${j.numero}: la escuela "${n}" no está escrita igual que en la lista de escuelas.`);
          else if (vistos.has(n)) errores.push(`Jornada ${j.numero}: "${n}" aparece en más de un partido.`);
          vistos.add(n);
        });
        const clave = [p.local, p.visitante].sort().join(" | ");
        if (cruces.has(clave)) errores.push(`"${p.local}" vs "${p.visitante}" aparece en la jornada ${cruces.get(clave)} y en la ${j.numero}.`);
        else cruces.set(clave, j.numero);
        Object.keys(p.resultados || {}).forEach((c) => {
          if (!CATS.includes(c)) errores.push(`Jornada ${j.numero} (${p.local} vs ${p.visitante}): categoría desconocida "${c}".`);
        });
      });
    });
    (T.ajustes || []).forEach((a) => {
      if (!ESCUELAS.has(a.escuela)) errores.push(`Ajuste de puntos: la escuela "${a.escuela}" no existe.`);
    });
  })();

  /* ------------------------------------------------------------------ */
  /* Cálculos                                                           */
  /* ------------------------------------------------------------------ */
  function calcularTabla(cat) {
    const filas = [...ESCUELAS.values()].filter((e) => !e.sinCategorias.includes(cat)).map((e) => ({
      nombre: e.nombre, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, ajuste: 0, motivos: [], forma: []
    }));
    const por = new Map(filas.map((f) => [f.nombre, f]));

    JORNADAS.forEach((j) => (j.partidos || []).forEach((p) => {
      const r = parseRes(p.resultados && p.resultados[cat]);
      if (!r || r.gl == null) return;
      const L = por.get(p.local), V = por.get(p.visitante);
      if (!L || !V) return;
      L.pj++; V.pj++;
      L.gf += r.gl; L.gc += r.gv; V.gf += r.gv; V.gc += r.gl;
      if (r.gl > r.gv) { L.g++; V.p++; L.forma.push("G"); V.forma.push("P"); }
      else if (r.gl < r.gv) { V.g++; L.p++; V.forma.push("G"); L.forma.push("P"); }
      else { L.e++; V.e++; L.forma.push("E"); V.forma.push("E"); }
    }));

    (T.ajustes || []).forEach((a) => {
      if (a.categoria !== cat && a.categoria !== "Todas") return;
      const f = por.get(a.escuela);
      if (f) { f.ajuste += Number(a.puntos) || 0; f.motivos.push(a); }
    });

    filas.forEach((f) => { f.dg = f.gf - f.gc; f.pts = f.g * 3 + f.e + f.ajuste; });
    filas.sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.nombre.localeCompare(b.nombre, "es"));
    return filas;
  }

  function jornadaActual() {
    let ult = 0;
    JORNADAS.forEach((j) => {
      const conRes = (j.partidos || []).some((p) => CATS.some((c) => {
        const r = parseRes(p.resultados && p.resultados[c]);
        return r && r.gl != null;
      }));
      if (conRes) ult = Math.max(ult, j.numero);
    });
    return ult;
  }

  const LLAVES = [
    { id: "C1", ronda: 0, seeds: [1, 8] },
    { id: "C2", ronda: 0, seeds: [4, 5] },
    { id: "C3", ronda: 0, seeds: [2, 7] },
    { id: "C4", ronda: 0, seeds: [3, 6] },
    { id: "S1", ronda: 1, de: ["C1", "C2"] },
    { id: "S2", ronda: 1, de: ["C3", "C4"] },
    { id: "F", ronda: 2, de: ["S1", "S2"] }
  ];
  const NOMBRE_LLAVE = { C1: "Cuartos 1", C2: "Cuartos 2", C3: "Cuartos 3", C4: "Cuartos 4", S1: "Semifinal 1", S2: "Semifinal 2", F: "Gran Final" };

  function calcularPlayoffs(cat) {
    const tabla = calcularTabla(cat);
    const completa = JA >= NJ;
    const datos = (T.playoffs && T.playoffs[cat]) || {};
    const res = {};
    LLAVES.forEach((l) => {
      let d = datos[l.id];
      if (typeof d === "string") d = { resultado: d };
      d = d || {};
      let local, visitante, etL, etV;
      if (l.seeds) {
        local = d.local || (tabla[l.seeds[0] - 1] || {}).nombre;
        visitante = d.visitante || (tabla[l.seeds[1] - 1] || {}).nombre;
        etL = l.seeds[0] + "º"; etV = l.seeds[1] + "º";
      } else {
        local = d.local || res[l.de[0]].ganador;
        visitante = d.visitante || res[l.de[1]].ganador;
        etL = ""; etV = "";
      }
      const r = parseRes(d.resultado);
      let ganador = null;
      if (r && r.gl != null && local && visitante) {
        if (r.gl > r.gv) ganador = local;
        else if (r.gv > r.gl) ganador = visitante;
        else if (r.pl != null && r.pl !== r.pv) ganador = r.pl > r.pv ? local : visitante;
      }
      res[l.id] = Object.assign({}, l, { local, visitante, etL, etV, r, ganador, fecha: d.fecha, cancha: d.cancha });
    });
    return { res, completa, tabla };
  }

  /* ------------------------------------------------------------------ */
  /* Estado (se guarda en la URL para poder compartir enlaces)          */
  /* ------------------------------------------------------------------ */
  const TABS = ["inicio", "posiciones", "resultados", "playoffs", "reglamento"];
  const JA = jornadaActual();
  const estado = {
    tab: "inicio",
    cat: store.get("reddfut-cat") || CATS[0],
    jornada: JA || 1,
    todas: store.get("reddfut-todas") === "1"
  };
  (function leerHash() {
    const partes = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/");
    if (TABS.includes(partes[0])) estado.tab = partes[0];
    const c = CATS.find((x) => x.toLowerCase() === (partes[1] || "").toLowerCase());
    if (c) estado.cat = c;
    const jn = parseInt(partes[2], 10);
    if (jn >= 1 && jn <= NJ) estado.jornada = jn;
  })();
  if (!CATS.includes(estado.cat)) estado.cat = CATS[0];

  function guardarHash() {
    let h = "#/" + estado.tab;
    if (estado.tab !== "reglamento" && estado.tab !== "inicio") h += "/" + estado.cat.toLowerCase();
    if (estado.tab === "resultados") h += "/" + estado.jornada;
    try { history.replaceState(null, "", h); } catch (e) { /* vista previa */ }
    store.set("reddfut-cat", estado.cat);
  }

  /* ------------------------------------------------------------------ */
  /* Render: cabecera, avisos, navegación                               */
  /* ------------------------------------------------------------------ */
  function renderCabecera() {
    document.getElementById("org").textContent = T.organizador || "";
    const mN = String(T.nombre || "").match(/^(.*?)\s+(\d{4}-\d{4})$/);
    document.getElementById("nombre-torneo").innerHTML = mN ? `${esc(mN[1])} <span class="anio">${esc(mN[2])}</span>` : esc(T.nombre || "");
    document.getElementById("subtitulo").textContent = T.subtitulo || "";
    document.getElementById("pie-org").textContent = T.organizador || "";
    document.title = `${T.nombre} · ${T.organizador}`;
    const act = T.actualizado ? "Actualizado: " + fecha(T.actualizado, { day: "numeric", month: "long", year: "numeric" }) : "";
    document.getElementById("pie-act").textContent = act;
    const pct = Math.round((JA / NJ) * 100);
    document.getElementById("progreso").innerHTML = `
      <div class="progreso-txt">
        <span>${JA ? `Fase regular · Jornada <b>${JA}</b> de ${NJ}` : "Fase regular · Por iniciar"}</span>
        <span>${esc(act)}</span>
      </div>
      <div class="barra-prog" role="progressbar" aria-valuemin="0" aria-valuemax="${NJ}" aria-valuenow="${JA}"><span style="width:${pct}%"></span></div>`;

    let html = "";
    if (T.modoDemo) html += `<div class="aviso aviso-demo">⚠️ <b>Datos de ejemplo.</b> Los nombres de las escuelas y los resultados mostrados son provisionales.</div>`;
    if (errores.length) {
      html += `<div class="aviso aviso-error"><b>Revisar datos.js:</b><ul>${errores.map((e) => `<li>${esc(e)}</li>`).join("")}</ul></div>`;
    }
    document.getElementById("avisos").innerHTML = html;
  }

  function renderNav() {
    document.querySelectorAll("#tabs button").forEach((b) => {
      b.setAttribute("aria-selected", b.dataset.tab === estado.tab ? "true" : "false");
    });
    const cats = document.getElementById("cats");
    cats.classList.toggle("oculto", estado.tab === "reglamento" || estado.tab === "inicio");
    cats.innerHTML = CATS.map((c) => `<button data-cat="${esc(c)}" aria-pressed="${c === estado.cat}">${esc(c)}</button>`).join("");
  }

  /* ------------------------------------------------------------------ */
  /* Render: Posiciones                                                 */
  /* ------------------------------------------------------------------ */
  function renderPosiciones() {
    const tabla = calcularTabla(estado.cat);
    const conAjuste = tabla.filter((f) => f.ajuste);
    const filas = tabla.map((f, i) => {
      const pos = i + 1;
      const cls = [pos <= NCLAS ? "clasifica" : "", pos === NCLAS ? "corte" : ""].join(" ");
      const forma = f.forma.slice(-5).map((x) => `<i class="${x}" title="${{ G: "Ganó", E: "Empató", P: "Perdió" }[x]}">${x}</i>`).join("");
      return `<tr class="${cls}">
        <td class="pos">${pos}</td>
        <td class="izq"><div class="equipo-celda">${escudo(f.nombre)}<span class="n" title="${esc(f.nombre)}">${esc(f.nombre)}</span></div></td>
        <td>${f.pj}</td>
        <td class="opt">${f.g}</td><td class="opt">${f.e}</td><td class="opt">${f.p}</td>
        <td class="opt">${f.gf}</td><td class="opt">${f.gc}</td>
        <td>${f.dg > 0 ? "+" + f.dg : f.dg}</td>
        <td class="pts">${f.pts}${f.ajuste ? `<span class="ajuste">*</span>` : ""}</td>
        <td class="opt2">${forma ? `<span class="forma">${forma}</span>` : "–"}</td>
      </tr>`;
    }).join("");

    app.innerHTML = `
      <div class="seccion-titulo">
        <h2>Tabla de posiciones · ${esc(estado.cat)}</h2>
        <span class="muted">${JA ? `Tras la jornada ${JA}` : "Aún no hay partidos jugados"}</span>
      </div>
      <div class="tarjeta">
        <div class="tabla-wrap">
          <table class="tabla">
            <thead><tr>
              <th>#</th><th class="izq">Escuela</th><th title="Partidos jugados">PJ</th>
              <th class="opt" title="Ganados">G</th><th class="opt" title="Empatados">E</th><th class="opt" title="Perdidos">P</th>
              <th class="opt" title="Goles a favor">GF</th><th class="opt" title="Goles en contra">GC</th>
              <th title="Diferencia de goles">DG</th><th title="Puntos">Pts</th><th class="opt2">Últimos</th>
            </tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        ${conAjuste.length ? `<p class="notas-ajustes">${conAjuste.map((f) => f.motivos.map((m) =>
          `* ${esc(f.nombre)}: ${m.puntos > 0 ? "+" : ""}${m.puntos} pts${m.motivo ? " (" + esc(m.motivo) + ")" : ""}`).join("<br>")).join("<br>")}</p>` : ""}
        <div class="leyenda">
          <span><span class="sw"></span>Clasifican a cuartos de final (top ${NCLAS})</span>
          <span>Victoria 3 · Empate 1 · Derrota 0</span>
          <span>Orden: Pts, DG, GF</span>
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Render: Resultados                                                 */
  /* ------------------------------------------------------------------ */
  function marcadorHTML(r, jugado) {
    if (!r) return jugado ? `<div class="marcador pendiente" title="Esta categoría no tiene resultado en este partido">SIN<br>PARTIDO</div>` : `<div class="marcador pendiente">VS</div>`;
    if (r.gl == null) return `<div class="marcador texto">${esc(r.texto)}</div>`;
    return `<div class="marcador">${r.gl} - ${r.gv}</div>`;
  }

  function renderResultados() {
    const disponibles = new Set(JORNADAS.map((j) => j.numero));
    const botones = Array.from({ length: NJ }, (_, i) => i + 1).map((n) =>
      `<button data-jornada="${n}" aria-pressed="${n === estado.jornada}" class="${disponibles.has(n) ? "" : "sin-datos"}" title="Jornada ${n}">${n}</button>`
    ).join("");

    const j = JORNADAS.find((x) => x.numero === estado.jornada);
    let cuerpo;
    if (!j || !(j.partidos || []).length) {
      cuerpo = `<div class="tarjeta vacio"><span class="icono">📅</span>Los resultados de la jornada ${estado.jornada} se publicarán cuando se dispute.</div>`;
    } else {
      cuerpo = `<div class="partidos">${j.partidos.map((p) => {
        const r = parseRes(p.resultados && p.resultados[estado.cat]);
        const jugado = CATS.some((c) => parseRes(p.resultados && p.resultados[c]));
        let clsL = "", clsV = "";
        if (r && r.gl != null) {
          if (r.gl > r.gv) clsV = "perdio"; else if (r.gv > r.gl) clsL = "perdio";
        }
        const meta = [p.fecha ? fecha(p.fecha, { weekday: "short", day: "numeric", month: "short" }) : "", p.hora || "", p.cancha || ""].filter(Boolean).join(" · ");
        const todas = estado.todas ? `<div class="todas-cats">${CATS.map((c) => {
          const rc = parseRes(p.resultados && p.resultados[c]);
          const txt = !rc ? "–" : rc.gl == null ? "✕" : `${rc.gl}-${rc.gv}`;
          return `<div class="${c === estado.cat ? "actual" : ""}" title="${rc && rc.texto ? esc(rc.texto) : ""}">${esc(c)}<b>${txt}</b></div>`;
        }).join("")}</div>` : "";
        return `<article class="partido tarjeta">
          <div class="partido-meta">${esc(meta)}</div>
          <div class="partido-fila">
            <div class="eq local ${clsL}"><span class="n">${esc(p.local)}</span>${escudo(p.local, true)}</div>
            ${marcadorHTML(r, jugado)}
            <div class="eq ${clsV}">${escudo(p.visitante, true)}<span class="n">${esc(p.visitante)}</span></div>
          </div>
          ${r && r.nota ? `<div class="nota-res">${esc(r.nota)}</div>` : ""}
          ${todas}
        </article>`;
      }).join("")}</div>`;
    }

    app.innerHTML = `
      <div class="jornadas-nav">
        <button class="flecha" data-mover="-1" ${estado.jornada <= 1 ? "disabled" : ""} aria-label="Jornada anterior">‹</button>
        <div class="jornadas-lista" id="jlista">${botones}</div>
        <button class="flecha" data-mover="1" ${estado.jornada >= NJ ? "disabled" : ""} aria-label="Jornada siguiente">›</button>
      </div>
      <div class="jornada-cab">
        <h2>Jornada ${estado.jornada} · ${esc(estado.cat)}${j && j.fecha ? ` <span class="muted" style="font-size:.85rem;font-weight:500">· ${esc(fecha(j.fecha))}</span>` : ""}</h2>
        <label class="interruptor"><input type="checkbox" id="chk-todas" ${estado.todas ? "checked" : ""}> Ver todas las categorías</label>
      </div>
      ${cuerpo}`;

    const activo = app.querySelector('#jlista button[aria-pressed="true"]');
    if (activo) activo.scrollIntoView({ block: "nearest", inline: "center" });
  }

  /* ------------------------------------------------------------------ */
  /* Render: Playoffs                                                   */
  /* ------------------------------------------------------------------ */
  function llaveHTML(l) {
    const r = l.r;
    const fila = (nombre, et, goles, pen, lado) => {
      const cls = l.ganador ? (l.ganador === nombre ? "gana" : "pierde") : "";
      const nom = nombre ? esc(nombre) : (l.de ? `Ganador ${NOMBRE_LLAVE[l.de[lado]]}` : "Por definir");
      return `<div class="fila ${cls}">
        ${et ? `<span class="seed">${et}</span>` : ""}
        ${nombre ? escudo(nombre) : ""}
        <span class="n ${nombre ? "" : "por-definir"}">${nom}</span>
        <span class="g">${goles != null ? goles : ""}${pen != null ? ` <small>(${pen})</small>` : ""}</span>
      </div>`;
    };
    const meta = [l.fecha ? fecha(l.fecha, { day: "numeric", month: "short" }) : "", l.cancha || ""].filter(Boolean).join(" · ");
    return `<div class="llave tarjeta ${l.id === "F" ? "final" : ""}">
      <div class="llave-id"><span>${NOMBRE_LLAVE[l.id]}</span><span>${esc(meta)}${r && r.texto ? esc(r.texto) : ""}</span></div>
      ${fila(l.local, l.etL, r && r.gl, r && r.pl, 0)}
      ${fila(l.visitante, l.etV, r && r.gv, r && r.pv, 1)}
    </div>`;
  }

  function renderPlayoffs() {
    const { res, completa } = calcularPlayoffs(estado.cat);
    const rondas = [["Cuartos de final", ["C1", "C2", "C3", "C4"]], ["Semifinales", ["S1", "S2"]], ["Gran final", ["F"]]];
    const campeon = res.F.ganador;
    app.innerHTML = `
      <div class="seccion-titulo">
        <h2>Playoffs · ${esc(estado.cat)}</h2>
        <span class="muted">1º vs 8º · 2º vs 7º · 3º vs 6º · 4º vs 5º</span>
      </div>
      ${completa ? "" : `<div class="aviso-proy">📊 <b>Proyección:</b> así quedarían los cruces si la fase regular terminara hoy (jornada ${JA || 0} de ${NJ}). Los cruces se confirman al finalizar la jornada ${NJ}.</div>`}
      <div class="bracket-wrap">
        <div class="bracket">
          ${rondas.map(([titulo, ids]) => `<section class="ronda"><h3>${titulo}</h3><div class="ronda-col">${ids.map((id) => llaveHTML(res[id])).join("")}</div></section>`).join("")}
        </div>
      </div>
      ${campeon ? `<div class="campeon"><div class="copa">🏆</div><p class="muted">Campeón ${esc(estado.cat)}</p><p class="nombre">${esc(campeon)}</p></div>` : ""}`;
  }

  /* ------------------------------------------------------------------ */
  /* Render: Inicio (portada)                                           */
  /* ------------------------------------------------------------------ */
  const ICONOS = {
    posiciones: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 9v11"/></svg>',
    resultados: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 15h3M13 15h3"/></svg>',
    playoffs: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 13v4M8 21h8M9 17h6v4H9z"/></svg>',
    reglamento: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/></svg>'
  };

  function renderInicio() {
    const pct = Math.round((JA / NJ) * 100);
    const act = T.actualizado ? fecha(T.actualizado, { day: "numeric", month: "long" }) : "";
    const lideres = CATS.map((c) => {
      const t = calcularTabla(c);
      return { c, f: t.some((x) => x.pj > 0) ? t[0] : null, emp: t.length > 1 && t[0].pts === t[1].pts && t[0].dg === t[1].dg && t[0].gf === t[1].gf };
    });
    const escuelas = [...ESCUELAS.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    const nPartidos = JORNADAS.reduce((n, j) => n + (j.partidos || []).length, 0);
    const acceso = (tab, titulo, texto) => `
      <button class="acceso tarjeta" data-ir="${tab}">
        <span class="acceso-ico">${ICONOS[tab]}</span>
        <span class="acceso-txt"><b>${titulo}</b><small>${texto}</small></span>
        <span class="acceso-flecha" aria-hidden="true">›</span>
      </button>`;

    app.innerHTML = `
      <section class="hero">
        <p class="hero-kicker">¡Bienvenidos!</p>
        <h2>Sigue el torneo de las escuelas de fútbol de Usulután</h2>
        <p class="hero-txt">Consulta los resultados de cada jornada, la tabla de posiciones de cada categoría y el camino hacia la gran final.</p>
        <div class="hero-estado">
          <span class="vivo"><i></i>${JA >= NJ ? "Fase final" : "Fase regular"}</span>
          <span>Jornada <b>${JA}</b> de ${NJ}</span>
          ${act ? `<span>Actualizado: ${esc(act)}</span>` : ""}
        </div>
        <div class="hero-prog"><span style="width:${pct}%"></span></div>
        <div class="hero-botones">
          <button class="btn-primario" data-ir="posiciones">Ver tabla de posiciones</button>
          <button class="btn-secundario" data-ir="resultados">Últimos resultados</button>
          ${instalarHTML()}
        </div>
      </section>

      <section class="bloque">
        <div class="bloque-cab"><span class="paso">1</span><div><h3>Elige tu categoría</h3><p class="muted">Toca una categoría para ver su tabla de posiciones.</p></div></div>
        <div class="inicio-cats">
          ${CATS.map((c) => `<button data-ir="posiciones" data-cat="${esc(c)}"><b>${esc(c)}</b><small>Ver tabla ›</small></button>`).join("")}
        </div>
      </section>

      <section class="bloque">
        <div class="bloque-cab"><span class="paso">2</span><div><h3>¿Qué quieres ver?</h3><p class="muted">Elige una sección. También puedes usar las pestañas de arriba.</p></div></div>
        <div class="accesos">
          ${acceso("posiciones", "Tabla de posiciones", "Puntos, goles y quiénes van clasificando al Top 8.")}
          ${acceso("resultados", "Resultados", JA ? `Marcadores de cada jornada. Última jugada: jornada ${JA}.` : "Marcadores de cada jornada.")}
          ${acceso("playoffs", "Playoffs", "Cuartos de final, semifinales y la gran final.")}
          ${acceso("reglamento", "Reglamento", "Bases del torneo, formato y sistema de puntos.")}
        </div>
      </section>

      <section class="bloque">
        <div class="bloque-cab"><span class="paso paso-oro">★</span><div><h3>Líderes por categoría</h3><p class="muted">Quién va primero en este momento.</p></div></div>
        <div class="lideres">
          ${lideres.map(({ c, f, emp }) => `
            <button class="lider tarjeta" data-ir="posiciones" data-cat="${esc(c)}">
              <span class="lider-cat">${esc(c)}</span>
              ${f ? `${escudo(f.nombre, true)}<b class="lider-n">${esc(f.nombre)}</b>
                <span class="lider-d">${f.pts} pts · DG ${f.dg > 0 ? "+" + f.dg : f.dg}${emp ? " · empatado" : ""}</span>`
                : `<b class="lider-n muted">Sin partidos aún</b>`}
            </button>`).join("")}
        </div>
      </section>

      <section class="bloque">
        <div class="numeros">
          <div><b>${ESCUELAS.size}</b><span>Escuelas</span></div>
          <div><b>${CATS.length}</b><span>Categorías</span></div>
          <div><b>${NJ}</b><span>Jornadas</span></div>
          <div><b>${nPartidos}</b><span>Encuentros jugados</span></div>
        </div>
      </section>

      <section class="bloque">
        <div class="bloque-cab"><span class="paso paso-azul">⚽</span><div><h3>Escuelas participantes</h3></div></div>
        <div class="escuelas tarjeta">
          ${escuelas.map((e) => `<div class="escuela">${escudo(e.nombre, true)}<span>${esc(e.nombre)}</span></div>`).join("")}
        </div>
      </section>`;
  }

  function renderReglamento() {
    app.innerHTML = "";
    app.appendChild(document.getElementById("tpl-reglamento").content.cloneNode(true));
    const chips = app.querySelector(".chips-lista");
    if (chips) chips.innerHTML = CATS.map((c) => `<li>${esc(c)}</li>`).join("");
    const sub = app.querySelector("#reg-sub");
    if (sub) sub.textContent = `${T.organizador} · ${T.nombre}`;
  }

  /* Anuncios: siempre al final del contenido, nunca encima ni flotando. */
  const ICONO_ANUNCIO = {
    retro: '<svg viewBox="0 0 16 16" width="44" height="44" shape-rendering="crispEdges" aria-hidden="true"><path fill="#fff" d="M5 1h1v1h-1zM6 1h1v1h-1zM7 1h1v1h-1zM8 1h1v1h-1zM9 1h1v1h-1zM10 1h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM5 2h1v1h-1zM6 2h1v1h-1zM9 2h1v1h-1zM10 2h1v1h-1zM11 2h1v1h-1zM12 2h1v1h-1zM2 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM5 3h1v1h-1zM10 3h1v1h-1zM11 3h1v1h-1zM12 3h1v1h-1zM13 3h1v1h-1zM2 4h1v1h-1zM4 4h1v1h-1zM5 4h1v1h-1zM10 4h1v1h-1zM11 4h1v1h-1zM13 4h1v1h-1zM1 5h1v1h-1zM4 5h1v1h-1zM5 5h1v1h-1zM6 5h1v1h-1zM9 5h1v1h-1zM10 5h1v1h-1zM11 5h1v1h-1zM14 5h1v1h-1zM1 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM8 6h1v1h-1zM9 6h1v1h-1zM10 6h1v1h-1zM11 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM1 7h1v1h-1zM2 7h1v1h-1zM3 7h1v1h-1zM4 7h1v1h-1zM5 7h1v1h-1zM6 7h1v1h-1zM7 7h1v1h-1zM8 7h1v1h-1zM9 7h1v1h-1zM10 7h1v1h-1zM11 7h1v1h-1zM12 7h1v1h-1zM13 7h1v1h-1zM14 7h1v1h-1zM1 8h1v1h-1zM2 8h1v1h-1zM3 8h1v1h-1zM6 8h1v1h-1zM7 8h1v1h-1zM8 8h1v1h-1zM9 8h1v1h-1zM12 8h1v1h-1zM13 8h1v1h-1zM14 8h1v1h-1zM1 9h1v1h-1zM2 9h1v1h-1zM7 9h1v1h-1zM8 9h1v1h-1zM13 9h1v1h-1zM14 9h1v1h-1zM1 10h1v1h-1zM2 10h1v1h-1zM3 10h1v1h-1zM7 10h1v1h-1zM8 10h1v1h-1zM12 10h1v1h-1zM13 10h1v1h-1zM14 10h1v1h-1zM2 11h1v1h-1zM3 11h1v1h-1zM4 11h1v1h-1zM6 11h1v1h-1zM7 11h1v1h-1zM8 11h1v1h-1zM9 11h1v1h-1zM11 11h1v1h-1zM12 11h1v1h-1zM13 11h1v1h-1zM2 12h1v1h-1zM3 12h1v1h-1zM4 12h1v1h-1zM5 12h1v1h-1zM6 12h1v1h-1zM7 12h1v1h-1zM8 12h1v1h-1zM9 12h1v1h-1zM10 12h1v1h-1zM11 12h1v1h-1zM12 12h1v1h-1zM13 12h1v1h-1zM3 13h1v1h-1zM4 13h1v1h-1zM5 13h1v1h-1zM10 13h1v1h-1zM11 13h1v1h-1zM12 13h1v1h-1zM5 14h1v1h-1zM6 14h1v1h-1zM9 14h1v1h-1zM10 14h1v1h-1z"/><path fill="#0b2545" d="M5 0h1v1h-1zM6 0h1v1h-1zM7 0h1v1h-1zM8 0h1v1h-1zM9 0h1v1h-1zM10 0h1v1h-1zM3 1h1v1h-1zM4 1h1v1h-1zM11 1h1v1h-1zM12 1h1v1h-1zM2 2h1v1h-1zM13 2h1v1h-1zM1 3h1v1h-1zM14 3h1v1h-1zM1 4h1v1h-1zM14 4h1v1h-1zM0 5h1v1h-1zM15 5h1v1h-1zM0 6h1v1h-1zM15 6h1v1h-1zM0 7h1v1h-1zM15 7h1v1h-1zM0 8h1v1h-1zM15 8h1v1h-1zM0 9h1v1h-1zM15 9h1v1h-1zM0 10h1v1h-1zM15 10h1v1h-1zM1 11h1v1h-1zM14 11h1v1h-1zM1 12h1v1h-1zM14 12h1v1h-1zM2 13h1v1h-1zM13 13h1v1h-1zM3 14h1v1h-1zM4 14h1v1h-1zM11 14h1v1h-1zM12 14h1v1h-1zM5 15h1v1h-1zM6 15h1v1h-1zM7 15h1v1h-1zM8 15h1v1h-1zM9 15h1v1h-1zM10 15h1v1h-1zM7 2h1v1h-1zM8 2h1v1h-1zM6 3h1v1h-1zM7 3h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM3 4h1v1h-1zM6 4h1v1h-1zM7 4h1v1h-1zM8 4h1v1h-1zM9 4h1v1h-1zM12 4h1v1h-1zM2 5h1v1h-1zM3 5h1v1h-1zM7 5h1v1h-1zM8 5h1v1h-1zM12 5h1v1h-1zM13 5h1v1h-1zM2 6h1v1h-1zM13 6h1v1h-1zM4 8h1v1h-1zM5 8h1v1h-1zM10 8h1v1h-1zM11 8h1v1h-1zM3 9h1v1h-1zM4 9h1v1h-1zM5 9h1v1h-1zM6 9h1v1h-1zM9 9h1v1h-1zM10 9h1v1h-1zM11 9h1v1h-1zM12 9h1v1h-1zM4 10h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1zM9 10h1v1h-1zM10 10h1v1h-1zM11 10h1v1h-1zM5 11h1v1h-1zM10 11h1v1h-1zM6 13h1v1h-1zM7 13h1v1h-1zM8 13h1v1h-1zM9 13h1v1h-1zM7 14h1v1h-1zM8 14h1v1h-1z"/></svg>',
    claro: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg>'
  };
  function anunciosHTML() {
    const lista = (T.anuncios || []).filter((a) => a && a.url && a.titulo);
    if (!lista.length) return "";
    return `
      <aside class="anuncios" aria-label="Anuncios">
        ${lista.map((a) => {
          const est = a.estilo === "retro" ? "retro" : "claro";
          return `
          <a class="anuncio anuncio-${est}" href="${esc(a.url)}" target="_blank" rel="noopener sponsored">
            <span class="anuncio-tag">Anuncio</span>
            <span class="anuncio-ico">${ICONO_ANUNCIO[est]}</span>
            <span class="anuncio-cuerpo">
              ${a.marca ? `<small class="anuncio-marca">${esc(a.marca)}</small>` : ""}
              <b class="anuncio-tit">${esc(a.titulo)}</b>
              ${a.texto ? `<span class="anuncio-txt">${esc(a.texto)}</span>` : ""}
              <span class="anuncio-btn">${esc(a.boton || "Visitar")} <span aria-hidden="true">↗</span></span>
            </span>
          </a>`;
        }).join("")}
      </aside>`;
  }

  /* ------------------------------------------------------------------ */
  function render() {
    renderNav();
    ({ inicio: renderInicio, posiciones: renderPosiciones, resultados: renderResultados, playoffs: renderPlayoffs, reglamento: renderReglamento })[estado.tab]();
    app.insertAdjacentHTML("beforeend", anunciosHTML());
    guardarHash();
  }

  document.getElementById("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]");
    if (!b) return;
    estado.tab = b.dataset.tab;
    render();
  });
  document.getElementById("cats").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-cat]");
    if (!b) return;
    estado.cat = b.dataset.cat;
    render();
  });
  app.addEventListener("click", (e) => {
    const ir = e.target.closest("[data-ir]");
    if (ir) {
      estado.tab = ir.dataset.ir;
      if (ir.dataset.cat) estado.cat = ir.dataset.cat;
      if (estado.tab === "resultados" && JA) estado.jornada = JA;
      render();
      const barra = document.querySelector(".barra");
      window.scrollTo({ top: barra.getBoundingClientRect().top + window.scrollY - 1, behavior: "smooth" });
      return;
    }
    const bj = e.target.closest("button[data-jornada]");
    if (bj) { estado.jornada = +bj.dataset.jornada; render(); return; }
    const bm = e.target.closest("button[data-mover]");
    if (bm) { estado.jornada = Math.min(NJ, Math.max(1, estado.jornada + +bm.dataset.mover)); render(); }
  });
  app.addEventListener("change", (e) => {
    if (e.target.id === "chk-todas") {
      estado.todas = e.target.checked;
      store.set("reddfut-todas", estado.todas ? "1" : "0");
      render();
    }
  });

  /* ------------------------------------------------------------------ */
  /* Sin internet: archivo único (MODO_OFFLINE) o app instalada (sw.js) */
  /* ------------------------------------------------------------------ */
  let promptInstalar = null;
  const esArchivoLocal = !!window.MODO_OFFLINE || location.protocol === "file:";
  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const yaInstalada = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;

  function instalarHTML() {
    if (esArchivoLocal || yaInstalada) return "";
    if (promptInstalar || esIOS) return `<button class="btn-secundario" id="btn-instalar">📲 Instalar en tu celular</button>`;
    return "";
  }

  if (!esArchivoLocal && "serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    promptInstalar = e;
    if (estado.tab === "inicio") render();
  });
  document.addEventListener("click", async (e) => {
    if (!e.target.closest("#btn-instalar")) return;
    if (promptInstalar) {
      promptInstalar.prompt();
      try { await promptInstalar.userChoice; } catch (err) { /* nada */ }
      promptInstalar = null;
      render();
    } else if (esIOS) {
      alert("Para instalarlo en tu iPhone:\n\n1. Toca el botón Compartir (el cuadro con la flecha hacia arriba).\n2. Elige \"Agregar a pantalla de inicio\".\n3. Toca \"Agregar\".\n\nDespués podrás abrirlo desde tu pantalla, incluso sin internet.");
    }
  });

  renderCabecera();
  if (esArchivoLocal && T.actualizado) {
    document.getElementById("pie-act").textContent =
      "Versión sin internet · datos al " + fecha(T.actualizado, { day: "numeric", month: "long", year: "numeric" });
  }
  render();
})();
