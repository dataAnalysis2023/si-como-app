import { useState } from 'react';
import MenuRecurrente from './MenuRecurrente.jsx';

/**
 * Bottom sheet con tres caminos:
 *   si      → confirmar con o sin antojo del menú
 *   no      → un toque, sin pasos extra
 *   pedido  → selección obligatoria del menú
 */
export default function ModalDecision({
  abierto,
  nombreComida,
  platos,
  activa,
  onConfirmar,
  onCerrar,
  enviando,
}) {
  const [ruta, setRuta] = useState(null); // null | 'si' | 'pedido'
  const [plato, setPlato] = useState(null);

  if (!abierto) return null;

  const titulo = activa
    ? `¿Qué pasa con este ${nombreComida?.toLowerCase() || 'momento'}?`
    : `¿Qué pasa con el próximo ${nombreComida?.toLowerCase() || 'momento'}?`;

  const cerrar = () => {
    setRuta(null);
    setPlato(null);
    onCerrar();
  };

  const confirmar = (tipo, platoFinal = null) => {
    onConfirmar({ tipo, plato: platoFinal });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center animate-fade">
      <div
        className="absolute inset-0 bg-tinta/40 backdrop-blur-sm"
        onClick={enviando ? undefined : cerrar}
      />
      <div className="relative w-full max-w-md bg-crema rounded-t-3xl shadow-[0_-10px_40px_rgba(59,42,30,0.25)] p-6 pb-8 animate-sheet">
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
              onClick={() => confirmar('no')}
              disabled={enviando}
            />
            <BotonOpcion
              icono="🍽"
              texto="Quiero algo específico"
              sub="Pedir del menú"
              color="terracota"
              onClick={() => setRuta('pedido')}
            />
          </div>
        )}

        {ruta === 'si' && (
          <div className="flex flex-col gap-4">
            <p className="text-tintaSuave text-sm">
              ¿Se te antoja algo del menú? (opcional)
            </p>
            <MenuRecurrente platos={platos} seleccion={plato} onChange={setPlato} />
            <div className="flex flex-col gap-2 mt-2">
              <BotonPrincipal
                onClick={() => confirmar('si', plato)}
                disabled={enviando}
              >
                {plato ? `Avisar: se me antoja ${plato}` : 'Avisar que sí voy'}
              </BotonPrincipal>
              <BotonSecundario onClick={() => setRuta(null)} disabled={enviando}>
                Volver
              </BotonSecundario>
            </div>
          </div>
        )}

        {ruta === 'pedido' && (
          <div className="flex flex-col gap-4">
            <p className="text-tintaSuave text-sm">Selecciona un plato del menú:</p>
            <MenuRecurrente
              platos={platos}
              seleccion={plato}
              onChange={setPlato}
              vacio="No hay platos configurados. Agrégalos en Configuración."
            />
            <div className="flex flex-col gap-2 mt-2">
              <BotonPrincipal
                onClick={() => confirmar('pedido', plato)}
                disabled={!plato || enviando}
              >
                {plato ? `Pedir ${plato}` : 'Selecciona un plato'}
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

function BotonOpcion({ icono, texto, sub, color, onClick, disabled }) {
  const clases = {
    exito: 'border-exito/40 hover:bg-exito/10 text-exito',
    alerta: 'border-alerta/40 hover:bg-alerta/10 text-alerta',
    terracota: 'border-terracota/50 hover:bg-terracota/10 text-terracota',
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
