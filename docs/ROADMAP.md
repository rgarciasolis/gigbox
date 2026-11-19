# Roadmap

El MVP0 es solo web y funciona con datos dummy. Las pantallas nunca leen datos directamente: usan hooks (`src/queries`) que llaman a repositorios (`src/domain/repositories.ts`). Pasar a datos reales consiste en **sustituir adaptadores**, no en reescribir pantallas.

Adaptadores actuales:

| Interfaz | Adaptador MVP0 |
| --- | --- |
| GigRepository | `src/data/mock/gigs.ts` |
| AttendanceRepository | `src/data/mock/attendances.ts` |
| GigslistRepository | `src/data/mock/gigslists.ts` |
| ProfileRepository | `src/data/mock/profiles.ts` |
| FriendRepository | `src/data/mock/friends.ts` |
| TagRepository | `src/data/mock/tags.ts` |
| FeedRepository | `src/data/mock/feed.ts` |
| ArtistFollowRepository | `src/data/mock/artistFollows.ts` |
| NotificationRepository | `src/data/mock/notifications.ts` |

El adaptador real se elige con `VITE_DATA_ADAPTER=real` y vive en `src/data/real/` (hoy es un stub que lanza error).

---

## Fase 1. Cuentas y base de datos (Supabase)

**Objetivo:** usuarios reales, datos persistentes, privacidad por fila.

- **Adaptadores que se sustituyen:** todos los de la tabla. `ProfileRepository.getCurrentUser()` pasa a leer la sesión de Supabase Auth.
- **Cambios de esquema:**
  - Crear en Postgres las tablas de `docs/DATA_MODEL.md` (users/profiles, artists, venues, gigs, gig_artists, attendances, gigslists, gigslist_items, tags, attendance_tags, follows, activities, gig_likes, review_likes, favorites, artist_follows, notifications, external_refs).
  - `profiles.id` referencia `auth.users.id`.
  - Índices: `gigs(starts_at)`, `gigs(venue_id)`, `attendances(user_id, gig_id)` único, `follows(follower_id, followee_id)` único.
  - Row Level Security: cada usuario escribe solo sus filas; lectura de reseñas y listas según relación de seguimiento.
  - La media de nota y el contador de asistentes pasan a vista o columna calculada (hoy se calculan en memoria).
  - `activities` se alimenta con triggers, no desde el cliente.
  - Los avisos `review_like` y `new_follower` de `notifications` se generan con triggers, no desde el cliente. Los de `artist_gig_announced` llegan en la fase 2.
- **Riesgos:**
  - RLS mal definida filtra datos de otros usuarios. Probar con dos cuentas.
  - Las vistas compuestas (`GigDetail`, `HomeFeed`) generan muchas consultas; conviene resolverlas con vistas SQL o funciones RPC.
  - Migrar el catálogo dummy: los IDs del seed son UUID, así que se pueden importar tal cual para pruebas.
  - Fotos: pasar de dataURL local a Supabase Storage con límites de tamaño.

## Fase 2. Catálogo real de conciertos

**Objetivo:** que `gigs`, `artists` y `venues` se llenen con datos reales sin scraping.

- **Adaptadores que se sustituyen:** se añade una capa `providers/` en servidor y `GigRepository` lee de nuestra base.
- **Fuentes, por orden:**
  1. Ticketmaster Discovery API (conciertos futuros y salas).
  2. MusicBrainz (identidad de artistas, géneros).
  3. setlist.fm (conciertos pasados y setlists).
  4. Songkick y Bandsintown **solo si se consigue acceso**; ninguna es requisito.
- **Avisos de artistas:** tarea periódica (cron o Edge Function) que, para cada artista seguido, compara los conciertos nuevos de la fuente con los guardados y crea los `artist_gig_announced`. Usa `external_refs` (MusicBrainz, Ticketmaster) para casar artistas.
- **Cambios de esquema:**
  - `external_refs` (ya existe) enlaza cada entidad con su ID externo por proveedor.
  - Campos de sincronización: `last_synced_at`, `source`.
  - Tabla de caché de respuestas (`provider_cache`) con TTL.
  - Deduplicar conciertos que llegan de varios proveedores.
