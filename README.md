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

Los datos están en `/data/*.json` y los genera un script reproducible:

```bash
npm run seed                 # semilla 42
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

Nota: con el adaptador mock el JSON de `/data` va dentro del bundle (~1 MB, ~245 KB comprimido). Es aceptable para el MVP; con datos reales desaparece.

## Hacia iOS y Android

Primero PWA o Capacitor sobre esta web; después Expo reutilizando `src/domain`, `src/data` y `src/queries`. Detalles en `docs/ROADMAP.md` (fase 5).

## Qué no incluye el MVP0

Importación masiva, pagos, cuentas reales, fotos en servidor, setlists, enlaces a plataformas.

## Artistas reales

Solo los artistas son reales; salas, conciertos, usuarios, reseñas, seguidores y avisos siguen siendo dummy.

- `data/source/artists.json` es una lista curada de artistas reales (vascos, españoles e internacionales, con género). `npm run seed` la usa y completa con nombres inventados hasta 120. Para cambiar artistas, edita ese fichero y vuelve a lanzar el seed. Si el fichero no existe, el seed genera todo inventado.
- Opcional: `npm run scrape:artists` recoge títulos de la agenda de conciertos de [Kulturklik](https://www.kulturklik.euskadi.eus) y **sobrescribe** `data/source/artists.json`. Ejecútalo en tu máquina, revisa antes `robots.txt` y el aviso legal, y repasa el resultado a mano (la limpieza de títulos es heurística).
