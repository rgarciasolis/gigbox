# Conciertos (MVP0)

Web para registrar y descubrir conciertos. Esta versión funciona solo con datos de ejemplo. Stack: Vite, React, TypeScript, React Router, TanStack Query.

## Arrancar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc --noEmit + vite build, salida en dist/
npm run typecheck
```

## Datos de ejemplo

Hay dos conjuntos de datos, en `/data/reales/*.json` y `/data/dummy/*.json`, que genera un script reproducible. En el pie de la web hay un selector **Datos: Reales / Dummy**; al cambiarlo se recarga la página y se carga solo el conjunto elegido (se recuerda en el navegador). Reales: salas, artistas y conciertos reales (Songkick y Excel, ver abajo). Dummy: todo inventado (120 artistas, 40 salas, 300 conciertos).

```bash
npm run seed                 # genera los dos conjuntos con la semilla 42
node scripts/seed.mjs --dataset=dummy   # solo uno de los dos
node scripts/seed.mjs --seed=7
```

Los cambios que haces en la app (Fui, notas, listas, follows...) se guardan en el `localStorage` del navegador. En **Perfil > Ajustes > Herramientas de desarrollo** puedes:

- activar o quitar la latencia simulada (300-600 ms),
- subir la probabilidad de error,
- ver las pantallas con listas vacías,
- quitar los contactos (Home en modo ciudad),
- generar un aviso de artista de prueba (para ver aparecer el punto de novedades de la campana),
- restablecer los datos.

Para probar los avisos de artistas: **Perfil > Ajustes > Suscripción** y activar Plus (simulado). Los avisos están en la campana de la cabecera (`/avisos`). El radio se cambia en **Perfil > Ajustes > Avisos** (por defecto 50 km) y los artistas se siguen desde la ficha de un concierto.

## Cómo está organizado

```
src/domain        tipos, interfaces de repositorio, formato (sin dependencias del navegador)
src/data          adaptadores: mock/ (datos dummy) y real/ (stub)
src/queries       hooks de TanStack Query; las pantallas solo usan esto
src/flags         feature flags (los avisos de artistas dependen de Plus: flag `artistAlerts`)
src/screens       pantallas
src/components    piezas comunes
docs/             ROADMAP.md y DATA_MODEL.md
```

Regla: las pantallas no importan nada de `src/data`. Todo pasa por `src/queries`, que usa los repositorios.

## Pasar de mock a datos reales

1. Implementa los repositorios en `src/data/real/` (una clase o factory por interfaz de `src/domain/repositories.ts`) y devuélvelos desde `createRealRepositories()`.
2. Cambia la variable de entorno:

   ```
   VITE_DATA_ADAPTER=real
   ```

3. Añade las claves de la fase 1 (ver `.env.example`):

   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

4. Reconstruye. Las pantallas no cambian.

Hoy, con `real`, la app lanza un error indicando que el adaptador no está implementado. El orden recomendado está en `docs/ROADMAP.md`.

## Desplegar en Vercel desde GitHub

1. Sube el proyecto a un repositorio de GitHub.
2. En Vercel: **Add New > Project** e importa el repositorio.
3. Vercel detecta Vite. `vercel.json` ya fija `npm run build`, `dist` y la redirección de rutas a `index.html` (necesaria para que funcionen `/conciertos/...` al recargar).
4. En **Settings > Environment Variables** añade:
   - `VITE_DATA_ADAPTER` = `mock`
   - `VITE_FLAG_PLUS_DEFAULT` = `false`
5. Despliega. Cada push a la rama principal publica una nueva versión.

Las variables `VITE_*` se incluyen en el código del navegador: no pongas secretos en ellas. Las claves privadas (Ticketmaster, Stripe, service role de Supabase) irán en el servidor.

Nota: con el adaptador mock los JSON de `/data/<conjunto>` no van dentro del bundle principal (~355 KB): se cargan bajo demanda, solo los del conjunto elegido. El conjunto reales pesa unos 4,3 MB (los conciertos, 2,6 MB). Con datos reales de servidor desaparece.

## setlist.fm (función `/api/setlist`)

`api/setlist.ts` es una función serverless de Vercel que busca conciertos en setlist.fm (`/api/setlist?artist=Nombre&date=DD-MM-YYYY`) y devuelve solo fecha, artista, sala y el enlace de atribución. Necesita la variable `SETLISTFM_API_KEY` en Vercel (Settings > Environment Variables); sin ella responde 503. No funciona con `npm run dev` (usa `vercel dev`). Condiciones de la API: solo uso no comercial, la clave nunca va al navegador, caché corta (10 min), no se guardan sus datos y hay que mostrar siempre el enlace de atribución (`url`) sin `nofollow`; si falta, enlazar a https://www.setlist.fm.

## Hacia iOS y Android

Primero PWA o Capacitor sobre esta web; después Expo reutilizando `src/domain`, `src/data` y `src/queries`. Detalles en `docs/ROADMAP.md` (fase 5).

## Qué no incluye el MVP0

Importación masiva, pagos, cuentas reales, fotos en servidor, setlists, enlaces a plataformas.

## Artistas reales

Solo los artistas son reales; salas, conciertos, usuarios, reseñas, seguidores y avisos siguen siendo dummy.

- **Datos reales (Songkick):** `data/source/songkick-{venues,artists,events}.json` contienen 268 salas, 675 artistas y 731 conciertos (oct 2026 a ene 2027) de España. `npm run seed` los usa cuando existen. Se generan con `node scripts/import-songkick.mjs <carpeta con kontz-salas.json, kontz-artistas.json y kontz-eventos.json>`. Las fechas se guardan relativas al 20/11/2026 (día de captura) y el adaptador las mueve a "hoy". Songkick solo trae agenda futura; el historial pasado sale de los eventos del Excel (ver abajo). Usuarios, asistencias, reseñas, listas y avisos siguen siendo ficticios. 510 de 675 artistas no tienen género en la fuente (se muestran sin género).
- **Eventos reales del Excel:** `data/source/excel-events-raw.json` (10.098 eventos de Madrid, sep 2013 a nov 2027, con sala y artistas) se procesa con `node scripts/import-excel-events.mjs` y genera `data/source/excel-{venues,artists,events}.json`. El script separa los artistas por `+`, los normaliza contra los de Songkick (ver `scripts/lib/artist-key.mjs`: ignora mayúsculas, tildes, puntuación, espacios, artículos iniciales y "y/&/and"; las erratas se corrigen en `data/source/artist-aliases.json`, que se puede editar), crea los que faltan (8.678 artistas, sin género), unifica salas (678 nuevas, con coordenadas aproximadas del centro de Madrid porque el Excel no trae dirección), limita el cartel a 10 artistas y descarta 8 eventos ya presentes en Songkick y 7 sin artista. El Excel no trae hora: se reparte entre las 20 y las 22. Con ellos el seed da 10.814 conciertos, 9.352 artistas y 946 salas, y ya no hay conciertos pasados sintéticos. Estos datos solo se descargan con el conjunto reales.
- El conjunto dummy nunca usa Songkick ni el Excel. Si borras los ficheros `songkick-*.json`, el conjunto reales también cae en el modo dummy: el seed usa `data/source/artists.json` (lista curada de 120 artistas) y completa con nombres y salas inventados, como antes.
- `data/source/artists.json` es una lista curada de artistas reales (vascos, españoles e internacionales, con género). `npm run seed` la usa y completa con nombres inventados hasta 120. Para cambiar artistas, edita ese fichero y vuelve a lanzar el seed. Si el fichero no existe, el seed genera todo inventado.
- Opcional: `npm run scrape:artists` recoge títulos de la agenda de conciertos de [Kulturklik](https://www.kulturklik.euskadi.eus) y **sobrescribe** `data/source/artists.json`. Ejecútalo en tu máquina, revisa antes `robots.txt` y el aviso legal, y repasa el resultado a mano (la limpieza de títulos es heurística).
