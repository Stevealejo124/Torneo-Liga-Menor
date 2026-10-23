# ⚽ Torneo Apertura: Liga Especial de Escuelas de Fútbol · REDDFUT Usulután

Sitio web con los resultados, la tabla de posiciones y los playoffs del **Torneo Apertura: Liga Especial de Escuelas de Fútbol** de las escuelas de fútbol de REDDFUT Usulután.
Categorías: Sub-7, Sub-9, Sub-11, Sub-13 y Sub-15.

**Secciones del sitio:** Inicio (portada con bienvenida, accesos rápidos, líderes por categoría y escuelas participantes) · Posiciones · Resultados · Playoffs · Reglamento.
La portada se arma sola con los datos de `datos.js`; no hay que editarla.

## Archivos
| Archivo | ¿Se edita? | Para qué sirve |
|---|---|---|
| `datos.js` | **Sí, cada semana** | Escuelas, resultados, sanciones y playoffs |
| `index.html` | Rara vez | Estructura de la página y texto del reglamento |
| `estilos.css` | No | Colores y diseño |
| `app.js` | No | Calcula tablas, llaves y campeón |
| `404.html` | No | Página que aparece si alguien abre un enlace que no existe |
| `logo.png` | No | Logo oficial de REDDFUT Usulután (encabezado) |
| `favicon.png`, `icono-192.png` | No | Ícono de la pestaña del navegador |
| `apple-touch-icon.png` | No | Ícono cuando guardan el sitio en la pantalla del celular |
| `compartir.png` | No | Imagen que aparece al compartir el enlace por WhatsApp o Facebook |
| `manifest.webmanifest` | No | Permite instalar el sitio como app en el celular |
| `sw.js` | No | Guarda una copia para que funcione sin internet |
| `firebase-config.js` | Solo para activar la quiniela | Datos de Firebase y si la quiniela está activa |
| `quiniela.js` | No | El juego de pronósticos (se carga solo al abrir la pestaña Quiniela) |
| `avisos.js` | No | Botón "Activar avisos" de Inicio (aviso cuando se actualizan las tablas) |
| `enviar-avisos.mjs` | No | Lo usa GitHub para mandar los avisos cuando subes resultados |
| `letra-600.woff2`, `letra-800.woff2` | No | Letra de los títulos y marcadores (Barlow Condensed, licencia libre OFL) |
| `icono-512.png` | No | Ícono grande de la app instalada |
| `.nojekyll` | No | Hace que GitHub Pages publique los archivos tal cual |
| `.gitignore` | No | Evita subir archivos basura del sistema |

---

## Publicar en GitHub Pages (solo la primera vez)
1. Crea una cuenta en github.com y presiona **New repository**. Ponle un nombre, por ejemplo `torneo-reddfut`, márcalo como **Public** y crea el repositorio.
2. Presiona **Add file → Upload files** y selecciona **todos los archivos** de la carpeta `torneo-reddfut`. Todos están al mismo nivel, sin subcarpetas, así que puedes elegirlos juntos o subirlos uno por uno:
   `index.html`, `datos.js`, `app.js`, `estilos.css`, `404.html`, `README.md`, `logo.png`, `favicon.png`, `icono-192.png`, `icono-512.png`, `apple-touch-icon.png`, `compartir.png`, `manifest.webmanifest`, `sw.js`, `letra-600.woff2`, `letra-800.woff2`, `firebase-config.js`, `quiniela.js`, `avisos.js`, `enviar-avisos.mjs`.
   - `.nojekyll` y `.gitignore` son archivos ocultos y **opcionales**. Si tu computadora no los muestra, no pasa nada: el sitio funciona igual.
3. Presiona **Commit changes**.
4. Entra a **Settings → Pages**. En *Branch* elige `main` y la carpeta `/ (root)`, y presiona **Save**.
5. Espera 1 o 2 minutos. Tu sitio quedará en `https://TU-USUARIO.github.io/torneo-reddfut/`

> Importante: `index.html` debe quedar en la raíz del repositorio, no dentro de otra carpeta.

**Opcional, para que la imagen de vista previa salga en WhatsApp:** cuando ya tengas la dirección del sitio, abre `index.html` y cambia
`<meta property="og:image" content="compartir.png">` por la dirección completa, por ejemplo
`<meta property="og:image" content="https://TU-USUARIO.github.io/torneo-reddfut/compartir.png">`.
WhatsApp y Facebook solo muestran la imagen si la dirección es completa.

## Actualizar cada semana
1. Anota los resultados en el Excel de control (`Resultados_Torneo_REDDFUT_Usulutan.xlsx`) y revisa que la columna **Revisión** muestre ✓ en todas las filas.
2. En GitHub, abre `datos.js`, presiona ✏️ (*Edit*), agrega la jornada nueva y cambia `actualizado`.
3. Presiona **Commit changes**. En 1 o 2 minutos el sitio se actualiza.
4. Compara la tabla del sitio con la del Excel. Deben ser idénticas, porque usan los mismos criterios.

Ejemplo de jornada en `datos.js` (copia el bloque, pégalo después de la última jornada y cambia los datos):
```js
{
  numero: 3,
  fecha: "2026-10-24",
  partidos: [
    { local: "Alegría", visitante: "Berlín",
      resultados: { "Sub-7": "1-0", "Sub-9": "2-2", "Sub-11": "0-1", "Sub-13": "3-1", "Sub-15": "1-1" } },
    // ...los otros 6 partidos
  ]
},
```

