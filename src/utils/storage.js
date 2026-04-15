const KEYS = {
  comidas: 'sicomo.comidas',
  proteinas: 'sicomo.proteinas',
  bebidas: 'sicomo.bebidas',
  config: 'sicomo.config',
  estado: 'sicomo.estadoActual',
  forzada: 'sicomo.comidaForzada',
  historial: 'sicomo.historial',
  // Legacy — se deja leerlo para migración silenciosa, no se escribe más
  menuLegacy: 'sicomo.menuRecurrente',
};

export const TIPOS = ['desayuno', 'almuerzo', 'cena'];

export const COMIDAS_DEFAULT = [
  { id: 'desayuno', nombre: 'Desayuno', tipo: 'desayuno', inicio: '06:00', fin: '09:30' },
  { id: 'almuerzo', nombre: 'Almuerzo', tipo: 'almuerzo', inicio: '11:30', fin: '14:00' },
  { id: 'cena', nombre: 'Cena', tipo: 'cena', inicio: '18:00', fin: '21:30' },
];

export const PROTEINAS_DEFAULT = [
  'Huevos',
  'Pollo',
  'Carne de res',
  'Pescado',
  'Cerdo',
];

export const BEBIDAS_DEFAULT = [
  'Té',
  'Jugo de fruta',
  'Jugo de flor de Jamaica',
];

const HISTORIAL_MAX = 2000; // ~1.5 años de 4 avisos/día

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignorar fallo de cuota o modo privado */
  }
}

// Migración lazy: comida v1 (sin tipo) → v2.
function migrarComida(c) {
  if (c && typeof c === 'object' && TIPOS.includes(c.tipo)) return c;
  const mapa = {
    desayuno: 'desayuno',
    almuerzo: 'almuerzo',
    cena: 'cena',
    onces: 'cena',
    merienda: 'almuerzo',
  };
  const tipo = mapa[c?.id] || 'almuerzo';
  return { ...c, tipo };
}

// Normaliza cualquier forma previa de lista de strings o {nombre}.
function normalizarNombres(lista) {
  if (!Array.isArray(lista)) return null;
  const vistos = new Set();
  const out = [];
  for (const item of lista) {
    const nombre = typeof item === 'string' ? item : item?.nombre;
    if (!nombre) continue;
    const t = nombre.trim();
    const key = t.toLowerCase();
    if (!t || vistos.has(key)) continue;
    vistos.add(key);
    out.push(t);
  }
  return out;
}

export const storage = {
  getComidas: () => {
    const raw = read(KEYS.comidas, null);
    if (!Array.isArray(raw)) return null;
    return raw.map(migrarComida);
  },
  setComidas: (v) => write(KEYS.comidas, v),

  getProteinas: () => normalizarNombres(read(KEYS.proteinas, null)),
  setProteinas: (v) => write(KEYS.proteinas, v),

  getBebidas: () => normalizarNombres(read(KEYS.bebidas, null)),
  setBebidas: (v) => write(KEYS.bebidas, v),

  getConfig: () => read(KEYS.config, null),
  setConfig: (v) => write(KEYS.config, v),

  getEstado: () => read(KEYS.estado, null),
  setEstado: (v) => write(KEYS.estado, v),
  clearEstado: () => localStorage.removeItem(KEYS.estado),

  getForzada: () => read(KEYS.forzada, null),
  setForzada: (v) => write(KEYS.forzada, v),
  clearForzada: () => localStorage.removeItem(KEYS.forzada),

  // Historial de SELECCIONES (no confirmaciones de consumo).
  // Cada entrada: { slotKey, timestamp, tipo, tipoComida, nombreComida, proteinas, bebidas, nota }
  getHistorial: () => {
    const raw = read(KEYS.historial, []);
    return Array.isArray(raw) ? raw : [];
  },
  appendHistorial: (entry) => {
    const actual = storage.getHistorial();
    const nuevo = [...actual, entry].slice(-HISTORIAL_MAX);
    write(KEYS.historial, nuevo);
  },

  configurado() {
    const cfg = this.getConfig();
    const comidas = this.getComidas();
    return Boolean(
      cfg?.nombreUsuario?.trim() &&
        cfg?.numeroCocinero?.trim() &&
        cfg?.apiKey?.trim() &&
        Array.isArray(comidas) &&
        comidas.length >= 2
    );
  },
};
