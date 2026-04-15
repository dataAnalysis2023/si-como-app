# Roadmap — ¡SÍ Como!

Prioridades y estado de tareas. Actualizar al cerrar cada sesión.

---

## ✅ Completado

### Scaffold e infra
- [x] Scaffold Vite + React + Tailwind con paleta cálida
- [x] Utils de localStorage y construcción de mensajes
- [x] Hook `useComidaActual` (rangos, próxima comida, cruce de medianoche, auto-reset)
- [x] Hook `useWhatsApp` (integración CallMeBot)
- [x] Componente `PlatoInteractivo` (SVG + animaciones)
- [x] Componente `Configuracion` (onboarding + edición)
- [x] Integración en `App.jsx` con router mínimo
- [x] PWA básica (manifest + service worker + íconos)
- [x] `vercel.json` para SPA
- [x] README con instrucciones de CallMeBot y decisiones técnicas
- [x] Inicializar repositorio git y primer commit
- [x] Deploy inicial en Vercel (URL pública asignada)
- [x] Verificación de build de producción

### Sesión 2026-04-15
- [x] Botón "Saltar esta comida" en header con avance virtual a siguiente turno
- [x] Modal reducido a 2 rutas (sí / no); ruta "pedido" eliminada
- [x] Proteínas + bebidas con multi-selección (reemplazo del menú recurrente)
- [x] Nota libre opcional en el aviso
- [x] Agregar proteína/bebida inline desde el modal con auto-select
- [x] Mensajes cálidos con concordancia plural, multi-items y emojis
- [x] Navegación por flechas hoy/mañana (6 slots navegables)
- [x] Mensajes con prefijo "mañana" cuando aplica
- [x] Historial silencioso por slotKey (`sicomo.historial`, tope 2000)
- [x] Pre-carga de selección previa al "Cambiar aviso"
- [x] Confirmación al eliminar comida en Configuración
- [x] Empty states en modal con CTA a Configuración
- [x] Preview del siguiente turno en dialog de Skip
- [x] Timeout + `navigator.onLine` + banner persistente de error
- [x] Fallback `wa.me` (link manual) como respaldo cuando el envío falla
- [x] Suite de tests con Vitest + Testing Library (115 tests)
- [x] Convicción "móvil es el target real" registrada en memoria permanente

## 🔄 En curso

_(vacío)_

---

## 🎯 Convicción central

**El valor real de ¡SÍ Como! está en el celular.** Todo pendiente debe evaluarse desde el lente móvil. Desktop es solo para desarrollo.

---

## 📋 Próximas — MVP móvil presentable (PRIORIDAD)

- [ ] **Probar la app real en el celular de Juan** — abrir URL de Vercel en el navegador del teléfono.
- [ ] **Instalar como PWA** (Add to Home Screen en iOS y Android), confirmar ícono + splash.
- [ ] **Probar envío real de WhatsApp** desde móvil con API key válido del cocinero.
- [ ] **QA táctil en móvil:** tamaños del plato, chips de proteína/bebida, bottom sheet con notch, scroll del modal con teclado abierto.
- [ ] **Probar flechas ← → en móvil**: tamaño del tap target, posible agregar swipe gesture lateral sobre el plato.
- [ ] Validar `safe-area-inset` en iOS (notch y home indicator).
- [ ] Confirmar que el auto-reset del estado visual funciona cuando el celular se bloquea y se reabre cruzando un rango horario.

## 📋 Refinamientos detectados en esta sesión

- [ ] Feedback visual en los extremos de la navegación (pulse / hint al chocar contra flecha deshabilitada).
- [ ] Indicador de "ya decidiste" en el mini-header al navegar a comidas con aviso previo (hoy solo se ve en la frase bajo el plato).
- [ ] Explorar swipe lateral sobre el plato como alternativa a las flechas (1-gesto móvil).
- [ ] Validación visual al configurar horarios invertidos sin intención de cruce (warning).
- [ ] Animación de entrada del check un poco más sutil (hoy es bouncy — revisar con usuario en móvil).
- [ ] Feedback háptico en móvil al tocar el plato (`navigator.vibrate`).
- [ ] Estado intermedio "enviando" con plato dimming / spinner mínimo.

---

## 🔮 Post-MVP — hábitos y escala

### Vista de hábitos (próxima feature grande)
- [ ] **Paso de confirmación de consumo real**: diferenciar "lo que seleccioné" vs "lo que efectivamente comí". Bloqueante antes de mostrar análisis.
- [ ] Vista "tus semanas": frecuencia de proteínas/bebidas en los últimos 7/30 días.
- [ ] Detección de patrones ("jugo de Jamaica los viernes").
- [ ] Sugerencia de lista de compra mensual a partir del histórico confirmado.

### Backend y entrega
- [ ] Migrar envío a Vercel Serverless Function + Twilio/WhatsApp Cloud API (ocultar API key, **confirmación real de entrega vía webhook**).
- [ ] Logging estructurado de fallos de envío para depurar reintentos.

### Multiusuario
- [ ] Soporte multiusuario: identificar quién avisó en el mensaje grupal.
- [ ] Grupo familiar compartido (varios que piden, uno que cocina).

### Integraciones
- [ ] Recordatorios push (si hay SW + notifications) cuando no se ha avisado dentro del rango.
- [ ] Integración con calendario (si usuario tiene una reunión en el rango → sugerir "no voy").
