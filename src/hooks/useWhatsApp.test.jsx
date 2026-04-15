import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWhatsApp } from './useWhatsApp.js';
import { storage } from '../utils/storage.js';

const entrada = {
  tipo: 'si',
  nombreComida: 'Almuerzo',
  tipoComida: 'almuerzo',
  proteinas: ['Pollo'],
  bebidas: [],
  nota: '',
};

beforeEach(() => {
  storage.setConfig({
    nombreUsuario: 'Juan',
    numeroCocinero: '+573001234567',
    apiKey: 'apikey-xyz',
  });
  Object.defineProperty(globalThis.navigator, 'onLine', {
    configurable: true,
    value: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useWhatsApp — envío ok', () => {
  it('resuelve ok cuando fetch responde', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useWhatsApp());
    const res = await act(() => result.current.enviar(entrada));
    expect(res.ok).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('detecta offline y lanza error sin fetch', async () => {
    Object.defineProperty(globalThis.navigator, 'onLine', { configurable: true, value: false });
    globalThis.fetch = vi.fn();
    const { result } = renderHook(() => useWhatsApp());
    await expect(act(() => result.current.enviar(entrada))).rejects.toThrow(/sin conexión/i);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('AbortError del fetch → mensaje "tardó demasiado"', async () => {
    // Simula el caso en que el controller.abort() ya disparó: fetch rechaza con AbortError
    globalThis.fetch = vi.fn(() => {
      const e = new Error('aborted');
      e.name = 'AbortError';
      return Promise.reject(e);
    });
    const { result } = renderHook(() => useWhatsApp());
    await expect(act(() => result.current.enviar(entrada))).rejects.toThrow(/tardó demasiado/i);
  });

  it('error de red genérico produce mensaje con fallback manual', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const { result } = renderHook(() => useWhatsApp());
    await expect(act(() => result.current.enviar(entrada))).rejects.toThrow(/whatsapp manual/i);
  });

  it('falta de config lanza error claro', async () => {
    storage.setConfig({ nombreUsuario: 'Juan' }); // sin numeroCocinero ni apiKey
    const { result } = renderHook(() => useWhatsApp());
    await expect(act(() => result.current.enviar(entrada))).rejects.toThrow(/callmebot/i);
  });
});

describe('useWhatsApp — linkManual', () => {
  it('devuelve URL wa.me con mensaje codificado', () => {
    const { result } = renderHook(() => useWhatsApp());
    const link = result.current.linkManual(entrada);
    expect(link).toContain('https://wa.me/573001234567?text=');
    expect(decodeURIComponent(link)).toContain('pollo');
    expect(decodeURIComponent(link)).toContain('Juan');
  });

  it('devuelve null si falta config', () => {
    storage.setConfig({ nombreUsuario: 'Juan' });
    const { result } = renderHook(() => useWhatsApp());
    expect(result.current.linkManual(entrada)).toBeNull();
  });
});
