import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalDecision from './ModalDecision.jsx';

function setup(props = {}) {
  const onConfirmar = vi.fn();
  const onAgregarProteina = vi.fn();
  const onAgregarBebida = vi.fn();
  const onCerrar = vi.fn();
  const defaultProps = {
    abierto: true,
    nombreComida: 'Almuerzo',
    proteinas: ['Pollo', 'Huevos', 'Carne de res'],
    bebidas: ['Té', 'Jugo de fruta'],
    activa: true,
    enviando: false,
    onConfirmar,
    onAgregarProteina,
    onAgregarBebida,
    onCerrar,
    ...props,
  };
  render(<ModalDecision {...defaultProps} />);
  return { onConfirmar, onAgregarProteina, onAgregarBebida, onCerrar };
}

describe('ModalDecision — entrada', () => {
  it('no renderiza nada cuando abierto=false', () => {
    const { container } = render(<ModalDecision abierto={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra título contextual para comida activa', () => {
    setup({ activa: true, nombreComida: 'Almuerzo' });
    expect(screen.getByRole('heading', { name: /este almuerzo/i })).toBeInTheDocument();
  });

  it('muestra título "próximo" si no está activa', () => {
    setup({ activa: false, nombreComida: 'Cena' });
    expect(screen.getByRole('heading', { name: /próximo cena/i })).toBeInTheDocument();
  });

  it('presenta las dos rutas iniciales: sí y no', () => {
    setup();
    expect(screen.getByRole('button', { name: /confirmo que voy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hoy no cuento/i })).toBeInTheDocument();
    expect(screen.queryByText(/quiero algo específico/i)).not.toBeInTheDocument();
  });
});

describe('ModalDecision — ruta NO', () => {
  it('confirma inmediatamente con tipo=no y listas vacías', async () => {
    const user = userEvent.setup();
    const { onConfirmar } = setup();
    await user.click(screen.getByRole('button', { name: /hoy no cuento/i }));
    expect(onConfirmar).toHaveBeenCalledWith({
      tipo: 'no',
      proteinas: [],
      bebidas: [],
      nota: '',
    });
  });
});

describe('ModalDecision — ruta SÍ', () => {
  it('entra a la ruta sí y muestra los tres bloques', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    expect(screen.getByText(/proteína/i)).toBeInTheDocument();
    expect(screen.getByText(/bebida/i)).toBeInTheDocument();
    expect(screen.getByText(/^nota/i)).toBeInTheDocument();
  });

  it('selecciona múltiples proteínas como chips', async () => {
    const user = userEvent.setup();
    const { onConfirmar } = setup();
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    await user.click(screen.getByRole('button', { name: 'Pollo' }));
    await user.click(screen.getByRole('button', { name: 'Huevos' }));
    await user.click(screen.getByRole('button', { name: /^avisar que sí voy/i }));
    expect(onConfirmar).toHaveBeenCalledWith({
      tipo: 'si',
      proteinas: ['Pollo', 'Huevos'],
      bebidas: [],
      nota: '',
    });
  });

  it('deseleccionar un chip lo quita del payload', async () => {
    const user = userEvent.setup();
    const { onConfirmar } = setup();
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    await user.click(screen.getByRole('button', { name: 'Pollo' }));
    await user.click(screen.getByRole('button', { name: 'Pollo' })); // deselect
    await user.click(screen.getByRole('button', { name: /^avisar que sí voy/i }));
    expect(onConfirmar).toHaveBeenCalledWith(
      expect.objectContaining({ proteinas: [] })
    );
  });

  it('multi-select en bebidas funciona independiente', async () => {
    const user = userEvent.setup();
    const { onConfirmar } = setup();
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    await user.click(screen.getByRole('button', { name: 'Té' }));
    await user.click(screen.getByRole('button', { name: 'Jugo de fruta' }));
    await user.click(screen.getByRole('button', { name: /^avisar que sí voy/i }));
    expect(onConfirmar).toHaveBeenCalledWith(
      expect.objectContaining({ bebidas: ['Té', 'Jugo de fruta'] })
    );
  });

  it('incluye la nota en el payload', async () => {
    const user = userEvent.setup();
    const { onConfirmar } = setup();
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    await user.type(screen.getByPlaceholderText(/algo específico/i), 'con arroz');
    await user.click(screen.getByRole('button', { name: /^avisar que sí voy/i }));
    expect(onConfirmar).toHaveBeenCalledWith(
      expect.objectContaining({ nota: 'con arroz' })
    );
  });

  it('confirma sin elegir nada — payload opcional', async () => {
    const user = userEvent.setup();
    const { onConfirmar } = setup();
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    await user.click(screen.getByRole('button', { name: /^avisar que sí voy/i }));
    expect(onConfirmar).toHaveBeenCalledWith({
      tipo: 'si',
      proteinas: [],
      bebidas: [],
      nota: '',
    });
  });

  it('botón "Volver" regresa a la ruta inicial', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    await user.click(screen.getByRole('button', { name: /volver/i }));
    expect(screen.getByRole('button', { name: /hoy no cuento/i })).toBeInTheDocument();
  });
});

