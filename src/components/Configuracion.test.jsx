import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Configuracion from './Configuracion.jsx';
import { storage } from '../utils/storage.js';

function renderCfg(props = {}) {
  const onGuardar = vi.fn();
  const onCancelar = vi.fn();
  render(<Configuracion onGuardar={onGuardar} onCancelar={onCancelar} {...props} />);
  return { onGuardar, onCancelar };
}

async function llenarPerfilValido(user) {
  await user.type(screen.getByPlaceholderText(/ej: juan/i), 'Juan');
  await user.type(screen.getByPlaceholderText(/\+573001234567/), '+573001234567');
  await user.type(screen.getByPlaceholderText('123456'), 'apikey-xyz');
}

describe('Configuracion — onboarding', () => {
  it('muestra el saludo inicial con inicial=true', () => {
    renderCfg({ inicial: true });
    expect(screen.getByRole('heading', { name: /bienvenido/i })).toBeInTheDocument();
  });

  it('no muestra botón Cancelar en modo inicial', () => {
    renderCfg({ inicial: true });
    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
  });

  it('muestra Cancelar cuando no es inicial', () => {
    renderCfg();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });
});

describe('Configuracion — validaciones', () => {
  it('exige nombre', async () => {
    const user = userEvent.setup();
    const { onGuardar } = renderCfg();
    await user.click(screen.getByRole('button', { name: /^guardar$/i }));
    expect(screen.getByText(/falta tu nombre/i)).toBeInTheDocument();
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('exige número con formato internacional', async () => {
    const user = userEvent.setup();
    const { onGuardar } = renderCfg();
    await user.type(screen.getByPlaceholderText(/ej: juan/i), 'Juan');
    await user.type(screen.getByPlaceholderText(/\+573001234567/), '123');
    await user.type(screen.getByPlaceholderText('123456'), 'k');
    await user.click(screen.getByRole('button', { name: /^guardar$/i }));
    expect(screen.getByText(/número de cocinero inválido/i)).toBeInTheDocument();
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('exige API key', async () => {
    const user = userEvent.setup();
    const { onGuardar } = renderCfg();
    await user.type(screen.getByPlaceholderText(/ej: juan/i), 'Juan');
    await user.type(screen.getByPlaceholderText(/\+573001234567/), '+573001234567');
    await user.click(screen.getByRole('button', { name: /^guardar$/i }));
    expect(screen.getByText(/falta el api key/i)).toBeInTheDocument();
    expect(onGuardar).not.toHaveBeenCalled();
  });
});

describe('Configuracion — guardado exitoso', () => {
  it('persiste perfil, comidas default, proteínas y bebidas', async () => {
    const user = userEvent.setup();
    const { onGuardar } = renderCfg();
    await llenarPerfilValido(user);
    await user.click(screen.getByRole('button', { name: /^guardar$/i }));
    expect(onGuardar).toHaveBeenCalled();
    const cfg = storage.getConfig();
    expect(cfg.nombreUsuario).toBe('Juan');
    expect(cfg.numeroCocinero).toBe('+573001234567');
    expect(cfg.apiKey).toBe('apikey-xyz');
    expect(storage.getComidas()).toHaveLength(3);
    expect(storage.getProteinas()).toContain('Pollo');
    expect(storage.getBebidas()).toContain('Té');
  });
});

describe('Configuracion — manipulación de proteínas', () => {
  it('agrega y elimina items', async () => {
    const user = userEvent.setup();
    renderCfg();
    await llenarPerfilValido(user);
    await user.click(screen.getByRole('button', { name: /agregar proteína/i }));
    const inputsProt = screen.getAllByPlaceholderText(/ej: pollo/i);
    const nuevo = inputsProt[inputsProt.length - 1];
    await user.type(nuevo, 'Atún');
    await user.click(screen.getByRole('button', { name: /^guardar$/i }));
    expect(storage.getProteinas()).toContain('Atún');
  });

  it('dedupe case-insensitive al guardar', async () => {
    const user = userEvent.setup();
    renderCfg();
    await llenarPerfilValido(user);
    await user.click(screen.getByRole('button', { name: /agregar proteína/i }));
    const inputsProt = screen.getAllByPlaceholderText(/ej: pollo/i);
    await user.type(inputsProt[inputsProt.length - 1], 'pollo');
    await user.click(screen.getByRole('button', { name: /^guardar$/i }));
    const prot = storage.getProteinas();
    const pollos = prot.filter((p) => p.toLowerCase() === 'pollo');
    expect(pollos).toHaveLength(1);
  });
});

describe('Configuracion — confirmación de eliminación de comida', () => {
  it('pulsar ✕ abre diálogo, no elimina aún', async () => {
    const user = userEvent.setup();
    renderCfg();
    await llenarPerfilValido(user);
    const eliminar = screen.getAllByLabelText(/eliminar comida/i);
    await user.click(eliminar[0]);
    // Se muestra diálogo de confirmación
    expect(screen.getByRole('heading', { name: /eliminar desayuno/i })).toBeInTheDocument();
    // Los inputs de nombre (role=textbox) de las 3 comidas siguen presentes
    const textboxes = screen.getAllByRole('textbox');
    const valores = textboxes.map((i) => i.value);
    expect(valores).toContain('Desayuno');
    expect(valores).toContain('Almuerzo');
    expect(valores).toContain('Cena');
  });

  it('confirmar elimina la comida', async () => {
    const user = userEvent.setup();
    renderCfg();
    await llenarPerfilValido(user);
    const eliminar = screen.getAllByLabelText(/eliminar comida/i);
    await user.click(eliminar[0]);
    await user.click(screen.getByRole('button', { name: /^sí, eliminar$/i }));
    await user.click(screen.getByRole('button', { name: /^guardar$/i }));
    const comidas = storage.getComidas();
    expect(comidas).toHaveLength(2);
    expect(comidas.find((c) => c.id === 'desayuno')).toBeUndefined();
  });

  it('cancelar el diálogo mantiene la comida', async () => {
    const user = userEvent.setup();
    renderCfg();
    await llenarPerfilValido(user);
    const eliminar = screen.getAllByLabelText(/eliminar comida/i);
    await user.click(eliminar[0]);
    const cancelars = screen.getAllByRole('button', { name: /^cancelar$/i });
    // El cancelar del diálogo, no el del form principal — tomamos el último (dentro del dialog modal)
    await user.click(cancelars[cancelars.length - 1]);
    expect(screen.queryByRole('heading', { name: /eliminar desayuno/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^guardar$/i }));
    expect(storage.getComidas()).toHaveLength(3);
  });
});

describe('Configuracion — manipulación de comidas', () => {
  it('cambiar tipo de una comida persiste', async () => {
    const user = userEvent.setup();
    renderCfg();
    await llenarPerfilValido(user);
    const selects = screen.getAllByRole('combobox');
    // El primer combobox es el tipo del Desayuno
    await user.selectOptions(selects[0], 'cena');
    await user.click(screen.getByRole('button', { name: /^guardar$/i }));
    const comidas = storage.getComidas();
    expect(comidas[0].tipo).toBe('cena');
  });

  it('agregar una nueva comida aparece en la lista', async () => {
    const user = userEvent.setup();
    renderCfg();
    await llenarPerfilValido(user);
    await user.click(screen.getByRole('button', { name: /agregar comida/i }));
    await user.click(screen.getByRole('button', { name: /^guardar$/i }));
    expect(storage.getComidas()).toHaveLength(4);
  });

  it('eliminar dos comidas y dejar solo 1 → error al guardar', async () => {
    const user = userEvent.setup();
    const { onGuardar } = renderCfg();
    await llenarPerfilValido(user);

    // Primera eliminación (cena) con confirmación
    let eliminar = screen.getAllByLabelText(/eliminar comida/i);
    await user.click(eliminar[2]);
    await user.click(screen.getByRole('button', { name: /^sí, eliminar$/i }));

    // Segunda eliminación (almuerzo, ahora última visible)
    eliminar = screen.getAllByLabelText(/eliminar comida/i);
    await user.click(eliminar[1]);
    await user.click(screen.getByRole('button', { name: /^sí, eliminar$/i }));

    await user.click(screen.getByRole('button', { name: /^guardar$/i }));
    expect(screen.getByText(/al menos 2 comidas/i)).toBeInTheDocument();
    expect(onGuardar).not.toHaveBeenCalled();
  });
});