- **Riesgos:**
  - Las claves de API no pueden estar en el cliente: Edge Functions o servidor propio con caché.
  - Límites de uso y condiciones de cada API (atribución, almacenamiento permitido). Revisarlas antes de guardar datos.
  - Calidad desigual de géneros y salas; hará falta normalización.
  - Los avisos de artistas dependen de la calidad de los datos y de los límites de cada API.
  - **No se hace scraping.**

## Fase 3. Importación por email reenviado (aplazada)

**Objetivo:** que el usuario reenvíe un email de entrada y se cree el Fui o el Voy a ir.

- **Adaptadores nuevos:** `ImportService` (hoy no existe en el código). Recepción de emails (webhook de un proveedor tipo Postmark o Mailgun) y parser.
- **Enfoque:** plantillas por proveedor de ticketing y, cuando no encaje ninguna, extracción con un LLM. Siempre con paso de confirmación del usuario antes de guardar.
- **Cambios de esquema:** tabla `imports` (estado, email bruto o referencia, resultado, concierto asignado).
- **Riesgos:**
  - Privacidad: los emails contienen datos personales. Minimizar, no guardar el cuerpo completo y definir retención.
  - Falsos positivos al casar el concierto con el catálogo.
  - Coste y fiabilidad del LLM. Tener siempre fallback manual.
  - Está fuera del MVP; no empezar antes de tener catálogo real (fase 2).

## Fase 4. Suscripción Plus y RGPD (Stripe)

**Objetivo:** cobrar Plus (hoy solo los avisos de artistas) y cumplir normativa.

- **Adaptadores que se sustituyen:** `ProfileRepository.getSubscription()` / `setPlus()` pasan a leer el estado de Stripe; `setPlus` desaparece del cliente.
- **Cambios de esquema:** tabla `subscriptions` (customer, estado, periodo), alimentada por webhooks de Stripe. El flag `artistAlerts` se deriva de ahí.
- **RGPD:** consentimiento y política de privacidad, exportación de datos, borrado de cuenta (cascada y borrado en Storage), registro de tratamientos, banner de cookies solo si hay analítica.
- **Riesgos:**
  - Webhooks perdidos o duplicados: idempotencia y reconciliación periódica.
  - IVA y facturación en la UE.

## Avisos reales por email y push

**Objetivo:** que los avisos de la campana lleguen también fuera de la app.

- **Primero email**, que es lo más barato. Push exige PWA con service worker o app nativa (fase 5).
- **Cambios de esquema:** preferencias de aviso por usuario y, para push, tabla de tokens.
- **Riesgos:** frecuencia y agrupación (un correo por aviso resulta molesto) y darse de baja con un clic.

## Fase 5. App nativa (React Native / Expo)

**Objetivo:** apps iOS y Android.

- **Qué se reutiliza:** `src/domain` (tipos, interfaces, formato), `src/data` (adaptadores reales) y `src/queries` (hooks de TanStack Query). Estas capas no usan `window` ni `document` salvo el panel mock y `localStorage` del adaptador mock.
- **Qué se reescribe:** pantallas y navegación (React Navigation o Expo Router) y componentes de UI.
- **Antes de Expo:** probar PWA o Capacitor sobre la web para validar uso real con poco coste.
- **Cambios de esquema:** tabla de tokens de notificaciones push si se añaden avisos push de artistas.
- **Riesgos:**
  - `localStorage` no existe en nativo: abstraer almacenamiento antes de mover código a un paquete compartido.
  - Subida de fotos desde cámara y permisos.
  - Revisión de las tiendas (suscripciones in-app: Apple y Google exigen su propio sistema de pago).
  - Mantener dos UIs: valorar un monorepo con paquete `core` compartido.

---

## Futuribles (no construir en el MVP)

- **Importar artistas desde streaming (Spotify, Apple Music, Tidal).** No puede ser condición del producto: Spotify restringe el acceso de apps nuevas (modo desarrollo con pocos usuarios y acceso ampliado reservado a apps consolidadas), Apple necesita cuenta de desarrollador de pago y token de usuario, y Tidal tiene API de colección de usuario con menos audiencia. El seguimiento dentro de la app es la fuente principal.
- **Comentarios en las reseñas.**
- **Aviso de salida a la venta de las entradas.**
