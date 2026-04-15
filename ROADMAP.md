# Roadmap — ¡SÍ Como!

Prioridades y estado de tareas. Actualizar al cerrar cada sesión.

---

## ✅ Completado

- [x] Scaffold Vite + React + Tailwind con paleta cálida
- [x] Utils de localStorage y construcción de mensajes
- [x] Hook `useComidaActual` (rangos, próxima comida, cruce de medianoche, auto-reset)
- [x] Hook `useWhatsApp` (integración CallMeBot)
- [x] Componente `PlatoInteractivo` (SVG + animaciones)
- [x] Componente `ModalDecision` (bottom sheet con tres rutas)
- [x] Componente `MenuRecurrente` (lista seleccionable)
- [x] Componente `Configuracion` (onboarding + edición)
- [x] Integración en `App.jsx` con router mínimo
- [x] PWA básica (manifest + service worker + íconos)
- [x] `vercel.json` para SPA
- [x] README con instrucciones de CallMeBot y decisiones técnicas
- [x] Verificación de build de producción

## 🔄 En curso

_(vacío)_

## 📋 Próximas — MVP presentable

- [ ] Inicializar repositorio git y primer commit
- [ ] Deploy inicial en Vercel (obtener URL pública)
- [ ] Probar envío real de WhatsApp en móvil con API key válido
- [ ] Validar instalación PWA en iOS y Android (Add to Home Screen)
- [ ] QA visual en móvil: notch, tamaños, scroll del bottom sheet

## 📋 Mejoras detectadas — polish

- [ ] Validación visual al configurar horarios invertidos sin intención de cruce (warning)
- [ ] Confirmación de envío fallido más clara (reintento, abrir WhatsApp manual)
- [ ] Animación de entrada del check un poco más sutil (hoy es bouncy — revisar con usuario)
- [ ] Feedback háptico en móvil al tocar el plato (navigator.vibrate)
- [ ] Estado intermedio "enviando" con plato dimming / spinner mínimo

## 🔮 Post-MVP — multiusuario y escala

- [ ] Migrar envío a Vercel Serverless Function + Twilio (ocultar API key)
- [ ] Soporte multiusuario: identificar quién avisó en el mensaje grupal
- [ ] Grupo familiar compartido (varios que piden, uno que cocina)
- [ ] Historial opcional de avisos (para patrones de consumo)
- [ ] Sugerencia automática de plato según patrón histórico
- [ ] Recordatorios push (si hay SW + notifications) cuando no se ha avisado dentro del rango
- [ ] Integración con calendario (si usuario tiene una reunión en el rango → sugerir "no voy")
