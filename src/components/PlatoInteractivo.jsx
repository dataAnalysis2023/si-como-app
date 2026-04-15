/**
 * Vista cenital: mantel + plato + tenedor + cuchillo.
 * Estados visuales:
 *   neutro → cubiertos paralelos
 *   si     → check sobre el plato, cubiertos ligeramente abiertos
 *   no     → cubiertos cruzados en X
 */
export default function PlatoInteractivo({ estado = 'neutro', onClick, proxima = false }) {
  const tenedorRot =
    estado === 'no' ? 45 : estado === 'si' ? -8 : 0;
  const cuchilloRot =
    estado === 'no' ? -45 : estado === 'si' ? 8 : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Avisar qué pasa con esta comida"
      className="relative block w-full max-w-sm aspect-square mx-auto focus:outline-none focus-visible:ring-4 focus-visible:ring-terracota/40 rounded-full"
    >
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full drop-shadow-plato"
        style={{ filter: proxima ? 'saturate(0.75) opacity(0.85)' : 'none' }}
      >
        {/* TENEDOR (izquierda) */}
        <g
          style={{
            transform: `rotate(${tenedorRot}deg)`,
            transformOrigin: '80px 200px',
            transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <Tenedor />
        </g>

        {/* PLATO */}
        <g>
          <circle cx="200" cy="200" r="120" fill="#FFFDF8" stroke="#D9C3A1" strokeWidth="4" />
          <circle cx="200" cy="200" r="96" fill="none" stroke="#E8D0AE" strokeWidth="2" />
          <circle cx="200" cy="200" r="80" fill="none" stroke="#EFDCBE" strokeWidth="1.5" strokeDasharray="2 4" />
        </g>

        {/* CUCHILLO (derecha) */}
        <g
          style={{
            transform: `rotate(${cuchilloRot}deg)`,
            transformOrigin: '320px 200px',
            transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <Cuchillo />
        </g>

        {/* CHECK en estado si */}
        {estado === 'si' && (
          <g className="animate-pop" style={{ transformOrigin: '200px 200px' }}>
            <circle cx="200" cy="200" r="40" fill="#6FA26B" />
            <path
              d="M180 202 L195 217 L222 188"
              stroke="#FFFDF8"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        )}
      </svg>
    </button>
  );
}

function Tenedor() {
  // Forma estilizada — mango vertical + 4 dientes arriba
  return (
    <g fill="#8A6B4E">
      <rect x="72" y="150" width="16" height="180" rx="8" />
      <rect x="68" y="100" width="6" height="60" rx="3" />
      <rect x="78" y="92" width="6" height="68" rx="3" />
      <rect x="88" y="92" width="6" height="68" rx="3" />
      <rect x="98" y="100" width="6" height="60" rx="3" />
      <path d="M68 150 Q 80 140 104 150 L104 168 L68 168 Z" fill="#8A6B4E" />
    </g>
  );
}

function Cuchillo() {
  // Mango + hoja triangular
  return (
    <g fill="#8A6B4E">
      <rect x="312" y="200" width="16" height="130" rx="8" />
      <path
        d="M312 72 Q 320 68 328 72 L328 205 L312 205 Z"
        fill="#C9B79C"
        stroke="#8A6B4E"
        strokeWidth="2"
      />
    </g>
  );
}
