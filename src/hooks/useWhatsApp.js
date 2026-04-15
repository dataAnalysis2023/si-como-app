import { useCallback, useState } from 'react';
import { construirMensaje } from '../utils/mensajes.js';
import { storage } from '../utils/storage.js';

/**
 * CallMeBot: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 * Endpoint: https://api.callmebot.com/whatsapp.php?phone=...&text=...&apikey=...
 *
 * Nota MVP: el apiKey vive en localStorage del cliente. Aceptable para la demo
 * single-user. Migración futura → Vercel Serverless Function + Twilio.
 */
export function useWhatsApp() {
  const [enviando, setEnviando] = useState(false);

  const enviar = useCallback(async ({ tipo, nombreComida, plato }) => {
    const cfg = storage.getConfig();
    if (!cfg?.numeroCocinero || !cfg?.apiKey) {
      throw new Error('Falta número de cocinero o API key de CallMeBot.');
    }

    const mensaje = construirMensaje({
      tipo,
      nombreUsuario: cfg.nombreUsuario,
      nombreComida,
      plato,
    });

    const telefono = cfg.numeroCocinero.replace(/[^0-9]/g, '');
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
      telefono
    )}&text=${encodeURIComponent(mensaje)}&apikey=${encodeURIComponent(cfg.apiKey)}`;

    setEnviando(true);
    try {
      // CallMeBot no soporta CORS; usamos no-cors (respuesta opaca).
      // Si la llamada no lanza, asumimos éxito.
      await fetch(url, { method: 'GET', mode: 'no-cors' });
      return { ok: true, mensaje };
    } finally {
      setEnviando(false);
    }
  }, []);

  return { enviar, enviando };
}
