# Gigbox - "Letterboxd para conciertos" (MVP web con datos dummy)

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

Perfil (`/`, `/u/:id`), Gigs (`/gigs`, `/gigs/:id`), Gigslist (`/gigslist`), Reviews (`/reviews`), Tags (`/tags`), Amigos (`/friends`), Agenda Plus (`/agenda`), Importacion masiva Plus (`/import`), Suscripcion simulada (`/subscription`).

Usuario dummy: Alex Demo (Madrid), plan Free. Activa Plus en `/subscription` para ver Agenda e Importacion. En el pie hay un panel "Mock" para simular listas vacias o errores y restablecer los datos locales.

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

`src/config/flags.ts`: `agenda` y `bulkImport`, ambos ligados a `User.plus`. El usuario dummy alterna Plus desde `/subscription`.
