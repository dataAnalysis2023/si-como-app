const VERBOS = {
  desayuno: 'desayunar',
  almuerzo: 'almorzar',
  cena: 'cenar',
};

function verboDe(tipo) {
  return VERBOS[tipo] || 'comer';
}

function limpiar(items) {
  return (items || []).map((s) => String(s).trim()).filter(Boolean);
}

// "pollo" / "pollo y huevos" / "pollo, huevos y carne"
function listar(items) {
  const limpios = limpiar(items);
  if (limpios.length === 0) return '';
  if (limpios.length === 1) return limpios[0].toLowerCase();
  const lc = limpios.map((s) => s.toLowerCase());
  if (lc.length === 2) return `${lc[0]} y ${lc[1]}`;
  return `${lc.slice(0, -1).join(', ')} y ${lc[lc.length - 1]}`;
}

function antojo(proteinas) {
  const limpios = limpiar(proteinas);
  if (limpios.length === 0) return '';
  const verbo = limpios.length === 1 ? 'antoja' : 'antojan';
  return `Se me ${verbo} ${listar(limpios)}`;
}

function bebida(bebidas) {
  const lista = listar(bebidas);
  if (!lista) return '';
  return `de tomar ${lista}`;
}

/**
 * Mensaje cálido, pensado para dos personas que comparten la comida.
 * tipo: 'si' | 'no'
 * proteinas, bebidas: string[] (multi-selección)
 * nota: string libre opcional
 * paraManana: si true, el mensaje se refiere a la comida del día siguiente
 */
export function construirMensaje({
  tipo,
  nombreUsuario,
  nombreComida,
  tipoComida,
  proteinas = [],
  bebidas = [],
  nota = '',
  paraManana = false,
}) {
  const quien = nombreUsuario?.trim() || 'Alguien';
  const verbo = verboDe(tipoComida);
  const etiquetaLibre =
    nombreComida && nombreComida.toLowerCase() !== tipoComida
      ? ` (${nombreComida})`
      : '';
  const notaLimpia = nota?.trim();
  const cuando = paraManana ? 'mañana' : 'hoy';

  if (tipo === 'si') {
    const apertura = paraManana
      ? `${quien}: mañana ¡sí! voy a ${verbo}${etiquetaLibre}`
      : `${quien}: ¡sí! voy a ${verbo}${etiquetaLibre}`;
    const partes = [];
    const a = antojo(proteinas);
    const b = bebida(bebidas);
    if (a && b) partes.push(`${a} y ${b} 🍽`);
    else if (a) partes.push(`${a} 🍽`);
    else if (b) partes.push(`Con ganas ${b} 🥤`);
    if (notaLimpia) partes.push(notaLimpia);

    if (partes.length === 0) return `${apertura} ${cuando} 🍽`;
    return `${apertura}. ${partes.join('. ')}`;
  }

  if (tipo === 'no') {
    const articulo =
      tipoComida === 'cena' ? 'la cena' : tipoComida === 'almuerzo' ? 'el almuerzo' : 'el desayuno';
    const base = `${quien}: ${cuando} no cuento para ${articulo}${etiquetaLibre} 😔`;
    if (notaLimpia) return `${base}. ${notaLimpia}`;
    return base;
  }

  return '';
}