describe('ModalDecision — agregar inline', () => {
  it('agregar proteína nueva llama al callback y la preselecciona', async () => {
    const user = userEvent.setup();
    const { onAgregarProteina, onConfirmar } = setup();
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    await user.type(screen.getByPlaceholderText(/nueva proteína/i), 'Atún');
    const bloqueProt = screen.getByText(/proteína/i).closest('div');
    const botonAgregar = within(bloqueProt).getByRole('button', { name: /agregar/i });
    await user.click(botonAgregar);
    expect(onAgregarProteina).toHaveBeenCalledWith('Atún');
    await user.click(screen.getByRole('button', { name: /^avisar que sí voy/i }));
    expect(onConfirmar).toHaveBeenCalledWith(
      expect.objectContaining({ proteinas: ['Atún'] })
    );
  });

  it('agregar con Enter también funciona', async () => {
    const user = userEvent.setup();
    const { onAgregarBebida } = setup();
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    const input = screen.getByPlaceholderText(/nueva bebida/i);
    await user.type(input, 'Café{Enter}');
    expect(onAgregarBebida).toHaveBeenCalledWith('Café');
  });

  it('no duplica si ya existe (case-insensitive)', async () => {
    const user = userEvent.setup();
    const { onAgregarProteina } = setup({ proteinas: ['Pollo'] });
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    await user.type(screen.getByPlaceholderText(/nueva proteína/i), 'pollo{Enter}');
    expect(onAgregarProteina).not.toHaveBeenCalled();
  });

  it('input vacío no dispara agregar', async () => {
    const user = userEvent.setup();
    const { onAgregarProteina } = setup();
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    const bloqueProt = screen.getByText(/proteína/i).closest('div');
    const botonAgregar = within(bloqueProt).getByRole('button', { name: /agregar/i });
    expect(botonAgregar).toBeDisabled();
    await user.click(botonAgregar);
    expect(onAgregarProteina).not.toHaveBeenCalled();
  });
});

describe('ModalDecision — empty states', () => {
  it('muestra mensaje vacío cuando no hay proteínas', async () => {
    const user = userEvent.setup();
    setup({ proteinas: [] });
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    expect(screen.getByText(/aún no tienes proteínas/i)).toBeInTheDocument();
  });

  it('muestra mensaje vacío cuando no hay bebidas', async () => {
    const user = userEvent.setup();
    setup({ bebidas: [] });
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    expect(screen.getByText(/aún no tienes bebidas/i)).toBeInTheDocument();
  });

  it('muestra CTA a Configuración cuando hay empty state y onAbrirConfig', async () => {
    const user = userEvent.setup();
    const onAbrirConfig = vi.fn();
    render(
      <ModalDecision
        abierto
        nombreComida="Almuerzo"
        proteinas={[]}
        bebidas={[]}
        activa
        onConfirmar={() => {}}
        onAgregarProteina={() => {}}
        onAgregarBebida={() => {}}
        onAbrirConfig={onAbrirConfig}
        onCerrar={() => {}}
      />
    );
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    const ctas = screen.getAllByRole('button', { name: /agregar en configuración/i });
    expect(ctas.length).toBeGreaterThan(0);
    await user.click(ctas[0]);
    expect(onAbrirConfig).toHaveBeenCalled();
  });
});

describe('ModalDecision — selección inicial (pre-carga)', () => {
  it('pre-carga proteínas, bebidas y nota y entra directo a ruta sí', () => {
    render(
      <ModalDecision
        abierto
        nombreComida="Almuerzo"
        proteinas={['Pollo', 'Huevos']}
        bebidas={['Té']}
        activa
        seleccionInicial={{ proteinas: ['Pollo'], bebidas: ['Té'], nota: 'con arroz' }}
        onConfirmar={() => {}}
        onAgregarProteina={() => {}}
        onAgregarBebida={() => {}}
        onCerrar={() => {}}
      />
    );
    // Saltó directo a ruta sí: aparece el botón de confirmar final
    expect(screen.getByRole('button', { name: /^avisar que sí voy/i })).toBeInTheDocument();
    // Nota precargada
    expect(screen.getByDisplayValue('con arroz')).toBeInTheDocument();
  });

  it('sin seleccionInicial arranca en ruta raíz con listas vacías', () => {
    render(
      <ModalDecision
        abierto
        nombreComida="Almuerzo"
        proteinas={['Pollo']}
        bebidas={['Té']}
        activa
        onConfirmar={() => {}}
        onAgregarProteina={() => {}}
        onAgregarBebida={() => {}}
        onCerrar={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /confirmo que voy/i })).toBeInTheDocument();
  });
});

describe('ModalDecision — estado enviando', () => {
  it('desactiva el botón principal', async () => {
    const user = userEvent.setup();
    setup({ enviando: true });
    await user.click(screen.getByRole('button', { name: /confirmo que voy/i }));
    expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled();
  });
});
