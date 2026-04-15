import { useEffect, useState, useCallback } from 'react';
import { storage } from '../utils/storage.js';

/**
 * Devuelve los slots navegables en un horizonte de hoy + mañana.
 * Cada slot: { comida, fecha, slotKey, esHoy }.
 * Orden: todas las de hoy (en el orden del array) seguidas de todas las de mañana.
 */
export function listarSlotsDosDias(comidas, ahora = new Date()) {
  if (!Array.isArray(comidas) || comidas.length === 0) return [];
  const hoy = fechaISO(ahora);
  const manana = fechaISO(addDias(ahora, 1));
  return [
    ...comidas.map((c) => ({ comida: c, fecha: hoy, slotKey: `${hoy}-${c.id}`, esHoy: true })),
    ...comidas.map((c) => ({ comida: c, fecha: manana, slotKey: `${manana}-${c.id}`, esHoy: false })),
  ];
}

function toMin(hhmm) {
  const [h, m] = (hhmm || '00:00').split(':').map(Number);
  return h * 60 + m;
}

function fechaISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDias(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function calcularNatural(comidas, ahora) {
  const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const hoy = fechaISO(ahora);

  for (const c of comidas) {
    const ini = toMin(c.inicio);
    const fin = toMin(c.fin);
    if (ini <= fin) {
      if (minAhora >= ini && minAhora <= fin) {
        return { comida: c, activa: true, fecha: hoy, slotKey: `${hoy}-${c.id}` };
      }
    } else {
      if (minAhora >= ini) {
        return { comida: c, activa: true, fecha: hoy, slotKey: `${hoy}-${c.id}` };
      }
      if (minAhora <= fin) {
        const ayer = fechaISO(addDias(ahora, -1));
        return { comida: c, activa: true, fecha: ayer, slotKey: `${ayer}-${c.id}` };
      }
    }
  }

  let mejor = null;
  let mejorDelta = Infinity;
  let mejorFecha = null;
  for (const c of comidas) {
    const ini = toMin(c.inicio);
    let delta = ini - minAhora;
    let fecha = hoy;
    if (delta <= 0) {
      delta += 1440;
      fecha = fechaISO(addDias(ahora, 1));
    }
    if (delta < mejorDelta) {
      mejorDelta = delta;
      mejor = c;
      mejorFecha = fecha;
    }
  }
  return {
    comida: mejor,
    activa: false,
    fecha: mejorFecha,
    slotKey: mejor ? `${mejorFecha}-${mejor.id}` : null,
  };
}

// La forzada expira cuando ya pasó el fin de su rango en su fecha, o si su slot
// coincide con el natural (llegó al turno naturalmente), o si el natural ya
// avanzó más allá (usuario ignoró la app y el reloj lo rebasó).
function forzadaVigente(forzada, natural, ahora) {
  if (!forzada || !natural?.slotKey) return false;
  if (forzada.slotKey === natural.slotKey) return false;
  const hoy = fechaISO(ahora);
  if (forzada.fecha < hoy) return false;
  if (forzada.fecha > hoy) return true;
  const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const finForzada = toMin(forzada.fin);
  const iniForzada = toMin(forzada.inicio);
  if (iniForzada <= finForzada && minAhora > finForzada) return false;
  // Si la natural pertenece a hoy y arranca después que la forzada, el reloj la rebasó
  if (natural.fecha === hoy && toMin(natural.comida.inicio) > iniForzada) return false;
  return true;
}

export function calcularComidaActual(comidas, ahora = new Date(), forzada = null) {
  if (!Array.isArray(comidas) || comidas.length === 0) {
    return { comida: null, activa: false, fecha: null, slotKey: null, forzada: false };
  }
  const natural = calcularNatural(comidas, ahora);
  if (forzada && forzadaVigente(forzada, natural, ahora)) {
    const c = comidas.find((x) => x.id === forzada.id);
    if (c) {
      return {
        comida: c,
        activa: false,
        fecha: forzada.fecha,
        slotKey: forzada.slotKey,
        forzada: true,
      };
    }
  }
  return { ...natural, forzada: false };
}

export function useComidaActual(comidas) {
  const [estado, setEstado] = useState(() =>
    calcularComidaActual(comidas, new Date(), storage.getForzada())
  );
  const [comidasRef, setComidasRef] = useState(comidas);

  // Recalcular al cambiar el array de comidas — patrón setState durante render.
  if (comidas !== comidasRef) {
    setComidasRef(comidas);
    const nuevo = calcularComidaActual(comidas, new Date(), storage.getForzada());
    if (!nuevo.forzada && storage.getForzada()) storage.clearForzada();
    setEstado(nuevo);
  }

  const recalcular = useCallback(() => {
    const nuevo = calcularComidaActual(comidas, new Date(), storage.getForzada());
    if (!nuevo.forzada && storage.getForzada()) storage.clearForzada();
    setEstado(nuevo);
  }, [comidas]);

  useEffect(() => {
    const intervalo = setInterval(recalcular, 30_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') recalcular();
    };
    window.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', recalcular);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', recalcular);
    };
  }, [recalcular]);

  // Auto-reset del estadoActual cuando cambia el slot — efecto "sincronizar con storage".
  const [slotKeyRef, setSlotKeyRef] = useState(estado.slotKey);
  if (estado.slotKey !== slotKeyRef) {
    setSlotKeyRef(estado.slotKey);
    if (estado.slotKey) {
      const guardado = storage.getEstado();
      if (guardado && guardado.slotKey !== estado.slotKey) storage.clearEstado();
    }
  }

  return { ...estado, recalcular };
}
