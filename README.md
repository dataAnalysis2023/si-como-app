# ¡SÍ Como!

Micro-app de coordinación doméstica de comidas. Una pantalla, una decisión, un toque. Avisa por WhatsApp a quien cocina qué pasa con la próxima comida.

**Estado:** MVP single-user. Multiusuario es roadmap.

---

## Cómo funciona

La pantalla principal es una vista cenital de una mesa: mantel, plato, tenedor y cuchillo. Arriba se muestra la comida actual (según rango horario) o la próxima si ninguna está activa.

Tocas el plato → eliges una de tres opciones:

- **✓ Voy a estar** — opcional sugerir un plato del menú recurrente.
- **✗ No voy a estar** — un toque, sin pasos extra.
- **🍽 Quiero algo específico** — pides un plato del menú recurrente.

Al confirmar, se manda un mensaje por WhatsApp al cocinero y el plato cambia de estado visual (check si vas, cubiertos en X si no vas). El estado se resetea automáticamente al entrar a un nuevo turno (cambio de rango horario).

---

## Stack

- React 19 + Vite
- Tailwind CSS (paleta cálida: mantel beige + terracota)
- localStorage — sin backend propio
- CallMeBot — envío directo desde el cliente
- PWA básica (manifest + service worker mínimo)
- Deploy: Vercel

---

## Configuración de CallMeBot (una vez)

El cocinero tiene que autorizar al bot para recibir mensajes.

1. Desde el WhatsApp del **cocinero**, enviar al número **+34 644 51 95 23**:
   ```
   I allow callmebot to send me messages
   ```
2. CallMeBot responde con el **API key personal**.
3. En la app, pantalla de Configuración, pega:
   - Número del cocinero (con código país, ej: `+573001234567`)
   - API key que llegó por WhatsApp
   - Tu nombre (el que aparecerá en los mensajes)

Nota MVP: el API key queda expuesto en el frontend. Aceptable para demo single-user, documentado como deuda técnica. Migración prevista: Vercel Serverless Function + Twilio.

---

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Deploy en Vercel

```bash
npx vercel --prod
```

O conecta el repo desde el dashboard; Vercel detecta Vite automáticamente.

---

## Estructura

```
src/
  App.jsx                     # router simple (configurado/no, home vs config)
  components/
    PlatoInteractivo.jsx      # SVG del plato + cubiertos animados
    ModalDecision.jsx         # bottom sheet con las 3 opciones
    MenuRecurrente.jsx        # lista seleccionable reutilizable
    Configuracion.jsx         # formulario de perfil + comidas + menú
  hooks/
    useComidaActual.js        # rangos horarios + reset automático
    useWhatsApp.js            # construcción mensaje + CallMeBot
  utils/
    storage.js                # wrappers localStorage + defaults
    mensajes.js               # strings WhatsApp por tipo de aviso
```

### Keys en localStorage

| Key                     | Qué contiene                                                 |
|-------------------------|--------------------------------------------------------------|
| `sicomo.config`         | `{ nombreUsuario, numeroCocinero, apiKey }`                  |
| `sicomo.comidas`        | `[{ id, nombre, inicio, fin }]`                              |
| `sicomo.menuRecurrente` | `[string]`                                                   |
| `sicomo.estadoActual`   | `{ slotKey, estado }` — se borra al cambiar de turno         |

---

## Decisiones técnicas documentadas

- **Detección de comida activa:** recorrido lineal sobre `comidas[]` buscando el rango que contiene la hora actual. Si ninguno coincide, calcula la próxima comida sumando 24h cuando la de inicio ya pasó hoy.
- **Cruce de medianoche:** cuando `inicio > fin`, el rango cruza medianoche (ej: cena 23:00–01:00). Se calcula el `slotKey` con la fecha del inicio del rango.
- **Re-evaluación:** `setInterval` de 30s + `visibilitychange` + `focus`. Barato; garantiza actualización sin polling agresivo.
- **Auto-reset del estado visual:** se dispara cuando el `slotKey` (fecha + id comida) cambia. Si se cambió de turno, el plato vuelve a neutro.
- **Modal abierto al cambiar de turno:** el modal captura el `nombreComida` al abrirse y no reacciona a cambios mid-modal. Cerrar y reabrir refleja el nuevo turno. Consciente, no es un bug.
- **CORS de CallMeBot:** `fetch` con `mode: 'no-cors'`. Respuesta opaca, pero basta para disparar el mensaje.
- **Sin historial:** no se persisten avisos anteriores. Reset diario implícito.

---

## Licencia

MIT — Imagine Robots.
