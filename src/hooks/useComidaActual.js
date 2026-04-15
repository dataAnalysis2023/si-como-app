import { useEffect, useState, useCallback } from 'react';
import { storage } from '../utils/storage.js';

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

/**
 * Devuelve:
 *  { comida, activa, fecha, slotKey }
 *  comida = { id, nombre, inicio, fin } o null si no hay comidas configuradas
 *  activa = true si la hora cae dentro del rango
 *  fecha  = YYYY-MM-DD al que pertenece el "turno"
 *  slotKey = identificador único del turno (para auto-reset)
 */
export function calcularComidaActual(comidas, ahora = new Date()) {
  if (!Array.isArray(comidas) || comidas.length === 0) {
    return { comida: null, activa: false, fecha: null, slotKey: null };
  }

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
      // cruza medianoche: inicio tarde, fin temprano al día siguiente
      if (minAhora >= ini) {
        return { comida: c, activa: true, fecha: hoy, slotKey: `${hoy}-${c.id}` };
      }
      if (minAhora <= fin) {
        const ayer = fechaISO(addDias(ahora, -1));
        return { comida: c, activa: true, fecha: ayer, slotKey: `${ayer}-${c.id}` };
      }
    }
  }

  // No hay comida activa → calcular próxima
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

export function useComidaActual(comidas) {
  const [estado, setEstado] = useState(() => calcularComidaActual(comidas));

  const recalcular = useCallback(() => {
    setEstado(calcularComidaActual(comidas));
  }, [comidas]);

  useEffect(() => {
    recalcular();
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

  // Auto-reset del estadoActual cuando cambia el slotKey
  useEffect(() => {
    if (!estado.slotKey) return;
    const guardado = storage.getEstado();
    if (guardado && guardado.slotKey !== estado.slotKey) {
      storage.clearEstado();
    }
  }, [estado.slotKey]);

  return estado;
}
