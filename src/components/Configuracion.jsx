import { useState } from 'react';
import { storage, COMIDAS_DEFAULT, MENU_DEFAULT } from '../utils/storage.js';

/**
 * Pantalla de configuración. Usada tanto en el onboarding inicial
 * como editando desde la pantalla principal.
 */
export default function Configuracion({ onGuardar, onCancelar, inicial = false }) {
  const cfgGuardada = storage.getConfig() || {};
  const [nombreUsuario, setNombreUsuario] = useState(cfgGuardada.nombreUsuario || '');
  const [numeroCocinero, setNumeroCocinero] = useState(cfgGuardada.numeroCocinero || '');
  const [apiKey, setApiKey] = useState(cfgGuardada.apiKey || '');

  const [comidas, setComidas] = useState(() => storage.getComidas() || COMIDAS_DEFAULT);
  const [menu, setMenu] = useState(() => storage.getMenu() || MENU_DEFAULT);

  const [error, setError] = useState(null);

  const actualizarComida = (idx, campo, valor) => {
    setComidas((prev) => prev.map((c, i) => (i === idx ? { ...c, [campo]: valor } : c)));
  };

  const agregarComida = () => {
    const id = `comida-${Date.now()}`;
    setComidas((prev) => [...prev, { id, nombre: 'Nueva comida', inicio: '12:00', fin: '13:00' }]);
  };

  const eliminarComida = (idx) => {
    setComidas((prev) => prev.filter((_, i) => i !== idx));
  };

  const actualizarPlato = (idx, valor) => {
    setMenu((prev) => prev.map((p, i) => (i === idx ? valor : p)));
  };

  const agregarPlato = () => setMenu((prev) => [...prev, '']);
  const eliminarPlato = (idx) => setMenu((prev) => prev.filter((_, i) => i !== idx));

  const guardar = () => {
    setError(null);

    if (!nombreUsuario.trim()) return setError('Falta tu nombre.');
    if (!numeroCocinero.trim() || !/^\+?\d{7,15}$/.test(numeroCocinero.replace(/\s/g, '')))
      return setError('Número de cocinero inválido. Incluye código de país (ej: +573001234567).');
    if (!apiKey.trim()) return setError('Falta el API key de CallMeBot.');
    if (comidas.length < 2) return setError('Configura al menos 2 comidas.');

    for (const [i, c] of comidas.entries()) {
      if (!c.nombre.trim()) return setError(`La comida #${i + 1} no tiene nombre.`);
      if (!/^\d{2}:\d{2}$/.test(c.inicio) || !/^\d{2}:\d{2}$/.test(c.fin))
        return setError(`La comida "${c.nombre}" tiene horario inválido.`);
    }

    const menuLimpio = menu.map((p) => p.trim()).filter(Boolean);

    storage.setConfig({ nombreUsuario: nombreUsuario.trim(), numeroCocinero: numeroCocinero.trim(), apiKey: apiKey.trim() });
    storage.setComidas(comidas);
    storage.setMenu(menuLimpio);
    onGuardar();
  };

  return (
    <div className="min-h-screen mantel-bg px-5 py-8 pb-24">
      <div className="max-w-md mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-medium text-tinta">
            {inicial ? 'Bienvenido a ¡SÍ Como!' : 'Configuración'}
          </h1>
          <p className="text-tintaSuave text-sm mt-1">
            {inicial
              ? 'Cuéntame quién eres y cuándo comes.'
              : 'Ajusta tu perfil, comidas y menú recurrente.'}
          </p>
        </header>

        <Seccion titulo="Tu perfil">
          <Campo label="Tu nombre">
            <input
              className="campo"
              placeholder="Ej: Juan"
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
            />
          </Campo>
          <Campo label="WhatsApp del cocinero (con código país)">
            <input
              className="campo"
              placeholder="+573001234567"
              value={numeroCocinero}
              onChange={(e) => setNumeroCocinero(e.target.value)}
              inputMode="tel"
            />
          </Campo>
          <Campo label="API key de CallMeBot">
            <input
              className="campo"
              placeholder="123456"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-tintaSuave mt-1">
              El cocinero debe escribir "I allow callmebot to send me messages" al
              número +34 644 51 95 23 desde su WhatsApp una sola vez para recibir su API key.
            </p>
          </Campo>
        </Seccion>

        <Seccion titulo="Comidas">
          <div className="flex flex-col gap-3">
            {comidas.map((c, idx) => (
              <div key={c.id} className="bg-crema rounded-xl p-3 border border-platoBorde">
                <div className="flex items-center gap-2">
                  <input
                    className="campo flex-1"
                    value={c.nombre}
                    onChange={(e) => actualizarComida(idx, 'nombre', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => eliminarComida(idx)}
                    className="text-alerta text-sm px-2"
                    aria-label="Eliminar comida"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <label className="text-xs text-tintaSuave">
                    Inicio
                    <input
                      type="time"
                      className="campo mt-1"
                      value={c.inicio}
                      onChange={(e) => actualizarComida(idx, 'inicio', e.target.value)}
                    />
                  </label>
                  <label className="text-xs text-tintaSuave">
                    Fin
                    <input
                      type="time"
                      className="campo mt-1"
                      value={c.fin}
                      onChange={(e) => actualizarComida(idx, 'fin', e.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}
            <button type="button" onClick={agregarComida} className="btn-secundario">
              + Agregar comida
            </button>
          </div>
        </Seccion>

        <Seccion titulo="Menú recurrente">
          <div className="flex flex-col gap-2">
            {menu.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  className="campo flex-1"
                  value={p}
                  placeholder="Nombre del plato"
                  onChange={(e) => actualizarPlato(idx, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => eliminarPlato(idx)}
                  className="text-alerta text-sm px-2"
                  aria-label="Eliminar plato"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" onClick={agregarPlato} className="btn-secundario">
              + Agregar plato
            </button>
          </div>
        </Seccion>

        {error && (
          <div className="bg-alerta/10 border border-alerta/40 text-alerta rounded-xl px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4">
          <button type="button" onClick={guardar} className="btn-principal">
            Guardar
          </button>
          {!inicial && (
            <button type="button" onClick={onCancelar} className="btn-secundario">
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Estilos de clases helper */}
      <style>{`
        .campo {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #D9C3A1;
          background: #FAF4EA;
          color: #3B2A1E;
          font-size: 15px;
          outline: none;
        }
        .campo:focus { border-color: #C46B4A; box-shadow: 0 0 0 3px rgba(196,107,74,0.18); }
        .btn-principal {
          padding: 12px 16px;
          border-radius: 12px;
          background: #C46B4A;
          color: #FAF4EA;
          font-weight: 500;
          border: none;
        }
        .btn-principal:hover { background: #A85337; }
        .btn-secundario {
          padding: 10px 16px;
          border-radius: 12px;
          background: transparent;
          color: #6B5744;
          border: 1px dashed #D9C3A1;
        }
        .btn-secundario:hover { color: #3B2A1E; border-color: #C46B4A; }
      `}</style>
    </div>
  );
}

function Seccion({ titulo, children }) {
  return (
    <section className="mb-6">
      <h2 className="text-sm uppercase tracking-wider text-tintaSuave mb-3">{titulo}</h2>
      {children}
    </section>
  );
}

function Campo({ label, children }) {
  return (
    <label className="block mb-3 text-xs text-tintaSuave">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
