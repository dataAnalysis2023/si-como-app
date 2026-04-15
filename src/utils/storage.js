const KEYS = {
  comidas: 'sicomo.comidas',
  menu: 'sicomo.menuRecurrente',
  config: 'sicomo.config',
  estado: 'sicomo.estadoActual',
};

export const COMIDAS_DEFAULT = [
  { id: 'desayuno', nombre: 'Desayuno', inicio: '06:00', fin: '09:30' },
  { id: 'almuerzo', nombre: 'Almuerzo', inicio: '11:30', fin: '14:00' },
  { id: 'cena', nombre: 'Cena', inicio: '18:00', fin: '21:30' },
];

export const MENU_DEFAULT = ['Arroz con pollo', 'Lentejas', 'Sopa', 'Huevos revueltos'];

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

export const storage = {
  getComidas: () => read(KEYS.comidas, null),
  setComidas: (v) => write(KEYS.comidas, v),

  getMenu: () => read(KEYS.menu, null),
  setMenu: (v) => write(KEYS.menu, v),

  getConfig: () => read(KEYS.config, null),
  setConfig: (v) => write(KEYS.config, v),

  getEstado: () => read(KEYS.estado, null),
  setEstado: (v) => write(KEYS.estado, v),
  clearEstado: () => localStorage.removeItem(KEYS.estado),

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
