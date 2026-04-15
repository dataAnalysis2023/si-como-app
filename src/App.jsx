import { useCallback, useMemo, useState } from 'react';
import {
  storage,
  COMIDAS_DEFAULT,
  PROTEINAS_DEFAULT,
  BEBIDAS_DEFAULT,
} from './utils/storage.js';
import { useComidaActual, listarSlotsDosDias } from './hooks/useComidaActual.js';
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

function siguienteComida(comidas, idActual) {
  if (!comidas || comidas.length === 0) return null;
  const idx = comidas.findIndex((c) => c.id === idActual);
  if (idx === -1) return comidas[0];
  return comidas[(idx + 1) % comidas.length];
}

function fechaISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function Home({ onAbrirConfig }) {
  const [comidas] = useState(() => storage.getComidas() || COMIDAS_DEFAULT);
  const [proteinas, setProteinas] = useState(
    () => storage.getProteinas() || PROTEINAS_DEFAULT
  );
  const [bebidas, setBebidas] = useState(() => storage.getBebidas() || BEBIDAS_DEFAULT);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [seleccionInicial, setSeleccionInicial] = useState(null);
  const [confirmandoSkip, setConfirmandoSkip] = useState(false);
  const [toast, setToast] = useState(null);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const { comida: comidaNatural, activa: activaNatural, slotKey: slotKeyNatural, forzada, recalcular } = useComidaActual(comidas);
  const { enviar, enviando, linkManual } = useWhatsApp();

  // Lista navegable hoy + mañana.
  const slots = useMemo(() => listarSlotsDosDias(comidas), [comidas]);

  // Navegación manual: cuando es null, seguimos el natural; cuando tiene valor, el usuario navegó.
  const [navegadoA, setNavegadoA] = useState(null);
  const [slotNaturalRef, setSlotNaturalRef] = useState(slotKeyNatural);

  // Si el reloj avanza y cambia el natural, se reinicia la navegación manual.
  if (slotKeyNatural !== slotNaturalRef) {
    setSlotNaturalRef(slotKeyNatural);
    setNavegadoA(null);
  }

  // Resolver la vista efectiva desde slots.
  const vistaSlotKey = navegadoA ?? slotKeyNatural;
  const vista = slots.find((s) => s.slotKey === vistaSlotKey) || null;
  const comida = vista?.comida || comidaNatural;
  const slotKey = vista?.slotKey || slotKeyNatural;
  const paraManana = vista ? !vista.esHoy : false;
  const activa = !navegadoA && activaNatural; // solo "Ahora" cuando seguimos natural y está activa

  const idxVista = slots.findIndex((s) => s.slotKey === vistaSlotKey);
  const puedeAtras = idxVista > 0;
  const puedeAdelante = idxVista >= 0 && idxVista < slots.length - 1;

  const irAtras = () => {
    if (puedeAtras) setNavegadoA(slots[idxVista - 1].slotKey);
  };
  const irAdelante = () => {
    if (puedeAdelante) setNavegadoA(slots[idxVista + 1].slotKey);
  };

  const [estadoVisual, setEstadoVisual] = useState(() => {
    const guardado = storage.getEstado();
    return guardado?.estado || 'neutro';
  });
  const [slotKeyRef, setSlotKeyRef] = useState(slotKey);

  if (slotKey !== slotKeyRef) {
    setSlotKeyRef(slotKey);
    const guardado = storage.getEstado();
    setEstadoVisual(guardado?.slotKey === slotKey ? guardado.estado : 'neutro');
  }

  const cfg = useMemo(() => storage.getConfig(), []);

  const mostrarToast = useCallback((mensaje, ms = 1800) => {
    setToast(mensaje);
    setTimeout(() => setToast(null), ms);
  }, []);

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

  const persistirHistorial = (tipo, payload) => {
    storage.appendHistorial({
      slotKey,
      timestamp: Date.now(),
      tipo,
      tipoComida: comida.tipo,
      nombreComida: comida.nombre,
      proteinas: payload?.proteinas || [],
      bebidas: payload?.bebidas || [],
      nota: payload?.nota || '',
    });
  };

  const confirmar = async ({ tipo, proteinas: p, bebidas: b, nota }) => {
    const entrada = {
      tipo,
      nombreComida: comida.nombre,
      tipoComida: comida.tipo,
      proteinas: p,
      bebidas: b,
      nota,
      paraManana,
    };
    try {
      await enviar(entrada);
      const nuevoEstado = tipo === 'no' ? 'no' : 'si';
      setEstadoVisual(nuevoEstado);
      storage.setEstado({ slotKey, estado: nuevoEstado });
      persistirHistorial(tipo, { proteinas: p, bebidas: b, nota });
      setModalAbierto(false);
      setErrorEnvio(null);
      mostrarToast('✓ Avisado');
    } catch (err) {
      setErrorEnvio({
        mensaje: err.message,
        ultimoIntento: entrada,
        linkManual: linkManual(entrada),
      });
      setModalAbierto(false);
    }
  };

  const agregarProteina = (nombre) => {
    setProteinas((prev) => {
      if (prev.some((p) => p.toLowerCase() === nombre.toLowerCase())) return prev;
      const nuevo = [...prev, nombre];
      storage.setProteinas(nuevo);
      return nuevo;
    });
  };

  const agregarBebida = (nombre) => {
    setBebidas((prev) => {
      if (prev.some((b) => b.toLowerCase() === nombre.toLowerCase())) return prev;
      const nuevo = [...prev, nombre];
      storage.setBebidas(nuevo);
      return nuevo;
    });
  };

  const confirmarSkip = async () => {
    const entrada = {
      tipo: 'no',
      nombreComida: comida.nombre,
      tipoComida: comida.tipo,
      proteinas: [],
      bebidas: [],
      nota: '',
      paraManana,
    };
    try {
      await enviar(entrada);
      storage.setEstado({ slotKey, estado: 'no' });
      persistirHistorial('no', {});

      const next = siguienteComida(comidas, comida.id);
      if (next) {
        const actualIdx = comidas.findIndex((c) => c.id === comida.id);
        const nextIdx = comidas.findIndex((c) => c.id === next.id);
        const fecha = nextIdx <= actualIdx
          ? fechaISO(new Date(Date.now() + 24 * 60 * 60 * 1000))
          : fechaISO(new Date());
        storage.setForzada({
          id: next.id,
          fecha,
          slotKey: `${fecha}-${next.id}`,
          inicio: next.inicio,
          fin: next.fin,
        });
      }

      setConfirmandoSkip(false);
      recalcular();
      setErrorEnvio(null);
      mostrarToast('✓ Saltada. Pasamos al siguiente turno.');
    } catch (err) {
      setConfirmandoSkip(false);
      setErrorEnvio({
        mensaje: err.message,
        ultimoIntento: entrada,
        linkManual: linkManual(entrada),
      });
    }
  };

  const reintentar = async () => {
    if (!errorEnvio?.ultimoIntento) return;
    const entrada = errorEnvio.ultimoIntento;
    try {
      await enviar(entrada);
      const nuevoEstado = entrada.tipo === 'no' ? 'no' : 'si';
      setEstadoVisual(nuevoEstado);
      storage.setEstado({ slotKey, estado: nuevoEstado });
      persistirHistorial(entrada.tipo, {
        proteinas: entrada.proteinas,
        bebidas: entrada.bebidas,
        nota: entrada.nota,
      });
      setErrorEnvio(null);
      mostrarToast('✓ Avisado');
    } catch (err) {
      setErrorEnvio({
        mensaje: err.message,
        ultimoIntento: entrada,
        linkManual: linkManual(entrada),
      });
    }
  };

  const proxima = siguienteComida(comidas, comidaNatural?.id);

  return (
    <div className="min-h-screen mantel-bg relative">
      <header className="flex items-start justify-between px-5 pt-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-tintaSuave">
            {paraManana
              ? 'Mañana'
              : forzada
                ? 'Siguiente'
                : navegadoA
                  ? 'Hoy'
                  : activa
                    ? 'Ahora'
                    : 'Próximo'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={irAtras}
              disabled={!puedeAtras}
              aria-label="Comida anterior"
              className="text-tintaSuave hover:text-tinta disabled:opacity-30 disabled:cursor-not-allowed text-xl px-1"
            >
              ←
            </button>
            <h1 className="text-3xl font-medium text-tinta">{comida.nombre}</h1>
            <button
              type="button"
              onClick={irAdelante}
              disabled={!puedeAdelante}
              aria-label="Comida siguiente"
              className="text-tintaSuave hover:text-tinta disabled:opacity-30 disabled:cursor-not-allowed text-xl px-1"
            >
              →
            </button>
          </div>
          <p className="text-sm text-tintaSuave mt-1">
            {comida.inicio} – {comida.fin}
            {!paraManana && !activa && !forzada && !navegadoA && ' (fuera de horario)'}
          </p>
          {!forzada && !paraManana && !navegadoA && (
            <button
              type="button"
              onClick={() => setConfirmandoSkip(true)}
              disabled={enviando}
              className="mt-2 text-xs text-terracota hover:text-terracotaDark underline disabled:opacity-40"
            >
              ⏭ Saltar esta comida
            </button>
          )}
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
          onClick={() => {
            const historial = storage.getHistorial();
            const ultimo = [...historial].reverse().find((h) => h.slotKey === slotKey && h.tipo === 'si');
            setSeleccionInicial(
              estadoVisual === 'si' && ultimo
                ? { proteinas: ultimo.proteinas || [], bebidas: ultimo.bebidas || [], nota: ultimo.nota || '' }
                : null
            );
            setModalAbierto(true);
          }}
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
            onClick={() => {
              const historial = storage.getHistorial();
              const ultimo = [...historial].reverse().find((h) => h.slotKey === slotKey && h.tipo === 'si');
              setSeleccionInicial(
                estadoVisual === 'si' && ultimo
                  ? { proteinas: ultimo.proteinas || [], bebidas: ultimo.bebidas || [], nota: ultimo.nota || '' }
                  : null
              );
              setModalAbierto(true);
            }}
            className="mt-3 text-xs underline text-terracota"
          >
            Cambiar aviso
          </button>
        )}
      </main>

      <ModalDecision
        abierto={modalAbierto}
        nombreComida={comida.nombre}
        proteinas={proteinas}
        bebidas={bebidas}
        activa={activa}
        enviando={enviando}
        seleccionInicial={seleccionInicial}
        onConfirmar={confirmar}
        onAgregarProteina={agregarProteina}
        onAgregarBebida={agregarBebida}
        onAbrirConfig={() => {
          setModalAbierto(false);
          onAbrirConfig();
        }}
        onCerrar={() => setModalAbierto(false)}
      />

      {confirmandoSkip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade">
          <div
            className="absolute inset-0 bg-tinta/40 backdrop-blur-sm"
            onClick={enviando ? undefined : () => setConfirmandoSkip(false)}
          />
          <div className="relative w-full max-w-sm bg-crema rounded-2xl p-6 shadow-plato">
            <h3 className="text-lg font-medium text-tinta mb-2">
              Saltar {comidaNatural?.nombre.toLowerCase() || 'esta comida'}
            </h3>
            <p className="text-sm text-tintaSuave mb-5">
              Se enviará aviso de que no participas
              {proxima && proxima.id !== comidaNatural?.id ? ` y pasarás a ${proxima.nombre}` : ''}.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={confirmarSkip}
                disabled={enviando}
                className="w-full py-3 rounded-xl bg-terracota text-crema font-medium disabled:opacity-40 hover:bg-terracotaDark transition-colors"
              >
                {enviando ? 'Enviando…' : 'Sí, saltar'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoSkip(false)}
                disabled={enviando}
                className="w-full py-2 rounded-xl text-tintaSuave hover:text-tinta"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {errorEnvio && (
        <div className="fixed inset-x-4 bottom-6 z-50 animate-fade">
          <div className="bg-alerta/95 text-crema rounded-2xl shadow-plato p-4 max-w-md mx-auto">
            <p className="text-sm font-medium mb-1">⚠ No pudimos confirmar el envío</p>
            <p className="text-xs opacity-90 mb-3">{errorEnvio.mensaje}</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={reintentar}
                disabled={enviando}
                className="w-full py-2 rounded-xl bg-crema text-alerta text-sm font-medium disabled:opacity-50"
              >
                {enviando ? 'Reintentando…' : 'Reintentar'}
              </button>
              {errorEnvio.linkManual && (
                <a
                  href={errorEnvio.linkManual}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setErrorEnvio(null)}
                  className="w-full py-2 rounded-xl bg-tinta/80 text-crema text-sm text-center"
                >
                  Abrir WhatsApp manual
                </a>
              )}
              <button
                type="button"
                onClick={() => setErrorEnvio(null)}
                className="w-full py-1 text-xs opacity-80 underline"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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
