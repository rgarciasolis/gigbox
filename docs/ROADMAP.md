# Roadmap (no implementado)

Cada fase indica el adaptador que sustituye, cambios de esquema y riesgos. Las pantallas no cambian: solo se sustituyen implementaciones de `src/data/repositories/*` y se pone `VITE_DATA_ADAPTER=real`.

## Fase real 1: Supabase (auth, Postgres, RLS)
- **Sustituye:** todos los adaptadores mock (`GigRepository`, `AttendanceRepository`, `GigslistRepository`, `ProfileRepository`, `FriendRepository`, `TagRepository`) por implementaciones Supabase en `src/data/real/`. Añadir sesión real (hoy el usuario actual es `meta.currentUserId` del seed).
- **Esquema:** crear las tablas de `docs/DATA_MODEL.md` con tablas puente (`gig_artist`, `gigslist_item`, `attendance_tag`). Indices en (user_id, gig_id), (gig_id), (date). Politicas RLS: lectura de perfiles/attendances de usuarios seguidos o publicos, escritura solo propia. Activity por trigger o vista.
- **Riesgos:** RLS mal definida filtra datos privados; paginacion (el mock devuelve listas completas); migrar de UUID de seed a UUID reales; costes de consultas de feed.

## Fase real 2: Datos de eventos (Ticketmaster Discovery, setlist.fm, MusicBrainz)
- **Sustituye:** `AgendaProvider` y la fuente de `GigRepository` para gigs futuros/pasados. Songkick y Bandsintown solo si se consigue acceso. Capa de proveedores en servidor (p. ej. Edge Functions) con cache en BD; sin scraping y sin llamar a las APIs desde el navegador.
- **Esquema:** `external_ref` pasa a ser la clave de deduplicacion (unique provider+external_id); tabla `provider_cache` (clave, payload, fetched_at, ttl); campos `source` y `last_synced_at` en Gig/Artist/Venue; normalizacion de generos.
- **Riesgos:** limites de cuota y terminos de uso (atribucion, almacenamiento); calidad y duplicados entre proveedores; cobertura desigual fuera de grandes giras; deriva de ids.

## Fase real 3: Importacion por reenvio de emails
- **Sustituye:** `ImportService`. Direccion de reenvio unica por usuario; parser por plantillas (Ticketmaster, Eventbrite, etc.) con LLM de respaldo; la pantalla de revision actual se mantiene. Lectura OAuth de Gmail/Outlook se evalua despues.
- **Esquema:** `import_inbox(user_id, address, created_at)`, `import_job(id, user_id, raw_ref, status, parsed_json)`, `import_candidate(...)` con estado confirmado/rechazado y enlace a `attendance`.
- **Riesgos:** privacidad y minimizacion del correo (guardar solo lo necesario, borrar el original), phishing/spoofing en emails entrantes, alucinaciones del LLM (siempre revision humana), falsos duplicados, coste por email.

## Fase real 4: Suscripcion (Stripe web), RGPD, privacidad
- **Sustituye:** el interruptor `setPlus` de `ProfileRepository` por estado derivado de Stripe (webhooks) y el flag `plus` por lectura de `subscription`.
- **Esquema:** `subscription(user_id, stripe_customer_id, status, current_period_end)`; `consent_log`; campos para exportacion y borrado de cuenta.
- **Riesgos:** sincronizacion de webhooks, impuestos/IVA, RGPD (base legal, exportar y borrar datos, DPA con proveedores, correo de terceros), reembolsos y gracia de impago.

## Fase real 5: App movil (React Native / Expo)
- **Reutiliza:** `src/domain`, interfaces de `src/data/repositories` y adaptadores reales, mas hooks de TanStack Query. Se extrae a un paquete compartido (monorepo).
- **Esquema:** sin cambios; añadir tabla `push_token` si hay notificaciones.
- **Riesgos:** diferencias de navegacion/UI, `localStorage` no existe en RN (el mock no se usa), politicas de pago de las tiendas para Plus (comisiones, Stripe no permitido para bienes digitales), mantenimiento de dos clientes.
