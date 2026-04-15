import { describe, expect, it } from 'vitest';
import { construirMensaje } from './mensajes.js';

const base = { nombreUsuario: 'Juan', nombreComida: 'Desayuno', tipoComida: 'desayuno' };

describe('construirMensaje — ruta SÍ', () => {
  it('sin proteínas ni bebidas ni nota → solo intención', () => {
    const m = construirMensaje({ ...base, tipo: 'si' });
    expect(m).toBe('Juan: ¡sí! voy a desayunar hoy 🍽');
  });

  it('una proteína → usa antojar en singular', () => {
    const m = construirMensaje({
      ...base,
      tipoComida: 'almuerzo',
      nombreComida: 'Almuerzo',
      tipo: 'si',
      proteinas: ['Pollo'],
    });
    expect(m).toBe('Juan: ¡sí! voy a almorzar. Se me antoja pollo 🍽');
  });

  it('dos proteínas → antojan en plural con "y"', () => {
    const m = construirMensaje({
      ...base,
      tipoComida: 'almuerzo',
      nombreComida: 'Almuerzo',
      tipo: 'si',
      proteinas: ['Pollo', 'Huevos'],
    });
    expect(m).toContain('Se me antojan pollo y huevos');
  });

  it('tres proteínas → comas + "y" en el último', () => {
    const m = construirMensaje({
      ...base,
      tipoComida: 'almuerzo',
      nombreComida: 'Almuerzo',
      tipo: 'si',
      proteinas: ['Pollo', 'Huevos', 'Carne de res'],
    });
    expect(m).toContain('pollo, huevos y carne de res');
  });

  it('solo bebidas → "Con ganas de tomar X"', () => {
    const m = construirMensaje({
      ...base,
      tipo: 'si',
      bebidas: ['Té'],
    });
    expect(m).toContain('Con ganas de tomar té');
    expect(m).toContain('🥤');
  });

  it('proteínas + bebidas → frase combinada', () => {
    const m = construirMensaje({
      ...base,
      tipoComida: 'cena',
      nombreComida: 'Cena',
      tipo: 'si',
      proteinas: ['Pescado'],
      bebidas: ['Jugo de flor de Jamaica'],
    });
    expect(m).toBe('Juan: ¡sí! voy a cenar. Se me antoja pescado y de tomar jugo de flor de jamaica 🍽');
  });

  it('agrega la nota al final', () => {
    const m = construirMensaje({
      ...base,
      tipo: 'si',
      proteinas: ['Huevos'],
      nota: 'Que sean revueltos',
    });
    expect(m).toContain('Que sean revueltos');
    expect(m.endsWith('Que sean revueltos')).toBe(true);
  });

  it('nombre libre distinto al tipo → lo incluye entre paréntesis', () => {
    const m = construirMensaje({
      nombreUsuario: 'Juan',
      nombreComida: 'Onces de Doña Rosa',
      tipoComida: 'cena',
      tipo: 'si',
    });
    expect(m).toContain('(Onces de Doña Rosa)');
    expect(m).toContain('voy a cenar');
  });

  it('fallback de nombre si no viene nombreUsuario', () => {
    const m = construirMensaje({ ...base, nombreUsuario: '', tipo: 'si' });
    expect(m.startsWith('Alguien:')).toBe(true);
  });
});

describe('construirMensaje — ruta NO', () => {
  it('genera frase con "hoy no cuento para"', () => {
    const m = construirMensaje({ ...base, tipoComida: 'almuerzo', nombreComida: 'Almuerzo', tipo: 'no' });
    expect(m).toBe('Juan: hoy no cuento para el almuerzo 😔');
  });

  it('concuerda género con "la cena"', () => {
    const m = construirMensaje({ ...base, tipoComida: 'cena', nombreComida: 'Cena', tipo: 'no' });
    expect(m).toContain('para la cena');
  });

  it('incluye la nota si existe', () => {
    const m = construirMensaje({ ...base, tipo: 'no', nota: 'Reunión de trabajo' });
    expect(m).toContain('Reunión de trabajo');
  });

  it('ignora proteínas y bebidas aunque vengan en el payload', () => {
    const m = construirMensaje({
      ...base,
      tipo: 'no',
      proteinas: ['Pollo'],
      bebidas: ['Té'],
    });
    expect(m).not.toContain('pollo');
    expect(m).not.toContain('té');
  });
});

describe('construirMensaje — paraManana', () => {
  it('SI sin detalles → prefija con "mañana"', () => {
    const m = construirMensaje({ ...base, tipo: 'si', paraManana: true });
    expect(m).toBe('Juan: mañana ¡sí! voy a desayunar mañana 🍽');
  });

  it('SI con proteínas → mantiene detalle y usa "mañana" en el apertura', () => {
    const m = construirMensaje({
      ...base,
      tipoComida: 'almuerzo',
      nombreComida: 'Almuerzo',
      tipo: 'si',
      proteinas: ['Pollo'],
      paraManana: true,
    });
    expect(m).toBe('Juan: mañana ¡sí! voy a almorzar. Se me antoja pollo 🍽');
  });

  it('NO → "mañana no cuento para X"', () => {
    const m = construirMensaje({
      ...base,
      tipoComida: 'cena',
      nombreComida: 'Cena',
      tipo: 'no',
      paraManana: true,
    });
    expect(m).toBe('Juan: mañana no cuento para la cena 😔');
  });

  it('paraManana=false por defecto → sigue diciendo "hoy"', () => {
    const m = construirMensaje({ ...base, tipo: 'si' });
    expect(m).toContain('hoy');
    expect(m).not.toContain('mañana');
  });
});

describe('construirMensaje — robustez', () => {
  it('tipo inválido → string vacío', () => {
    expect(construirMensaje({ ...base, tipo: 'pedido' })).toBe('');
  });

  it('items con espacios se recortan antes de listar', () => {
    const m = construirMensaje({
      ...base,
      tipo: 'si',
      proteinas: ['  Pollo  ', ' Huevos '],
    });
    expect(m).toContain('pollo y huevos');
  });

  it('items vacíos se filtran', () => {
    const m = construirMensaje({
      ...base,
      tipo: 'si',
      proteinas: ['Pollo', '', '  '],
    });
    expect(m).toContain('Se me antoja pollo');
    expect(m).not.toContain(' y ');
  });
});
