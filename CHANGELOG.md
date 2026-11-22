# Changelog

Historial de cambios de App Concis (MVP web con datos dummy). Formato inspirado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Las versiones `vX.Y` son las del documento funcional; el número de `package.json` no se usa.

## Cómo mantenerlo

- Cada PR añade sus líneas bajo **Sin publicar**, en la categoría que toque: Añadido, Cambiado, Eliminado o Corregido.
- Cuando se cierra un hito o una versión funcional, "Sin publicar" pasa a una sección con su fecha y se deja vacío.
- Los cambios de producto (el qué) se deciden en el chat funcional. Aquí se anotan los de construcción y las decisiones que modifican otras anteriores.

## Sin publicar

_Nada por ahora._

## 2026-11-20 · Interfaz del Figma y datos reales

### Añadido
- Tokens y estilos del Figma "Gigbox": zinc, verde, Inter, cabecera de 56 px, cuadrado de fecha, filas de concierto, botones y tarjetas de reseña (#6).
- Home con los 4 últimos conciertos añadidos por contactos y las 4 últimas reseñas, con "Ver todo" hacia `/actividad/wishlists` y `/actividad/resenas` (hasta 50) (#6).
- Versión móvil del Home según el artboard de 375 px, con menú de tres barras en la cabecera (#8, #9).
- Artistas reales como fuente del seed: lista curada en `data/source/artists.json` y script opcional `npm run scrape:artists` (Kulturklik) (#7, #10).
- Datos reales de Songkick: 268 salas, 675 artistas y 731 conciertos (oct 2026 a ene 2027), con `scripts/import-songkick.mjs`. Los 205 conciertos pasados del historial son sintéticos (#14).

### Cambiado
- La campana de Avisos muestra solo un punto cuando hay novedades, sin número. Sustituye al contador de la v0.7 (#6).
- Todas las pantallas interiores usan el diseño del Home: columna de 1120 px, títulos de 32/48 px y filas de concierto y reseña del Home (#11).
- En móvil, las acciones de cada concierto van debajo, los botones son siempre grises (verde solo en hover con ratón) y el estado seleccionado se marca con borde oscuro y negrita (#8).
- El menú de secciones del Perfil queda en una línea con scroll horizontal y enlaces de 44 px (#13).
- El seed pasa de 40 salas, 120 artistas y 300 conciertos a 268, 675 y 934 (usuarios y asistencias no cambian) (#14).
- Los títulos usan Inter ExtraBold porque "ES Klarheit Kurrent" es una fuente de prueba (#9).

### Corregido
- Se descarta el estado guardado en el navegador cuando cambian los datos del seed, para evitar mezclar datos antiguos y nuevos (#12).
- Safari ya no subraya fechas y direcciones por la autodetección de iOS (#8).

### Notas
- Songkick y Kulturklik: antes de hacer público el repo o desplegar con estos datos, revisar los términos de uso de Songkick y el `robots.txt` y el aviso legal de Kulturklik. Mientras sean datos dummy en un repo privado, el riesgo es bajo.
- El ROADMAP sigue diciendo que en producción no se hace scraping.

## 2026-11-19 · v0.7: Avisos sustituye a Agenda

Documento de origen: `claude/cambios-v0.7-construccion.md` del Project.

### Añadido
- Pantalla `/avisos` con las pestañas **Artistas** (Plus) e **Interacciones**. Pulsar un aviso lo marca como leído, hay "Marcar todo como leído" y el aviso de artista lleva el botón "Voy a ir". Sin Plus, la pestaña Artistas aparece bloqueada con enlace a la suscripción (#3, #4).
- Campana en la cabecera con contador de avisos sin leer (#4).
- Seguir y dejar de seguir artistas: sección "Cartel" en la ficha y nueva sección **Perfil > Artistas** (#4).
- Radio de los avisos de artistas en Perfil > Ajustes: 25, 50, 100, 200 o 500 km, por defecto 50 (#4).
- Entidades `ArtistFollow` y `Notification`, repositorios `ArtistFollowRepository` y `NotificationRepository`, hooks y adaptador mock (#3).
- Seed: `artistFollows.json` y `notifications.json`, generados al final del script para no alterar el resto del dataset (#3).
- Botón "Generar aviso de prueba" en el panel de desarrollo (#3).
- Documentación del modelo, las reglas de avisos y los futuribles en `DATA_MODEL.md`, `ROADMAP.md` y `README.md` (#5).

### Cambiado
- Los destinos pasan a cuatro: Home, Conciertos, Wishlist y Perfil, más la campana de Avisos (#4).
- Plus pasa a ser solo la pestaña Artistas de Avisos. Los calendarios de Wishlist y sala son gratuitos (D1 cerrada) (#4, #5).
- El flag `agenda` pasa a `artistAlerts` (#4).
- La campana cuenta las interacciones sin leer y, solo con Plus, los avisos de artistas sin leer (#4).

### Eliminado
- Pantalla Agenda, `AgendaProvider`, `useAgenda` y el mock de agenda. La ruta `/agenda` ya no existe y no redirige (#4).

## 2026-11-19 · Base del proyecto (MVP0, funcional v0.6)

### Añadido
- MVP0 web con datos dummy: Vite, React, TypeScript, Tailwind v4, React Router y TanStack Query. Arquitectura por capas pantallas → hooks → repositorios → adaptador (`mock` o `real`).
- Cinco destinos (Home, Conciertos, Wishlist, Agenda, Perfil), Fui, Voy a ir, notas de 0,5 a 5, reseñas, tags, listas personales y estadísticas.
- Seed reproducible (`npm run seed`, semilla 42): 30 usuarios, 120 artistas, 40 salas, 300 conciertos y 500 asistencias.
- Manifiesto PWA e iconos provisionales, para añadir la app a la pantalla de inicio (#2).
- Despliegue en Vercel desde GitHub (`vercel.json`).
- `.gitignore` y limpieza de `.DS_Store` (#1).
