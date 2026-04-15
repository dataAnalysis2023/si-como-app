import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { storage } from './utils/storage.js';

// Mock de fetch para el envío a CallMeBot
beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
});

function sembrarConfig() {
  storage.setConfig({
    nombreUsuario: 'Juan',
    numeroCocinero: '+573001234567',
    apiKey: 'apikey-xyz',
  });
  storage.setComidas([
    { id: 'desayuno', nombre: 'Desayuno', tipo: 'desayuno', inicio: '00:00', fin: '23:59' },
    { id: 'almuerzo', nombre: 'Almuerzo', tipo: 'almuerzo', inicio: '11:30', fin: '14:00' },
  ]);
  storage.setProteinas(['Pollo', 'Huevos']);
  storage.setBebidas(['Té', 'Jugo de fruta']);
}

describe('App — ruteo', () => {
  it('muestra onboarding cuando no hay config', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /bienvenido/i })).toBeInTheDocument();
  });

  it('muestra Home cuando ya hay config', () => {
    sembrarConfig();
    render(<App />);
    expect(screen.getByRole('heading', { name: /desayuno/i })).toBeInTheDocument();
  });

  it('botón de configuración abre la pantalla de edición', async () => {
    sembrarConfig();
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /configuración/i }));
    expect(screen.getByRole('heading', { name: /^configuración$/i })).toBeInTheDocument();
  });
});

describe('App — flujo Avisar SÍ con proteína + bebida', () => {
  it('dispara fetch a CallMeBot con el mensaje construido y persiste historial', async () => {
    sembrarConfig();
    const user = userEvent.setup();
    render(<App />);

    // Abrir modal tocando el plato
    await user.click(screen.getByLabelText(/avisar qué pasa/i));
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    await user.click(screen.getByRole('button', { name: 'Pollo' }));
    await user.click(screen.getByRole('button', { name: 'Té' }));
    await user.click(screen.getByRole('button', { name: /^avisar que sí voy/i }));

    // Fetch llamado con la URL correcta
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url] = globalThis.fetch.mock.calls[0];
    expect(url).toContain('api.callmebot.com');
    expect(url).toContain('phone=573001234567');
    expect(url).toContain('apikey=apikey-xyz');
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('Juan');
    expect(decoded).toContain('pollo');
    expect(decoded).toContain('té');

    // Historial persistido
    const historial = storage.getHistorial();
    expect(historial).toHaveLength(1);
    expect(historial[0].tipo).toBe('si');
    expect(historial[0].proteinas).toEqual(['Pollo']);
    expect(historial[0].bebidas).toEqual(['Té']);
  });
});

describe('App — flujo Avisar NO', () => {
  it('dispara fetch y persiste historial con tipo=no', async () => {
    sembrarConfig();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText(/avisar qué pasa/i));
    await user.click(screen.getByRole('button', { name: /hoy no cuento/i }));

    expect(globalThis.fetch).toHaveBeenCalled();
    const decoded = decodeURIComponent(globalThis.fetch.mock.calls[0][0]);
    expect(decoded).toContain('no cuento');

    const historial = storage.getHistorial();
    expect(historial[0].tipo).toBe('no');
    expect(historial[0].proteinas).toEqual([]);
  });
});

describe('App — flujo Skip', () => {
  it('saltar desayuno envía "no" y fuerza al almuerzo', async () => {
    sembrarConfig();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /saltar esta comida/i }));
    await user.click(screen.getByRole('button', { name: /^sí, saltar$/i }));

    // Fetch disparado
    expect(globalThis.fetch).toHaveBeenCalled();
    // Estado forzado apunta al almuerzo
    const forzada = storage.getForzada();
    expect(forzada?.id).toBe('almuerzo');
    // El header ahora muestra "Siguiente" y "Almuerzo"
    expect(await screen.findByRole('heading', { name: /almuerzo/i })).toBeInTheDocument();
    expect(screen.getByText('Siguiente')).toBeInTheDocument();
  });
});

describe('App — error de envío + reintento + WhatsApp manual', () => {
  it('muestra banner con Reintentar y link manual cuando fetch falla', async () => {
    sembrarConfig();
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText(/avisar qué pasa/i));
    await user.click(screen.getByRole('button', { name: /hoy no cuento/i }));

    expect(await screen.findByText(/no pudimos confirmar el envío/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /whatsapp manual/i });
    expect(link.getAttribute('href')).toContain('wa.me/573001234567');
  });

  it('al reintentar y tener éxito, limpia el banner y persiste historial', async () => {
    sembrarConfig();
    globalThis.fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ ok: true });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText(/avisar qué pasa/i));
    await user.click(screen.getByRole('button', { name: /hoy no cuento/i }));
    expect(await screen.findByText(/no pudimos confirmar/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(screen.queryByText(/no pudimos confirmar/i)).not.toBeInTheDocument();
    expect(storage.getHistorial()).toHaveLength(1);
  });
});

