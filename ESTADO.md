# Estado — ¡SÍ Como!

Registro cronológico de sesiones y decisiones. Entradas más recientes arriba.

---

## 2026-04-14 (tarde) — Renombre del producto

- Producto renombrado de **Rancho** a **¡SÍ Como!**
- Identificadores técnicos usan el slug `si-como` / `sicomo`:
  - `package.json` → `"name": "si-como"`
  - localStorage keys → `sicomo.config`, `sicomo.comidas`, `sicomo.menuRecurrente`, `sicomo.estadoActual`
- Strings visibles al usuario (title, manifest, onboarding, README) usan el nombre con signos: `¡SÍ Como!`
- **Nota sobre migración de localStorage:** los datos guardados bajo las viejas keys `rancho.*` ya no son leídos. Si alguien ya había configurado la app con el nombre anterior, debe volver a configurarla. Aceptable porque aún no hay usuarios reales.

---

## 2026-04-14 — Sesión inicial: scaffold completo del MVP

### Completado
- Scaffold Vite + React 19 + Tailwind CSS 3 con paleta cálida (mantel, terracota, crema, tinta).
- Utils:
  - `src/utils/storage.js` — wrappers de localStorage con keys `sicomo.config`, `sicomo.comidas`, `sicomo.menuRecurrente`, `sicomo.estadoActual` + defaults (3 comidas colombianas, menú base).
  - `src/utils/mensajes.js` — construcción de strings WhatsApp según tipo (`si` / `no` / `pedido`), con mapeo para comidas estándar (desayuno/almuerzo/cena/onces/merienda) y fallback genérico para nombres personalizados.
- Hooks:
  - `src/hooks/useComidaActual.js` — detección de comida activa por rango horario, cálculo de próxima comida, soporte de cruce de medianoche, re-evaluación con `setInterval` (30s) + `visibilitychange` + `focus`, auto-reset de `estadoActual` cuando cambia el `slotKey` (fecha+id).
  - `src/hooks/useWhatsApp.js` — envío a CallMeBot con `fetch mode: 'no-cors'`.
- Componentes:
  - `PlatoInteractivo.jsx` — SVG inline (plato + tenedor + cuchillo), transiciones CSS de 320ms para rotación de cubiertos, check animado en estado "sí".
  - `ModalDecision.jsx` — bottom sheet con tres rutas (sí / no / pedido), submenú de selección opcional u obligatoria según ruta.
  - `MenuRecurrente.jsx` — lista seleccionable reutilizable.
  - `Configuracion.jsx` — pantalla de onboarding + edición posterior; secciones perfil / comidas / menú con validaciones.
- `App.jsx` — router mínimo (si no configurado → onboarding; si edita → config; si no → home) + `Home` con toast, estado visual sincronizado con `slotKey`.
- PWA: `manifest.webmanifest`, `sw.js` mínimo (solo para instalabilidad), íconos SVG 192/512, theme color terracota, registro del SW en `main.jsx` sólo en producción.
- `vercel.json` con rewrite SPA y no-cache para `/sw.js`.
- `README.md` con instrucciones de CallMeBot, estructura de código, decisiones documentadas.
- Build de producción verificado: 209 KB JS (66 KB gzip), 11 KB CSS (3.4 KB gzip), 24 módulos transformados en ~620ms.

### Decisiones tomadas
- **API key de CallMeBot expuesto en cliente:** aceptado como deuda técnica documentada del MVP. Migración prevista a Vercel Serverless Function + Twilio cuando escale.
- **Cruce de medianoche:** si `inicio > fin` en un rango, se interpreta como cruce de día (no como error del usuario).
- **Modal abierto al cambiar de rango:** el modal captura `nombreComida` al abrirse y no reacciona a cambios mid-modal. Cerrar y reabrir refleja el nuevo turno. Decisión consciente por simplicidad.
- **Polling cada 30s + eventos de visibilidad/focus** en lugar de cron puro — garantiza actualización cuando el usuario vuelve a la app sin consumir recursos innecesarios.
- **SVG inline en lugar de Framer Motion** — las animaciones son simples (rotación sobre pivote fijo) y CSS transitions las cubren sin dependencia extra.

### Pendientes identificados
- Inicializar repositorio git y primer commit (no estaba iniciado al empezar la sesión).
- Probar el envío real de CallMeBot con API key válida en móvil.
- Confirmar visualmente en dispositivo: tamaños del SVG, posición del bottom sheet con notch, instalabilidad PWA en iOS vs Android.
- Validar que el auto-reset del estado visual ocurre correctamente al cruzar un rango (requiere simulación de hora o esperar).
- Revisar UX de configuración cuando el usuario configura mal horarios (ej: inicio después del fin sin intención de cruce).
