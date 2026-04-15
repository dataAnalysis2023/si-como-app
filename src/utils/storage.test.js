import { describe, expect, it } from 'vitest';
import { storage, TIPOS } from './storage.js';

describe('storage — comidas', () => {
  it('getComidas retorna null cuando no hay nada', () => {
    expect(storage.getComidas()).toBeNull();
  });

  it('migra comidas v1 (sin tipo) usando el id conocido', () => {
    localStorage.setItem(
      'sicomo.comidas',
      JSON.stringify([
        { id: 'desayuno', nombre: 'Desayuno', inicio: '07:00', fin: '09:00' },
        { id: 'almuerzo', nombre: 'Almuerzo', inicio: '12:00', fin: '14:00' },
        { id: 'cena', nombre: 'Cena', inicio: '19:00', fin: '21:00' },
      ])
    );
    const out = storage.getComidas();
    expect(out).toHaveLength(3);
    expect(out[0].tipo).toBe('desayuno');
    expect(out[1].tipo).toBe('almuerzo');
    expect(out[2].tipo).toBe('cena');
  });

  it('migra onces → cena y merienda → almuerzo', () => {
    localStorage.setItem(
      'sicomo.comidas',
      JSON.stringify([
        { id: 'onces', nombre: 'Onces', inicio: '17:00', fin: '18:00' },
        { id: 'merienda', nombre: 'Merienda', inicio: '15:00', fin: '16:00' },
      ])
    );
    const out = storage.getComidas();
    expect(out[0].tipo).toBe('cena');
    expect(out[1].tipo).toBe('almuerzo');
  });

  it('id desconocido → fallback a almuerzo', () => {
    localStorage.setItem(
      'sicomo.comidas',
      JSON.stringify([{ id: 'merendita-custom', nombre: 'X', inicio: '10:00', fin: '11:00' }])
    );
    expect(storage.getComidas()[0].tipo).toBe('almuerzo');
  });

  it('preserva tipo válido si ya existe', () => {
    localStorage.setItem(
      'sicomo.comidas',
      JSON.stringify([{ id: 'x', nombre: 'X', tipo: 'cena', inicio: '19:00', fin: '21:00' }])
    );
    expect(storage.getComidas()[0].tipo).toBe('cena');
  });
});

describe('storage — proteínas y bebidas', () => {
  it('normaliza strings viejos a nombres', () => {
    localStorage.setItem('sicomo.proteinas', JSON.stringify(['Pollo', 'Huevos']));
    expect(storage.getProteinas()).toEqual(['Pollo', 'Huevos']);
  });

  it('normaliza objetos {nombre} a strings', () => {
    localStorage.setItem(
      'sicomo.bebidas',
      JSON.stringify([{ nombre: 'Té' }, { nombre: 'Jugo de fruta' }])
    );
    expect(storage.getBebidas()).toEqual(['Té', 'Jugo de fruta']);
  });

  it('dedupe case-insensitive al normalizar', () => {
    localStorage.setItem(
      'sicomo.proteinas',
      JSON.stringify(['Pollo', 'pollo', 'POLLO', 'Huevos'])
    );
    const out = storage.getProteinas();
    expect(out).toHaveLength(2);
    expect(out[0]).toBe('Pollo');
  });

  it('descarta items vacíos o sin nombre', () => {
    localStorage.setItem(
      'sicomo.proteinas',
      JSON.stringify(['Pollo', '', '   ', { nombre: '' }, null])
    );
    expect(storage.getProteinas()).toEqual(['Pollo']);
  });
});

describe('storage — historial', () => {
  it('parte vacío cuando no hay nada', () => {
    expect(storage.getHistorial()).toEqual([]);
  });

  it('appendHistorial acumula entradas', () => {
    storage.appendHistorial({ slotKey: 'a', timestamp: 1, tipo: 'si' });
    storage.appendHistorial({ slotKey: 'b', timestamp: 2, tipo: 'no' });
    const h = storage.getHistorial();
    expect(h).toHaveLength(2);
    expect(h[0].slotKey).toBe('a');
    expect(h[1].slotKey).toBe('b');
  });

  it('respeta el tope de 2000 entradas (FIFO)', () => {
    const entradas = Array.from({ length: 2005 }, (_, i) => ({
      slotKey: `slot-${i}`,
      timestamp: i,
      tipo: 'si',
    }));
    for (const e of entradas) storage.appendHistorial(e);
    const h = storage.getHistorial();
    expect(h).toHaveLength(2000);
    expect(h[0].slotKey).toBe('slot-5');
    expect(h[1999].slotKey).toBe('slot-2004');
  });
});

describe('storage — forzada y estado', () => {
  it('get/set/clear de forzada', () => {
    expect(storage.getForzada()).toBeNull();
    storage.setForzada({ id: 'cena', fecha: '2026-04-15', slotKey: '2026-04-15-cena' });
    expect(storage.getForzada().id).toBe('cena');
    storage.clearForzada();
    expect(storage.getForzada()).toBeNull();
  });

  it('estado persiste el último aviso', () => {
    storage.setEstado({ slotKey: 'x', estado: 'si' });
    expect(storage.getEstado()).toEqual({ slotKey: 'x', estado: 'si' });
    storage.clearEstado();
    expect(storage.getEstado()).toBeNull();
  });
});

describe('storage — configurado()', () => {
  it('false cuando falta cualquier campo obligatorio', () => {
    expect(storage.configurado()).toBe(false);

    storage.setConfig({ nombreUsuario: 'Juan' });
    expect(storage.configurado()).toBe(false);

    storage.setConfig({ nombreUsuario: 'Juan', numeroCocinero: '+573001234567' });
    expect(storage.configurado()).toBe(false);

    storage.setConfig({ nombreUsuario: 'Juan', numeroCocinero: '+573001234567', apiKey: 'k' });
    expect(storage.configurado()).toBe(false); // aún falta comidas

    storage.setComidas([{ id: 'a', nombre: 'A', tipo: 'desayuno', inicio: '07:00', fin: '08:00' }]);
    expect(storage.configurado()).toBe(false); // solo 1 comida

    storage.setComidas([
      { id: 'a', nombre: 'A', tipo: 'desayuno', inicio: '07:00', fin: '08:00' },
      { id: 'b', nombre: 'B', tipo: 'almuerzo', inicio: '12:00', fin: '14:00' },
    ]);
    expect(storage.configurado()).toBe(true);
  });
});

describe('storage — TIPOS', () => {
  it('expone desayuno/almuerzo/cena', () => {
    expect(TIPOS).toEqual(['desayuno', 'almuerzo', 'cena']);
  });
});
