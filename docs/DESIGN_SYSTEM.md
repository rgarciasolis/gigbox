# Sistema visual (fuente: Figma Gigbox, página Ready, frame 01_Home)

Tokens en `tailwind.config.js` (green, zinc, purple = Purple Heart) y clases base en `src/index.css`.

| Elemento Figma | Componente / clase |
|---|---|
| Nav (KONTZ + pastilla CONCIERTOS / AGENDA / SUSCRIPCIÓN, activo green-600) | `components/Layout.tsx` |
| Avatar (círculo green-600, iniciales Kurrent) | `Avatar` en `components/ui.tsx` |
| Eyebrow + título Kurrent italic 48 px zinc-500 | `SectionHeader` / `.section-title` |
| Tarjeta de concierto (fecha, titular 32/24, persona, banda green-950) | `GigCard` + `GigGrid` en `components/gig.tsx` |
| Reseña (autor, título Inter Bold 20, meta 12, estrellas green-600) | `ReviewCard` + `ReviewGrid` |
| Botón MORE (green-700, Inter Bold, mayúsculas) | `.btn .btn-primary` |
| Pestañas / submenú (pastilla verde activa) | `Tabs`, `ProfileLayout` |

Pendiente respecto a Figma: tipografía "ES Klarheit Plakat" del logo, modo oscuro (variables Dark en Figma), icono de "me gusta" (Purple Heart) cuando el modelo de datos tenga likes.
