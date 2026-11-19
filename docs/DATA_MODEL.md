# Modelo de datos

Los tipos están en `src/domain/types.ts` y reflejan el esquema final en Postgres. IDs: UUID. Fechas: ISO 8601.

Nombres: los identificadores técnicos van en inglés (`Gig`, `Gigslist`) y la interfaz usa **Conciertos** y **Wishlist**.

## Entidades

| Entidad | Campos principales | Notas |
| --- | --- | --- |
| User | id, username, displayName, bio, city, createdAt | En fase 1 será `profiles`, ligada a `auth.users`. |
| Artist | id, name, genre | Un género por artista en el MVP. |
| Venue | id, name, address, city, country, lat, lng | Coordenadas para la Agenda por radio. |
| Gig | id, artistIds[], venueId, startsAt, imageUrl, createdAt | `artistIds[0]` es cabeza de cartel. En SQL: tabla puente `gig_artists` con orden. |
| Attendance | id, userId, gigId, rating, review, tagIds[], photoUrl, createdAt | Es el "Fui". Solo para conciertos pasados. `rating` de 0.5 a 5 en pasos de 0.5. Único por (userId, gigId). |
| Gigslist | id, userId, kind, title, description, items[] | `kind: 'wishlist'` es la lista única de futuros; `kind: 'custom'` son las listas personales. |
| GigslistItem | gigId, addedAt, ticketStatus | `ticketStatus`: `no_ticket` (por defecto) o `has_ticket`. Solo relevante en la wishlist. |
| Tag | id, userId, name | Etiquetas propias para clasificar asistencias. |
| Follow | followerId, followeeId, createdAt | Relación dirigida. |
| Activity | id, userId, type, gigId, attendanceId, createdAt | `type`: `wishlist_add`, `review`, `attended`. Alimenta el Home. |
| ExternalRef | id, entityType, entityId, provider, externalId | Enlace con Ticketmaster, MusicBrainz, setlist.fm, Songkick, Bandsintown. |

## Entidades añadidas respecto al esquema original

Estas tres no estaban en el esquema inicial y salen de las decisiones del documento funcional:

| Entidad | Campos | Por qué |
| --- | --- | --- |
| GigLike | userId, gigId | El like es una palanca de interacción con el concierto y puede combinarse con Fui. |
| ReviewLike | userId, attendanceId | Like sobre la reseña de otra persona. |
| Favorite | userId, gigIds[] | Hasta 5 conciertos favoritos en el perfil, en orden. En el código: `getFavoriteIds` / `setFavorites`; el seed los guarda en `favorites.json`. En SQL: tabla `favorites(user_id, gig_id, position)`. |

## Reglas de negocio

- **Fui** solo existe para conciertos pasados. **Voy a ir** solo para futuros, y los guarda en la wishlist.
- Un concierto pasado que sigue en la wishlist se muestra como "pendiente de confirmar" con las acciones Fui y Quitar.
- Si el usuario marca Fui, el concierto sale de la wishlist.
- Importación masiva: fuera del MVP. No existe `ImportService`.
- La foto es local y simulada (dataURL, máximo 400 KB).

## Vistas compuestas

Los repositorios devuelven vistas ya montadas (`GigSummary`, `GigDetail`, `ReviewView`, `ProfileView`, `HomeFeed`, `AgendaResult`...). En Supabase se resolverán con vistas SQL o RPC. Ver `src/domain/types.ts`.

## Supuestos abiertos

1. **GigLike, ReviewLike y Favorite** son entidades nuevas (ver arriba). Confirmar que son las que se quieren.
2. **"Wishlist de tu ciudad"** (Home sin contactos) = conciertos futuros de la ciudad del usuario, ordenados por número de wishlists que los guardan.
3. **Las listas personales son visibles para quien te sigue.** No hay listas privadas en el MVP.
4. **D1 (abierta):** las vistas de calendario de Wishlist y sala se muestran a todos; Agenda es lo único de Plus.
5. La Agenda calcula distancia con coordenadas de la sala y la ciudad del usuario; el radio admite 25, 50, 100, 200 y 500 km.

## Datos de ejemplo

`npm run seed` genera `data/*.json` de forma reproducible (`--seed=N`, por defecto 42):
30 usuarios, 120 artistas, 40 salas (España y algunas internacionales), 300 conciertos, 500 asistencias con notas y reseñas, tags, listas y seguimientos.
Las fechas se guardan relativas a hoy (`dayOffset`) y se convierten a ISO al cargar, así que el dataset no caduca.
