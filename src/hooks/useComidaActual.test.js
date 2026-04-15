import { describe, expect, it } from 'vitest';
import { calcularComidaActual, listarSlotsDosDias } from './useComidaActual.js';

const COMIDAS = [
  { id: 'desayuno', nombre: 'Desayuno', tipo: 'desayuno', inicio: '06:00', fin: '09:30' },
  { id: 'almuerzo', nombre: 'Almuerzo', tipo: 'almuerzo', inicio: '11:30', fin: '14:00' },
  { id: 'cena', nombre: 'Cena', tipo: 'cena', inicio: '18:00', fin: '21:30' },
];

function at(hora) {
  // 2026-04-15 a la hora indicada, hora local
  const [h, m] = hora.split(':').map(Number);
  return new Date(2026, 3, 15, h, m, 0);
}

describe('calcularComidaActual — reloj natural', () => {
  it('comidas vacías → comida null', () => {
    const r = calcularComidaActual([], at('10:00'));
    expect(r.comida).toBeNull();
  });

  it('dentro de rango → activa=true con esa comida', () => {
    const r = calcularComidaActual(COMIDAS, at('07:00'));
    expect(r.activa).toBe(true);
    expect(r.comida.id).toBe('desayuno');
    expect(r.slotKey).toBe('2026-04-15-desayuno');
  });

  it('entre rangos → activa=false, próxima comida', () => {
    const r = calcularComidaActual(COMIDAS, at('10:00'));
    expect(r.activa).toBe(false);
    expect(r.comida.id).toBe('almuerzo');
    expect(r.slotKey).toBe('2026-04-15-almuerzo');
  });

  it('después de la última → próxima es desayuno de mañana', () => {
    const r = calcularComidaActual(COMIDAS, at('23:00'));
    expect(r.activa).toBe(false);
    expect(r.comida.id).toBe('desayuno');
    expect(r.slotKey).toBe('2026-04-16-desayuno');
  });

  it('justo al inicio del rango → activa=true', () => {
    const r = calcularComidaActual(COMIDAS, at('11:30'));
    expect(r.activa).toBe(true);
    expect(r.comida.id).toBe('almuerzo');
  });

  it('justo al fin del rango → activa=true', () => {
    const r = calcularComidaActual(COMIDAS, at('14:00'));
    expect(r.activa).toBe(true);
    expect(r.comida.id).toBe('almuerzo');
  });
});

describe('calcularComidaActual — cruce de medianoche', () => {
  const CON_CRUCE = [
    { id: 'desayuno', nombre: 'Desayuno', tipo: 'desayuno', inicio: '06:00', fin: '09:30' },
    { id: 'cena', nombre: 'Cena', tipo: 'cena', inicio: '22:00', fin: '01:00' },
  ];

  it('antes de medianoche dentro del rango → activa=true fecha=hoy', () => {
    const r = calcularComidaActual(CON_CRUCE, at('23:30'));
    expect(r.activa).toBe(true);
    expect(r.comida.id).toBe('cena');
    expect(r.fecha).toBe('2026-04-15');
  });

  it('después de medianoche antes del fin → activa=true fecha=ayer', () => {
    const r = calcularComidaActual(CON_CRUCE, at('00:30'));
    expect(r.activa).toBe(true);
    expect(r.comida.id).toBe('cena');
    expect(r.fecha).toBe('2026-04-14');
  });
});

describe('listarSlotsDosDias', () => {
  it('retorna vacío si no hay comidas', () => {
    expect(listarSlotsDosDias([], at('10:00'))).toEqual([]);
  });

  it('retorna N slots de hoy + N slots de mañana, en ese orden', () => {
    const slots = listarSlotsDosDias(COMIDAS, at('10:00'));
    expect(slots).toHaveLength(6);
    expect(slots.slice(0, 3).every((s) => s.esHoy)).toBe(true);
    expect(slots.slice(3).every((s) => !s.esHoy)).toBe(true);
    expect(slots[0].slotKey).toBe('2026-04-15-desayuno');
    expect(slots[3].slotKey).toBe('2026-04-16-desayuno');
    expect(slots[5].slotKey).toBe('2026-04-16-cena');
  });

  it('preserva la info de la comida en cada slot', () => {
    const slots = listarSlotsDosDias(COMIDAS, at('10:00'));
    expect(slots[0].comida.tipo).toBe('desayuno');
    expect(slots[4].comida.tipo).toBe('almuerzo');
    expect(slots[4].fecha).toBe('2026-04-16');
  });
});

describe('calcularComidaActual — comida forzada', () => {
  it('sin forzada → retorna natural con forzada=false', () => {
    const r = calcularComidaActual(COMIDAS, at('07:00'), null);
    expect(r.forzada).toBe(false);
    expect(r.comida.id).toBe('desayuno');
  });

  it('forzada mismo día, antes de su fin → retorna la forzada', () => {
    const forzada = {
      id: 'almuerzo',
      fecha: '2026-04-15',
      slotKey: '2026-04-15-almuerzo',
      inicio: '11:30',
      fin: '14:00',
    };
    const r = calcularComidaActual(COMIDAS, at('07:00'), forzada);
    expect(r.forzada).toBe(true);
    expect(r.comida.id).toBe('almuerzo');
  });

  it('forzada coincide con natural → limpia, retorna natural', () => {
    const forzada = {
      id: 'desayuno',
      fecha: '2026-04-15',
      slotKey: '2026-04-15-desayuno',
      inicio: '06:00',
      fin: '09:30',
    };
    const r = calcularComidaActual(COMIDAS, at('07:00'), forzada);
    expect(r.forzada).toBe(false);
    expect(r.comida.id).toBe('desayuno');
    expect(r.activa).toBe(true);
  });

  it('forzada expira cuando el reloj pasa su fin', () => {
    const forzada = {
      id: 'desayuno',
      fecha: '2026-04-15',
      slotKey: '2026-04-15-desayuno',
      inicio: '06:00',
      fin: '09:30',
    };
    const r = calcularComidaActual(COMIDAS, at('10:00'), forzada);
    expect(r.forzada).toBe(false);
    expect(r.comida.id).toBe('almuerzo');
  });

  it('forzada expira cuando cambia el día', () => {
    const forzada = {
      id: 'cena',
      fecha: '2026-04-14',
      slotKey: '2026-04-14-cena',
      inicio: '18:00',
      fin: '21:30',
    };
    const r = calcularComidaActual(COMIDAS, at('07:00'), forzada);
    expect(r.forzada).toBe(false);
  });

  it('forzada del día siguiente (tras skip de última comida durante su rango) → vigente', () => {
    const forzada = {
      id: 'desayuno',
      fecha: '2026-04-16',
      slotKey: '2026-04-16-desayuno',
      inicio: '06:00',
      fin: '09:30',
    };
    // 20:00 está dentro de la cena (18:00-21:30); tras el skip el usuario fuerza al desayuno de mañana.
    const r = calcularComidaActual(COMIDAS, at('20:00'), forzada);
    expect(r.forzada).toBe(true);
    expect(r.comida.id).toBe('desayuno');
  });

  it('si el id forzado ya no existe en comidas → cae a natural', () => {
    const forzada = {
      id: 'no-existe',
      fecha: '2026-04-15',
      slotKey: '2026-04-15-no-existe',
      inicio: '11:30',
      fin: '14:00',
    };
    const r = calcularComidaActual(COMIDAS, at('07:00'), forzada);
    expect(r.forzada).toBe(false);
    expect(r.comida.id).toBe('desayuno');
  });
});
