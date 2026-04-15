import { useState } from 'react';

/**
 * Bottom sheet — dos rutas:
 *   si → proteínas (multi) + bebidas (multi) + nota opcional, todo opcional
 *   no → un toque
 *
 * seleccionInicial: precarga selecciones previas cuando se reabre el modal
 * tras haber avisado (pre-edición del aviso).
 */
export default function ModalDecision({
  abierto,
  nombreComida,
  proteinas,
  bebidas,
  activa,
  seleccionInicial,
  onConfirmar,
  onAgregarProteina,
  onAgregarBebida,
  onAbrirConfig,
  onCerrar,
  enviando,
}) {
  const tieneSeleccion = (s) =>
    Boolean(s && (s.proteinas?.length || s.bebidas?.length || s.nota));

  const [ruta, setRuta] = useState(() => (tieneSeleccion(seleccionInicial) ? 'si' : null));
  const [protSel, setProtSel] = useState(() => seleccionInicial?.proteinas || []);
  const [bebSel, setBebSel] = useState(() => seleccionInicial?.bebidas || []);
  const [nota, setNota] = useState(() => seleccionInicial?.nota || '');
  const [nuevaProt, setNuevaProt] = useState('');
  const [nuevaBeb, setNuevaBeb] = useState('');

  // Sincronizar selecciones iniciales cuando cambian entre aperturas — patrón setState durante render.
  const [seleccionRef, setSeleccionRef] = useState(seleccionInicial);
  if (abierto && seleccionInicial !== seleccionRef) {
    setSeleccionRef(seleccionInicial);
    setProtSel(seleccionInicial?.proteinas || []);
    setBebSel(seleccionInicial?.bebidas || []);
    setNota(seleccionInicial?.nota || '');
    if (tieneSeleccion(seleccionInicial)) setRuta('si');
  }

  if (!abierto) return null;

  const titulo = activa
    ? `¿Qué pasa con este ${nombreComida?.toLowerCase() || 'momento'}?`
    : `¿Qué pasa con el próximo ${nombreComida?.toLowerCase() || 'momento'}?`;

  const cerrar = () => {
    setRuta(null);
    setProtSel([]);
    setBebSel([]);
    setNota('');
    setNuevaProt('');
    setNuevaBeb('');
    onCerrar();
  };

  const toggle = (lista, setLista, valor) => {
    setLista(lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor]);
  };

  const agregarProt = () => {
    const n = nuevaProt.trim();
    if (!n) return;
    if (!proteinas.some((p) => p.toLowerCase() === n.toLowerCase())) {
      onAgregarProteina(n);
    }
    if (!protSel.some((p) => p.toLowerCase() === n.toLowerCase())) {
      setProtSel([...protSel, n]);
    }
    setNuevaProt('');
  };

  const agregarBeb = () => {
    const n = nuevaBeb.trim();
    if (!n) return;
    if (!bebidas.some((b) => b.toLowerCase() === n.toLowerCase())) {
      onAgregarBebida(n);
    }
    if (!bebSel.some((b) => b.toLowerCase() === n.toLowerCase())) {
      setBebSel([...bebSel, n]);
    }
    setNuevaBeb('');
  };

  const confirmarSi = () => {
    onConfirmar({
      tipo: 'si',
      proteinas: protSel,
      bebidas: bebSel,
      nota: nota.trim(),
    });
  };

  const confirmarNo = () => {
    onConfirmar({ tipo: 'no', proteinas: [], bebidas: [], nota: '' });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center animate-fade">
      <div
        className="absolute inset-0 bg-tinta/40 backdrop-blur-sm"
        onClick={enviando ? undefined : cerrar}
      />
      <div className="relative w-full max-w-md bg-crema rounded-t-3xl shadow-[0_-10px_40px_rgba(59,42,30,0.25)] p-6 pb-8 animate-sheet max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-mantelDark rounded-full mx-auto mb-4" />

        <h2 className="text-xl font-medium text-tinta text-center mb-5">{titulo}</h2>

        {ruta === null && (
          <div className="flex flex-col gap-3">
            <BotonOpcion
              icono="✓"
              texto="Voy a estar"
              sub="Confirmo que voy"
              color="exito"
              onClick={() => setRuta('si')}
            />
            <BotonOpcion
              icono="✗"
              texto="No voy a estar"
              sub="Hoy no cuento"
              color="alerta"
              onClick={confirmarNo}
              disabled={enviando}
            />
          </div>
        )}

        {ruta === 'si' && (
          <div className="flex flex-col gap-5">
            <Bloque titulo="Proteína (opcional, multi)">
              <Chips
                items={proteinas}
                seleccion={protSel}
                onToggle={(v) => toggle(protSel, setProtSel, v)}
                vacio="Aún no tienes proteínas guardadas."
                onAbrirConfig={onAbrirConfig}
              />
              <AgregarInline
                placeholder="Nueva proteína"
                valor={nuevaProt}
                onChange={setNuevaProt}
                onAgregar={agregarProt}
                disabled={enviando}
              />
            </Bloque>

            <Bloque titulo="Bebida (opcional, multi)">
              <Chips
                items={bebidas}
                seleccion={bebSel}
                onToggle={(v) => toggle(bebSel, setBebSel, v)}
                vacio="Aún no tienes bebidas guardadas."
                onAbrirConfig={onAbrirConfig}
              />
              <AgregarInline
                placeholder="Nueva bebida"
                valor={nuevaBeb}
                onChange={setNuevaBeb}
                onAgregar={agregarBeb}
                disabled={enviando}
              />
            </Bloque>

            <Bloque titulo="Nota (opcional)">
              <input
                className="w-full px-3 py-2 rounded-xl border border-platoBorde bg-crema text-tinta text-sm outline-none focus:border-terracota"
                placeholder="Algo específico para esta vez…"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                maxLength={140}
              />
            </Bloque>

            <div className="flex flex-col gap-2 mt-1">
              <BotonPrincipal onClick={confirmarSi} disabled={enviando}>
                {enviando ? 'Enviando…' : 'Avisar que sí voy'}
              </BotonPrincipal>
              <BotonSecundario onClick={() => setRuta(null)} disabled={enviando}>
                Volver
              </BotonSecundario>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Bloque({ titulo, children }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-tintaSuave mb-2">{titulo}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Chips({ items, seleccion, onToggle, vacio, onAbrirConfig }) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-tintaSuave text-sm italic">{vacio}</p>
        {onAbrirConfig && (
          <button
            type="button"
            onClick={onAbrirConfig}
            className="self-start text-xs underline text-terracota hover:text-terracotaDark"
          >
            Agregar en Configuración →
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((nombre) => {
        const activo = seleccion.includes(nombre);
        return (
          <button
            key={nombre}
            type="button"
            onClick={() => onToggle(nombre)}
            className={`px-3 py-1.5 rounded-full border-2 text-sm transition-colors ${
              activo
                ? 'bg-terracota text-crema border-terracota'
                : 'bg-crema text-tinta border-platoBorde hover:border-terracota/60'
            }`}
          >
            {nombre}
          </button>
        );
      })}
    </div>
  );
}

function AgregarInline({ placeholder, valor, onChange, onAgregar, disabled }) {
  return (
    <div className="flex gap-2 mt-1">
      <input
        className="flex-1 px-3 py-2 rounded-xl border border-platoBorde bg-crema text-tinta text-sm outline-none focus:border-terracota"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onAgregar()}
      />
      <button
        type="button"
        onClick={onAgregar}
        disabled={!valor.trim() || disabled}
        className="px-4 py-2 rounded-xl bg-tinta text-crema text-sm disabled:opacity-40"
      >
        Agregar
      </button>
    </div>
  );
}

function BotonOpcion({ icono, texto, sub, color, onClick, disabled }) {
  const clases = {
    exito: 'border-exito/40 hover:bg-exito/10 text-exito',
    alerta: 'border-alerta/40 hover:bg-alerta/10 text-alerta',
  }[color];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 bg-crema transition-colors disabled:opacity-50 ${clases}`}
    >
      <span className="text-2xl w-8 flex items-center justify-center">{icono}</span>
      <div className="text-left">
        <div className="font-medium text-tinta">{texto}</div>
        <div className="text-xs text-tintaSuave">{sub}</div>
      </div>
    </button>
  );
}

function BotonPrincipal({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 rounded-xl bg-terracota text-crema font-medium disabled:opacity-40 hover:bg-terracotaDark transition-colors"
    >
      {children}
    </button>
  );
}

function BotonSecundario({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full py-2 rounded-xl text-tintaSuave hover:text-tinta transition-colors"
    >
      {children}
    </button>
  );
}
