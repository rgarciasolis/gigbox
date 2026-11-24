# Changelog

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
