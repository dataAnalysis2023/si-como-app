import { useCallback, useState } from 'react';
import { construirMensaje } from '../utils/mensajes.js';
import { storage } from '../utils/storage.js';

const TIMEOUT_MS = 8000;

/**
 * Limitación conocida: CallMeBot no soporta CORS, usamos fetch con mode: 'no-cors'.
 * Eso implica respuesta OPACA — no podemos leer status ni body.
 * Solo detectamos fallos duros (offline, timeout, network error), no errores de API.
 * Confirmación real de entrega requeriría backend propio (post-MVP).
 */
export function useWhatsApp() {
  const [enviando, setEnviando] = useState(false);

  const armarPayload = useCallback(({ tipo, nombreComida, tipoComida, proteinas, bebidas, nota, paraManana }) => {
    const cfg = storage.getConfig();
    if (!cfg?.numeroCocinero || !cfg?.apiKey) {
      throw new Error('Falta número de cocinero o API key de CallMeBot.');
    }
    const mensaje = construirMensaje({
      tipo,
      nombreUsuario: cfg.nombreUsuario,
      nombreComida,
      tipoComida,
      proteinas,
      bebidas,
      nota,
      paraManana,
    });
    const telefono = cfg.numeroCocinero.replace(/[^0-9]/g, '');
    return { cfg, mensaje, telefono };
  }, []);

  const enviar = useCallback(async (entrada) => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new Error('Sin conexión a internet.');
    }

    const { mensaje, telefono, cfg } = armarPayload(entrada);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
      telefono
    )}&text=${encodeURIComponent(mensaje)}&apikey=${encodeURIComponent(cfg.apiKey)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    setEnviando(true);
    try {
      await fetch(url, { method: 'GET', mode: 'no-cors', signal: controller.signal });
      return { ok: true, mensaje };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('El envío tardó demasiado. Revisa tu conexión o abre WhatsApp manual.');
      }
      throw new Error('No se pudo enviar. Abre WhatsApp manual como respaldo.');
    } finally {
      clearTimeout(timeoutId);
      setEnviando(false);
    }
  }, [armarPayload]);

  // Fallback: link wa.me que abre WhatsApp nativo con el mensaje precargado.
  const linkManual = useCallback((entrada) => {
    try {
      const { mensaje, telefono } = armarPayload(entrada);
      return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    } catch {
      return null;
    }
  }, [armarPayload]);

  return { enviar, enviando, linkManual };
}
