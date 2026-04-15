# Estado — ¡SÍ Como!

Registro cronológico de sesiones y decisiones. Entradas más recientes arriba.

---

## 2026-04-15 — Sesión larga: proteínas/bebidas + navegación + suite de tests + robustez de envío

### Completado
- **Convicción móvil registrada** como memoria permanente: el valor real de ¡SÍ Como! vive en el celular. Todo pendiente se evalúa desde ese lente.
- **Botón Skip** en el header: confirmación → envía "no voy" → fuerza la UI al siguiente turno (avance virtual). Auto-limpieza cuando el reloj llega al slot forzado o lo rebasa.
- **Modal reducido a 2 rutas:** "Voy a estar" / "No voy a estar". Ruta "pedido" eliminada.
- **Reemplazo del menú recurrente libre** por dos dimensiones con multi-selección: **proteínas** (huevos, pollo, carne de res, pescado, cerdo) y **bebidas** (té, jugo de fruta, jugo de flor de Jamaica). Sin filtro por tipo de comida (decisión: máxima simplicidad). Campo "Nota" libre opcional.
- **Agregar proteína/bebida inline** desde el modal: Enter o botón, dedupe case-insensitive, auto-selección del recién agregado.
- **Mensajes WhatsApp cálidos**: tono pensado para pareja que comparte comida, multi-items con concordancia ("Se me antoja pollo" vs "Se me antojan pollo y huevos"), listas en español bien formadas, emojis ocasionales. Formatos: `"Juan: ¡sí! voy a almorzar. Se me antoja pollo y de tomar té 🍽"`, `"Juan: hoy no cuento para la cena 😔"`.
- **Navegación por flechas hoy/mañana**: `← →` en el header permiten navegar los 6 slots del horizonte (3 comidas × 2 días). Labels contextuales: "Ahora / Próximo / Hoy / Mañana / Siguiente". Extremos deshabilitan las flechas. Decidir sobre mañana produce mensaje con prefijo "mañana".
- **Historial silencioso** por slotKey (`sicomo.historial`, tope 2000 entradas). Guarda selecciones, no consumo — base para futura vista de hábitos.
- **Pre-carga de selección** previa al "Cambiar aviso": el modal vuelve a abrirse con proteínas/bebidas/nota marcadas.
- **Confirmación al eliminar comida** en Configuración (dialog modal).
- **Empty states en modal con CTA** a Configuración (link directo a agregar).
- **Previsualización del siguiente turno** en el dialog de Skip (`pasarás a Almuerzo`).
- **Robustez de envío WhatsApp**:
  - Timeout 8s con `AbortController`.
  - Check `navigator.onLine` antes del intento.
  - Mensaje de error específico por caso (offline, timeout, red).
  - Banner persistente de error con botones **Reintentar** y **Abrir WhatsApp manual** (fallback `wa.me` con mensaje precargado).
- **Limitación documentada honestamente**: con `fetch mode: 'no-cors'` no es posible confirmar entrega real. Solo detectamos fallos duros. Confirmación real requiere backend propio (post-MVP).
- **Suite de tests instalada**: Vitest + @testing-library/react + jsdom. **115 tests pasando** (44 unitarios + 41 DOM + 30 integración). Cobertura: migración v1→v2 de comidas, normalización de proteínas/bebidas, historial FIFO, forzada con auto-limpieza, cruce de medianoche, mensajes con todas las permutaciones, multi-select, agregar inline, confirmación de eliminación, navegación con flechas, envío con timeout/red/offline, fallback `wa.me`, reintento, preview siguiente turno.
- **Deploy automático Vercel** disparado por push a main. URL del deploy en `vercel ls`.

### Decisiones tomadas
- **Rechazo de la memoria en el mensaje de WhatsApp**: incluir historial en el mensaje rompe el tono cercano y suena a bot. La memoria vive en la app para decisiones del usuario, no en el mensaje al cocinero. Confirmado por Juan.
- **Historial guarda selecciones, no consumo**: una selección ≠ lo que efectivamente comió. Guardamos solo la intención registrada. La vista de hábitos requerirá un paso de confirmación posterior (post-MVP) antes de emitir análisis, para no brindar información falsa.
- **Proteínas y bebidas sin filtro por tipo de comida**: todas disponibles siempre (2.C). Se privilegia simplicidad sobre la duda de "¿carne de res al desayuno?". El usuario decide en el momento.
- **Multi-selección en ambas dimensiones** (proteína y bebida pueden tener varios items).
- **Selección opcional al decir "sí voy"**: puedes confirmar sin elegir nada.
- **Navegación manual no persiste** entre recargas. Solo la forzada del skip persiste. Si abres la app, vuelves al estado natural (+ forzada pendiente).
- **Navegación se reinicia al cambiar el slot natural**: si navegaste a almuerzo y pasan 2 horas naturales, al cambiar el reloj de desayuno a almuerzo se resetea la vista al natural.
- **React 19 setState-in-effect**: todos los efectos que reseteaban estado al cambiar prop/slot reescritos al patrón oficial de `setState durante render` para evitar el lint `react-hooks/set-state-in-effect`.
- **Framework de testing**: Vitest elegido por integración nativa con Vite (mismo config + HMR + ESM sin transpilación extra).

### Bug real encontrado y fix estructural
- **`mensajes.antojo()` usaba `proteinas.length` antes de filtrar vacíos** → concordancia singular/plural incorrecta cuando llegaban arrays con items vacíos. Fix: función `limpiar()` compartida que filtra espacios y vacíos antes de contar. Test de regresión agregado.

### Pendientes identificados
- **Móvil real**: abrir la URL de Vercel en el celular, confirmar instalación PWA, probar envío con API key real del cocinero. Es el criterio real de "MVP presentable".
- Refinamientos menores de la navegación: feedback visual en extremos, indicador de "ya decidiste" en mini-header al navegar a comidas con aviso previo.
- Escalabilidad post-MVP: vista de hábitos + paso de confirmación de consumo + sugerencia de compra mensual (arquitectura de datos ya preparada con `sicomo.historial`).
- Backend propio para confirmación real de entrega de WhatsApp (Vercel Function + Twilio/Cloud API).

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
