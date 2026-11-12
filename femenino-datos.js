/* =====================================================================
   DATOS LFFU — ESTE ES EL ÚNICO ARCHIVO QUE NECESITAS EDITAR
   =====================================================================
   Cómo anotar un resultado (goles LOCAL - VISITANTE):
     "2-1"        → ganó el local
     "0-0"        → empate
     "3-0 W.O."   → se cuenta 3-0 y aparece la nota "W.O."
     "" o null    → partido pendiente (no cuenta en la tabla)
   Los nombres deben escribirse EXACTAMENTE igual que en "equipos".
   ===================================================================== */
window.LFFU = {
  nombre: "Liga de Fútbol Femenino Usulután",
  siglas: "LFFU",
  temporada: "2026·27",
  actualizado: "2026-11-10",
  totalJornadas: 14,
  clasificados: 4,

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

  jornadas: [
    { numero: 1, fecha: "2026-09-19", partidos: [
      { local: "C.D. Federal", visitante: "Guadalupano", cancha: "Cancha Federal", resultado: "2-1" },
      { local: "Galingagua", visitante: "Palmo", cancha: "Cancha Galingagua", resultado: "2-0" },
      { local: "Usuluteca", visitante: "Estrellas Marinas", cancha: "Cancha Usuluteca", resultado: "4-0" },
      { local: "Cuscatlecas", visitante: "Vencedor", cancha: "Cancha Miramar", resultado: "1-4" } ] },
    { numero: 2, fecha: "2026-09-26", partidos: [
      { local: "Palmo", visitante: "C.D. Federal", cancha: "Cancha El Palmo", resultado: "0-1" },
      { local: "Estrellas Marinas", visitante: "Guadalupano", cancha: "Cancha El Nigre", resultado: "2-1" },
      { local: "Vencedor", visitante: "Galingagua", cancha: "Cancha Balboa", resultado: "4-1" },
      { local: "Cuscatlecas", visitante: "Usuluteca", cancha: "Cancha Miramar", resultado: "2-2" } ] },
    { numero: 3, fecha: "2026-10-03", partidos: [
      { local: "C.D. Federal", visitante: "Estrellas Marinas", cancha: "Cancha Federal", resultado: "1-0" },
      { local: "Palmo", visitante: "Vencedor", cancha: "Cancha El Palmo", resultado: "2-4" },
      { local: "Guadalupano", visitante: "Cuscatlecas", cancha: "Cancha Guadalupano", resultado: "0-2" },
      { local: "Galingagua", visitante: "Usuluteca", cancha: "Cancha Galingagua", resultado: "2-2" } ] },
    { numero: 4, fecha: "2026-10-10", partidos: [
      { local: "C.D. Federal", visitante: "Vencedor", cancha: "Cancha Federal", resultado: "4-3" },
      { local: "Estrellas Marinas", visitante: "Cuscatlecas", cancha: "Cancha El Nigre", resultado: "1-0" },
      { local: "Palmo", visitante: "Usuluteca", cancha: "Cancha El Palmo", resultado: "3-1" },
      { local: "Guadalupano", visitante: "Galingagua", cancha: "Cancha Guadalupano", resultado: "2-4" } ] },
    { numero: 5, fecha: "2026-10-17", partidos: [
      { local: "Cuscatlecas", visitante: "C.D. Federal", cancha: "Cancha Miramar", resultado: "2-3" },
      { local: "Usuluteca", visitante: "Vencedor", cancha: "Cancha Usuluteca", resultado: "1-3" },
      { local: "Galingagua", visitante: "Estrellas Marinas", cancha: "Cancha Galingagua", resultado: "4-2" },
      { local: "Guadalupano", visitante: "Palmo", cancha: "Cancha Guadalupano", resultado: "2-3" } ] },
    { numero: 6, fecha: "2026-10-24", partidos: [
      { local: "C.D. Federal", visitante: "Usuluteca", cancha: "Cancha Federal", resultado: "1-1" },
      { local: "Cuscatlecas", visitante: "Galingagua", cancha: "Cancha Miramar", resultado: "0-3" },
      { local: "Vencedor", visitante: "Guadalupano", cancha: "Cancha Balboa", resultado: "2-0" },
      { local: "Estrellas Marinas", visitante: "Palmo", cancha: "Cancha El Nigre", resultado: "1-0" } ] },
    { numero: 7, fecha: "2026-10-31", partidos: [
      { local: "Galingagua", visitante: "C.D. Federal", cancha: "Cancha Galingagua", resultado: "0-1" },
      { local: "Guadalupano", visitante: "Usuluteca", cancha: "Cancha Guadalupano", resultado: "0-5" },
      { local: "Palmo", visitante: "Cuscatlecas", cancha: "Cancha El Palmo", resultado: "1-0" },
      { local: "Estrellas Marinas", visitante: "Vencedor", cancha: "Cancha El Nigre", resultado: "1-4" } ] },
    { numero: 8, fecha: "2026-11-14", partidos: [
      { local: "Guadalupano", visitante: "C.D. Federal", cancha: "Cancha Guadalupano", hora: "14:00" },
      { local: "Palmo", visitante: "Galingagua", cancha: "Cancha El Palmo", hora: "15:30" },
      { local: "Estrellas Marinas", visitante: "Usuluteca", cancha: "Cancha El Nigre", hora: "16:00" },
      { local: "Vencedor", visitante: "Cuscatlecas", cancha: "Cancha Balboa", hora: "18:00" } ] },
    { numero: 9, fecha: "2026-11-21", partidos: [
      { local: "C.D. Federal", visitante: "Palmo", cancha: "Cancha Federal", hora: "14:30" },
      { local: "Guadalupano", visitante: "Estrellas Marinas", cancha: "Cancha Guadalupano", hora: "15:00" },
      { local: "Galingagua", visitante: "Vencedor", cancha: "Cancha Galingagua", hora: "16:30" },
      { local: "Usuluteca", visitante: "Cuscatlecas", cancha: "Cancha Usuluteca", hora: "18:00" } ] },
    { numero: 10, fecha: "2026-11-28", partidos: [
      { local: "Estrellas Marinas", visitante: "C.D. Federal", cancha: "Cancha El Nigre", hora: "14:00" },
      { local: "Vencedor", visitante: "Palmo", cancha: "Cancha Balboa", hora: "15:30" },
      { local: "Cuscatlecas", visitante: "Guadalupano", cancha: "Cancha Miramar", hora: "16:00" },
      { local: "Usuluteca", visitante: "Galingagua", cancha: "Cancha Usuluteca", hora: "18:00" } ] },
    { numero: 11, fecha: "2026-12-05", partidos: [
      { local: "Vencedor", visitante: "C.D. Federal", cancha: "Cancha Balboa", hora: "14:30" },
      { local: "Cuscatlecas", visitante: "Estrellas Marinas", cancha: "Cancha Miramar", hora: "15:00" },
      { local: "Usuluteca", visitante: "Palmo", cancha: "Cancha Usuluteca", hora: "16:30" },
      { local: "Galingagua", visitante: "Guadalupano", cancha: "Cancha Galingagua", hora: "18:00" } ] },
    { numero: 12, fecha: "2026-12-12", partidos: [
      { local: "C.D. Federal", visitante: "Cuscatlecas", cancha: "Cancha Federal", hora: "14:00" },
      { local: "Vencedor", visitante: "Usuluteca", cancha: "Cancha Balboa", hora: "15:30" },
      { local: "Estrellas Marinas", visitante: "Galingagua", cancha: "Cancha El Nigre", hora: "16:00" },
      { local: "Palmo", visitante: "Guadalupano", cancha: "Cancha El Palmo", hora: "18:00" } ] },
    { numero: 13, fecha: "2026-12-19", partidos: [
      { local: "Usuluteca", visitante: "C.D. Federal", cancha: "Cancha Usuluteca", hora: "14:30" },
      { local: "Galingagua", visitante: "Cuscatlecas", cancha: "Cancha Galingagua", hora: "15:00" },
      { local: "Guadalupano", visitante: "Vencedor", cancha: "Cancha Guadalupano", hora: "16:30" },
      { local: "Palmo", visitante: "Estrellas Marinas", cancha: "Cancha El Palmo", hora: "18:00" } ] },
    { numero: 14, fecha: "2027-01-09", partidos: [
      { local: "C.D. Federal", visitante: "Galingagua", cancha: "Cancha Federal", hora: "14:00" },
      { local: "Usuluteca", visitante: "Guadalupano", cancha: "Cancha Usuluteca", hora: "15:30" },
      { local: "Cuscatlecas", visitante: "Palmo", cancha: "Cancha Miramar", hora: "16:00" },
      { local: "Vencedor", visitante: "Estrellas Marinas", cancha: "Cancha Balboa", hora: "18:00" } ] }
  ],

  // Goleadoras (actualízalo junto con los resultados)
  goleadoras: [
    { nombre: "K. Menjívar",  equipo: "Vencedor",          goles: 9 },
    { nombre: "A. Rosales",   equipo: "Usuluteca",         goles: 7 },
    { nombre: "M. Fuentes",   equipo: "Galingagua",        goles: 6 },
    { nombre: "D. Cornejo",   equipo: "C.D. Federal",      goles: 5 },
    { nombre: "S. Villalta",  equipo: "Vencedor",          goles: 5 },
    { nombre: "L. Parada",    equipo: "Palmo",             goles: 4 },
    { nombre: "R. Guzmán",    equipo: "Estrellas Marinas", goles: 3 },
    { nombre: "F. Alvarado",  equipo: "Cuscatlecas",       goles: 3 }
  ],

  canchas: [
    { id: "el-palmo", cancha: "Cancha El Palmo", equipo: "Palmo", lugar: "Cantón El Palmo, Jiquilisco",
      superficie: "Césped natural", exacta: true,
      detalle: "Casa del C.D. Palmo Femenino. Gradería techada y ambiente familiar cada jornada.",
      maps: "https://maps.google.com/?q=13.3238,-88.5728" },
    { id: "galingagua", cancha: "Cancha Galingagua", equipo: "Galingagua", lugar: "Santiago de María",
      superficie: "Empastada", exacta: false,
      detalle: "El fortín del CD Galingagua Femenino, en la zona alta de Santiago de María.",
      maps: "https://maps.google.com/?q=Santiago+de+Maria+El+Salvador" },
    { id: "el-nigre", cancha: "Cancha El Nigre", equipo: "Estrellas Marinas", lugar: "Puerto El Triunfo",
      superficie: "Césped natural", exacta: false,
      detalle: "Cancha de las Estrellas Marinas, cerca del puerto. La brisa de la bahía se siente en cada partido.",
      maps: "https://maps.google.com/?q=Puerto+El+Triunfo+El+Salvador" },
    { id: "usuluteca", cancha: "Cancha Usuluteca", equipo: "Usuluteca", lugar: "Colonia Buena Vista, Usulután",
      alias: "Cancha El Puma", superficie: "Césped natural", exacta: false,
      detalle: "La casa del C.D. Usuluteca. Aquí se transmitió en vivo el duelo de la séptima fecha.",
      maps: "https://maps.google.com/?q=Usulutan+El+Salvador" },
    { id: "miramar", cancha: "Cancha Miramar", equipo: "Cuscatlecas", lugar: "Barrio Miramar, Puerto El Triunfo",
      exacta: false, detalle: "Sede del C.D. Cuscatlecas, a pocas cuadras de la bahía.",
      maps: "https://maps.google.com/?q=Puerto+El+Triunfo+El+Salvador" },
    { id: "balboa", cancha: "Cancha Balboa", equipo: "Vencedor", lugar: "Usulután",
      exacta: false, detalle: "Donde el Vencedor hace valer su localía: seis victorias en la primera vuelta.",
      maps: "https://maps.google.com/?q=Usulutan+El+Salvador" },
    { id: "federal", cancha: "Cancha Federal", equipo: "C.D. Federal", lugar: "Jiquilisco",
      superficie: "Césped natural", exacta: false,
      detalle: "El líder invicto juega aquí. Fondo con vista al volcán, como reza su escudo.",
      maps: "https://maps.google.com/?q=Jiquilisco+El+Salvador" },
    { id: "guadalupano", cancha: "Cancha Guadalupano", equipo: "Guadalupano", lugar: "Usulután",
      exacta: false, detalle: "La casa del equipo guadalupano, que busca su primer punto de la temporada.",
      maps: "https://maps.google.com/?q=Usulutan+El+Salvador" }
  ],

  contacto: { whatsapp: "+1 510-779-8559", lugar: "Barrio El Candelaria, Usulután, El Salvador" }
};