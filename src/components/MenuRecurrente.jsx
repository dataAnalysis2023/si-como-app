/**
 * Lista seleccionable de platos del menú recurrente.
 * Una sola selección. onChange(platoSeleccionado | null).
 */
export default function MenuRecurrente({ platos, seleccion, onChange, vacio }) {
  if (!platos || platos.length === 0) {
    return (
      <p className="text-tintaSuave text-sm italic py-2">
        {vacio || 'Aún no hay platos en el menú recurrente. Agrégalos desde Configuración.'}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
      {platos.map((p) => {
        const activo = seleccion === p;
        return (
          <li key={p}>
            <button
              type="button"
              onClick={() => onChange(activo ? null : p)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                activo
                  ? 'bg-terracota text-crema border-terracota'
                  : 'bg-crema text-tinta border-platoBorde hover:border-terracota/60'
              }`}
            >
              {p}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