**Reglas para escribir resultados** (siempre goles LOCAL - VISITANTE):
- `"2-1"`: resultado normal.
- `"2-0 W.O."`: cuenta 2-0 y muestra la nota "W.O.".
- `"Suspendido"`: se muestra, pero no cuenta en la tabla.
- `"1-1 (4-3)"`: solo en playoffs; empate 1-1 y penales 4-3.
- Si una categoría no se jugó, no la pongas. Aparecerá como "Sin partido".
- Los nombres deben ser **exactamente iguales** a los de la lista `escuelas`. Si alguno no coincide, sale un aviso rojo en el sitio.

**Sanciones:** en `ajustes`, agrega `{ escuela: "Berlín", categoria: "Sub-15", puntos: -3, motivo: "..." }`. Anota lo mismo en la columna *Ajuste* del Excel.

**Escuela sin una categoría:** en la lista de escuelas usa `sinCategorias`, por ejemplo `{ nombre: "Estanzuelas", corto: "EST", sinCategorias: ["Sub-15"] }`.

> **¿Subiste los cambios y todavía ves la versión anterior?** GitHub tarda de 1 a 5 minutos en publicar; puedes ver el avance en la pestaña **Actions** del repositorio. Cuando termine, recarga la página. Si aún no aparece, fuerza la recarga con **Ctrl + Shift + R** (en Mac, **Cmd + Shift + R**). En el celular, cierra la página o la app y vuelve a abrirla.

## Playoffs
Los cruces se arman solos con la tabla final:
- Cuartos: C1 = 1º vs 8º, C2 = 4º vs 5º, C3 = 2º vs 7º, C4 = 3º vs 6º.
- Semifinales: S1 = ganador de C1 vs ganador de C2; S2 = ganador de C3 vs ganador de C4.
- Final: F.

Solo anota los marcadores, por ejemplo `"Sub-13": { C1: "2-0", C2: "1-1 (5-4)" }`.
Si la REDDFUT define otro cruce, puedes forzarlo: `C1: { local: "...", visitante: "...", resultado: "2-0" }`.

## Quiniela de pronósticos

Juego para que la gente adivine quién gana cada partido, por diversión (sin apuestas). Entran con su cuenta de Google, eligen un apodo y ganan 1 punto por acierto. Está **desactivado** hasta que configures Firebase: sigue la guía `GUIA_QUINIELA.md` de la carpeta **Configurar_Quiniela**.

Cada semana: agrega la próxima jornada en `datos.js` con su `fecha` y sus cruces (sin resultados) antes de que se juegue, y abre la pestaña Quiniela con tu cuenta de organizador para publicarla.

## Avisos (notificaciones)

En Inicio hay un botón **Activar avisos**. Quien lo toca recibe una notificación cada vez que subes un `datos.js` con **resultados nuevos**: "📊 Jornada N: tablas actualizadas". Si solo corriges un marcador, no se manda nada.

Para que funcione hacen falta 3 cosas (una sola vez; ver `GUIA_AVISOS.md`): el secreto `FIREBASE_CUENTA` en GitHub, el archivo `.github/workflows/avisos.yml` y las reglas de Firestore actualizadas.
En iPhone los avisos solo funcionan si la persona instala el sitio en su pantalla de inicio (iOS 16.4 o más reciente).

## Anuncios

Al final de cada sección (Inicio, Posiciones, Resultados, Playoffs y Reglamento) aparecen dos tarjetas marcadas como "Anuncio": **Retro Football Manager SV** y el **portafolio de Christopher Alejo**. Siempre van al final del contenido: no flotan, no tapan nada y no se abren solas. Al tocarlas se abren en una pestaña nueva.

Para cambiarlas, edita la sección `anuncios:` de `datos.js`:

- **Cambiar textos o enlace:** edita `marca`, `titulo`, `texto`, `boton` o `url`.
- **Quitar un anuncio:** borra su bloque `{ ... }` completo, incluida la coma.
- **Agregar otro:** copia un bloque y cambia sus datos. `estilo` puede ser `"retro"` (fondo oscuro) o `"claro"` (fondo blanco).
- **Quitarlos todos:** deja la lista vacía: `anuncios: [],`

## Usarlo sin internet
- **Celular (Android o iPhone):** abre el sitio una vez con internet.
  - En Android aparece el botón **"📲 Instalar en tu celular"** en la portada.
  - En iPhone: en Safari toca **Compartir** y luego **"Agregar a pantalla de inicio"**.
  - Después se abre desde el ícono, aunque no haya internet. Cuando vuelva a haber conexión, se actualiza solo.
- **Computadora:** también se puede instalar desde Chrome o Edge, con el ícono de instalar de la barra de direcciones.
- **Archivo único:** también existe la versión `Torneo_REDDFUT_sin_internet.html`, para abrir con doble clic o enviar por WhatsApp. Ese archivo no se sube a GitHub.

## Enlaces para compartir
Cada vista tiene su propio enlace, por ejemplo: `.../#/inicio`, `.../#/posiciones/sub-13` o `.../#/resultados/sub-9/2`.
Si alguien abre la dirección sin nada al final, verá la portada (Inicio).
