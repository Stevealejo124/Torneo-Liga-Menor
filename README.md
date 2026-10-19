# ⚽ Torneo Apertura Liga Menor 2026-2027 · REDDFUT Usulután

Sitio web con los resultados, la tabla de posiciones y los playoffs del **Torneo Apertura Liga Menor 2026-2027** de las escuelas de fútbol de REDDFUT Usulután.
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
| `.nojekyll` | No | Hace que GitHub Pages publique los archivos tal cual |
| `.gitignore` | No | Evita subir archivos basura del sistema |

---|---|---|
| `datos.js` | **Sí, cada semana** | Escuelas, resultados, sanciones y playoffs |
| `index.html` | Rara vez | Estructura y texto del reglamento |
| `estilos.css` | No | Colores y diseño |
| `app.js` | No | Calcula las tablas, las llaves y el campeón |
| `.nojekyll` | No | Hace que GitHub Pages publique los archivos tal cual |

---

## Publicar en GitHub Pages (solo la primera vez)
1. Crea una cuenta en github.com y presiona **New repository**. Ponle un nombre, por ejemplo `torneo-reddfut`, márcalo como **Public** y crea el repositorio.
2. Presiona **Add file → Upload files** y selecciona **todos los archivos** de la carpeta `torneo-reddfut`. Todos están al mismo nivel, sin subcarpetas, así que puedes elegirlos juntos o subirlos uno por uno:
   `index.html`, `datos.js`, `app.js`, `estilos.css`, `404.html`, `README.md`, `logo.png`, `favicon.png`, `icono-192.png`, `apple-touch-icon.png`, `compartir.png`.
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

## Playoffs
Los cruces se arman solos con la tabla final:
- Cuartos: C1 = 1º vs 8º, C2 = 4º vs 5º, C3 = 2º vs 7º, C4 = 3º vs 6º.
- Semifinales: S1 = ganador de C1 vs ganador de C2; S2 = ganador de C3 vs ganador de C4.
- Final: F.

Solo anota los marcadores, por ejemplo `"Sub-13": { C1: "2-0", C2: "1-1 (5-4)" }`.
Si la REDDFUT define otro cruce, puedes forzarlo: `C1: { local: "...", visitante: "...", resultado: "2-0" }`.

## Enlaces para compartir
Cada vista tiene su propio enlace, por ejemplo: `.../#/inicio`, `.../#/posiciones/sub-13` o `.../#/resultados/sub-9/2`.
Si alguien abre la dirección sin nada al final, verá la portada (Inicio).
