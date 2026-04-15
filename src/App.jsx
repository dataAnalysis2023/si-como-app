import { useEffect, useMemo, useState } from 'react';
import { storage, COMIDAS_DEFAULT, MENU_DEFAULT } from './utils/storage.js';
import { useComidaActual } from './hooks/useComidaActual.js';
import { useWhatsApp } from './hooks/useWhatsApp.js';
import PlatoInteractivo from './components/PlatoInteractivo.jsx';
import ModalDecision from './components/ModalDecision.jsx';
import Configuracion from './components/Configuracion.jsx';

export default function App() {
  const [configurado, setConfigurado] = useState(() => storage.configurado());
  const [editandoConfig, setEditandoConfig] = useState(false);

  if (!configurado) {
    return (
      <Configuracion
        inicial
        onGuardar={() => setConfigurado(true)}
        onCancelar={() => {}}
      />
    );
  }

  if (editandoConfig) {
    return (
      <Configuracion
        onGuardar={() => setEditandoConfig(false)}
        onCancelar={() => setEditandoConfig(false)}
      />
    );
  }

  return <Home onAbrirConfig={() => setEditandoConfig(true)} />;
}

function Home({ onAbrirConfig }) {
  const [comidas] = useState(() => storage.getComidas() || COMIDAS_DEFAULT);
  const [menu] = useState(() => storage.getMenu() || MENU_DEFAULT);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [toast, setToast] = useState(null);
  const { comida, activa, slotKey } = useComidaActual(comidas);
  const { enviar, enviando } = useWhatsApp();

  const [estadoVisual, setEstadoVisual] = useState(() => {
    const guardado = storage.getEstado();
    return guardado?.estado || 'neutro';
  });

  useEffect(() => {
    const guardado = storage.getEstado();
    if (!guardado || guardado.slotKey !== slotKey) {
      setEstadoVisual('neutro');
    } else {
      setEstadoVisual(guardado.estado);
    }
  }, [slotKey]);

  const cfg = useMemo(() => storage.getConfig(), []);

  if (!comida) {
    return (
      <div className="min-h-screen mantel-bg flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-tinta mb-4">No hay comidas configuradas.</p>
          <button onClick={onAbrirConfig} className="underline text-terracota">
            Abrir configuración
          </button>
        </div>
      </div>
    );
  }

  const confirmar = async ({ tipo, plato }) => {
    try {
      await enviar({ tipo, nombreComida: comida.nombre, plato });
      const nuevoEstado = tipo === 'no' ? 'no' : 'si';
      setEstadoVisual(nuevoEstado);
      storage.setEstado({ slotKey, estado: nuevoEstado });
      setModalAbierto(false);
      setToast('✓ Avisado');
      setTimeout(() => setToast(null), 1800);
    } catch (err) {
      setToast(`⚠ ${err.message}`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="min-h-screen mantel-bg relative">
      <header className="flex items-center justify-between px-5 pt-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-tintaSuave">
            {activa ? 'Ahora' : 'Próximo'}
          </p>
          <h1 className="text-3xl font-medium text-tinta mt-1">{comida.nombre}</h1>
          <p className="text-sm text-tintaSuave mt-1">
            {comida.inicio} – {comida.fin}
            {!activa && ' (fuera de horario)'}
          </p>
        </div>
        <button
          onClick={onAbrirConfig}
          aria-label="Configuración"
          className="text-tintaSuave hover:text-tinta p-2 rounded-full hover:bg-mantelDark/50 transition"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      <main className="flex flex-col items-center justify-center pt-10 pb-32 px-6">
        <PlatoInteractivo
          estado={estadoVisual}
          proxima={!activa}
          onClick={() => setModalAbierto(true)}
        />
        <p className="mt-8 text-center text-tintaSuave text-sm max-w-xs">
          {estadoVisual === 'neutro'
            ? 'Toca el plato para avisar qué pasa con esta comida.'
            : estadoVisual === 'si'
              ? `Avisaste que sí. ${cfg?.nombreUsuario || ''} 🍽`
              : 'Avisaste que no vas.'}
        </p>
        {estadoVisual !== 'neutro' && (
          <button
            onClick={() => setModalAbierto(true)}
            className="mt-3 text-xs underline text-terracota"
          >
            Cambiar aviso
          </button>
        )}
      </main>

      <ModalDecision
        abierto={modalAbierto}
        nombreComida={comida.nombre}
        platos={menu}
        activa={activa}
        enviando={enviando}
        onConfirmar={confirmar}
        onCerrar={() => setModalAbierto(false)}
      />

      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-toast">
          <div className="bg-tinta text-crema px-5 py-3 rounded-full shadow-plato text-sm">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
