/* =====================================================================
   CONFIGURACIÓN DE LA QUINIELA (Firebase)
   =====================================================================
   Mientras "activa" sea false, la pestaña Quiniela NO aparece en el sitio.

   Cuando crees tu proyecto en Firebase (ver la guía GUIA_QUINIELA.md):
     1. Pega abajo los datos de "firebase" que te da Firebase.
     2. Escribe tu correo de Gmail en "administradores".
     3. Cambia  activa: false  por  activa: true
   ===================================================================== */

window.QUINIELA = {
  activa: true,

  firebase: {
    apiKey: "AIzaSyB9llCjR7b8faEmGiNaT0pKecjHeyV2xAM",
    authDomain: "reddfut-quiniela.firebaseapp.com",
    projectId: "reddfut-quiniela",
    appId: "1:753232031272:web:a1af590f9f62706011cf1d"
  },

  // Correos que ven el "Panel del organizador" (el mismo que pongas en las reglas)
  administradores: ["stevealejo503@gmail.com"],

  // Hora en que se cierran los pronósticos el día de la jornada (hora de El Salvador).
  // Una jornada puede tener su propio cierre en datos.js:  cierre: "2026-10-24 08:30"
  horaCierre: "07:00"
};
