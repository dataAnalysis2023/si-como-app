const MAP_COMIDA = {
  desayuno: { verbo: 'desayunar', sustantivo: 'el desayuno' },
  almuerzo: { verbo: 'almorzar', sustantivo: 'el almuerzo' },
  cena: { verbo: 'cenar', sustantivo: 'la cena' },
  onces: { verbo: 'tomar onces', sustantivo: 'las onces' },
  merienda: { verbo: 'merendar', sustantivo: 'la merienda' },
};

function formasDe(nombreComida) {
  const key = (nombreComida || '').trim().toLowerCase();
  if (MAP_COMIDA[key]) return MAP_COMIDA[key];
  return {
    verbo: `tomar ${nombreComida.toLowerCase()}`,
    sustantivo: nombreComida.toLowerCase(),
  };
}

/**
 * Construye el mensaje de WhatsApp según tipo.
 * tipo: 'si' | 'no' | 'pedido'
 */
export function construirMensaje({ tipo, nombreUsuario, nombreComida, plato }) {
  const { verbo, sustantivo } = formasDe(nombreComida);
  const quien = nombreUsuario?.trim() || 'Alguien';

  if (tipo === 'si') {
    if (plato) return `${quien} va a ${verbo}. Se antoja: ${plato} 🍽`;
    return `${quien} va a ${verbo} hoy 🍽`;
  }
  if (tipo === 'no') {
    return `${quien} no va a ${verbo} hoy`;
  }
  if (tipo === 'pedido') {
    return `${quien} pide para ${sustantivo}: ${plato} 🍽`;
  }
  return '';
}
