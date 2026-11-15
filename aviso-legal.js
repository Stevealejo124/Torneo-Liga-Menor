/* =====================================================================
   DESCARGO DE RESPONSABILIDAD (aviso legal)
   Sirve para las dos páginas (Escuelitas y Femenino). Agrega en el pie
   de página la línea "Proyecto independiente…" y el botón
   "Descargo de responsabilidad", que abre la ventana con el texto completo.
   Para cambiar el texto, edita RESUMEN y SECCIONES de aquí abajo.
   ===================================================================== */
(function () {
  "use strict";
  if (document.getElementById("dl-ventana")) return;

  const esFemenino = !!window.LFFU && !window.TORNEO;
  const CORREO = (window.TORNEO && window.TORNEO.contacto && window.TORNEO.contacto.correo) || "cseuropa1890@gmail.com";

  /* Texto corto (aparece arriba, resaltado) */
  const RESUMEN = "Este sitio web y su aplicación móvil son un proyecto independiente de seguimiento deportivo sin relación oficial con REDDFUT Usulután, la Liga de Fútbol Femenino Usulután (LFFU) ni con los organizadores de los torneos. Los datos, tablas de posiciones y resultados se publican con carácter estrictamente informativo. Los nombres de los equipos y emblemas mostrados se utilizan únicamente para identificar a los participantes de la competencia y son propiedad de sus respectivas instituciones.";

  /* Texto completo, por apartados */
  const SECCIONES = [
    ["1. Proyecto independiente",
      "<p>Esta página y su aplicación son creadas y mantenidas de forma voluntaria por aficionados al fútbol de Usulután. <b>No somos la organización oficial</b> de ningún torneo: no pertenecemos a REDDFUT Usulután, a la LFFU, a las escuelas de fútbol, a los equipos ni a sus patrocinadores, y no hablamos en nombre de ninguno de ellos.</p>" +
      "<p>Nada de lo que se publica aquí es un comunicado oficial. Las decisiones sobre el torneo (resultados, sanciones, calendario, reglamento o premiación) corresponden únicamente a sus organizadores.</p>"],
    ["2. Los datos son solo informativos",
      "<p>Los resultados se copian de las hojas de juego, publicaciones y avisos de los organizadores, y las tablas de posiciones se calculan automáticamente a partir de ellos. Por eso pueden tener <b>errores, retrasos u omisiones</b>; por ejemplo, una sanción o un resultado administrativo puede tardar en reflejarse.</p>" +
      "<p><b>La información oficial es siempre la que publiquen los organizadores.</b> Si hay alguna diferencia entre lo que ves aquí y lo oficial, vale lo oficial.</p>"],
    ["3. Nombres, escudos y logotipos",
      "<p>Los nombres, escudos, logotipos y colores de las escuelas, equipos, ligas y organizadores son propiedad de sus respectivas instituciones. Se muestran solo para <b>identificar a quién corresponde cada resultado</b>, sin fines de lucro y sin intención de apropiarnos de ellos.</p>" +
      "<p>Su uso no significa que esas instituciones respalden, patrocinen o hayan aprobado este proyecto. Si eres responsable de alguno de ellos y deseas que se corrija o se retire, escríbenos y lo atenderemos.</p>"],
    ["4. Menores de edad y datos personales",
      "<p>En los torneos participan niñas, niños y jóvenes. Para protegerlos, <b>no publicamos nombres, fotografías ni datos personales de jugadores</b>: solo resultados por escuela, equipo y categoría.</p>"],
    ["5. Canchas, horarios y calendario",
      "<p>Las ubicaciones en el mapa pueden ser aproximadas y las fechas u horarios pueden cambiar (lluvia, reprogramaciones, decisiones de la organización). Confirma con los organizadores o con tu escuela antes de trasladarte.</p>"],
    ["6. Quiniela de pronósticos",
      "<p>La quiniela es un juego gratuito de pronósticos entre aficionados. <b>No es una apuesta</b>: no se pide ni se maneja dinero. La cuenta de Google se usa solo para identificar tus pronósticos. No está organizada ni avalada por REDDFUT Usulután ni por las escuelas.</p>"],
    ["7. Anuncios y enlaces externos",
      "<p>Los anuncios y los enlaces a otras páginas (redes sociales, mapas, sitios de anunciantes) llevan a sitios que no controlamos; su contenido es responsabilidad de sus autores. Los anunciantes no tienen relación con los organizadores de los torneos.</p>"],
    ["8. Sin garantías",
      "<p>El sitio se ofrece tal como está, sin garantía de que la información esté completa, exacta o actualizada, ni de que funcione sin interrupciones. No nos hacemos responsables por decisiones tomadas únicamente con base en lo publicado aquí.</p>"],
    ["9. Correcciones y contacto",
      "<p>¿Encontraste un error, eres organizador o representas a una escuela o equipo? Escríbenos y lo revisamos lo antes posible.</p>"]
  ];

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ICO = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6l8-3zM12 8v5M12 16.5v.01"/></svg>';

  /* ---------- Estilos (van aquí para que sirvan en las dos páginas y sin internet) ---------- */
  const acento = esFemenino ? "var(--magenta, #e91e8c)" : "var(--oro, #f2b705)";
  const css = `
.dl-pie { margin-top: 12px; margin-bottom: 14px; font-size: .8rem; line-height: 1.45; }
.dl-pie-in { padding-top: 12px; border-top: 1px solid rgba(255,255,255,.14); }
.dl-pie p { margin: 0 0 8px; max-width: 640px; opacity: .85; }
.dl-abrir {
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  background: transparent; color: inherit; border: 1.5px solid ${acento}; border-radius: 999px;
  padding: 6px 13px 5px; font: inherit; font-weight: 700; font-size: .8rem; letter-spacing: .02em;
}
.dl-abrir svg { color: ${acento}; flex: none; }
.dl-abrir:hover, .dl-abrir:focus-visible { background: rgba(255,255,255,.1); }
.dl-abrir:focus-visible { outline: 2px solid ${acento}; outline-offset: 2px; }
.dl-ventana {
  position: fixed; inset: 0; z-index: 9000; display: flex; align-items: flex-end; justify-content: center;
  background: rgba(6, 14, 30, .62); padding: 0; opacity: 0; transition: opacity .2s;
}
.dl-ventana[hidden] { display: none; }
.dl-ventana.visible { opacity: 1; }
.dl-caja {
  position: relative; width: 100%; max-width: 680px; max-height: 92vh; display: flex; flex-direction: column;
  background: #fff; color: #1d2733; border-radius: 14px 14px 0 0; border-top: 5px solid ${acento};
  box-shadow: 0 -10px 40px rgba(0,0,0,.35); transform: translateY(24px); transition: transform .25s;
}
.dl-ventana.visible .dl-caja { transform: none; }
@media (min-width: 640px) { .dl-ventana { align-items: center; padding: 20px; } .dl-caja { border-radius: 10px; max-height: 88vh; } }
.dl-cab { padding: 18px 58px 12px 22px; border-bottom: 1px solid rgba(11,37,69,.12); }
.dl-sobre { display: block; font-family: var(--titular, sans-serif); font-weight: 700; letter-spacing: .18em; text-transform: uppercase; font-size: .78rem; color: ${esFemenino ? "var(--magenta-osc, #a3125f)" : "#9a7300"}; }
.dl-cab h2 { margin: 2px 0 0; font-family: var(--titular, sans-serif); font-weight: 800; text-transform: uppercase; font-size: clamp(1.45rem, 5.6vw, 1.9rem); line-height: 1.02; color: var(--azul, #0b2545); }
.dl-cerrar { position: absolute; top: 12px; right: 12px; width: 38px; height: 38px; border: 0; border-radius: 50%; background: #eef0f3; color: var(--azul, #0b2545); font-size: 1.05rem; font-weight: 800; cursor: pointer; }
.dl-cuerpo { overflow-y: auto; padding: 14px 22px 6px; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
.dl-resumen { margin: 0 0 14px; padding: 12px 14px; border-left: 4px solid ${acento}; background: ${esFemenino ? "#fff0f7" : "#fff8e1"}; border-radius: 0 6px 6px 0; font-size: .92rem; line-height: 1.5; }
.dl-cuerpo h3 { margin: 16px 0 4px; font-family: var(--titular, sans-serif); font-weight: 800; text-transform: uppercase; letter-spacing: .03em; font-size: 1.08rem; color: var(--azul, #0b2545); }
.dl-cuerpo p { margin: 0 0 8px; font-size: .9rem; line-height: 1.55; color: #2b3644; }
.dl-correo { display: inline-block; margin: 2px 0 12px; font-weight: 700; color: var(--azul, #0b2545); word-break: break-all; }
.dl-pie-caja { display: flex; justify-content: flex-end; padding: 12px 22px max(14px, env(safe-area-inset-bottom)); border-top: 1px solid rgba(11,37,69,.12); }
.dl-entendido { border: 0; border-radius: 999px; padding: 11px 22px 10px; background: var(--azul, #0b2545); color: #fff; cursor: pointer;
  font-family: var(--titular, sans-serif); font-weight: 800; font-size: 1rem; letter-spacing: .08em; text-transform: uppercase; box-shadow: 0 0 0 2px ${acento}; }
body.dl-abierta { overflow: hidden; }
@media (prefers-reduced-motion: reduce) { .dl-ventana, .dl-caja { transition: none; } }
@media print { .dl-ventana, .dl-abrir { display: none !important; } }`;
  const estilo = document.createElement("style");
  estilo.textContent = css;
  document.head.appendChild(estilo);

  /* ---------- Pie de página: línea corta + botón ---------- */
  const pie = document.querySelector("footer.pie");
  if (pie) {
    const caja = document.createElement("div");
    caja.className = "dl-pie contenedor";
    caja.innerHTML = `<div class="dl-pie-in"><p>Proyecto independiente de seguimiento deportivo, sin relación oficial con los organizadores de los torneos. Datos solo informativos.</p>
      <button class="dl-abrir" type="button" aria-haspopup="dialog" aria-controls="dl-ventana">${ICO}<span>Descargo de responsabilidad</span></button></div>`;
    const lema = pie.querySelector(".pie-lema");
    if (lema) pie.insertBefore(caja, lema); else pie.appendChild(caja);
  }

  /* ---------- Ventana ---------- */
  const ventana = document.createElement("div");
  ventana.id = "dl-ventana"; ventana.className = "dl-ventana"; ventana.hidden = true;
  ventana.innerHTML = `<div class="dl-caja" role="dialog" aria-modal="true" aria-labelledby="dl-tit">
      <header class="dl-cab">
        <span class="dl-sobre">Aviso legal</span>
        <h2 id="dl-tit">Descargo de responsabilidad</h2>
        <button class="dl-cerrar" type="button" data-dl="cerrar" aria-label="Cerrar">✕</button>
      </header>
      <div class="dl-cuerpo" tabindex="0">
        <p class="dl-resumen"><b>Descargo de responsabilidad:</b> ${esc(RESUMEN)}</p>
        ${SECCIONES.map(([t, h]) => `<h3>${esc(t)}</h3>${h}`).join("")}
        <a class="dl-correo" href="${esc("mailto:" + CORREO + "?subject=" + encodeURIComponent("Corrección / aviso legal"))}">✉ ${esc(CORREO)}</a>
      </div>
      <div class="dl-pie-caja"><button class="dl-entendido" type="button" data-dl="cerrar">Entendido</button></div>
    </div>`;
  document.body.appendChild(ventana);

  let ultimoFoco = null;
  function abrir() {
    ultimoFoco = document.activeElement;
    ventana.hidden = false;
    document.body.classList.add("dl-abierta");
    ventana.querySelector(".dl-cuerpo").scrollTop = 0;
    requestAnimationFrame(() => ventana.classList.add("visible"));
    ventana.querySelector(".dl-cerrar").focus();
  }
  function cerrar() {
    ventana.classList.remove("visible");
    document.body.classList.remove("dl-abierta");
    setTimeout(() => { ventana.hidden = true; }, 200);
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest(".dl-abrir, [data-abrir-descargo]")) { e.preventDefault(); abrir(); }
  });
  ventana.addEventListener("click", (e) => {
    if (e.target === ventana || e.target.closest("[data-dl='cerrar']")) cerrar();
  });
  document.addEventListener("keydown", (e) => {
    if (ventana.hidden) return;
    if (e.key === "Escape") cerrar();
    else if (e.key === "Tab") {           // mantener el foco dentro de la ventana
      const f = ventana.querySelectorAll("button, a[href], [tabindex='0']");
      const pri = f[0], ult = f[f.length - 1];
      if (e.shiftKey && document.activeElement === pri) { e.preventDefault(); ult.focus(); }
      else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); pri.focus(); }
    }
  });
  window.abrirDescargo = abrir;
})();
