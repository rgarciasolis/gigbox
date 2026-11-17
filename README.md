# Kontz - "Letterboxd para conciertos" (MVP web con datos dummy)

React + TypeScript + Vite, React Router, Tailwind, TanStack Query. Sin backend ni APIs externas: los datos salen de `public/data/*.json` a traves de una capa de repositorios.

## Ejecutar

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + build
npm run seed         # regenera public/data/*.json (reproducible)
```

`npm run seed -- --seed=7 --today=2026-11-16` cambia semilla/fecha base. Los datos ya generados estan versionados.

## Pantallas

Secciones principales: Home (`/`), Perfil (`/perfil`), Agenda Plus (`/agenda`), Gigs (`/gigs`, `/gigs/:id`), Suscripcion simulada (`/suscripcion`).

- Home: ultimos 5 conciertos logados de tus amigos y ultimas 5 reviews de tus amigos.
- Perfil: resumen (mis 5 favoritos, actividad reciente = ultimos conciertos logados, reviews recientes) con submenu: Gigs (mis conciertos registrados, `/perfil/gigs`), Tags (`/perfil/tags`), Friends (`/perfil/friends`), Giglists (`/perfil/gigslists`), Agenda y Suscripcion.
- Gigs: catalogo con filtrado por fecha (desde/hasta), artista, lugar, genero y puntuacion minima; ficha de gig con fecha, amigos que fueron y asistentes totales.
- Agenda: contenido dummy (vista Plus existente: lista y calendario con radio/fechas/genero).
- Importacion masiva Plus (`/import`, enlace desde el resumen del perfil). Perfiles ajenos: `/u/:id`.

Usuario dummy: Alex Demo (Madrid), plan Free. Activa Plus en `/suscripcion` para ver Agenda e Importacion. En el pie hay un panel "Mock" para simular listas vacias o errores y restablecer los datos locales.

## Arquitectura

```
src/domain/        tipos del modelo (User, Artist, Venue, Gig, Attendance, Gigslist, Tag, Follow, Activity, ExternalRef) y vistas compuestas
src/data/repositories/  INTERFACES: Gig, Attendance, Gigslist, Profile, Friend, Tag, AgendaProvider, ImportService
src/data/mock/     adaptadores mock: leen /data/*.json, guardan en memoria + localStorage, latencia 300-600 ms, modos error/vacio
src/data/real/     adaptador real (stubs que lanzan "no implementado")
src/data/index.ts  unico sitio que elige adaptador (VITE_DATA_ADAPTER)
src/data/hooks.ts  hooks TanStack Query sobre los repositorios
src/pages, src/components   pantallas: solo usan hooks, nunca datos ni mock
src/config/        env y feature flags
scripts/seed.ts    generador de datos dummy con semilla
docs/              ROADMAP.md, DATA_MODEL.md
```

Regla: las pantallas nunca importan de `src/data/mock` (salvo el panel de desarrollo del layout) ni leen JSON.

## Cambiar de mock a real

1. Implementa las interfaces de `src/data/repositories/index.ts` en `src/data/real/` (reemplaza los stubs de `createRealRepositories`).
2. Pon `VITE_DATA_ADAPTER=real` en `.env` (ver `.env.example`).
3. Los tipos de retorno (`src/domain/views.ts`) son el contrato: el backend debe devolver esas formas o el adaptador debe mapearlas.
4. Quita el panel Mock de `Layout` si no lo quieres (solo aparece con el adaptador mock).

## Variables de entorno

| Variable | Efecto |
|---|---|
| `VITE_DATA_ADAPTER` | `mock` (por defecto) o `real` |
| `VITE_FORCE_PLUS` | `true`/`false` fuerza los flags Plus; vacio = depende del usuario |
| `VITE_MOCK_LATENCY_MIN/MAX` | latencia simulada en ms |

## Feature flags

`src/config/flags.ts`: `agenda` y `bulkImport`, ambos ligados a `User.plus`. El usuario dummy alterna Plus desde `/suscripcion`.

## Cambios v2

Home y Perfil ahora son páginas separadas. Las rutas antiguas /friends, /tags,
/gigslist y /subscription redirigen a sus equivalentes; /reviews sigue disponible.
Los favoritos conservan el criterio del MVP (las cinco mejores notas de 4,5 o más).
La actividad reciente se ordena por fecha de registro, no por fecha del concierto.
El total de asistentes de la ficha cuenta registros con estado "attended" en Kontz,
no el aforo ni la asistencia real del recinto. Todos los datos siguen siendo dummy.

### Publicar en Vercel

Incluye vercel.json con fallback SPA para que las rutas profundas funcionen al
recargar o abrir un enlace directo. Comando de build: npm run build. Carpeta: dist.

### Actualizar tu repositorio existente

Copia el contenido del proyecto sobre tu copia local, sin reemplazar su carpeta
.git. Después ejecuta git add ., git commit y git push desde tu copia habitual.
El zip también incluye el historial original y el nuevo commit de esta versión.