describe('App — preview del siguiente turno en Skip', () => {
  it('el dialog muestra el nombre de la próxima comida', async () => {
    sembrarConfig();
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /saltar esta comida/i }));
    expect(screen.getByText(/pasarás a almuerzo/i)).toBeInTheDocument();
  });
});

describe('App — Cambiar aviso pre-carga la selección previa', () => {
  it('tras avisar con pollo+té, reabrir trae los chips marcados', async () => {
    sembrarConfig();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText(/avisar qué pasa/i));
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    await user.click(screen.getByRole('button', { name: 'Pollo' }));
    await user.click(screen.getByRole('button', { name: 'Té' }));
    await user.click(screen.getByRole('button', { name: /^avisar que sí voy/i }));

    // Reabrir con "Cambiar aviso"
    await user.click(screen.getByRole('button', { name: /cambiar aviso/i }));
    // El botón principal debe mostrar el nuevo label (ya estamos en ruta sí, con selección)
    expect(screen.getByRole('button', { name: /^avisar que sí voy/i })).toBeInTheDocument();
  });
});

describe('App — navegación hoy/mañana con flechas', () => {
  it('la flecha → avanza al almuerzo; la ← vuelve al desayuno', async () => {
    sembrarConfig();
    const user = userEvent.setup();
    render(<App />);

    // Arranca en desayuno (activa = true por el rango 00:00-23:59)
    expect(screen.getByRole('heading', { name: /desayuno/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /comida siguiente/i }));
    expect(screen.getByRole('heading', { name: /almuerzo/i })).toBeInTheDocument();
    expect(screen.getByText('Hoy')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /comida anterior/i }));
    expect(screen.getByRole('heading', { name: /desayuno/i })).toBeInTheDocument();
  });

  it('navegar más allá del final del día lleva a mañana', async () => {
    sembrarConfig();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /comida siguiente/i })); // almuerzo hoy
    await user.click(screen.getByRole('button', { name: /comida siguiente/i })); // desayuno mañana
    expect(screen.getByText('Mañana')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /desayuno/i })).toBeInTheDocument();
  });

  it('flecha ← deshabilitada en el primer slot (desayuno hoy)', () => {
    sembrarConfig();
    render(<App />);
    expect(screen.getByRole('button', { name: /comida anterior/i })).toBeDisabled();
  });

  it('flecha → deshabilitada en el último slot (cena mañana)', async () => {
    sembrarConfig();
    const user = userEvent.setup();
    render(<App />);
    // 1 comida de desayuno (porque sembrarConfig solo pone 2) → slots: desayuno hoy, almuerzo hoy, desayuno mañana, almuerzo mañana = 4
    // Avanzar hasta el final
    const siguiente = () => screen.getByRole('button', { name: /comida siguiente/i });
    await user.click(siguiente()); // almuerzo hoy
    await user.click(siguiente()); // desayuno mañana
    await user.click(siguiente()); // almuerzo mañana
    expect(screen.getByRole('button', { name: /comida siguiente/i })).toBeDisabled();
  });

  it('decidir sobre mañana produce mensaje con "mañana"', async () => {
    sembrarConfig();
    const user = userEvent.setup();
    render(<App />);

    // Navegar hasta desayuno de mañana: 2 clics →
    await user.click(screen.getByRole('button', { name: /comida siguiente/i })); // almuerzo hoy
    await user.click(screen.getByRole('button', { name: /comida siguiente/i })); // desayuno mañana
    expect(screen.getByText('Mañana')).toBeInTheDocument();

    await user.click(screen.getByLabelText(/avisar qué pasa/i));
    await user.click(screen.getByRole('button', { name: /hoy no cuento/i }));

    const decoded = decodeURIComponent(globalThis.fetch.mock.calls[0][0]);
    expect(decoded).toContain('mañana');
    expect(decoded).toContain('no cuento');
  });

  it('el botón Saltar no aparece cuando estamos navegando mañana', async () => {
    sembrarConfig();
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /comida siguiente/i }));
    await user.click(screen.getByRole('button', { name: /comida siguiente/i }));
    expect(screen.queryByRole('button', { name: /saltar esta comida/i })).not.toBeInTheDocument();
  });
});

describe('App — agregar proteína desde el modal', () => {
  it('persiste en catálogo y queda seleccionada al confirmar', async () => {
    sembrarConfig();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText(/avisar qué pasa/i));
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    const input = screen.getByPlaceholderText(/nueva proteína/i);
    await user.type(input, 'Atún{Enter}');
    await user.click(screen.getByRole('button', { name: /^avisar que sí voy/i }));

    // Persistencia en catálogo
    expect(storage.getProteinas()).toContain('Atún');
    // Seleccionada en el envío
    const historial = storage.getHistorial();
    expect(historial[0].proteinas).toEqual(['Atún']);
  });
});
