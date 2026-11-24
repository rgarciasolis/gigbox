# Changelog

## Artistas sin duplicados (2026-11-24)

Corrige duplicados como "Lagos de Hinault", "Lo Lagos de Hinault" y "Los Lagos de Hinault", que la primera normalización no detectaba.

- **Clave de comparación común** (`scripts/lib/artist-key.mjs`, usada por la importación del Excel y por el seed): ignora mayúsculas, tildes, puntuación, espacios, el artículo inicial (El, La, Los, Las, Lo, The, Les, Els, L') y "y/&/and/i".
- **Erratas:** `data/source/artist-aliases.json` recoge 80 nombres con su grafía correcta y las grafías erróneas que se unifican con ella (por ejemplo "Mulatu Astakte" y "Kamashi Washington"). Se puede editar a mano; solo incluye casos claros.
- **Songkick también:** los duplicados dentro de los artistas de Songkick se unifican en el seed.
- **Resultado:** de 9.523 a 9.352 artistas (171 duplicados unidos), 0 claves repetidas en la base y ningún concierto con el mismo artista dos veces. Los nombres en cirílico, que antes se descartaban, ahora se conservan. El conjunto dummy no cambia.
- **No se unen solos** los nombres que difieren en una letra y podrían ser artistas distintos (Bob Dylan y Bob Vylan, Ana Muñiz y Ana Muñoz). Si hay más erratas, se añaden al fichero de alias.

## Función intermedia de setlist.fm (2026-11-24)

- **`api/setlist.ts`:** busca conciertos por artista (y fecha opcional) y devuelve fecha, artista, sala y enlace de atribución. No devuelve ni usa los temas del setlist.
- **Condiciones de setlist.fm:** clave solo en el servidor (`SETLISTFM_API_KEY`, ver `.env.example`), caché de 10 minutos, sin guardar datos, solo uso no comercial.
- **`vercel.json`:** la regla de reescritura a `index.html` excluye `/api/`.
- Aún no hay interfaz que la use. Probada solo con respuestas simuladas.

## Datos bajo demanda y selector reales/dummy (2026-11-24)

- **Dos conjuntos:** `npm run seed` genera `data/reales/` (Songkick y Excel) y `data/dummy/` (todo inventado: 120 artistas, 40 salas, 300 conciertos). El conjunto reales es idéntico al anterior (mismo md5).
- **Carga bajo demanda:** los JSON ya no van en el bundle principal (de 4,5 MB a ~355 KB). Cada fichero es un trozo aparte y solo se descargan los del conjunto elegido. El adaptador mock usa `await` de nivel superior (`build.target: es2022`), y `index.html` muestra "Cargando datos…" mientras llegan.
- **Selector en el pie:** "Datos: Reales | Dummy". Cambiarlo recarga la página y se recuerda en `localStorage`. Cada conjunto guarda su propio estado (Fui, notas, listas, follows…).
- Por defecto se abre Reales. Solo aparece con el adaptador mock.

## Eventos Excel (2026-11-24)

Añade los eventos reales del Excel (pasados y futuros) como datos de ejemplo.

- **Origen:** `data/source/excel-events-raw.json`, 10.098 eventos de Madrid entre sep 2013 y nov 2027 (266 futuros), con fecha, sala y artistas.
- **Importación:** `scripts/import-excel-events.mjs`. Separa los artistas por `+` ("A + B", "A+ B", "A (+ B)") y descarta ruido ("18+", "...", "Ganglios +").
- **Artistas normalizados:** cada nombre se compara con los de la base sin distinguir mayúsculas, tildes, puntuación ni espacios. 229 ya existían; se han creado 8.848 nuevos (sin género). Las grafías distintas del mismo artista dentro del Excel se unifican con la más frecuente.
- **Salas:** 48 ya existían y se han creado 678 nuevas. El Excel no trae dirección ni coordenadas: se usan coordenadas aproximadas del centro de Madrid.
- **Eventos:** 10.084 importados. Se descartan 7 ya presentes en Songkick (misma fecha y sala) y 7 sin artista. Cartel limitado a 10 artistas. Sin hora en origen: se reparte entre las 20 y las 22.
- **Seed:** `scripts/seed.mjs` suma estos datos a los de Songkick. Resultado: 10.815 conciertos, 9.523 artistas y 946 salas. Desaparecen los conciertos pasados sintéticos. Sigue siendo reproducible.
- **Peso:** el bundle de JS pasa de ~1,3 MB a ~4,5 MB (1,4 MB comprimido).
