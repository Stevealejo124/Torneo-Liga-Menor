/* =====================================================================
   DATOS DEL TORNEO  —  ESTE ES EL ÚNICO ARCHIVO QUE NECESITAS EDITAR
   =====================================================================
   Cómo anotar un resultado (siempre goles LOCAL - VISITANTE):
     "2-1"            → ganó el local 2 a 1
     "0-0"            → empate
     "3-0 W.O."       → se cuenta 3-0 y aparece la nota "W.O."
     "1-1 (4-3)"      → (solo playoffs) empate 1-1, penales 4-3
     ""  o  no ponerlo → partido pendiente (no cuenta en la tabla)
     "Suspendido"     → se muestra el texto y NO cuenta en la tabla

   Los nombres de las escuelas en los partidos deben escribirse
   EXACTAMENTE igual que en la lista "escuelas" (con tildes y puntos).
   Si algo no coincide, el sitio mostrará un aviso en rojo arriba.
   ===================================================================== */

window.TORNEO = {
  nombre: "Torneo Apertura Liga Menor 2026-2027",
  subtitulo: "Escuelas de fútbol infanto-juveniles de Usulután",
  organizador: "REDDFUT Usulután",
  actualizado: "2026-10-18",       // fecha de la última actualización (AAAA-MM-DD)

  // true = muestra el aviso amarillo de "datos de ejemplo"
  modoDemo: false,

  totalJornadas: 13,
  clasificados: 8,
  categorias: ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15"],

  // ---- LAS 14 ESCUELAS
  // "corto" = siglas del escudo. "color" (opcional) = color del escudo.
  // "sinCategorias" (opcional) = categorías en que la escuela NO participa
  //  (no aparecerá en esa tabla).
  escuelas: [
    { nombre: "Alegría",            corto: "ALE" },
    { nombre: "Berlín",             corto: "BER" },
    { nombre: "Ciudad El Triunfo",  corto: "CET" },
    { nombre: "El Tránsito",        corto: "ETR" },
    { nombre: "Estanzuelas",        corto: "EST", sinCategorias: ["Sub-15"] },
    { nombre: "Gerardo Barrios",    corto: "GB"  },
    { nombre: "Jucuapa",            corto: "JUC" },
    { nombre: "La Noria",           corto: "LNO" },
    { nombre: "Lolotique",          corto: "LOL" },
    { nombre: "Mercedes Umaña",     corto: "MU"  },
    { nombre: "Puerto El Triunfo",  corto: "PET" },
    { nombre: "San Marcos",         corto: "SMC" },
    { nombre: "Santiago de María",  corto: "SDM" },
    { nombre: "Topiltzin",          corto: "TOP" }
  ],

  // ---- JORNADAS: agrega una nueva cada semana (copia y pega un bloque)
  // Si una categoría no se jugó, simplemente no la pongas.
  jornadas: [
    {
      numero: 1,
      fecha: "2026-10-10",
      partidos: [
        { local: "Alegría", visitante: "Estanzuelas",
          resultados: { "Sub-7": "8-0", "Sub-11": "14-1", "Sub-13": "4-4" } },
        { local: "Ciudad El Triunfo", visitante: "La Noria",
          resultados: { "Sub-7": "3-5", "Sub-11": "0-10", "Sub-13": "0-3", "Sub-15": "2-6" } },
        { local: "Lolotique", visitante: "Jucuapa",
          resultados: { "Sub-7": "11-1", "Sub-9": "2-6", "Sub-11": "3-1", "Sub-13": "2-3", "Sub-15": "2-2" } },
        { local: "Santiago de María", visitante: "Gerardo Barrios",
          resultados: { "Sub-9": "5-10", "Sub-11": "1-10", "Sub-13": "6-3", "Sub-15": "2-3" } },
        { local: "Topiltzin", visitante: "Berlín",
          resultados: { "Sub-9": "12-0", "Sub-11": "12-0", "Sub-13": "4-2", "Sub-15": "3-2" } },
        { local: "San Marcos", visitante: "El Tránsito",
          resultados: { "Sub-9": "3-3", "Sub-11": "3-1", "Sub-13": "3-4", "Sub-15": "4-2" } },
        { local: "Mercedes Umaña", visitante: "Puerto El Triunfo",
          resultados: { "Sub-9": "0-9", "Sub-11": "2-3", "Sub-13": "2-1", "Sub-15": "0-2 W.O." } }
      ]
    },
    {
      numero: 2,
      partidos: [
        { local: "La Noria", visitante: "Mercedes Umaña",
          resultados: { "Sub-9": "2-0 W.O.", "Sub-11": "2-0 W.O.", "Sub-13": "2-0 W.O.", "Sub-15": "2-0 W.O." } },
        { local: "El Tránsito", visitante: "Alegría",
          resultados: { "Sub-7": "2-0", "Sub-9": "21-1", "Sub-11": "3-2", "Sub-13": "12-2", "Sub-15": "3-4" } },
        { local: "Lolotique", visitante: "Berlín",
          resultados: { "Sub-7": "2-0", "Sub-9": "0-12", "Sub-11": "14-1", "Sub-13": "4-5", "Sub-15": "2-2" } },
        { local: "Gerardo Barrios", visitante: "Topiltzin",
          resultados: { "Sub-7": "2-0", "Sub-9": "1-9", "Sub-11": "2-2", "Sub-13": "4-3", "Sub-15": "2-0" } },
        { local: "Jucuapa", visitante: "San Marcos",
          resultados: { "Sub-7": "3-0", "Sub-9": "4-6", "Sub-11": "3-4", "Sub-13": "3-3", "Sub-15": "4-1" } },
        { local: "Puerto El Triunfo", visitante: "Santiago de María",
          resultados: { "Sub-9": "8-4", "Sub-11": "6-4", "Sub-13": "4-7", "Sub-15": "6-0" } },
        { local: "Estanzuelas", visitante: "Ciudad El Triunfo",
          resultados: { "Sub-9": "2-9", "Sub-11": "6-11", "Sub-13": "11-7" } }
      ]
    }
  ],

  // ---- AJUSTES DE PUNTOS (sanciones). Ejemplo:
  // { escuela: "Berlín", categoria: "Sub-15", puntos: -3, motivo: "Alineación indebida" }
  // categoria puede ser "Todas".
  ajustes: [],

  // ---- ANUNCIOS: aparecen al final de cada sección, sin tapar nada.
  // Para quitar uno, borra su bloque { ... }. Para cambiar textos o enlace,
  // edita aquí. "estilo" puede ser "retro" (oscuro) o "claro".
  anuncios: [
    {
      estilo: "retro",
      marca: "Retro Football Manager SV",
      titulo: "¿Te creés DT?",
      texto: "Elegí un club de la liga salvadoreña, armá la plantilla, fichá en el mercado de pases y peleá el ascenso. Gratis y desde el navegador.",
      boton: "Jugar gratis",
      url: "https://7320256-arch.github.io/Retro-Football-Manager-SV/"
    },
    {
      estilo: "claro",
      marca: "Christopher Alejo · Jiquilisco, Usulután",
      titulo: "Herramientas digitales para tu negocio",
      texto: "Menús digitales con pedidos por WhatsApp, marcadores deportivos para torneos y sitios web sencillos. Sin instalar nada.",
      boton: "Ver proyectos",
      url: "https://7320256-arch.github.io/Portafolio-/"
    }
  ],

  // ---- PLAYOFFS: se llenan al terminar la liga. Los cruces se arman SOLOS
  // con la tabla (C1: 1º vs 8º, C2: 4º vs 5º, C3: 2º vs 7º, C4: 3º vs 6º;
  // S1: ganador C1 vs ganador C2; S2: ganador C3 vs ganador C4; F: Final).
  // Solo anota el marcador. Ejemplo:
  //   "Sub-13": { C1: "2-0", C2: "1-1 (5-4)", C3: "0-1", C4: "3-2",
  //               S1: { resultado: "2-1", fecha: "2027-01-10" }, F: "1-0" }
  playoffs: {
    "Sub-7": {}, "Sub-9": {}, "Sub-11": {}, "Sub-13": {}, "Sub-15": {}
  }
};
