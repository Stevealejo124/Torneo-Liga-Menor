/* =====================================================================
   DATOS LFFU — ESTE ES EL ÚNICO ARCHIVO QUE NECESITAS EDITAR
   =====================================================================
   Cómo anotar un resultado (goles LOCAL - VISITANTE):
     "2-1"        → ganó el local
     "0-0"        → empate
     "3-0 W.O."   → se cuenta 3-0 y aparece la nota "W.O."
     "" o null    → partido pendiente (no cuenta en la tabla)
   Cada partido puede llevar: fecha (si no es el día de la jornada),
   hora ("15:30") y nota (texto corto debajo del marcador).
   Los nombres deben escribirse EXACTAMENTE igual que en "equipos".
   ===================================================================== */
window.LFFU = {
  nombre: "Liga de Fútbol Femenino Usulután",
  siglas: "LFFU",
  temporada: "Apertura 2026",
  actualizado: "2026-11-12",
  totalJornadas: 14,
  clasificados: 6,          // los 6 primeros van a cuartos de final
  lema: "El primer amor de una mujer debe ser siempre el amor propio",

  equipos: [
    { nombre: "C.D. Federal",      corto: "FED", color: "#1d6fb8", color2: "#0d3f6e" },
    { nombre: "Vencedor",          corto: "VEN", color: "#8e24aa", color2: "#4a1259" },
    { nombre: "Galingagua",        corto: "GAL", color: "#b3202c", color2: "#57060c" },
    { nombre: "Palmo",             corto: "PAL", color: "#1e8a4c", color2: "#0b4a26" },
    { nombre: "Estrellas Marinas", corto: "EST", color: "#d81b7f", color2: "#6d0f45" },
    { nombre: "Usuluteca",         corto: "USU", color: "#c62828", color2: "#1a3a8f" },
    { nombre: "Cuscatlecas",       corto: "CUS", color: "#283593", color2: "#0d1440" },
    { nombre: "Guadalupano",       corto: "GUA", color: "#f2a007", color2: "#7a4d00" }
  ],

  // porConfirmar: true = fecha estimada (la liga aún no la publica). Quítalo cuando se confirme.
  jornadas: [
    { numero: 1, fecha: "2026-09-12", partidos: [
      { local: "Cuscatlecas", visitante: "Guadalupano", cancha: "Cancha Miramar", fecha: "2026-09-11", hora: "16:00", resultado: "2-1" },
      { local: "Palmo", visitante: "Galingagua", cancha: "Cancha El Palmo", hora: "15:00", resultado: "1-2" },
      { local: "Vencedor", visitante: "C.D. Federal", cancha: "Cancha Balboa", hora: "15:30", resultado: "2-3" },
      { local: "Estrellas Marinas", visitante: "Usuluteca", cancha: "Cancha El Nigre", hora: "15:00", resultado: "0-4" } ] },
    { numero: 2, fecha: "2026-09-19", partidos: [
      { local: "Galingagua", visitante: "Vencedor", cancha: "Cancha Galingagua", hora: "15:00", resultado: "2-3" },
      { local: "C.D. Federal", visitante: "Palmo", cancha: "Cancha El Mono", hora: "15:30", resultado: "3-2" },
      { local: "Usuluteca", visitante: "Cuscatlecas", cancha: "Cancha San José", hora: "16:00", resultado: "2-2" },
      { local: "Guadalupano", visitante: "Estrellas Marinas", cancha: "Cancha Machupichu", hora: "16:00", resultado: "1-2" } ] },
    { numero: 3, fecha: "2026-09-26", partidos: [
      { local: "Palmo", visitante: "Usuluteca", cancha: "Cancha El Palmo", fecha: "2026-09-25", resultado: "2-1" },
      { local: "Cuscatlecas", visitante: "C.D. Federal", cancha: "Cancha Miramar", fecha: "2026-09-25", resultado: "1-2" },
      { local: "Vencedor", visitante: "Guadalupano", cancha: "Cancha Balboa", resultado: "3-0" },
      { local: "Estrellas Marinas", visitante: "Galingagua", cancha: "Cancha El Nigre", resultado: "1-3" } ] },
    { numero: 4, fecha: "2026-10-03", partidos: [
      { local: "Galingagua", visitante: "Cuscatlecas", cancha: "Cancha Galingagua", resultado: "3-1" },
      { local: "Guadalupano", visitante: "Palmo", cancha: "Cancha Machupichu", resultado: "1-2" },
      { local: "Usuluteca", visitante: "Vencedor", cancha: "Cancha San José", resultado: "2-5" },
      { local: "C.D. Federal", visitante: "Estrellas Marinas", cancha: "Cancha El Cerrito", fecha: "2026-10-13", resultado: "2-1", nota: "Reprogramado por lluvia: se jugó el martes 13 de octubre" } ] },
    { numero: 5, fecha: "2026-10-10", partidos: [
      { local: "Cuscatlecas", visitante: "Estrellas Marinas", cancha: "Cancha Miramar", fecha: "2026-10-09", resultado: "0-1" },
      { local: "Palmo", visitante: "Vencedor", cancha: "Cancha El Palmo", fecha: "2026-10-09", resultado: "1-3" },
      { local: "Guadalupano", visitante: "Galingagua", cancha: "Cancha Machupichu", resultado: "2-4" },
      { local: "Usuluteca", visitante: "C.D. Federal", cancha: "Cancha San José", resultado: "0-0" } ] },
    { numero: 6, fecha: "2026-10-17", partidos: [
      { local: "Estrellas Marinas", visitante: "Palmo", cancha: "Cancha El Nigre", resultado: "1-0" },
      { local: "Galingagua", visitante: "Usuluteca", cancha: "Cancha Galingagua", resultado: "2-2" },
      { local: "C.D. Federal", visitante: "Guadalupano", cancha: "Cancha El Mono", resultado: "2-1" },
      { local: "Vencedor", visitante: "Cuscatlecas", cancha: "Cancha Balboa", resultado: "4-1" } ] },
    { numero: 7, fecha: "2026-10-24", partidos: [
      { local: "Palmo", visitante: "Cuscatlecas", cancha: "Cancha El Palmo", fecha: "2026-10-23", resultado: "1-0" },
      { local: "Galingagua", visitante: "C.D. Federal", cancha: "Cancha Galingagua", fecha: "2026-10-23", resultado: "0-1" },
      { local: "Estrellas Marinas", visitante: "Vencedor", cancha: "Cancha El Nigre", fecha: "2026-10-23", resultado: "1-4" },
      { local: "Usuluteca", visitante: "Guadalupano", cancha: "Cancha San José", resultado: "5-0", nota: "Transmitido en vivo" } ] },
    { numero: 8, fecha: "2026-10-31", partidos: [
      { local: "Galingagua", visitante: "Palmo", cancha: "Cancha Galingagua", fecha: "2026-10-30", resultado: "1-1" },
      { local: "C.D. Federal", visitante: "Vencedor", cancha: "Cancha El Mono", resultado: "5-0", nota: "Duelo de líderes" },
      { local: "Usuluteca", visitante: "Estrellas Marinas", cancha: "Cancha San José", resultado: "7-1" },
      { local: "Guadalupano", visitante: "Cuscatlecas", cancha: "Cancha Machupichu", resultado: "3-1", nota: "Primera victoria del Guadalupano" } ] },
    { numero: 9, fecha: "2026-11-07", partidos: [
      { local: "Estrellas Marinas", visitante: "Guadalupano", cancha: "Cancha El Nigre", fecha: "2026-11-06", hora: "15:00", resultado: "4-0" },
      { local: "Palmo", visitante: "C.D. Federal", cancha: "Cancha El Palmo", fecha: "2026-11-06", hora: "15:30", resultado: "1-3" },
      { local: "Cuscatlecas", visitante: "Usuluteca", cancha: "Cancha Miramar", fecha: "2026-11-06", resultado: "0-3", nota: "Resultado administrativo" },
      { local: "Vencedor", visitante: "Galingagua", cancha: "Cancha Balboa", resultado: "10-3", nota: "Mayor goleada del torneo" } ] },
    { numero: 10, fecha: "2026-11-14", porConfirmar: true, partidos: [
      { local: "Usuluteca", visitante: "Palmo", cancha: "Cancha San José", resultado: "" },
      { local: "C.D. Federal", visitante: "Cuscatlecas", cancha: "Cancha El Mono", resultado: "" },
      { local: "Guadalupano", visitante: "Vencedor", cancha: "Cancha Machupichu", resultado: "" },
      { local: "Galingagua", visitante: "Estrellas Marinas", cancha: "Cancha Galingagua", resultado: "" } ] },
    { numero: 11, fecha: "2026-11-21", porConfirmar: true, partidos: [
      { local: "Cuscatlecas", visitante: "Galingagua", cancha: "Cancha Miramar", resultado: "" },
      { local: "Palmo", visitante: "Guadalupano", cancha: "Cancha El Palmo", resultado: "" },
      { local: "Vencedor", visitante: "Usuluteca", cancha: "Cancha Balboa", resultado: "" },
      { local: "Estrellas Marinas", visitante: "C.D. Federal", cancha: "Cancha El Nigre", resultado: "" } ] },
    { numero: 12, fecha: "2026-11-28", porConfirmar: true, partidos: [
      { local: "Estrellas Marinas", visitante: "Cuscatlecas", cancha: "Cancha El Nigre", resultado: "" },
      { local: "Vencedor", visitante: "Palmo", cancha: "Cancha Balboa", resultado: "" },
      { local: "Galingagua", visitante: "Guadalupano", cancha: "Cancha Galingagua", resultado: "" },
      { local: "C.D. Federal", visitante: "Usuluteca", cancha: "Cancha El Mono", resultado: "" } ] },
    { numero: 13, fecha: "2026-12-05", porConfirmar: true, partidos: [
      { local: "Palmo", visitante: "Estrellas Marinas", cancha: "Cancha El Palmo", resultado: "" },
      { local: "Usuluteca", visitante: "Galingagua", cancha: "Cancha San José", resultado: "" },
      { local: "Guadalupano", visitante: "C.D. Federal", cancha: "Cancha Machupichu", resultado: "" },
      { local: "Cuscatlecas", visitante: "Vencedor", cancha: "Cancha Miramar", resultado: "" } ] },
    { numero: 14, fecha: "2026-12-12", porConfirmar: true, partidos: [
      { local: "Cuscatlecas", visitante: "Palmo", cancha: "Cancha Miramar", resultado: "" },
      { local: "C.D. Federal", visitante: "Galingagua", cancha: "Cancha El Mono", resultado: "" },
      { local: "Vencedor", visitante: "Estrellas Marinas", cancha: "Cancha Balboa", resultado: "" },
      { local: "Guadalupano", visitante: "Usuluteca", cancha: "Cancha Machupichu", resultado: "" } ] }
  ],

  // Goleadoras: déjalo vacío [] mientras no haya datos oficiales (la pestaña se oculta sola).
  // Ejemplo: { nombre: "Nombre Apellido", equipo: "Vencedor", goles: 5 },
  goleadoras: [],

  // Reconocimientos oficiales de la liga (aparecen en Inicio)
  reconocimientos: [
    { fecha: "2026-10-27", texto: "Palmo y Galingagua, premiados como los equipos con mejor actitud, respeto y perseverancia de la primera vuelta, según los reportes arbitrales." }
  ],

  // Canchas: cada equipo juega de local en la suya. "exacta: false" = ubicación aproximada.
  // CANCHAS · lat/lng = punto en el mapa. precision: "exacta" (la cancha misma), "zona" (cantón ubicado),
  // "municipio" (solo se sabe el municipio). Sin lat/lng = aún sin punto en el mapa.
  // Para marcar una cancha: pega aquí lat y lng (de Google Maps) y pon precision: "exacta".
  canchas: [
    { id: "el-palmo", cancha: "Cancha El Palmo", equipo: "Palmo", lugar: "Cantón El Palmo, San Francisco Javier (Usulután Oeste)",
      lat: 13.4325, lng: -88.5683, precision: "zona", etiqueta: "der",
      detalle: "Cancha de local de Palmo, en el cantón El Palmo, a unos 2.5 km al norte del casco urbano de San Francisco Javier.",
      fuente: "Ubicación del cantón: MINED (C.E. Cantón El Palmo) y GeoNames." },
    { id: "galingagua", cancha: "Cancha Galingagua", equipo: "Galingagua", lugar: "Cantón Galingagua, San Agustín (Usulután Oeste)",
      lat: 13.45, lng: -88.5833, precision: "zona", etiqueta: "izq",
      detalle: "Cancha de local de Galingagua, en el cantón Galingagua de San Agustín, vecino de El Palmo.",
      fuente: "Ubicación del cantón: GeoNames y municipiosdeelsalvador.com (cantón 8 de San Agustín)." },
    { id: "el-nigre", cancha: "Cancha El Nigre", equipo: "Estrellas Marinas", lugar: "Puerto El Triunfo (Usulután Oeste)",
      lat: 13.2748, lng: -88.5472, precision: "municipio", etiqueta: "der",
      detalle: "Cancha de local de Estrellas Marinas, en Puerto El Triunfo, a la orilla de la Bahía de Jiquilisco." },
    { id: "usuluteca", cancha: "Cancha San José", equipo: "Usuluteca", lugar: "Colonia San José, ciudad de Usulután", alias: "El Puma",
      lat: 13.3447, lng: -88.4399, precision: "municipio", etiqueta: "izq",
      detalle: "Cancha de local de Usuluteca, en la ciudad de Usulután. Aquí se transmitió en vivo el Usuluteca 5–0 Guadalupano de la jornada 7." },
    { id: "miramar", cancha: "Cancha Miramar", equipo: "Cuscatlecas", lugar: "Por confirmar",
      detalle: "Cancha de local de Cuscatlecas. En Usulután hay varios cantones llamados Miramar (Santa Elena, Concepción Batres, Jucuarán); falta confirmar cuál es." },
    { id: "balboa", cancha: "Cancha Balboa", equipo: "Vencedor", lugar: "Por confirmar",
      detalle: "Cancha de local de Vencedor. Aquí se jugó el Vencedor 10–3 Galingagua, la mayor goleada del torneo." },
    { id: "federal", cancha: "Cancha El Mono", equipo: "C.D. Federal", lugar: "Por confirmar",
      detalle: "Cancha de local de C.D. Federal. El partido reprogramado por lluvia ante Estrellas Marinas (J4) se jugó en la cancha El Cerrito." },
    { id: "guadalupano", cancha: "Cancha Machupichu", equipo: "Guadalupano", lugar: "Por confirmar",
      detalle: "Cancha de local de Guadalupano. Aquí llegó su primera victoria: 3–1 ante Cuscatlecas (J8)." }
  ],

  contacto: { whatsapp: "+1 510-779-8559", lugar: "Barrio El Candelaria, Usulután, El Salvador" }
};
