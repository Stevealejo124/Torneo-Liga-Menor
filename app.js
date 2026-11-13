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

  /* Escudos oficiales: una regla CSS por escuela (la imagen se carga una sola vez) */
  const LOGOS = new Map();
  (function estilosLogos() {
    const reglas = [];
    (T.escuelas || []).forEach((e, i) => {
      if (!e.logo) return;
      const cls = "logo-" + i;
      LOGOS.set(e.nombre, cls);
      reglas.push(`.escudo.${cls}{background-image:url("${String(e.logo).replace(/"/g, "")}")}`);
    });
    if (reglas.length) {
      const st = document.createElement("style");
      st.textContent = reglas.join("\n");
      document.head.appendChild(st);
    }
  })();

  function escudo(nombre, grande) {
    const e = ESCUELAS.get(nombre);
    if (!e) return `<span class="escudo${grande ? " grande" : ""}" style="background:#cbd2db">?</span>`;
    if (LOGOS.has(nombre)) return `<span class="escudo con-logo ${LOGOS.get(nombre)}${grande ? " grande" : ""}" role="img" aria-label="Escudo de ${esc(nombre)}"></span>`;
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
      if (f) { f.ajuste += Number(a.puntos) || 0; if (a.mostrarNota !== false) f.motivos.push(a); }
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
  const Q = window.QUINIELA;
  const QUINIELA_ACTIVA = !!(Q && Q.activa && Q.firebase && Q.firebase.apiKey && !/PEGA/.test(Q.firebase.apiKey));
  const TABS = ["inicio", "posiciones", "resultados", "canchas", "playoffs", "reglamento"].concat(QUINIELA_ACTIVA ? ["quiniela"] : []);
  const JA = jornadaActual();
  const estado = {
    tab: "inicio",
    cat: store.get("reddfut-cat") || CATS[0],
    jornada: JA || 1,
    todas: store.get("reddfut-todas") === "1",
    cancha: ""
  };
  (function leerHash() {
    const partes = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/");
    if (TABS.includes(partes[0])) estado.tab = partes[0];
    if (estado.tab === "canchas") { estado.cancha = partes[1] || ""; return; }
    const c = CATS.find((x) => x.toLowerCase() === (partes[1] || "").toLowerCase());
    if (c) estado.cat = c;
    const jn = parseInt(partes[2], 10);
    if (jn >= 1 && jn <= NJ) estado.jornada = jn;
  })();
  if (!CATS.includes(estado.cat)) estado.cat = CATS[0];

  function guardarHash() {
    let h = "#/" + estado.tab;
    if (estado.tab === "canchas") { if (estado.cancha) h += "/" + estado.cancha; }
    else if (!["reglamento", "inicio", "quiniela"].includes(estado.tab)) h += "/" + estado.cat.toLowerCase();
    if (estado.tab === "resultados") h += "/" + estado.jornada;
    try { history.replaceState(null, "", h); } catch (e) { /* vista previa */ }
    store.set("reddfut-cat", estado.cat);
  }

  /* ------------------------------------------------------------------ */
  /* Render: cabecera, avisos, navegación                               */
  /* ------------------------------------------------------------------ */
  function ticksHTML() {
    return `<span class="ticks" aria-hidden="true">${Array.from({ length: NJ }, (_, i) => `<i class="${i < JA ? "ok" : ""}"></i>`).join("")}</span>`;
  }

  function renderCabecera() {
    document.getElementById("org").textContent = T.organizador || "";
    // "Torneo Apertura: Liga Especial de Escuelas de Fútbol" -> "TORNEO APERTURA" / "LIGA ESPECIAL…"
    // (si no hay ":", se parte a la mitad; un año "2026-2027" al final va en dorado)
    const mN = String(T.nombre || "").match(/^(.*?)\s+(\d{4}-\d{4})$/);
    const base = mN ? mN[1] : String(T.nombre || "");
    let l1, l2;
    if (base.includes(":")) { const i = base.indexOf(":"); l1 = base.slice(0, i).trim(); l2 = base.slice(i + 1).trim(); }
    else { const w = base.split(/\s+/), c = Math.ceil(w.length / 2); l1 = w.slice(0, c).join(" "); l2 = w.slice(c).join(" "); }
    document.getElementById("nombre-torneo").innerHTML =
      `${esc(l1)} <span class="l2">${esc(l2)}${mN ? ` <span class="anio">${esc(mN[2])}</span>` : ""}</span>`;
    document.getElementById("pie-org").textContent = T.organizador || "";
    document.title = `${T.nombre} · ${T.organizador}`;
    const act = T.actualizado ? "Actualizado: " + fecha(T.actualizado, { day: "numeric", month: "long", year: "numeric" }) : "";
    document.getElementById("pie-act").textContent = act;
    document.getElementById("progreso").innerHTML = `
      <span class="franja-txt">${esc(T.subtitulo || "")}</span>
      <span class="franja-jor" role="progressbar" aria-valuemin="0" aria-valuemax="${NJ}" aria-valuenow="${JA}" aria-label="Jornadas jugadas">
        ${JA ? `Jornada <b>${JA}</b> de ${NJ}` : "Por iniciar"} ${ticksHTML()}
      </span>${(() => {
        const P = proximaJornada();
        if (!P || P.modo === "espera") return "";
        return P.modo === "vivo"
          ? `<span class="franja-cuenta vivo"><i></i>J${P.j.numero} en juego</span>`
          : `<span class="franja-cuenta">J${P.j.numero} en <b data-cuenta-corta="${P.t}"></b></span>`;
      })()}`;

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
    const sel = document.querySelector('#tabs button[aria-selected="true"]'), cont = document.getElementById("tabs");
    if (sel && cont.scrollWidth > cont.clientWidth) cont.scrollTo({ left: sel.offsetLeft - (cont.clientWidth - sel.offsetWidth) / 2, behavior: "auto" });
    const cats = document.getElementById("cats");
    document.getElementById("barra-cats").classList.toggle("oculto", ["reglamento", "inicio", "quiniela", "canchas"].includes(estado.tab));
    cats.innerHTML = CATS.map((c) => `<button data-cat="${esc(c)}" aria-pressed="${c === estado.cat}">${esc(c)}</button>`).join("");
  }

  /* ------------------------------------------------------------------ */
  /* Render: Posiciones                                                 */
  /* ------------------------------------------------------------------ */
  function renderPosiciones() {
    const tabla = calcularTabla(estado.cat);
    const conAjuste = tabla.filter((f) => f.ajuste && f.motivos.length);
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
        <td class="pts">${f.pts}${f.ajuste && f.motivos.length ? `<span class="ajuste">*</span>` : ""}</td>
        <td class="opt2">${forma ? `<span class="forma">${forma}</span>` : "–"}</td>
      </tr>`;
    }).join("");

    app.innerHTML = `
      <div class="seccion-titulo">
        <h2>Posiciones <span class="cat">${esc(estado.cat)}</span></h2>
        <span class="muted">${JA ? `Tras la jornada ${JA}` : "Aún no hay partidos jugados"}</span>
      </div>
      <div class="tarjeta">
        <div class="tabla-wrap">
          <table class="tabla">
            <thead><tr>
              <th>#</th><th class="izq">Escuela</th><th title="Partidos jugados">PJ</th>
              <th class="opt" title="Ganados">G</th><th class="opt" title="Empatados">E</th><th class="opt" title="Perdidos">P</th>
              <th class="opt" title="Goles a favor">GF</th><th class="opt" title="Goles en contra">GC</th>
              <th title="Diferencia de goles">DG</th><th class="th-pts" title="Puntos">Pts</th><th class="opt2">Últimos</th>
            </tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        ${conAjuste.length ? `<p class="notas-ajustes">${conAjuste.map((f) => f.motivos.map((m) =>
          `* ${esc(f.nombre)}: ${m.puntos > 0 ? "+" : ""}${m.puntos} pts${m.motivo ? " (" + esc(m.motivo) + ")" : ""}`).join("<br>")).join("<br>")}</p>` : ""}
        <div class="leyenda">
          <span><span class="sw oro"></span>Líder</span>
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
    return `<div class="marcador">${r.gl}<span class="sep">-</span>${r.gv}</div>`;
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
      const sinJugar = !j.partidos.some((p) => CATS.some((c) => parseRes(p.resultados && p.resultados[c])));
      const P = proximaJornada();
      const relojJ = P && P.j && P.j.numero === j.numero
        ? (P.modo === "vivo" ? `<div class="mini-cuenta vivo"><i></i>Se está jugando hoy</div>`
          : `<div class="mini-cuenta">⏱️ Faltan <b data-cuenta-corta="${P.t}"></b> para esta jornada</div>`) : "";
      cuerpo = relojJ + (sinJugar ? `<div class="aviso-proy">📅 <b>Programación oficial.</b> Las fechas y canchas pueden cambiar por decisión de la comisión organizadora.</div>` : "")
        + `<div class="partidos">${j.partidos.map((p) => {
        const r = parseRes(p.resultados && p.resultados[estado.cat]);
        const jugado = CATS.some((c) => parseRes(p.resultados && p.resultados[c]));
        let clsL = "", clsV = "";
        if (r && r.gl != null) {
          if (r.gl > r.gv) clsV = "perdio"; else if (r.gv > r.gl) clsL = "perdio";
        }
        const hCat = !jugado && !p.hora && horaDe(estado.cat) ? "🕗 " + horaTxt(horaDe(estado.cat)) : "";
        const meta = [p.fecha ? esc(fecha(p.fecha, { weekday: "short", day: "numeric", month: "short" })) : "", esc(p.hora || hCat), botonCancha(p.cancha)].filter(Boolean).join(" · ");
        const todas = estado.todas ? `<div class="todas-cats">${CATS.map((c) => {
          const rc = parseRes(p.resultados && p.resultados[c]);
          const txt = !rc ? "–" : rc.gl == null ? "✕" : `${rc.gl}-${rc.gv}`;
          return `<div class="${c === estado.cat ? "actual" : ""}" title="${rc && rc.texto ? esc(rc.texto) : ""}">${esc(c)}<b>${txt}</b></div>`;
        }).join("")}</div>` : "";
        return `<article class="partido tarjeta">
          <div class="partido-meta">${meta}</div>
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
        <h2>Jornada ${estado.jornada} <span class="cat">${esc(estado.cat)}</span>${j && j.fecha ? `<span class="fecha-j">${esc(fecha(j.fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}</span>` : ""}</h2>
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
        <h2>Playoffs <span class="cat">${esc(estado.cat)}</span></h2>
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
  /* ---------- Contador en tiempo real hacia la próxima jornada ---------- */
  const esHora = (h) => /^\d{1,2}:\d{2}$/.test(h || "");
  const minutos = (h) => { const [a, b] = h.split(":"); return +a * 60 + +b; };
  const HORARIOS = CATS.filter((c) => T.horarios && esHora(T.horarios[c])).map((c) => ({ c, h: T.horarios[c] }));
  const horaDe = (c) => (HORARIOS.find((x) => x.c === c) || {}).h || null;
  /* Turnos: categorías agrupadas por hora (las de la misma hora juegan a la vez) */
  const TURNOS = [...new Set(HORARIOS.map((x) => x.h))].sort((a, b) => minutos(a) - minutos(b))
    .map((h) => ({ h, cats: HORARIOS.filter((x) => x.h === h).map((x) => x.c) }));
  const HORA_JUEGOS = TURNOS.length ? TURNOS[0].h : (esHora(T.horaJuegos) ? T.horaJuegos : "08:00");
  /* Se da por terminada la mañana ~80 min después del último turno */
  const FIN_JUEGOS_MS = ((TURNOS.length ? minutos(TURNOS[TURNOS.length - 1].h) - minutos(HORA_JUEGOS) : 240) + 80) * 60e3;
  function momento(fechaISO, h) {
    const [a, b] = h.split(":");
    const d = new Date(`${fechaISO}T${a.padStart(2, "0")}:${b}:00-06:00`);   // hora de El Salvador
    return isNaN(d) ? null : d.getTime();
  }
  function inicioJornada(j) { return j && j.fecha ? momento(j.fecha, HORA_JUEGOS) : null; }
  const horaTxt = (h) => { const [a, b] = h.split(":").map(Number); return `${((a + 11) % 12) + 1}:${String(b).padStart(2, "0")}\u00a0${a < 12 ? "a.\u00a0m." : "p.\u00a0m."}`; };
  function turnosHTML(j, ahora = Date.now()) {
    if (!TURNOS.length) return "";
    const enVivo = ahora >= inicioJornada(j);
    const sig = enVivo ? TURNOS.find((t) => momento(j.fecha, t.h) > ahora) : null;
    return `<div class="cuenta-turnos">${TURNOS.map((t) => {
      const ini = momento(j.fecha, t.h);
      const est = !enVivo ? "" : ini <= ahora ? "ya" : t === sig ? "sig" : "";
      const etq = est === "ya" ? "✓ Ya empezó" : est === "sig" ? `Empieza en <b data-cuenta-corta="${ini}"></b>` : "";
      return `<div class="turno ${est}"><span class="t-hora">${horaTxt(t.h)}</span><span class="t-cats">${t.cats.map(esc).join(" · ")}</span>${etq ? `<span class="t-est">${etq}</span>` : ""}</div>`;
    }).join("")}</div>`;
  }
  function tieneResultados(j) {
    return (j.partidos || []).some((p) => CATS.some((c) => parseRes(p.resultados && p.resultados[c])));
  }
  /* Qué toca ahora: "cuenta" (falta para la próxima), "vivo" (se está jugando hoy) o null */
  function proximaJornada(ahora = Date.now()) {
    const pend = JORNADAS.filter((j) => (j.partidos || []).length && !tieneResultados(j) && inicioJornada(j));
    const vivo = pend.find((j) => ahora >= inicioJornada(j) && ahora < inicioJornada(j) + FIN_JUEGOS_MS);
    if (vivo) return { modo: "vivo", j: vivo, t: inicioJornada(vivo) };
    const prox = pend.find((j) => inicioJornada(j) > ahora);
    const sinRes = pend.filter((j) => inicioJornada(j) + FIN_JUEGOS_MS <= ahora).map((j) => j.numero);
    return prox ? { modo: "cuenta", j: prox, t: inicioJornada(prox), sinRes } : (sinRes.length ? { modo: "espera", sinRes } : null);
  }
  function partesCuenta(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
  }
  const dos2 = (n) => String(n).padStart(2, "0");
  function cuentaHTML() {
    const P = proximaJornada();
    if (!P) return "";
    const listaSinRes = P.sinRes && P.sinRes.length
      ? `<p class="cuenta-nota">✅ ${P.sinRes.length > 1 ? "Jornadas" : "Jornada"} ${P.sinRes.join(", ")} ya ${P.sinRes.length > 1 ? "se jugaron" : "se jugó"} · los resultados se publicarán pronto.</p>` : "";
    if (P.modo === "espera") return `<section class="cuenta cuenta-espera">${listaSinRes}</section>`;
    const j = P.j;
    const dia = fecha(j.fecha, { weekday: "long", day: "numeric", month: "long" });
    const hora = new Date(P.t).toLocaleTimeString("es-SV", { hour: "numeric", minute: "2-digit", timeZone: "America/El_Salvador" }).replace(/\s/g, "\u00a0");
    const cruces = j.partidos.map((p) => `<span class="cuenta-cruce" title="${esc(p.local)} vs ${esc(p.visitante)}${p.cancha ? " · " + esc(p.cancha) : ""}">${escudo(p.local)}<i>vs</i>${escudo(p.visitante)}</span>`).join("");
    const reloj = P.modo === "vivo"
      ? `<div class="cuenta-vivo"><span class="punto"></span><b>Se está jugando hoy</b></div>`
      : (() => { const c = partesCuenta(P.t - Date.now()); return `<div class="cuenta-reloj" data-cuenta="${P.t}" role="timer" aria-live="off">
          ${[["d", "Días"], ["h", "Horas"], ["m", "Min"], ["s", "Seg"]].map(([k, t]) => `<div class="dig"><b data-k="${k}">${k === "d" ? c[k] : dos2(c[k])}</b><span>${t}</span></div>`).join("")}
        </div>`; })();
    return `<section class="cuenta ${P.modo === "vivo" ? "en-vivo" : ""}">
      <div class="cuenta-cab">
        <span class="cuenta-tit">${P.modo === "vivo" ? "En juego" : "Próxima jornada"}</span>
        <span class="cuenta-num">J${dos2(j.numero)}</span>
      </div>
      ${reloj}
      <p class="cuenta-fecha">${esc(dia)} · desde las ${esc(hora)}</p>
      ${turnosHTML(j)}
      <div class="cuenta-cruces">${cruces}</div>
      <button class="cuenta-ver" data-ir="resultados" data-jor="${j.numero}">Ver los ${j.partidos.length} partidos y canchas ›</button>
      ${listaSinRes}
    </section>`;
  }
  /* Un solo reloj para todo el sitio: actualiza los números cada segundo */
  function claveCuenta(ahora) {
    const P0 = proximaJornada(ahora);
    const turno = P0 && P0.modo === "vivo" ? TURNOS.filter((t) => momento(P0.j.fecha, t.h) <= ahora).length : -1;
    const q = QUINIELA_ACTIVA ? quinielaAhora(ahora) : null;
    return JSON.stringify(P0) + "|" + turno + "|" + (q ? q.j.numero + (q.abierta ? "a" : "c") : "");
  }
  let modoCuenta = claveCuenta(Date.now());
  function tic() {
    const ahora = Date.now();
    document.querySelectorAll("[data-cuenta]").forEach((el) => {
      const c = partesCuenta(+el.dataset.cuenta - ahora);
      el.querySelectorAll("b[data-k]").forEach((b) => {
        const v = b.dataset.k === "d" ? String(c.d) : dos2(c[b.dataset.k]);
        if (b.textContent !== v) b.textContent = v;
      });
    });
    document.querySelectorAll("[data-cuenta-corta]").forEach((el) => {
      const c = partesCuenta(+el.dataset.cuentaCorta - ahora);
      const v = c.d ? `${c.d}d ${dos2(c.h)}h ${dos2(c.m)}m` : `${dos2(c.h)}:${dos2(c.m)}:${dos2(c.s)}`;
      if (el.textContent !== v) el.textContent = v;
    });
    const m = claveCuenta(ahora);   // llegó la hora: cambia a "en juego", al siguiente turno, etc.
    if (m !== modoCuenta) { modoCuenta = m; renderCabecera(); if (estado.tab === "inicio" || estado.tab === "resultados") render(); }
  }
  setInterval(tic, 1000);

  /* Ventana de la quiniela de cada jornada (igual que quiniela.js):
     abre "diasAntes" días antes del primer partido y cierra el día de juego a la horaCierre. */
  function ventanaQuiniela(j) {
    if (!j || !j.fecha) return null;
    const dias = Number.isFinite(Number(Q && Q.diasAntes)) ? Number(Q.diasAntes) : 2;
    const hc = (j.cierre && String(j.cierre).match(/(\d{1,2}:\d{2})$/)) ? String(j.cierre).match(/(\d{1,2}:\d{2})$/)[1] : ((Q && Q.horaCierre) || "07:00");
    const cierre = momento(j.cierre ? String(j.cierre).slice(0, 10) : j.fecha, hc);
    const apertura = j.apertura ? momento(String(j.apertura).slice(0, 10), String(j.apertura).slice(11, 16) || HORA_JUEGOS)
      : momento(j.fecha, HORA_JUEGOS) - dias * 864e5;
    return cierre && apertura ? { apertura, cierre } : null;
  }
  function quinielaAhora(ahora = Date.now()) {
    for (const j of JORNADAS) {
      if (!(j.partidos || []).length || tieneResultados(j)) continue;
      const v = ventanaQuiniela(j);
      if (!v || v.cierre <= ahora) continue;
      return { j, ...v, abierta: ahora >= v.apertura };
    }
    return null;
  }
  function promoQuiniela() {
    if (!QUINIELA_ACTIVA) return "";
    const q = quinielaAhora();
    const fechaHora = (ms) => new Date(ms).toLocaleString("es-SV", { weekday: "long", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/El_Salvador" });
    let tit = "Quiniela del torneo", txt = "Adivina los resultados de cada jornada y compite en la tabla. Solo por diversión.", ir = "Ver tabla ›";
    if (q && q.abierta) {
      tit = `Quiniela · Jornada ${q.j.numero} abierta`;
      txt = `Elige hasta 2 partidos por categoría. Cierra en <strong class="q-cuenta" data-cuenta-corta="${q.cierre}"></strong>.`;
      ir = "Jugar ›";
    } else if (q) {
      tit = `Quiniela · Jornada ${q.j.numero}`;
      txt = `Se abre el ${esc(fechaHora(q.apertura))} · faltan <strong class="q-cuenta" data-cuenta-corta="${q.apertura}"></strong>.`;
      ir = "Ver ›";
    }
    return `<button class="q-promo" data-ir="quiniela">
      <span><b>${tit}</b><span>${txt}</span></span>
      <span class="ir">${ir}</span>
    </button>`;
  }

  /* Avisos: "te avisamos cuando se actualicen las tablas" (nunca se piden solos) */
  const avisosUI = { cargando: false, msg: "", ok: false };
  function avisosEstado() {
    const local = !!window.MODO_OFFLINE || location.protocol === "file:";
    if (local || !QUINIELA_ACTIVA || !("serviceWorker" in navigator)) return "no";
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const instalada = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
    if (ios && !instalada && !("PushManager" in window)) return "ios";
    if (typeof Notification === "undefined" || !("PushManager" in window)) return "no";
    if (Notification.permission === "denied") return "bloqueado";
    let token = null;
    try { token = localStorage.getItem("reddfut-avisos"); } catch (e) { /* nada */ }
    return token && Notification.permission === "granted" ? "activos" : "apagados";
  }
  function avisosHTML() {
    const e = avisosEstado();
    if (e === "no") return "";
    const textos = {
      apagados: ["Avisos de las tablas", "Te llega una notificación cuando se actualicen las tablas de posiciones."],
      activos: ["Avisos activados", "Te avisaremos en este dispositivo cuando se actualicen las tablas de posiciones."],
      bloqueado: ["Avisos bloqueados", "Los bloqueaste en este navegador. Toca el candado junto a la dirección del sitio → Notificaciones → Permitir."],
      ios: ["Avisos de las tablas", "En iPhone primero instala el sitio en tu pantalla de inicio y ábrelo desde ahí."]
    };
    const [t, d] = textos[e];
    const boton = avisosUI.cargando ? `<button class="av-btn" disabled>Activando…</button>`
      : e === "apagados" ? `<button class="av-btn" id="btn-avisos">Activar avisos</button>`
      : e === "activos" ? `<button class="av-quitar" id="btn-avisos-quitar">Desactivar</button>`
      : e === "ios" ? `<button class="av-btn" id="btn-avisos-ios">Cómo activarlos</button>` : "";
    return `<div class="avisos av-${e}" id="caja-avisos">
      <span class="av-campana" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z"/></svg>${e === "activos" ? "<i></i>" : ""}</span>
      <span class="av-txt"><b>${t}</b><span>${avisosUI.msg ? esc(avisosUI.msg) : d}</span></span>
      ${boton}
    </div>`;
  }
  function repintarAvisos() {
    const caja = document.getElementById("caja-avisos");
    if (caja) caja.outerHTML = avisosHTML();
  }
  document.addEventListener("click", async (ev) => {
    if (ev.target.closest("#btn-avisos-ios")) {
      alert("Para recibir avisos en tu iPhone:\n\n1. Toca el botón Compartir (el cuadro con la flecha hacia arriba).\n2. Elige \"Agregar a pantalla de inicio\" y toca \"Agregar\".\n3. Abre el torneo desde ese ícono en tu pantalla.\n4. Toca \"Activar avisos\" en Inicio.\n\n(Necesitas iOS 16.4 o más reciente.)");
      return;
    }
    const on = ev.target.closest("#btn-avisos"), off = ev.target.closest("#btn-avisos-quitar");
    if (!on && !off) return;
    avisosUI.cargando = !!on; avisosUI.msg = ""; repintarAvisos();
    try {
      const m = await import("./avisos.js");
      try {
        if (on) await m.activar(); else await m.desactivar();
      } catch (err) { console.warn("avisos:", err); avisosUI.msg = m.mensajeError(err); }
    } catch (err) {
      avisosUI.msg = "No se pudieron activar los avisos. Revisa tu conexión a internet.";
    }
    avisosUI.cargando = false; repintarAvisos();
  });

  function renderInicio() {
    const act = T.actualizado ? fecha(T.actualizado, { day: "numeric", month: "long", year: "numeric" }) : "";
    const jUlt = JORNADAS.filter((j) => j.numero <= JA).pop();
    const fechaUlt = jUlt && jUlt.fecha ? fecha(jUlt.fecha, { weekday: "long", day: "numeric", month: "long" }) : "";
    const lideres = CATS.map((c) => {
      const t = calcularTabla(c);
      const f = t.some((x) => x.pj > 0) ? t[0] : null;
      const emp = f && t.length > 1 && t[0].pts === t[1].pts && t[0].dg === t[1].dg && t[0].gf === t[1].gf;
      return { c, f, emp };
    });
    const escuelas = [...ESCUELAS.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    const nPartidos = JORNADAS.reduce((n, j) => n + (j.partidos || []).length, 0);
    const numCat = (c) => (String(c).match(/\d+/) || [c])[0];
    const dos = (n) => String(n).padStart(2, "0");

    app.innerHTML = `
      <section class="portada">
        <div class="cartel">
          <span class="cartel-fase"><i></i>${JA >= NJ ? "Fase final" : "Fase regular"}</span>
          <div class="cartel-jornada">
            <span class="num">${dos(JA)}</span>
            <span class="txt"><b>Jornada</b><span>de ${NJ} jugadas</span></span>
          </div>
          <span class="ticks" aria-hidden="true">${Array.from({ length: NJ }, (_, i) => `<i class="${i < JA ? "ok" : ""}"></i>`).join("")}</span>
          <p class="cartel-act">${fechaUlt ? `Última fecha: ${esc(fechaUlt)} · ` : ""}${act ? `Actualizado el ${esc(act)}` : ""}</p>
          <div class="cartel-botones">
            <button class="btn-primario" data-ir="posiciones">Ver posiciones</button>
            <button class="btn-secundario" data-ir="resultados">Resultados${JA ? ` J${JA}` : ""}</button>
            ${instalarHTML()}
          </div>
        </div>

        <div class="tablero">
          <div class="tablero-cab"><b>Líderes <span>·</span> ${JA ? `J${JA}` : ""}</b><small>Toca para ver la tabla</small></div>
          <div class="tablero-lista">
            ${lideres.map(({ c, f, emp }) => `
              <button class="tablero-fila" data-ir="posiciones" data-cat="${esc(c)}">
                <span class="cat">${esc(c)}</span>
                ${f ? `${escudo(f.nombre, true)}
                  <span class="n">${esc(f.nombre)}<small>DG ${f.dg > 0 ? "+" + f.dg : f.dg}${emp ? " · empatado" : ""}</small></span>
                  <span class="pts">${f.pts}<small>pts</small></span>`
                : `<span></span><span class="vacio-t">Sin partidos aún</span><span></span>`}
              </button>`).join("")}
          </div>
        </div>
      </section>

      ${cuentaHTML()}
      ${promoQuiniela()}
      ${avisosHTML()}

      <section class="bloque">
        <h3 class="titulo-bloque">Categorías <small>Elige una para ver su tabla</small></h3>
        <div class="inicio-cats">
          ${CATS.map((c) => `<button class="cat-tile" data-ir="posiciones" data-cat="${esc(c)}" aria-label="Tabla ${esc(c)}">
            <span class="sub">Sub</span><span class="num">${esc(numCat(c))}</span><span class="ver">Ver tabla ›</span></button>`).join("")}
        </div>
      </section>

      <section class="bloque">
        <div class="cifras">
          <div><b>${ESCUELAS.size}</b><span>Escuelas</span></div>
          <div><b>${CATS.length}</b><span>Categorías</span></div>
          <div><b>${NJ}</b><span>Jornadas</span></div>
          <div><b>${nPartidos}</b><span>Encuentros</span></div>
        </div>
      </section>

      <section class="bloque">
        <h3 class="titulo-bloque">Escuelas participantes</h3>
        <div class="escuelas tarjeta">
          ${escuelas.map((e) => `<div class="escuela">${escudo(e.nombre, true)}<span>${esc(e.nombre)}</span></div>`).join("")}
        </div>
        ${CORREO && escuelas.some((e) => !LOGOS.has(e.nombre)) ? `<p class="pista-escudo">¿Tienes el escudo oficial de tu escuela? <a href="#apoyar" data-ir-apoyo>Envíanoslo</a> y lo ponemos en las tablas.</p>` : ""}
      </section>

      ${apoyoHTML()}`;
  }

  /* ---------- Redes sociales: "Síguenos" en Inicio + iconos en el pie ---------- */
  const REDES = T.redes || {};
  const ICO_RED = {
    facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.6-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3z"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor"/></svg>`
  };
  const listaRedes = () => [
    REDES.facebook && { id: "facebook", url: REDES.facebook, red: "Facebook", accion: "Seguir", nombre: REDES.nombre || "" },
    REDES.instagram && { id: "instagram", url: REDES.instagram, red: "Instagram", accion: "Seguir", nombre: REDES.usuario || "" }
  ].filter(Boolean);
  /* Barra lateral fija: se ve en TODAS las pestañas (PC: borde izquierdo al centro; celular: arriba del botón de música) */
  function barraRedes() {
    const l = listaRedes();
    if (!l.length || document.getElementById("redes-lateral")) return;
    document.body.insertAdjacentHTML("beforeend", `<aside class="redes-lateral" id="redes-lateral" aria-label="Síguenos en redes sociales">
      <span class="rl-titulo" aria-hidden="true">Síguenos</span>
      ${l.map((r) => `<a class="rl-btn rl-${r.id}" href="${esc(r.url)}" target="_blank" rel="noopener" aria-label="Seguir en ${esc(r.red)}: ${esc(r.nombre)}">
        <span class="rl-ico">${ICO_RED[r.id]}</span>
        <span class="rl-tip" aria-hidden="true"><small>${esc(r.red)} · Seguir ↗</small><b>${esc(r.nombre)}</b></span>
      </a>`).join("")}
      <button class="rl-asa" type="button" aria-expanded="false" aria-label="Mostrar redes sociales">
        <span class="rl-asa-ico">${ICO_RED.facebook}</span><span class="rl-asa-ico">${ICO_RED.instagram}</span>
      </button>
    </aside>`);
    /* En celular/tablet la barra se esconde en una pestañita del borde para no tapar las tablas */
    const barra = document.getElementById("redes-lateral"), asa = barra.querySelector(".rl-asa");
    let reloj = 0;
    const abrir = (si, ms = 6000) => {
      barra.classList.toggle("abierta", si); asa.setAttribute("aria-expanded", String(si));
      asa.setAttribute("aria-label", si ? "Ocultar redes sociales" : "Mostrar redes sociales");
      clearTimeout(reloj); if (si) reloj = setTimeout(() => abrir(false), ms);
    };
    asa.addEventListener("click", (ev) => { ev.stopPropagation(); abrir(!barra.classList.contains("abierta")); });
    document.addEventListener("click", (ev) => { if (!barra.contains(ev.target)) abrir(false); });
    try {                       // la primera vez de cada visita se asoma unos segundos para que la gente la vea
      if (!sessionStorage.getItem("redes-vistas")) { sessionStorage.setItem("redes-vistas", "1"); setTimeout(() => abrir(true, 4500), 1800); }
    } catch (e) {}
  }
  barraRedes();
  function pieRedes() {
    const pie = document.querySelector(".pie .contenedor");
    const l = listaRedes();
    if (!pie || !l.length || document.getElementById("pie-redes")) return;
    pie.insertAdjacentHTML("beforeend", `<p class="pie-redes" id="pie-redes"><span>Síguenos</span>${l.map((r) =>
      `<a class="pie-red pie-${r.id}" href="${esc(r.url)}" target="_blank" rel="noopener" aria-label="${esc(r.red)}: ${esc(r.nombre)}">${ICO_RED[r.id]}<span>${esc(r.red)}</span></a>`).join("")}</p>`);
  }
  pieRedes();

  /* ---------- "¿Te gustaría apoyarnos?": todo llega al correo del organizador ---------- */
  const CORREO = (T.contacto && T.contacto.correo) || "";
  const SVG = (d) => `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="${d}"/></svg>`;
  const APOYOS = [
    { id: "fotos", ico: "M4 8h3l2-3h6l2 3h3v11H4z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", t: "Fotos y videos", d: "De los partidos, los equipos o la afición.",
      asunto: "Fotos y videos del torneo",
      cuerpo: "Hola, les comparto fotos o videos del torneo.\n\nEscuela(s): \nJornada o fecha: \nCategoría: \n\n(Adjunta las fotos aquí. Si los videos pesan mucho, pega el enlace de Google Drive o YouTube.)" },
    { id: "escudo", ico: "M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z M9 12l2 2 4-4", t: "Escudo de tu escuela", d: "El logo oficial, para mostrarlo en las tablas.",
      asunto: "Escudo de mi escuela",
      cuerpo: "Hola, les envío el escudo oficial de mi escuela.\n\nEscuela: \n\n(Adjunta el escudo o logo, de preferencia en buena calidad.)" },
    { id: "cancha", ico: "M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z", t: "Ubicación de una cancha", d: "Dirección o enlace de Google Maps del estadio.",
      asunto: "Ubicación de una cancha",
      cuerpo: "Hola, les comparto la ubicación de una cancha.\n\nCancha o estadio: \nEscuela que juega de local ahí: \nDirección o enlace de Google Maps: \n" },
    { id: "resultado", ico: "M9 4h6v3H9z M7 5H5v16h14V5h-2 M8 12h8 M8 16h5", t: "Corregir un dato", d: "Un resultado, un nombre o una fecha que no cuadra.",
      asunto: "Corrección de un dato",
      cuerpo: "Hola, encontré un dato que hay que corregir.\n\nJornada: \nPartido: \nCategoría: \nDato correcto: \n\n(Si tienes foto de la hoja del partido, adjúntala.)" },
    { id: "apoyar", ico: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z", t: "Apoyar al torneo", d: "Con tu negocio, transporte, hidratación, premios…",
      asunto: "Quiero apoyar al torneo",
      cuerpo: "Hola, me gustaría apoyar al torneo.\n\nNombre o negocio: \nCómo me gustaría apoyar: \n" },
    { id: "otro", ico: "M4 6h16v12H4z M4 7l8 6 8-6", t: "Otro mensaje", d: "Ideas, dudas o lo que quieras contarnos.",
      asunto: "Mensaje sobre el torneo", cuerpo: "Hola,\n\n" }
  ];
  function enlaceCorreo(a) {
    const cuerpo = a.cuerpo + "\n\n— Enviado desde el sitio del torneo " + (T.organizador || "");
    return `mailto:${CORREO}?subject=${encodeURIComponent((T.organizador || "Torneo") + " · " + a.asunto)}&body=${encodeURIComponent(cuerpo)}`;
  }
  function apoyoHTML() {
    if (!CORREO) return "";
    return `
      <section class="bloque apoyo" id="apoyar">
        <div class="apoyo-cab">
          <span class="apoyo-sobre">Entre todos</span>
          <h3>¿Te gustaría apoyarnos?</h3>
          <p>Este sitio se arma con lo que la gente del torneo comparte. Si tienes fotos, videos, el escudo de tu escuela o la ubicación de una cancha, mándalo por correo. También puedes escribir para cualquier otra cosa.</p>
        </div>
        <div class="apoyo-lista">
          ${APOYOS.map((a) => `<a class="apoyo-op" href="${esc(enlaceCorreo(a))}">
            <span class="apoyo-ico">${SVG(a.ico)}</span>
            <span class="apoyo-txt"><b>${esc(a.t)}</b><small>${esc(a.d)}</small></span>
            <span class="apoyo-ir" aria-hidden="true">›</span>
          </a>`).join("")}
        </div>
        <div class="apoyo-correo">
          <span class="apoyo-correo-txt"><small>Escríbenos a</small><b>${esc(CORREO)}</b></span>
          <button type="button" class="apoyo-copiar" data-copiar="${esc(CORREO)}">Copiar correo</button>
        </div>
        <p class="apoyo-nota">Al tocar una opción se abre tu correo con el mensaje listo para llenar. Adjunta las fotos o el escudo antes de enviarlo.</p>
      </section>`;
  }
  document.addEventListener("click", async (ev) => {
    const b = ev.target.closest("[data-copiar]");
    if (!b) return;
    const txt = b.dataset.copiar;
    let ok = false;
    try { await navigator.clipboard.writeText(txt); ok = true; } catch (e) {
      const t = document.createElement("textarea");
      t.value = txt; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      t.remove();
    }
    const antes = "Copiar correo";
    b.textContent = ok ? "¡Copiado!" : txt;
    b.classList.toggle("ok", ok);
    setTimeout(() => { b.textContent = antes; b.classList.remove("ok"); }, 2200);
  });
  /* Enlaces "Apóyanos" fuera de Inicio (pie de página, escuelas) */
  document.addEventListener("click", (ev) => {
    const l = ev.target.closest("[data-ir-apoyo]");
    if (!l) return;
    ev.preventDefault();
    const bajar = (suave) => { const s = document.getElementById("apoyar"); if (s) s.scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "start" }); };
    if (estado.tab === "inicio") bajar(true);
    else conCortina("inicio", () => { estado.tab = "inicio"; render(); bajar(false); });
  });

  function renderReglamento() {
    app.innerHTML = "";
    app.appendChild(document.getElementById("tpl-reglamento").content.cloneNode(true));
    const chips = app.querySelector(".chips-lista");
    if (chips) chips.innerHTML = CATS.map((c) => `<li>${esc(c)}</li>`).join("");
    const sub = app.querySelector("#reg-sub");
    if (sub) sub.textContent = `${T.organizador} · ${T.nombre}`;
  }

  /* ------------------------------------------------------------------ */
  /* Render: Canchas y estadios (mapa propio, funciona sin internet)    */
  /* ------------------------------------------------------------------ */
  /* Mapa base de los departamentos: lo genera herramientas/canchas/generar_mapa.py */
  /* MAPA-INICIO */ const MAPA = {"w":1000,"h":1100,"lng0":-88.77,"lat0":13.685,"k":2056.122,"kx":0.97271,"deps":{"Usulután":"M496.0 42.9L491.6 47.0L488.6 57.7L463.9 69.4L449.6 87.9L437.8 95.3L434.8 118.7L429.8 125.2L418.5 129.5L410.0 142.0L404.7 153.7L405.3 166.8L396.8 179.6L375.8 186.9L360.0 197.2L339.5 201.8L324.8 200.4L304.2 208.8L298.3 209.2L285.5 201.4L276.3 201.2L270.5 209.4L274.0 223.3L272.6 229.8L268.8 236.3L262.0 237.2L252.2 247.4L253.2 265.3L250.3 270.6L240.7 280.3L221.8 272.1L209.3 282.2L201.1 297.5L208.1 314.6L208.3 325.0L197.6 347.8L194.5 383.3L182.5 431.1L186.9 457.9L182.4 465.9L166.5 474.1L158.7 481.9L145.3 532.8L119.2 550.3L103.6 572.0L98.5 608.1L79.1 648.6L78.9 670.7L95.5 696.0L96.7 711.3L88.9 719.6L52.5 741.5L36.2 767.1L-0.8 793.5L-12.5 806.8L-30.0 818.5L-30.0 910.3L12.1 925.8L66.0 939.7L306.3 981.9L511.1 1031.2L595.6 1057.4L706.2 1072.1L736.3 1078.9L750.2 1072.2L802.6 1059.9L871.9 1050.7L945.4 1055.8L1030.0 1067.2L1030.0 774.1L1022.6 768.2L1010.7 769.1L1008.0 773.9L1003.2 772.0L1002.0 769.4L1005.8 764.3L1004.2 759.2L1001.7 764.5L993.3 767.8L993.6 771.9L987.9 768.9L990.0 776.0L982.6 775.6L983.0 783.6L974.0 777.3L962.0 788.7L969.2 802.0L966.0 810.1L955.5 819.4L954.8 826.3L952.0 826.6L951.2 842.5L954.2 850.4L978.3 872.9L962.2 883.2L952.4 880.0L901.9 892.0L895.4 860.9L882.3 834.8L888.9 815.3L941.2 763.0L947.7 743.3L937.9 730.2L947.7 713.8L937.9 700.8L921.6 694.2L901.9 707.3L888.3 705.0L830.0 707.3L833.3 684.4L830.0 668.0L810.5 661.5L761.4 628.9L771.2 566.8L771.2 514.5L767.9 504.7L754.9 514.5L738.6 517.7L738.6 498.2L758.2 462.2L767.9 432.7L767.9 409.9L777.7 396.8L794.0 390.3L794.0 374.0L777.7 331.5L777.7 289.1L758.2 240.0L758.2 200.9L767.9 184.4L787.5 168.1L794.0 155.1L794.0 145.3L777.7 125.7L771.2 106.1L784.4 83.3L784.4 57.1L774.5 34.3L764.7 37.5L745.1 50.6L722.3 50.6L692.8 37.5L670.0 14.7L640.5 -24.5L614.4 -21.2L592.2 -9.0L565.4 -24.5L560.5 -30.0L558.7 -30.0L567.6 -18.1L560.0 -0.4L540.7 20.0Z","San Vicente":"M-30.0 573.9L-20.0 587.1L-27.8 601.4L-21.9 607.6L-24.6 611.3L-22.0 628.6L-25.0 636.9L-30.0 642.2L-30.0 818.5L-12.5 806.8L-0.8 793.5L36.2 767.1L52.5 741.5L88.9 719.6L96.7 711.3L95.5 696.0L78.9 670.7L79.1 648.6L98.5 608.1L103.6 572.0L119.2 550.3L145.3 532.8L158.7 481.9L166.5 474.1L182.4 465.9L186.9 457.9L182.5 431.1L194.5 383.3L197.6 347.8L208.3 325.0L208.1 314.6L201.1 297.5L209.3 282.2L221.8 272.1L240.7 280.3L250.3 270.6L253.2 265.3L252.2 247.4L262.0 237.2L268.8 236.3L272.6 229.8L274.0 223.3L270.5 209.4L276.3 201.2L285.5 201.4L298.3 209.2L304.2 208.8L324.8 200.4L339.5 201.8L360.0 197.2L375.8 186.9L396.8 179.6L405.3 166.8L404.7 153.7L410.0 142.0L418.5 129.5L429.8 125.2L434.8 118.7L437.8 95.3L449.6 87.9L463.9 69.4L488.6 57.7L491.6 47.0L496.0 42.9L540.7 20.0L560.0 -0.4L567.6 -18.1L558.7 -30.0L-30.0 -30.0L-30.0 562.6L-29.3 563.2L-30.0 567.3Z","San Miguel":"M1017.4 25.7L1017.9 22.3L1008.8 12.8L999.2 -30.0L560.5 -30.0L565.4 -24.5L592.2 -9.0L614.4 -21.2L640.5 -24.5L670.0 14.7L692.8 37.5L722.3 50.6L745.1 50.6L764.7 37.5L774.5 34.3L784.4 57.1L784.4 83.3L771.2 106.1L777.7 125.7L794.0 145.3L794.0 155.1L787.5 168.1L767.9 184.4L758.2 200.9L758.2 240.0L777.7 289.1L777.7 331.5L794.0 374.0L794.0 390.3L777.7 396.8L767.9 409.9L767.9 432.7L758.2 462.2L738.6 498.2L738.6 517.7L754.9 514.5L767.9 504.7L771.2 514.5L771.2 566.8L761.4 628.9L810.5 661.5L830.0 668.0L833.3 684.4L830.0 707.3L888.3 705.0L901.9 707.3L921.6 694.2L937.9 700.8L947.7 713.8L937.9 730.2L947.7 743.3L941.2 763.0L888.9 815.3L882.3 834.8L895.4 860.9L901.9 892.0L952.4 880.0L962.2 883.2L978.3 872.9L954.2 850.4L951.2 842.5L952.0 826.6L954.8 826.3L955.5 819.4L966.0 810.1L969.2 802.0L962.0 788.7L974.0 777.3L983.0 783.6L982.6 775.6L990.0 776.0L987.9 768.9L993.6 771.9L993.3 767.8L1001.7 764.5L1004.2 759.2L1005.8 764.3L1002.0 769.4L1003.2 772.0L1008.0 773.9L1010.7 769.1L1022.6 768.2L1030.0 774.1L1030.0 15.2L1029.2 14.3Z","Morazán":"M1008.8 12.8L1017.9 22.3L1017.4 25.7L1029.2 14.3L1030.0 15.2L1030.0 -30.0L999.2 -30.0Z","La Paz":"M-24.6 611.3L-21.9 607.6L-27.8 601.4L-20.0 587.1L-30.0 573.9L-30.0 567.3L-29.3 563.2L-30.0 562.6L-30.0 642.2L-25.0 636.9L-22.0 628.6Z"}}; /* MAPA-FIN */
  const CANCHAS = (T.canchas || []).filter((c) => c && c.cancha);
  const slugC = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const canchaDe = (nombre) => CANCHAS.find((c) => c.cancha === nombre);
  function botonCancha(nombre) {
    if (!nombre) return "";
    return canchaDe(nombre)
      ? `<button class="ir-cancha" type="button" data-ir="canchas" data-cancha="${esc(slugC(nombre))}">📍 ${esc(nombre)}</button>`
      : `<span>📍 ${esc(nombre)}</span>`;
  }
  function proximoEn(c, ahora = Date.now()) {
    for (const j of JORNADAS) {
      if (tieneResultados(j)) continue;
      const ini = inicioJornada(j);
      if (ini && ini + FIN_JUEGOS_MS < ahora) continue;
      const p = (j.partidos || []).find((x) => x.cancha === c.cancha);
      if (p) return { j, p };
    }
    return null;
  }
  function enlaceMapa(c) {
    const q = c.exacta && c.lat ? `${c.lat},${c.lng}` : `${c.nombre}, ${c.lugar}, El Salvador`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }
  function mapaHTML() {
    if (typeof MAPA === "undefined") return "";
    const X = (c) => (c.lng - MAPA.lng0) * MAPA.k * MAPA.kx, Y = (c) => (MAPA.lat0 - c.lat) * MAPA.k;
    const LADO = { "Alegría": "arriba", "Berlín": "izq", "Mercedes Umaña": "izq", "Jiquilisco": "izq" };
    const dep = (n, cls) => MAPA.deps[n] ? `<path class="${cls}" d="${MAPA.deps[n]}"/>` : "";
    const otros = Object.keys(MAPA.deps).filter((n) => n !== "Usulután" && n !== "San Miguel");
    const puntos = CANCHAS.filter((c) => typeof c.lat === "number").map((c) => {
      const x = X(c).toFixed(1), y = Y(c).toFixed(1), e = ESCUELAS.get(c.escuela);
      const lado = LADO[c.cancha] || "der", izq = lado === "izq", arriba = lado === "arriba";
      const corto = e ? e.corto : c.cancha.slice(0, 3).toUpperCase();
      const sel = estado.cancha === slugC(c.cancha) ? " sel" : "";
      return `<a class="m-punto${c.exacta ? "" : " aprox"}${sel}" href="#/canchas/${slugC(c.cancha)}" data-cancha="${slugC(c.cancha)}" aria-label="${esc(c.nombre)} (${esc(c.escuela || "")})">
        <circle class="m-halo" cx="${x}" cy="${y}" r="34"/>
        <circle class="m-dot" cx="${x}" cy="${y}" r="14" style="--c:${e ? esc(e.color) : "#0b2545"}"/>
        <text class="m-etq" x="${(+x + (arriba ? 0 : izq ? -22 : 22)).toFixed(1)}" y="${(+y + (arriba ? -24 : 11)).toFixed(1)}" text-anchor="${arriba ? "middle" : izq ? "end" : "start"}">${esc(corto)}</text>
      </a>`;
    }).join("");
    const tx = (lng, lat, t, cls) => `<text class="${cls}" x="${((lng - MAPA.lng0) * MAPA.k * MAPA.kx).toFixed(0)}" y="${((MAPA.lat0 - lat) * MAPA.k).toFixed(0)}">${t}</text>`;
    return `<figure class="mapa tarjeta">
      <svg viewBox="0 0 ${MAPA.w} ${MAPA.h}" role="img" aria-label="Mapa de las canchas del torneo en Usulután y San Miguel">
        <defs><pattern id="m-olas" width="26" height="14" patternUnits="userSpaceOnUse"><path d="M0 10q6.5-6 13 0t13 0" fill="none" class="m-ola"/></pattern></defs>
        <rect class="m-mar" width="${MAPA.w}" height="${MAPA.h}"/>
        <rect width="${MAPA.w}" height="${MAPA.h}" fill="url(#m-olas)"/>
        ${otros.map((n) => dep(n, "m-otro")).join("")}
        ${dep("San Miguel", "m-dep m-smi")}${dep("Usulután", "m-dep m-usu")}
        ${tx(-88.66, 13.45, "USULUTÁN", "m-nom")}<text class="m-nom chico" x="${MAPA.w - 18}" y="${((MAPA.lat0 - 13.435) * MAPA.k).toFixed(0)}" text-anchor="end">SAN MIGUEL</text>
        ${tx(-88.76, 13.66, "SAN VICENTE", "m-nom chico")}${tx(-88.70, 13.175, "OCÉANO PACÍFICO", "m-mar-t")}
        ${puntos}
      </svg>
      <figcaption><span><i class="m-ley"></i> Ubicación exacta</span><span><i class="m-ley aprox"></i> Aproximada (centro del pueblo)</span></figcaption>
    </figure>`;
  }
  function tarjetaCancha(c) {
    const id = slugC(c.cancha), e = ESCUELAS.get(c.escuela);
    const datos = [["Aforo", c.aforo], ["Superficie", c.superficie], ["Código Plus", c.plus]]
      .filter((d) => d[1]).map((d) => `<div><dt>${d[0]}</dt><dd>${esc(d[1])}</dd></div>`).join("");
    const px = proximoEn(c);
    const prox = px ? `<div class="cancha-prox"><span>Próximo partido aquí</span><b>J${px.j.numero} · ${esc(fecha(px.j.fecha, { weekday: "short", day: "numeric", month: "short" }))}</b>
        <span class="cruce">${escudo(px.p.local)} ${esc(px.p.local)} <i>vs</i> ${esc(px.p.visitante)} ${escudo(px.p.visitante)}</span></div>` : "";
    return `<article class="cancha tarjeta${estado.cancha === id ? " sel" : ""}" id="cancha-${id}" data-cancha="${id}">
      <header class="cancha-cab">
        ${e ? escudo(c.escuela, true) : ""}
        <div>
          <span class="cancha-local">Local: ${esc(c.escuela || c.cancha)}</span>
          <h3>${esc(c.nombre || c.cancha)}</h3>
          <span class="cancha-lugar">${esc(c.lugar || c.cancha)}</span>
        </div>
      </header>
      ${datos ? `<dl class="cancha-datos">${datos}</dl>` : ""}
      ${c.detalle ? `<p class="cancha-det">${esc(c.detalle)}</p>` : ""}
      ${prox}
      <footer class="cancha-pie">
        <button type="button" class="cancha-btn" data-ver-mapa="${id}">Ver en el mapa</button>
        <a class="cancha-btn sec" href="${esc(enlaceMapa(c))}" target="_blank" rel="noopener">Cómo llegar ↗</a>
        <span class="cancha-ubic ${c.exacta ? "ok" : ""}">${c.exacta ? "Ubicación exacta" : "Ubicación aproximada"}${c.fuente ? ` · Fuente: ${esc(c.fuente)}` : ""}</span>
      </footer>
    </article>`;
  }
  function renderCanchas() {
    const lista = [...CANCHAS].sort((a, b) => String(a.escuela || a.cancha).localeCompare(String(b.escuela || b.cancha), "es"));
    const exactas = CANCHAS.filter((c) => c.exacta).length;
    app.innerHTML = `
      <div class="seccion-titulo">
        <h2>Canchas <span class="cat">y estadios</span></h2>
        <span class="muted">${CANCHAS.length} canchas · Usulután y San Miguel</span>
      </div>
      <div class="canchas-grid">
        <div class="canchas-mapa">${mapaHTML()}
          <p class="canchas-ayuda">Toca un punto para ver su ficha. ${exactas} de ${CANCHAS.length} tienen la ubicación exacta.</p>
        </div>
        <div class="canchas-lista">${lista.map(tarjetaCancha).join("")}</div>
      </div>
      <p class="canchas-nota">Datos de fuentes públicas (fichas de clubes, prensa y mapas). Las canchas de cada jornada las define la comisión organizadora.
        ${CORREO ? `¿Tu escuela juega en otra cancha o ves un dato que no cuadra? <a href="${esc(enlaceCorreo(APOYOS.find((a) => a.id === "cancha")))}">Escríbenos</a>.` : ""}</p>`;
  }
  function marcarCancha(id, desplazar) {
    estado.cancha = id;
    app.querySelectorAll(".cancha.sel, .m-punto.sel").forEach((x) => x.classList.remove("sel"));
    app.querySelectorAll(`[data-cancha="${id}"]`).forEach((x) => { if (x.matches(".cancha, .m-punto")) x.classList.add("sel"); });
    guardarHash();
    const destino = desplazar === "mapa" ? app.querySelector(".mapa") : app.querySelector(`#cancha-${id}`);
    if (destino && desplazar) {
      const barra = document.querySelector(".barra").getBoundingClientRect().height;
      window.scrollTo({ top: destino.getBoundingClientRect().top + window.scrollY - barra - 12, behavior: sinMovimiento() ? "auto" : "smooth" });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Render: Quiniela (se carga aparte, solo con internet)              */
  /* ------------------------------------------------------------------ */
  const URL_SITIO = T.urlSitio || "";
  function renderQuiniela() {
    app.innerHTML = `<div id="quiniela" class="quiniela"><div class="q-caja"><b>Cargando la quiniela…</b></div></div>`;
    const cont = app.querySelector("#quiniela");
    const sinRed = !!window.MODO_OFFLINE || location.protocol === "file:" || navigator.onLine === false;
    if (sinRed) {
      cont.innerHTML = `<div class="q-caja"><b>La quiniela necesita internet</b>
        <p>Para hacer tus pronósticos y ver la tabla, abre el sitio con conexión${URL_SITIO ? `: <a href="${esc(URL_SITIO)}#/quiniela">${esc(URL_SITIO.replace(/^https?:\/\//, ""))}</a>` : "."}</p></div>`;
      return;
    }
    import("./quiniela.js")
      .then((m) => { if (cont.isConnected) m.montar(cont, { T, CATS, JORNADAS, ESCUELAS, parseRes, escudo, esc, fecha }); })
      .catch(() => { if (cont.isConnected) cont.innerHTML = `<div class="q-caja"><b>No se pudo cargar la quiniela</b><p>Revisa tu conexión y vuelve a intentarlo.</p></div>`; });
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
  /* Cortina "wipe" al cambiar de pestaña                               */
  /* Sube 5 barras azul/dorado, se cambia el contenido mientras la      */
  /* pantalla está tapada y las barras se van hacia arriba.             */
  /* ------------------------------------------------------------------ */
  let animando = false;
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const sinMovimiento = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function nombreTab(tab) {
    const b = document.querySelector(`#tabs button[data-tab="${tab}"]`);
    return b ? b.textContent.trim() : tab;
  }
  async function conCortina(tab, cambiar) {
    if (animando) return;                       // doble toque mientras anima: se ignora
    const ov = document.getElementById("wipe-overlay");
    if (!ov || sinMovimiento()) { cambiar(); return; }
    animando = true;
    document.getElementById("wipe-title").textContent = nombreTab(tab);
    const org = document.getElementById("wipe-org");
    if (org) org.textContent = T.organizador || "";
    ov.classList.remove("leave");
    ov.classList.add("is-active", "cover");    // 1) las barras suben y tapan
    await esperar(520);
    try { cambiar(); } catch (e) { console.error(e); }   // 2) cambio real, con la pantalla tapada
    await esperar(160);                         // el nombre se alcanza a leer
    ov.classList.remove("cover");
    ov.classList.add("leave");                  // 3) las barras se van hacia arriba
    await esperar(520);
    ov.classList.remove("is-active", "leave"); // 4) limpieza
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

  /* ------------------------------------------------------------------ */
  function render() {
    renderNav();
    ({ inicio: renderInicio, posiciones: renderPosiciones, resultados: renderResultados, playoffs: renderPlayoffs, reglamento: renderReglamento, quiniela: renderQuiniela, canchas: renderCanchas })[estado.tab]();
    app.insertAdjacentHTML("beforeend", anunciosHTML());
    guardarHash();
    tic();
  }

  document.getElementById("tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]");
    if (!b) return;
    irATab(b.dataset.tab);
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
      const destino = ir.dataset.ir;
      const aplicar = () => {
        estado.tab = destino;
        if (ir.dataset.cat) estado.cat = ir.dataset.cat;
        if (estado.tab === "resultados" && JA) estado.jornada = JA;
        if (ir.dataset.jor) estado.jornada = +ir.dataset.jor;
        if (destino === "canchas") estado.cancha = ir.dataset.cancha || "";
        render();
      };
      const subirABarra = (suave) => {
        const barra = document.querySelector(".barra");
        window.scrollTo({ top: barra.getBoundingClientRect().top + window.scrollY - 1, behavior: suave ? "smooth" : "auto" });
      };
      const enfocar = (suave) => (destino === "canchas" && ir.dataset.cancha) ? marcarCancha(ir.dataset.cancha, true) : subirABarra(suave);
      if (destino === estado.tab) { aplicar(); enfocar(true); }
      else conCortina(destino, () => { aplicar(); if (destino === "canchas" && ir.dataset.cancha) { estado.cancha = ir.dataset.cancha; const c = app.querySelector("#cancha-" + ir.dataset.cancha); if (c) window.scrollTo({ top: c.getBoundingClientRect().top + window.scrollY - document.querySelector(".barra").getBoundingClientRect().height - 12 }); } else subirABarra(false); });
      return;
    }
    const mp = e.target.closest(".m-punto");
    if (mp) { e.preventDefault(); marcarCancha(mp.dataset.cancha, true); return; }
    const vm = e.target.closest("[data-ver-mapa]");
    if (vm) { marcarCancha(vm.dataset.verMapa, "mapa"); return; }
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
  if (esArchivoLocal) { const tiraT = document.getElementById("torneos"); if (tiraT) tiraT.hidden = true; }   // el archivo sin internet es solo de Escuelitas
  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const yaInstalada = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;

  /* Código QR del sitio, guardado aquí mismo para que se vea aunque no haya internet.
     Lo genera herramientas/qr/generar_qr.py (solo hay que correrlo si cambia urlSitio). */
  /* QR-INICIO */ const QR_APP = { url: "https://stevealejo124.github.io/Torneo-Liga-Menor/?app=1", n: 41, hueco: [16, 9], d: "M0 0h7v1h-7zM8 0h1v1h-1zM10 0h4v1h-4zM16 0h3v1h-3zM20 0h2v1h-2zM23 0h6v1h-6zM30 0h3v1h-3zM34 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM11 1h1v1h-1zM15 1h1v1h-1zM17 1h3v1h-3zM21 1h1v1h-1zM24 1h4v1h-4zM29 1h1v1h-1zM32 1h1v1h-1zM34 1h1v1h-1zM40 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM9 2h1v1h-1zM11 2h1v1h-1zM14 2h1v1h-1zM18 2h3v1h-3zM22 2h1v1h-1zM24 2h2v1h-2zM28 2h5v1h-5zM34 2h1v1h-1zM36 2h3v1h-3zM40 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h3v1h-3zM14 3h1v1h-1zM17 3h1v1h-1zM20 3h1v1h-1zM23 3h1v1h-1zM25 3h3v1h-3zM30 3h1v1h-1zM34 3h1v1h-1zM36 3h3v1h-3zM40 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h2v1h-2zM11 4h1v1h-1zM14 4h4v1h-4zM20 4h8v1h-8zM34 4h1v1h-1zM36 4h3v1h-3zM40 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h2v1h-2zM12 5h3v1h-3zM20 5h1v1h-1zM22 5h1v1h-1zM24 5h1v1h-1zM27 5h1v1h-1zM29 5h1v1h-1zM31 5h1v1h-1zM34 5h1v1h-1zM40 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM24 6h1v1h-1zM26 6h1v1h-1zM28 6h1v1h-1zM30 6h1v1h-1zM32 6h1v1h-1zM34 6h7v1h-7zM10 7h2v1h-2zM13 7h2v1h-2zM17 7h2v1h-2zM20 7h2v1h-2zM24 7h1v1h-1zM26 7h1v1h-1zM28 7h5v1h-5zM3 8h1v1h-1zM6 8h1v1h-1zM9 8h3v1h-3zM14 8h1v1h-1zM19 8h1v1h-1zM23 8h1v1h-1zM25 8h1v1h-1zM28 8h1v1h-1zM32 8h1v1h-1zM35 8h3v1h-3zM39 8h2v1h-2zM0 9h3v1h-3zM5 9h1v1h-1zM9 9h1v1h-1zM13 9h5v1h-5zM19 9h2v1h-2zM22 9h1v1h-1zM24 9h1v1h-1zM28 9h1v1h-1zM30 9h1v1h-1zM32 9h1v1h-1zM34 9h1v1h-1zM37 9h4v1h-4zM0 10h2v1h-2zM3 10h2v1h-2zM6 10h1v1h-1zM8 10h4v1h-4zM13 10h1v1h-1zM17 10h1v1h-1zM19 10h2v1h-2zM24 10h3v1h-3zM28 10h1v1h-1zM30 10h2v1h-2zM35 10h1v1h-1zM37 10h3v1h-3zM0 11h1v1h-1zM2 11h1v1h-1zM4 11h1v1h-1zM8 11h1v1h-1zM10 11h2v1h-2zM13 11h6v1h-6zM21 11h2v1h-2zM24 11h1v1h-1zM26 11h3v1h-3zM30 11h1v1h-1zM33 11h4v1h-4zM38 11h1v1h-1zM1 12h1v1h-1zM4 12h1v1h-1zM6 12h1v1h-1zM10 12h3v1h-3zM14 12h1v1h-1zM16 12h3v1h-3zM22 12h3v1h-3zM26 12h1v1h-1zM28 12h2v1h-2zM31 12h1v1h-1zM34 12h2v1h-2zM37 12h1v1h-1zM39 12h1v1h-1zM0 13h1v1h-1zM2 13h1v1h-1zM8 13h3v1h-3zM13 13h1v1h-1zM15 13h5v1h-5zM21 13h2v1h-2zM25 13h1v1h-1zM27 13h2v1h-2zM30 13h4v1h-4zM35 13h1v1h-1zM37 13h1v1h-1zM39 13h1v1h-1zM0 14h1v1h-1zM3 14h1v1h-1zM6 14h1v1h-1zM9 14h2v1h-2zM12 14h6v1h-6zM19 14h2v1h-2zM23 14h2v1h-2zM26 14h1v1h-1zM28 14h2v1h-2zM32 14h1v1h-1zM34 14h1v1h-1zM36 14h2v1h-2zM39 14h2v1h-2zM3 15h1v1h-1zM7 15h3v1h-3zM12 15h2v1h-2zM15 15h1v1h-1zM17 15h1v1h-1zM19 15h1v1h-1zM21 15h1v1h-1zM23 15h3v1h-3zM27 15h1v1h-1zM29 15h3v1h-3zM34 15h2v1h-2zM0 16h1v1h-1zM2 16h1v1h-1zM4 16h3v1h-3zM12 16h2v1h-2zM25 16h1v1h-1zM31 16h2v1h-2zM35 16h1v1h-1zM37 16h1v1h-1zM40 16h1v1h-1zM1 17h1v1h-1zM3 17h1v1h-1zM5 17h1v1h-1zM7 17h6v1h-6zM14 17h2v1h-2zM28 17h1v1h-1zM34 17h2v1h-2zM39 17h2v1h-2zM0 18h1v1h-1zM2 18h1v1h-1zM4 18h1v1h-1zM6 18h1v1h-1zM8 18h1v1h-1zM10 18h1v1h-1zM13 18h3v1h-3zM25 18h1v1h-1zM30 18h1v1h-1zM34 18h1v1h-1zM36 18h2v1h-2zM39 18h2v1h-2zM1 19h4v1h-4zM7 19h4v1h-4zM14 19h2v1h-2zM29 19h1v1h-1zM32 19h2v1h-2zM35 19h1v1h-1zM39 19h2v1h-2zM0 20h1v1h-1zM4 20h3v1h-3zM8 20h1v1h-1zM13 20h2v1h-2zM26 20h1v1h-1zM28 20h1v1h-1zM30 20h1v1h-1zM34 20h1v1h-1zM38 20h2v1h-2zM10 21h2v1h-2zM14 21h1v1h-1zM25 21h2v1h-2zM28 21h3v1h-3zM32 21h1v1h-1zM34 21h1v1h-1zM39 21h2v1h-2zM2 22h5v1h-5zM12 22h3v1h-3zM28 22h1v1h-1zM31 22h2v1h-2zM35 22h1v1h-1zM38 22h2v1h-2zM0 23h2v1h-2zM4 23h2v1h-2zM8 23h1v1h-1zM10 23h4v1h-4zM26 23h3v1h-3zM33 23h4v1h-4zM38 23h2v1h-2zM2 24h6v1h-6zM9 24h1v1h-1zM11 24h1v1h-1zM14 24h2v1h-2zM25 24h2v1h-2zM28 24h2v1h-2zM31 24h4v1h-4zM0 25h1v1h-1zM4 25h2v1h-2zM7 25h1v1h-1zM10 25h1v1h-1zM12 25h1v1h-1zM14 25h3v1h-3zM18 25h4v1h-4zM25 25h1v1h-1zM29 25h1v1h-1zM31 25h1v1h-1zM33 25h1v1h-1zM37 25h1v1h-1zM39 25h2v1h-2zM1 26h4v1h-4zM6 26h1v1h-1zM9 26h3v1h-3zM13 26h2v1h-2zM16 26h2v1h-2zM20 26h3v1h-3zM24 26h1v1h-1zM28 26h2v1h-2zM32 26h2v1h-2zM35 26h2v1h-2zM39 26h2v1h-2zM0 27h1v1h-1zM2 27h4v1h-4zM7 27h5v1h-5zM14 27h1v1h-1zM17 27h3v1h-3zM21 27h3v1h-3zM25 27h1v1h-1zM28 27h2v1h-2zM32 27h1v1h-1zM34 27h1v1h-1zM2 28h1v1h-1zM4 28h1v1h-1zM6 28h1v1h-1zM9 28h3v1h-3zM17 28h1v1h-1zM20 28h2v1h-2zM23 28h3v1h-3zM29 28h1v1h-1zM32 28h1v1h-1zM35 28h1v1h-1zM39 28h2v1h-2zM1 29h1v1h-1zM7 29h2v1h-2zM11 29h1v1h-1zM13 29h7v1h-7zM21 29h3v1h-3zM25 29h3v1h-3zM29 29h1v1h-1zM34 29h1v1h-1zM37 29h1v1h-1zM39 29h2v1h-2zM0 30h1v1h-1zM2 30h2v1h-2zM6 30h1v1h-1zM9 30h1v1h-1zM12 30h2v1h-2zM15 30h4v1h-4zM20 30h1v1h-1zM25 30h1v1h-1zM35 30h1v1h-1zM39 30h2v1h-2zM2 31h1v1h-1zM4 31h2v1h-2zM7 31h2v1h-2zM10 31h1v1h-1zM12 31h2v1h-2zM16 31h6v1h-6zM23 31h7v1h-7zM31 31h3v1h-3zM36 31h2v1h-2zM39 31h1v1h-1zM0 32h1v1h-1zM2 32h2v1h-2zM5 32h2v1h-2zM8 32h1v1h-1zM10 32h2v1h-2zM13 32h1v1h-1zM15 32h2v1h-2zM20 32h1v1h-1zM23 32h1v1h-1zM26 32h1v1h-1zM28 32h1v1h-1zM31 32h6v1h-6zM38 32h2v1h-2zM8 33h1v1h-1zM10 33h1v1h-1zM12 33h1v1h-1zM14 33h1v1h-1zM19 33h7v1h-7zM28 33h1v1h-1zM31 33h2v1h-2zM36 33h1v1h-1zM38 33h3v1h-3zM0 34h7v1h-7zM12 34h2v1h-2zM16 34h1v1h-1zM18 34h1v1h-1zM21 34h2v1h-2zM24 34h1v1h-1zM28 34h1v1h-1zM32 34h1v1h-1zM34 34h1v1h-1zM36 34h1v1h-1zM39 34h1v1h-1zM0 35h1v1h-1zM6 35h1v1h-1zM16 35h1v1h-1zM20 35h5v1h-5zM27 35h1v1h-1zM30 35h1v1h-1zM32 35h1v1h-1zM36 35h1v1h-1zM38 35h1v1h-1zM0 36h1v1h-1zM2 36h3v1h-3zM6 36h1v1h-1zM9 36h1v1h-1zM13 36h1v1h-1zM15 36h1v1h-1zM17 36h1v1h-1zM19 36h1v1h-1zM21 36h2v1h-2zM24 36h1v1h-1zM27 36h1v1h-1zM29 36h2v1h-2zM32 36h7v1h-7zM40 36h1v1h-1zM0 37h1v1h-1zM2 37h3v1h-3zM6 37h1v1h-1zM8 37h3v1h-3zM13 37h7v1h-7zM23 37h1v1h-1zM25 37h1v1h-1zM29 37h2v1h-2zM32 37h3v1h-3zM36 37h3v1h-3zM0 38h1v1h-1zM2 38h3v1h-3zM6 38h1v1h-1zM9 38h4v1h-4zM14 38h2v1h-2zM18 38h1v1h-1zM22 38h3v1h-3zM28 38h2v1h-2zM31 38h2v1h-2zM36 38h1v1h-1zM38 38h1v1h-1zM40 38h1v1h-1zM0 39h1v1h-1zM6 39h1v1h-1zM10 39h2v1h-2zM15 39h1v1h-1zM17 39h2v1h-2zM21 39h2v1h-2zM25 39h1v1h-1zM27 39h1v1h-1zM29 39h4v1h-4zM35 39h1v1h-1zM39 39h1v1h-1zM0 40h7v1h-7zM9 40h1v1h-1zM11 40h2v1h-2zM14 40h2v1h-2zM17 40h2v1h-2zM20 40h1v1h-1zM22 40h8v1h-8zM31 40h2v1h-2zM35 40h3v1h-3zM39 40h1v1h-1z" }; /* QR-FIN */
  const llegoPorQR = /[?&]app=1\b/.test(location.search);
  function logoSrc() { const i = document.querySelector('img[alt^="Logo"]'); return i ? i.src : "logo.png"; }
  function qrHTML(clase) {
    const t = QR_APP.n + 8, [a, h] = QR_APP.hueco, pc = (v) => (v / t * 100).toFixed(3) + "%";
    return `<div class="qr-caja ${clase}">
      <svg viewBox="-4 -4 ${t} ${t}" role="img" aria-label="Código QR para descargar la app" shape-rendering="crispEdges"><rect x="-4" y="-4" width="${t}" height="${t}" fill="#fff"/><path d="${QR_APP.d}" fill="#0b2545"/></svg>
      <span class="qr-logo" style="left:${pc(a + 4)};top:${pc(a + 4)};width:${pc(h)};height:${pc(h)}"><img src="${esc(logoSrc())}" alt=""></span>
    </div>`;
  }
  function seccionQR() {
    return `<section class="ha-sec ha-sec-qr">
      <h3>Escanea el código QR</h3>
      <div class="ha-qr-fila">
        <button class="ha-qr-toque" type="button" data-ha="qr-grande" aria-label="Ver el código QR en grande">${qrHTML("chico")}</button>
        <div>
          <p>Muéstraselo a otra persona: que apunte la <b>cámara de su teléfono</b> al código. Se le abre la app y la descarga con el botón <b>Descargar app</b>.</p>
          <p class="ha-nota">Tú no necesitas internet para mostrarlo.</p>
        </div>
      </div>
      <div class="ha-botones">
        <button class="ha-btn" type="button" data-ha="qr-grande">⛶ Ver en grande</button>
        <button class="ha-btn sec" type="button" data-ha="qr-guardar">Guardar imagen</button>
      </div>
    </section>`;
  }
  function vistaQRGrande() {
    return `<div class="ha-caja ha-caja-qr" role="dialog" aria-modal="true" aria-labelledby="ha-tit">
      <button class="ha-cerrar" type="button" data-ha="volver" aria-label="Volver">✕</button>
      <span class="ha-sobre">${esc(T.organizador || "")}</span>
      <h2 id="ha-tit">Escanea y descarga la app</h2>
      ${qrHTML("grande")}
      <p class="ha-qr-pie">Abre la <b>cámara</b> y apunta al código.<br>Luego toca <b>Descargar app</b>.</p>
      <button class="ha-btn sec" type="button" data-ha="volver">← Volver</button>
    </div>`;
  }
  async function guardarQR(boton) {
    const W = 1080, H = 1350, c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    const tit = getComputedStyle(document.querySelector(".ha-caja h2") || document.body).fontFamily;
    g.fillStyle = "#0b2545"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#f2b705"; g.fillRect(0, 0, W, 18); g.fillRect(0, H - 18, W, 18);
    g.textAlign = "center";
    g.fillStyle = "#f2b705"; g.font = `700 40px ${tit}`; g.fillText((T.organizador || "").toUpperCase(), W / 2, 112);
    g.fillStyle = "#fff"; g.font = `800 86px ${tit}`; g.fillText("ESCANEA Y DESCARGA LA APP", W / 2, 205, W - 100);
    const lado = 820, x0 = (W - lado) / 2, y0 = 270, t = QR_APP.n + 8, m = lado / t;
    g.fillStyle = "#fff"; g.fillRect(x0, y0, lado, lado);
    g.save(); g.translate(x0 + 4 * m, y0 + 4 * m); g.scale(m, m);
    g.fillStyle = "#0b2545"; g.fill(new Path2D(QR_APP.d)); g.restore();
    const [a, h] = QR_APP.hueco;
    await new Promise((ok) => {
      const img = new Image();
      img.onload = () => {
        const caja = h * m * 0.9, esc2 = Math.min(caja / img.width, caja / img.height);
        const w = img.width * esc2, hh = img.height * esc2;
        g.drawImage(img, x0 + (a + 4) * m + (h * m - w) / 2, y0 + (a + 4) * m + (h * m - hh) / 2, w, hh); ok();
      };
      img.onerror = ok; img.src = logoSrc();
    });
    g.fillStyle = "#fff"; g.font = `700 44px ${tit}`;
    g.fillText(String(T.nombre || "").toUpperCase(), W / 2, 1170, W - 100);
    g.fillStyle = "#c9d3e0"; g.font = "500 34px system-ui, sans-serif";
    g.fillText(QR_APP.url.replace(/^https?:\/\//, "").replace(/\?app=1$/, ""), W / 2, 1240, W - 100);
    c.toBlob((blob) => {
      if (!blob) return;
      const a2 = document.createElement("a");
      a2.href = URL.createObjectURL(blob); a2.download = "QR_App_REDDFUT.png";
      document.body.appendChild(a2); a2.click(); a2.remove();
      setTimeout(() => URL.revokeObjectURL(a2.href), 4000);
      boton.textContent = "✓ Imagen guardada";
    }, "image/png");
  }

  /* Botón fijo "Descargar app": siempre visible, aunque ya esté instalada */
  const ARCHIVO_OFFLINE = "Torneo_REDDFUT_sin_internet.html";
  function instalarHTML() { return ""; }   // (antes había un botón en Inicio; ahora es el botón fijo)
  const boton = document.createElement("button");
  boton.id = "btn-app"; boton.className = "boton-app"; boton.type = "button";
  boton.setAttribute("aria-haspopup", "dialog");
  boton.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M12 3v12m0 0l-5-5m5 5l5-5M5 20h14"/></svg><span class="largo">Descargar app</span><span class="corto">App</span>`;
  document.body.appendChild(boton);
  document.body.classList.add("con-boton-app");

  const hoja = document.createElement("div");
  hoja.id = "hoja-app"; hoja.className = "hoja-app"; hoja.hidden = true;
  document.body.appendChild(hoja);
  let ultimoFoco = null;
  function pasos(lista) { return `<ol class="ha-pasos">${lista.map((t) => `<li>${t}</li>`).join("")}</ol>`; }
  function contenidoHoja(msg, desdeQR) {
    const enLinea = !esArchivoLocal;
    const instalada = yaInstalada;
    let principal;
    if (esArchivoLocal) {
      principal = `<div class="ha-estado ok">✓ Ya tienes la versión descargada</div>
        <p>Este archivo funciona sin internet. Para instalar la app (con resultados al día y la quiniela), abre el sitio con conexión:</p>
        ${URL_SITIO ? `<a class="ha-btn" href="${esc(URL_SITIO)}" target="_blank" rel="noopener">Abrir el sitio ↗</a>` : ""}`;
    } else if (instalada) {
      principal = `<div class="ha-estado ok">✓ Ya estás usando la app</div>
        <p>Está instalada en este dispositivo. La encuentras en tu pantalla de inicio como <b>REDDFUT</b>.</p>`;
    } else if (promptInstalar) {
      principal = `<p>Instálala en tu ${esIOS ? "iPhone" : "celular o computadora"}: queda como una app en tu pantalla de inicio y se abre aunque no tengas internet.</p>
        <button class="ha-btn" type="button" data-ha="instalar">📲 Instalar la app</button>`;
    } else if (esIOS) {
      principal = `<p>En iPhone se instala desde Safari:</p>
        ${pasos(["Toca el botón <b>Compartir</b> (el cuadro con la flecha hacia arriba).", "Elige <b>Agregar a pantalla de inicio</b>.", "Toca <b>Agregar</b>."])}`;
    } else {
      principal = `<p>Si ya la instalaste, búscala en tu pantalla de inicio como <b>REDDFUT</b>. Si no:</p>
        ${pasos(["Abre el menú del navegador (<b>⋮</b> arriba a la derecha).", "Toca <b>Instalar aplicación</b> o <b>Agregar a la pantalla principal</b>.", "Confirma con <b>Instalar</b>."])}`;
    }
    return `<div class="ha-caja" role="dialog" aria-modal="true" aria-labelledby="ha-tit">
      <button class="ha-cerrar" type="button" data-ha="cerrar" aria-label="Cerrar">✕</button>
      <span class="ha-sobre">${esc(T.organizador || "")}</span>
      <h2 id="ha-tit">Descarga la app</h2>
      ${msg ? `<p class="ha-msg">${esc(msg)}</p>` : ""}
      ${desdeQR ? "" : seccionQR()}
      <section class="ha-sec">${principal}</section>
      ${desdeQR ? seccionQR() : ""}
      ${enLinea ? `<section class="ha-sec">
        <h3>Versión sin internet</h3>
        <p>Un solo archivo para pasarlo por WhatsApp o USB y abrirlo sin datos, en cualquier celular o computadora.</p>
        <a class="ha-btn sec" href="${ARCHIVO_OFFLINE}" download="${ARCHIVO_OFFLINE}">⬇ Descargar archivo</a>
      </section>` : ""}
      ${URL_SITIO ? `<section class="ha-sec">
        <h3>Compártela</h3>
        <button class="ha-btn sec" type="button" data-ha="compartir">Compartir enlace</button>
      </section>` : ""}
    </div>`;
  }
  let hojaDesdeQR = false, hojaMsg = "";
  function abrirHoja(msg, desdeQR) {
    if (hoja.hidden) ultimoFoco = document.activeElement;
    hojaDesdeQR = !!desdeQR;
    hojaMsg = msg || "";
    hoja.innerHTML = contenidoHoja(msg, desdeQR);
    hoja.hidden = false;
    document.body.classList.add("hoja-abierta");
    requestAnimationFrame(() => hoja.classList.add("visible"));
    const c = hoja.querySelector(".ha-cerrar"); if (c) c.focus();
  }
  function cerrarHoja() {
    hoja.classList.remove("visible");
    document.body.classList.remove("hoja-abierta");
    setTimeout(() => { hoja.hidden = true; }, 200);
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }
  boton.addEventListener("click", () => abrirHoja());
  hoja.addEventListener("click", async (e) => {
    if (e.target === hoja) { cerrarHoja(); return; }        // tocar fuera de la caja
    const b = e.target.closest("[data-ha]");
    if (!b) return;
    const a = b.dataset.ha;
    if (a === "cerrar") cerrarHoja();
    else if (a === "qr-grande") { hoja.innerHTML = vistaQRGrande(); hoja.querySelector(".ha-cerrar").focus(); }
    else if (a === "volver") abrirHoja(hojaMsg, hojaDesdeQR);
    else if (a === "qr-guardar") guardarQR(b).catch(() => {});
    else if (a === "instalar" && promptInstalar) {
      promptInstalar.prompt();
      let ok = false;
      try { ok = (await promptInstalar.userChoice).outcome === "accepted"; } catch (err) { /* nada */ }
      promptInstalar = null;
      abrirHoja(ok ? "¡Listo! La app se está instalando en tu pantalla de inicio." : "");
    } else if (a === "compartir") {
      const datos = { title: T.nombre, text: `${T.organizador} · ${T.nombre}`, url: URL_SITIO };
      try {
        if (navigator.share) await navigator.share(datos);
        else { await navigator.clipboard.writeText(URL_SITIO); b.textContent = "¡Enlace copiado!"; }
      } catch (err) { /* cancelado */ }
    }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !hoja.hidden) cerrarHoja(); });
  // Llegó escaneando el QR (…/?app=1): se abre sola la ventana para instalar, y se limpia la dirección.
  if (llegoPorQR) {
    try { history.replaceState(null, "", location.pathname + location.hash); } catch (err) { /* nada */ }
    if (!yaInstalada) setTimeout(() => abrirHoja("¡Bienvenido! Así instalas la app en tu teléfono:", true), 700);
  }

  if (!esArchivoLocal && "serviceWorker" in navigator) {
    // Si ya había una versión guardada y llega una nueva, recargar UNA vez para mostrarla.
    const habiaVersion = !!navigator.serviceWorker.controller;
    let recargado = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!habiaVersion || recargado) return;
      recargado = true;
      location.reload();
    });
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js", { updateViaCache: "none" })
        .then((reg) => reg.update())
        .catch(() => {});
      if (avisosEstado() === "activos") {
        setTimeout(() => import("./avisos.js").then((m) => m.renovarSiHaceFalta()).catch(() => {}), 4000);
      }
    });
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    promptInstalar = e;
    if (!hoja.hidden && !hoja.querySelector(".ha-caja-qr")) hoja.innerHTML = contenidoHoja(hojaMsg, hojaDesdeQR);
  });
  window.addEventListener("appinstalled", () => { promptInstalar = null; if (!hoja.hidden) abrirHoja("¡Listo! La app quedó instalada."); });
  if (estado.tab === "canchas" && estado.cancha) setTimeout(() => marcarCancha(estado.cancha, true), 60);
  if (QUINIELA_ACTIVA) {
    document.getElementById("tab-quiniela").hidden = false;
    document.getElementById("tabs").classList.add("con-6");
  }
  renderCabecera();
  if (esArchivoLocal && T.actualizado) {
    document.getElementById("pie-act").textContent =
      "Versión sin internet · datos al " + fecha(T.actualizado, { day: "numeric", month: "long", year: "numeric" });
  }
  render();

  /* Si el organizador ya entró antes con su cuenta, publica en silencio las horas
     de apertura/cierre de la quiniela (así cada jornada se abre sola 2 días antes). */
  if (QUINIELA_ACTIVA && !esArchivoLocal && store.get("reddfut-admin") === "1" && navigator.onLine !== false) {
    setTimeout(() => {
      import("./quiniela.js")
        .then((m) => m.sincronizarEnSegundoPlano({ T, CATS, JORNADAS, ESCUELAS, parseRes, escudo, esc, fecha }))
        .catch(() => {});
    }, 2500);
  }
})();

/* ------------------------------------------------------------------ */
/* Música de fondo: botón redondo abajo a la izquierda.                */
/* Empieza APAGADA; la persona la enciende. Se pausa sola al salir de  */
/* la app y recuerda si la dejaste encendida. Canciones: datos.js →    */
/* musica: ["cancion1.mp4", ...]                                       */
/* ------------------------------------------------------------------ */
(function musicaDeFondo() {
  "use strict";
  const T = window.TORNEO || {};
  const lista = (T.musica || []).filter(Boolean);
  if (!lista.length || window.MODO_OFFLINE || location.protocol === "file:") return;   // el archivo sin internet no lleva música

  const CLAVE = "reddfut-musica";
  const leer = () => { try { return localStorage.getItem(CLAVE) === "1"; } catch (e) { return false; } };
  const guardar = (v) => { try { localStorage.setItem(CLAVE, v ? "1" : "0"); } catch (e) {} };

  let pista = 0, quiere = leer(), pausadaPorSalir = false, fallos = 0;
  const audio = new Audio();
  audio.preload = "none";
  audio.volume = 0.35;
  audio.loop = lista.length === 1;
  const ponerPista = (i) => { pista = (i + lista.length) % lista.length; audio.src = lista[pista]; };
  ponerPista(0);

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

  audio.addEventListener("playing", () => { fallos = 0; pintar("sonando"); });
  audio.addEventListener("waiting", () => { if (!audio.paused) pintar("cargando"); });
  audio.addEventListener("pause", () => { if (!pausadaPorSalir) pintar("apagada"); });
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
      if (!audio.paused) { pausadaPorSalir = true; audio.pause(); }
    } else if (pausadaPorSalir) {
      pausadaPorSalir = false;
      if (quiere) tocar();
    }
  });

  // Nombre en la pantalla de bloqueo / controles del teléfono
  if ("mediaSession" in navigator && window.MediaMetadata) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Música del torneo", artist: T.organizador || "REDDFUT Usulután",
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
