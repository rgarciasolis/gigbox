# Modelo de datos

Replica el esquema Postgres final. Tipos TypeScript en `src/domain/types.ts`; tipos compuestos (vistas) en `src/domain/views.ts`. Todos los ids son UUID, todas las fechas ISO 8601 (timestamptz en Postgres).

## Entidades

| Entidad | Campos | Notas |
|---|---|---|
| `User` | id, handle (unique), displayName, bio, avatarUrl, city, plus, createdAt | `plus` pasara a derivarse de una tabla `subscription` en la Fase 4. |
| `Artist` | id, name, genre, country | Fase 2: `genre` pasa a tabla `artist_genre` (N:M). |
| `Venue` | id, name, city, country, lat, lon | lat/lon sirven para el radio de la Agenda (en Postgres: PostGIS o haversine). |
| `Gig` | id, title, date, venueId, artistIds[], kind | `artistIds` es una tabla `gig_artist(gig_id, artist_id, position)`; posicion 0 = cabeza de cartel. |
| `Attendance` | id, userId, gigId, status (`attended` \| `going`), rating (0.5-5, paso 0.5, null), review, tagIds[], createdAt | Unique (userId, gigId). `tagIds` es `attendance_tag(attendance_id, tag_id)`. |
| `Gigslist` | id, userId, name, isDefault, items[{gigId, addedAt}] | Items en tabla `gigslist_item(gigslist_id, gig_id, added_at)`. Una por usuario es `isDefault` ("Quiero ir"). |
| `Tag` | id, userId, name | Unique (userId, lower(name)). Tags privados por usuario. |
| `Follow` | followerId, followeeId, createdAt | PK compuesta. |
| `Activity` | id, userId, type, gigId, targetUserId, rating, createdAt | Tipos: attended, rated, reviewed, saved, going, followed. En real puede generarse por triggers o vista. |
| `ExternalRef` | id, entityType (artist/venue/gig), entityId, provider, externalId | Enlaza con Ticketmaster, setlist.fm, MusicBrainz, etc. Unique (provider, externalId). |

## Relaciones

```
User 1-N Attendance N-1 Gig N-1 Venue
Gig N-M Artist
User 1-N Gigslist 1-N GigslistItem N-1 Gig
User 1-N Tag N-M Attendance
User N-M User (Follow)
User 1-N Activity -> Gig | User
ExternalRef -> (Artist | Venue | Gig) polimorfica
```

## Reglas de negocio ya en el mock

- Solo puntuas, reseñas o etiquetas si `status = attended`.
- Nota valida: 0.5 a 5 en pasos de 0.5.
- "Próximos guardados" = gigs futuros presentes en cualquiera de tus gigslists, ordenados por fecha.
- Duplicados en importación: mismo `userId + gigId` ya existente.
- Plus (flags `agenda`, `bulkImport`) depende de `User.plus` (o de `VITE_FORCE_PLUS`).

## Datos dummy

`npm run seed` (script `scripts/seed.ts`, PRNG con semilla) genera `public/data/*.json`: 30 usuarios, 120 artistas, 40 salas (34 de España, 6 internacionales), 300 conciertos (200 pasados, 100 futuros), 500 asistencias (440 `attended`, 60 `going`), tags, gigslists, follows, actividad y ExternalRefs. Todo es ficticio. Las fechas se generan relativas al día del seed y el adaptador mock las desplaza al día actual al cargar, para que los datos "próximos" lo sigan siendo.
