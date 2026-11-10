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
  nombre: "Torneo Apertura: Liga Especial de Escuelas de Fútbol",
  subtitulo: "Escuelas de fútbol infanto-juveniles de Usulután",
  organizador: "REDDFUT Usulután",
  urlSitio: "https://stevealejo124.github.io/Torneo-Liga-Menor/",
  actualizado: "2026-11-10",       // fecha de la última actualización (AAAA-MM-DD)
  // Horario de cada categoría los sábados (24 h). Las que tienen la misma hora
  // juegan al mismo tiempo en distintas partes de la cancha.
  horarios: { "Sub-7": "08:00", "Sub-11": "08:00", "Sub-9": "09:30", "Sub-13": "10:00", "Sub-15": "11:10" },

  // true = muestra el aviso amarillo de "datos de ejemplo"
  modoDemo: false,

  totalJornadas: 13,
  clasificados: 8,
  categorias: ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15"],

  // ---- LAS 14 ESCUELAS
  // "corto" = siglas del escudo. "color" (opcional) = color del escudo.
  // "sinCategorias" (opcional) = categorías en que la escuela NO participa
  //  (no aparecerá en esa tabla).
  // "logo" (opcional) = imagen del escudo oficial (PNG, en la misma carpeta).
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
    { nombre: "Topiltzin",          corto: "TOP", logo: "escudo-topiltzin.png" }
  ],

  // ---- CANCHAS Y ESTADIOS: una por escuela local. "cancha" debe ser igual al que usan los partidos.
  // lat/lng = punto en el mapa. exacta: true si viene de un código Plus de Google Maps;
  // false = centro del pueblo (aproximada). Los campos vacíos simplemente no se muestran.
  canchas: [
    { cancha: "Jiquilisco", escuela: "Topiltzin", nombre: "Estadio Topiltzín", lugar: "Jiquilisco, Usulután",
      aforo: "≈ 2,500", superficie: "Césped natural",
      detalle: "Estadio municipal en el casco urbano de Jiquilisco, a un costado de las calles principales del centro.",
      plus: "8CFG+GVF Jiquilisco", lat: 13.3238, lng: -88.5728, exacta: true, fuente: "Soccerway · Google Maps" },
    { cancha: "Puerto El Triunfo", escuela: "Puerto El Triunfo", nombre: "Estadio Mar y Plata", lugar: "4.ª Calle Poniente, Puerto El Triunfo",
      aforo: "≈ 1,000",
      detalle: "Graderías sencillas, en remodelación para sumar asientos. A unos pasos está el Polideportivo del puerto.",
      plus: "7FG2+7VM Puerto El Triunfo", lat: 13.2757, lng: -88.5478, exacta: true, fuente: "Google Maps · publicaciones locales" },
    { cancha: "Santiago de María", escuela: "Santiago de María", nombre: "Estadio Leonidas Flores Cárdenas", lugar: "Colonia El Estadio, Santiago de María",
      aforo: "1,000 a 3,000 (las fuentes no coinciden)",
      detalle: "El estadio municipal de Santiago de María. Desde 2022 tiene butacas tipo cine en la gradería.",
      plus: "FGQR+5G6 Santiago de María", lat: 13.4879, lng: -88.4587, exacta: true, fuente: "Diario1 · Google Maps" },
    { cancha: "La Noria", escuela: "La Noria", nombre: "Cancha de Cantón La Noria", lugar: "Cantón La Noria, Jiquilisco",
      aforo: "≈ 500 a 800", superficie: "Empastada",
      detalle: "Campo comunal abierto en la zona de Tierra Blanca. El público se acomoda a los costados de la cancha.",
      plus: "98VC+G4 Jiquilisco", lat: 13.39376, lng: -88.67965, exacta: true, fuente: "Google Maps · información local" },
    { cancha: "Jucuapa", escuela: "Jucuapa", nombre: "Estadio Municipal de Jucuapa", lugar: "Jucuapa, Usulután",
      aforo: "≈ 5,000",
      detalle: "El estadio municipal de Jucuapa.",
      lat: 13.5139, lng: -88.3847, exacta: false, fuente: "Fuentes públicas" },
    { cancha: "Ciudad El Triunfo", escuela: "Ciudad El Triunfo", nombre: "Estadio Municipal de Ciudad El Triunfo", lugar: "Ciudad El Triunfo, Usulután",
      detalle: "Escenario de partidos de los Juegos Deportivos Estudiantiles.",
      lat: 13.5593, lng: -88.4290, exacta: false, fuente: "INDES" },
    { cancha: "El Tránsito", escuela: "El Tránsito", nombre: "Cancha César Antonio Angulo", lugar: "El Tránsito, San Miguel",
      lat: 13.3550, lng: -88.3472, exacta: false, fuente: "INDES" },
    { cancha: "San Rafael Oriente", escuela: "Gerardo Barrios", nombre: "Cancha Municipal de San Rafael Oriente", lugar: "San Rafael Oriente, San Miguel",
      detalle: "En algunos registros aparece como Cancha La Merced.",
      lat: 13.3784, lng: -88.3540, exacta: false, fuente: "Registros públicos" },
    { cancha: "Alegría", escuela: "Alegría", nombre: "Cancha Alegría", lugar: "Alegría, Usulután",
      detalle: "En el casco urbano, a unos 250 metros al noroeste de la iglesia.",
      lat: 13.5003, lng: -88.4895, exacta: false, fuente: "Mapcarta" },
    { cancha: "Mercedes Umaña", escuela: "Mercedes Umaña", nombre: "Cancha Municipal de Mercedes Umaña", lugar: "Mercedes Umaña, Usulután",
      plus: "HG57+V85 Mercedes Umaña", lat: 13.5596, lng: -88.4866, exacta: true, fuente: "Directorio TodosBiz" },
    { cancha: "San Marcos", escuela: "San Marcos", nombre: "Cancha de San Marcos", lugar: "San Marcos Lempa, Jiquilisco",
      detalle: "Escuela de la comunidad San Marcos Lempa. Nombre de la cancha por confirmar.",
      lat: 13.4213, lng: -88.6957, exacta: false },
    { cancha: "Lolotique", escuela: "Lolotique", nombre: "Polideportivo de Lolotique", lugar: "Barrio El Calvario, Lolotique (San Miguel)",
      detalle: "Le dicen el “Poli Hoyo”: está construido en una montañita y es la sede de una escuela de fútbol con unos 150 niños y jóvenes.",
      lat: 13.5561, lng: -88.3509, exacta: false, fuente: "El Diario de Hoy" },
    { cancha: "Berlín", escuela: "Berlín", nombre: "Campo “El 11”", lugar: "Barrio San José, Berlín",
      detalle: "Uno de los campos con más tradición del oriente del país.",
      lat: 13.4971, lng: -88.5303, exacta: false, fuente: "El Gráfico" },
    { cancha: "Estanzuelas", escuela: "Estanzuelas", nombre: "Cancha de Estanzuelas", lugar: "Estanzuelas, Usulután",
      detalle: "Nombre y datos de la cancha por confirmar.",
      lat: 13.6438, lng: -88.4936, exacta: false }
  ],

  // ---- JORNADAS: ya están las 13 fechas del calendario oficial (con su cancha).
  // Cada semana solo agrega los "resultados" a los partidos de esa fecha:
  //   { local: "A", visitante: "B", cancha: "X",
  //     resultados: { "Sub-9": "2-1", "Sub-11": "0-0" } }
  // Si una categoría no se jugó, simplemente no la pongas.
  // Si la comisión cambia una fecha, cambia "fecha" (AAAA-MM-DD).
  jornadas: [
    {
      numero: 1,
      fecha: "2026-10-03",
      partidos: [
        { local: "Puerto El Triunfo", visitante: "Santiago de María", cancha: "Puerto El Triunfo",
          resultados: { "Sub-9": "8-4", "Sub-11": "6-4", "Sub-13": "4-7", "Sub-15": "6-0" } },
        { local: "Estanzuelas", visitante: "Ciudad El Triunfo", cancha: "Estanzuelas",
          resultados: { "Sub-9": "2-9", "Sub-11": "6-11", "Sub-13": "11-7" } },
        { local: "El Tránsito", visitante: "Alegría", cancha: "El Tránsito",
          resultados: { "Sub-7": "2-0", "Sub-9": "21-1", "Sub-11": "3-2", "Sub-13": "12-2", "Sub-15": "3-4" } },
        { local: "Jucuapa", visitante: "San Marcos", cancha: "Jucuapa",
          resultados: { "Sub-7": "3-0", "Sub-9": "4-6", "Sub-11": "3-4", "Sub-13": "3-3", "Sub-15": "4-1" } },
        { local: "Berlín", visitante: "Lolotique", cancha: "Berlín",
          resultados: { "Sub-7": "0-2", "Sub-9": "12-0", "Sub-11": "1-14", "Sub-13": "5-4", "Sub-15": "2-2" } },
        { local: "Gerardo Barrios", visitante: "Topiltzin", cancha: "San Rafael Oriente",
          resultados: { "Sub-7": "2-0", "Sub-9": "1-9", "Sub-11": "2-2", "Sub-13": "4-3", "Sub-15": "2-0" } },
        { local: "La Noria", visitante: "Mercedes Umaña", cancha: "La Noria",
          resultados: { "Sub-9": "2-0 W.O.", "Sub-11": "2-0 W.O.", "Sub-13": "2-0 W.O.", "Sub-15": "2-0 W.O." } }
      ]
    },
    {
      numero: 2,
      fecha: "2026-10-10",
      partidos: [
        { local: "Santiago de María", visitante: "Gerardo Barrios", cancha: "Santiago de María",
          resultados: { "Sub-9": "5-10", "Sub-11": "1-10", "Sub-13": "6-3", "Sub-15": "2-3" } },
        { local: "Topiltzin", visitante: "Berlín", cancha: "Jiquilisco",
          resultados: { "Sub-9": "12-0", "Sub-11": "12-0", "Sub-13": "4-2", "Sub-15": "3-2" } },
        { local: "Alegría", visitante: "Estanzuelas", cancha: "Alegría",
          resultados: { "Sub-7": "8-0", "Sub-11": "14-1", "Sub-13": "4-4" } },
        { local: "San Marcos", visitante: "El Tránsito", cancha: "San Marcos",
          resultados: { "Sub-9": "3-3", "Sub-11": "3-1", "Sub-13": "3-4", "Sub-15": "4-2" } },
        { local: "Mercedes Umaña", visitante: "Puerto El Triunfo", cancha: "Mercedes Umaña",
          resultados: { "Sub-9": "0-9", "Sub-11": "2-3", "Sub-13": "2-1", "Sub-15": "0-2 W.O." } },
        { local: "Ciudad El Triunfo", visitante: "La Noria", cancha: "Ciudad El Triunfo",
          resultados: { "Sub-7": "3-5", "Sub-11": "0-10", "Sub-13": "0-3", "Sub-15": "2-6" } },
        { local: "Lolotique", visitante: "Jucuapa", cancha: "Lolotique",
          resultados: { "Sub-7": "11-1", "Sub-9": "2-6", "Sub-11": "3-1", "Sub-13": "2-3", "Sub-15": "2-2" } }
      ]
    },
    {
      numero: 3,
      fecha: "2026-10-17",
      partidos: [
        { local: "Berlín", visitante: "Santiago de María", cancha: "Berlín",
          resultados: { "Sub-9": "4-7", "Sub-11": "12-7", "Sub-13": "2-2", "Sub-15": "4-2" } },
        { local: "El Tránsito", visitante: "Lolotique", cancha: "El Tránsito",
          resultados: { "Sub-7": "3-1", "Sub-9": "13-1", "Sub-11": "3-3", "Sub-13": "5-2", "Sub-15": "4-2" } },
        { local: "Jucuapa", visitante: "Topiltzin", cancha: "Jucuapa",
          resultados: { "Sub-7": "2-6", "Sub-9": "3-12", "Sub-11": "3-7", "Sub-13": "2-3", "Sub-15": "0-0" } },
        { local: "San Marcos", visitante: "Alegría", cancha: "San Marcos",
          resultados: { "Sub-9": "20-0", "Sub-11": "8-4", "Sub-13": "8-0", "Sub-15": "1-5" } },
        { local: "Gerardo Barrios", visitante: "Mercedes Umaña", cancha: "San Rafael Oriente",
          resultados: { "Sub-9": "14-2", "Sub-11": "2-0 W.O.", "Sub-13": "6-2" } },
        { local: "Puerto El Triunfo", visitante: "Ciudad El Triunfo", cancha: "Puerto El Triunfo",
          resultados: { "Sub-9": "12-2", "Sub-11": "6-1", "Sub-13": "6-3", "Sub-15": "9-3" } },
        { local: "La Noria", visitante: "Estanzuelas", cancha: "La Noria",
          resultados: { "Sub-9": "13-4", "Sub-11": "7-0", "Sub-13": "16-0" } }
      ]
    },
    {
      numero: 4,
      fecha: "2026-10-24",
      partidos: [
        { local: "Santiago de María", visitante: "Jucuapa", cancha: "Santiago de María",
          resultados: { "Sub-9": "10-5", "Sub-11": "1-9", "Sub-13": "1-1", "Sub-15": "2-2" } },
        { local: "Ciudad El Triunfo", visitante: "Gerardo Barrios", cancha: "Ciudad El Triunfo",
          resultados: { "Sub-9": "3-15", "Sub-11": "2-5", "Sub-13": "0-8", "Sub-15": "0-5" } },
        { local: "Alegría", visitante: "La Noria", cancha: "Alegría",
          resultados: { "Sub-9": "1-13", "Sub-11": "2-7", "Sub-13": "0-5", "Sub-15": "5-2" } },
        { local: "Lolotique", visitante: "San Marcos", cancha: "Lolotique",
          resultados: { "Sub-9": "0-9", "Sub-11": "7-4", "Sub-13": "2-6", "Sub-15": "3-0" } },
        { local: "Estanzuelas", visitante: "Puerto El Triunfo", cancha: "Estanzuelas",
          resultados: { "Sub-9": "2-19", "Sub-11": "6-14", "Sub-13": "6-10" } },
        { local: "Topiltzin", visitante: "El Tránsito", cancha: "Jiquilisco",
          resultados: { "Sub-7": "6-5", "Sub-9": "1-3", "Sub-11": "6-0", "Sub-13": "3-2", "Sub-15": "1-4" } },
        { local: "Mercedes Umaña", visitante: "Berlín", cancha: "Mercedes Umaña",
          resultados: { "Sub-9": "1-18", "Sub-11": "5-4", "Sub-13": "6-3" } }
      ]
    },
    {
      numero: 5,
      fecha: "2026-10-31",
      partidos: [
        { local: "El Tránsito", visitante: "Santiago de María", cancha: "El Tránsito",
          resultados: { "Sub-9": "12-7", "Sub-11": "6-5", "Sub-13": "3-2", "Sub-15": "4-0" } },
        { local: "Lolotique", visitante: "Alegría", cancha: "Lolotique",
          resultados: { "Sub-9": "6-2", "Sub-11": "19-2", "Sub-13": "5-2", "Sub-15": "4-1" } },
        { local: "Jucuapa", visitante: "Mercedes Umaña", cancha: "Jucuapa",
          resultados: { "Sub-9": "2-0 W.O.", "Sub-11": "3-1", "Sub-13": "1-1" } },
        { local: "Berlín", visitante: "Ciudad El Triunfo", cancha: "Berlín",
          resultados: { "Sub-9": "15-7", "Sub-11": "4-6", "Sub-13": "4-2", "Sub-15": "13-0" } },
        { local: "San Marcos", visitante: "Topiltzin", cancha: "San Marcos",
          resultados: { "Sub-9": "1-5", "Sub-11": "0-6", "Sub-13": "2-2", "Sub-15": "0-3" } },
        { local: "Gerardo Barrios", visitante: "Estanzuelas", cancha: "San Rafael Oriente",
          resultados: { "Sub-7": "8-1", "Sub-9": "20-2", "Sub-11": "22-1", "Sub-13": "9-0" } },
        { local: "Puerto El Triunfo", visitante: "La Noria", cancha: "Puerto El Triunfo",
          resultados: { "Sub-9": "9-1", "Sub-11": "2-9", "Sub-15": "16-0" } }
      ]
    },
    {
      numero: 6,
      fecha: "2026-11-07",      // confirmada en la hoja oficial (Sexta fecha, sábado 07 de noviembre de 2026)
      partidos: [
        { local: "Santiago de María", visitante: "San Marcos", cancha: "Santiago de María",
          resultados: { "Sub-9": "6-6", "Sub-11": "7-7", "Sub-13": "6-3", "Sub-15": "0-0" } },
        { local: "La Noria", visitante: "Gerardo Barrios", cancha: "La Noria",
          resultados: { "Sub-9": "3-10", "Sub-11": "2-2", "Sub-13": "0-1", "Sub-15": "2-12" } },
        { local: "Ciudad El Triunfo", visitante: "Jucuapa", cancha: "Ciudad El Triunfo",
          resultados: { "Sub-9": "0-12", "Sub-11": "2-3", "Sub-13": "1-2", "Sub-15": "4-3" } },
        { local: "Alegría", visitante: "Puerto El Triunfo", cancha: "Alegría",
          resultados: { "Sub-9": "1-13", "Sub-11": "4-3", "Sub-13": "5-6", "Sub-15": "3-5" } },
        { local: "Estanzuelas", visitante: "Berlín", cancha: "Estanzuelas",
          resultados: { "Sub-9": "5-14", "Sub-11": "2-14", "Sub-13": "6-17" } },
        { local: "Topiltzin", visitante: "Lolotique", cancha: "Jiquilisco",
          resultados: { "Sub-7": "2-2", "Sub-9": "14-0", "Sub-11": "4-2", "Sub-13": "3-1", "Sub-15": "2-0" } },
        { local: "Mercedes Umaña", visitante: "El Tránsito", cancha: "Mercedes Umaña",
          resultados: { "Sub-9": "0-11", "Sub-11": "3-2", "Sub-13": "2-6" } }
      ]
    },
    {
      numero: 7,
      fecha: "2026-11-14",      // fecha estimada (el calendario decía 2026-11-07; se viene jugando una semana después)
      partidos: [
        { local: "Lolotique", visitante: "Santiago de María", cancha: "Lolotique" },
        { local: "Topiltzin", visitante: "Alegría", cancha: "Jiquilisco" },
        { local: "El Tránsito", visitante: "Ciudad El Triunfo", cancha: "El Tránsito" },
        { local: "Jucuapa", visitante: "Estanzuelas", cancha: "Jucuapa" },
        { local: "Berlín", visitante: "La Noria", cancha: "Berlín" },
        { local: "San Marcos", visitante: "Mercedes Umaña", cancha: "San Marcos" },
        { local: "Gerardo Barrios", visitante: "Puerto El Triunfo", cancha: "San Rafael Oriente" }
      ]
    },
    {
      numero: 8,
      fecha: "2026-11-21",      // fecha estimada (el calendario decía 2026-11-14; se viene jugando una semana después)
      partidos: [
        { local: "Santiago de María", visitante: "Topiltzin", cancha: "Santiago de María" },
        { local: "Puerto El Triunfo", visitante: "Berlín", cancha: "Puerto El Triunfo" },
        { local: "La Noria", visitante: "Jucuapa", cancha: "La Noria" },
        { local: "Ciudad El Triunfo", visitante: "San Marcos", cancha: "Ciudad El Triunfo" },
        { local: "Alegría", visitante: "Gerardo Barrios", cancha: "Alegría" },
        { local: "Estanzuelas", visitante: "El Tránsito", cancha: "Estanzuelas" },
        { local: "Mercedes Umaña", visitante: "Lolotique", cancha: "Mercedes Umaña" }
      ]
    },
    {
      numero: 9,
      fecha: "2026-11-28",      // fecha estimada (el calendario decía 2026-11-21; se viene jugando una semana después)
      partidos: [
        { local: "Santiago de María", visitante: "Alegría", cancha: "Santiago de María" },
        { local: "San Marcos", visitante: "Estanzuelas", cancha: "San Marcos" },
        { local: "Berlín", visitante: "Gerardo Barrios", cancha: "Berlín" },
        { local: "Jucuapa", visitante: "Puerto El Triunfo", cancha: "Jucuapa" },
        { local: "El Tránsito", visitante: "La Noria", cancha: "El Tránsito" },
        { local: "Lolotique", visitante: "Ciudad El Triunfo", cancha: "Lolotique" },
        { local: "Topiltzin", visitante: "Mercedes Umaña", cancha: "Jiquilisco" }
      ]
    },
    {
      numero: 10,
      fecha: "2026-12-05",      // fecha estimada (el calendario decía 2026-11-28; se viene jugando una semana después)
      partidos: [
        { local: "Mercedes Umaña", visitante: "Santiago de María", cancha: "Mercedes Umaña" },
        { local: "Estanzuelas", visitante: "Lolotique", cancha: "Estanzuelas" },
        { local: "Alegría", visitante: "Berlín", cancha: "Alegría" },
        { local: "Ciudad El Triunfo", visitante: "Topiltzin", cancha: "Ciudad El Triunfo" },
        { local: "Gerardo Barrios", visitante: "Jucuapa", cancha: "San Rafael Oriente" },
        { local: "Puerto El Triunfo", visitante: "El Tránsito", cancha: "Puerto El Triunfo" },
        { local: "La Noria", visitante: "San Marcos", cancha: "La Noria" }
      ]
    },
    {
      numero: 11,
      fecha: "2026-12-12",      // fecha estimada (el calendario decía 2026-12-05; se viene jugando una semana después)
      partidos: [
        { local: "Santiago de María", visitante: "Ciudad El Triunfo", cancha: "Santiago de María" },
        { local: "San Marcos", visitante: "Puerto El Triunfo", cancha: "San Marcos" },
        { local: "Jucuapa", visitante: "Berlín", cancha: "Jucuapa" },
        { local: "El Tránsito", visitante: "Gerardo Barrios", cancha: "El Tránsito" },
        { local: "Lolotique", visitante: "La Noria", cancha: "Lolotique" },
        { local: "Topiltzin", visitante: "Estanzuelas", cancha: "Jiquilisco" },
        { local: "Mercedes Umaña", visitante: "Alegría", cancha: "Mercedes Umaña" }
      ]
    },
    {
      numero: 12,
      fecha: "2026-12-19",      // fecha estimada (el calendario decía 2026-12-12; se viene jugando una semana después)
      partidos: [
        { local: "Estanzuelas", visitante: "Santiago de María", cancha: "Estanzuelas" },
        { local: "Jucuapa", visitante: "Alegría", cancha: "Jucuapa" },
        { local: "Ciudad El Triunfo", visitante: "Mercedes Umaña", cancha: "Ciudad El Triunfo" },
        { local: "Berlín", visitante: "El Tránsito", cancha: "Berlín" },
        { local: "Gerardo Barrios", visitante: "San Marcos", cancha: "San Rafael Oriente" },
        { local: "Puerto El Triunfo", visitante: "Lolotique", cancha: "Puerto El Triunfo" },
        { local: "La Noria", visitante: "Topiltzin", cancha: "La Noria" }
      ]
    },
    {
      numero: 13,
      fecha: "2026-12-26",      // fecha estimada (el calendario decía 2026-12-19; se viene jugando una semana después)
      partidos: [
        { local: "Santiago de María", visitante: "La Noria", cancha: "Santiago de María" },
        { local: "Mercedes Umaña", visitante: "Estanzuelas", cancha: "Mercedes Umaña" },
        { local: "San Marcos", visitante: "Berlín", cancha: "San Marcos" },
        { local: "Topiltzin", visitante: "Puerto El Triunfo", cancha: "Jiquilisco" },
        { local: "Lolotique", visitante: "Gerardo Barrios", cancha: "Lolotique" },
        { local: "El Tránsito", visitante: "Jucuapa", cancha: "El Tránsito" },
        { local: "Alegría", visitante: "Ciudad El Triunfo", cancha: "Alegría" }
      ]
    }
  ],

  // ---- QUINIELA: para abrir los pronósticos de una jornada, agrégala ANTES
  // de que se juegue, con su fecha y sus cruces, SIN resultados. Ejemplo:
  //   { numero: 3, fecha: "2026-10-24",
  //     partidos: [ { local: "Berlín", visitante: "El Tránsito" }, ... ] },
  // Los pronósticos se cierran ese día a las 7:00 a. m. Para otra hora:
  //   { numero: 3, fecha: "2026-10-24", cierre: "2026-10-24 08:30", ... }
  // Después del partido, solo agrega los resultados como siempre.

  // ---- AJUSTES DE PUNTOS (sanciones). Ejemplo:
  // { escuela: "Berlín", categoria: "Sub-15", puntos: -3, motivo: "Alineación indebida" }
  // categoria puede ser "Todas".
  // mostrarNota: false = los puntos se siguen aplicando, pero sin asterisco ni nota.
  ajustes: [
    { escuela: "Puerto El Triunfo", categoria: "Sub-15", puntos: -3, motivo: "Decisión de la organización", mostrarNota: false },
    { escuela: "La Noria",          categoria: "Sub-15", puntos: 3,  motivo: "Decisión de la organización", mostrarNota: false }
  ],

  // ---- APÓYANOS: correo al que llegan fotos, videos, escudos, ubicaciones de
  // canchas, correcciones, etc. (sección "¿Te gustaría apoyarnos?" en Inicio).
  contacto: { correo: "cseuropa1890@gmail.com" },

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
      url: "https://7320256-arch.github.io/"
    },
    {
      estilo: "claro",
      marca: "Christopher Alejo · Jiquilisco, Usulután",
      titulo: "Herramientas digitales para tu negocio",
      texto: "Menús digitales con pedidos por WhatsApp, marcadores deportivos en vivo para torneos, apps a medida y sitios web sencillos. Sin instalar nada.",
      boton: "Ver proyectos",
      url: "https://stevealejo124.github.io/Portafolio-/"
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
