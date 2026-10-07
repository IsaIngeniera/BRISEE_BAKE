/* eslint-disable */
/**
 * PRUEBAS UNITARIAS QA - useCart hook
 *
 * Verifica el hook useCart que expone el CartContext:
 * - Debe lanzar error si se usa fuera de un CartProvider
 * - Debe retornar el contexto del carrito cuando se usa dentro de CartProvider
 * - Las operaciones del carrito deben estar accesibles vía el hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useCart } from '@/hooks/useCart';
import { CartProvider } from '@/context/CartContext';

// Mock del servicio de autenticación
jest.mock('@/services/auth', () => ({
  AUTH_CHANGE_EVENT: 'brisee:auth-changed',
  getSessionUser: jest.fn(() => null),
}));

describe('useCart [QA]', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    localStorage.clear();
    mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    (global as any).fetch = mockFetch;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  // ============================================================
  // VALIDACIÓN DE PROVIDER
  // ============================================================
  describe('validación de provider', () => {
    it('debe lanzar un error si se usa fuera de CartProvider', () => {
      expect(() => {
        renderHook(() => useCart());
      }).toThrow('useCart debe usarse dentro de un CartProvider');
    });

    it('debe retornar el contexto cuando se usa dentro de CartProvider', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <CartProvider>{children}</CartProvider>
      );

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      expect(result.current).toBeDefined();
      expect(result.current).not.toBeNull();
    });
  });

  // ============================================================
  // API EXPUESTA
  // ============================================================
  describe('API expuesta', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    it('debe exponer el array de items', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      expect(Array.isArray(result.current.items)).toBe(true);
    });

    it('debe exponer totalItems como número', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      expect(typeof result.current.totalItems).toBe('number');
      expect(result.current.totalItems).toBe(0);
    });

    it('debe exponer las funciones del carrito', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      expect(typeof result.current.addToCart).toBe('function');
      expect(typeof result.current.updateQuantity).toBe('function');
      expect(typeof result.current.removeFromCart).toBe('function');
      expect(typeof result.current.clearCart).toBe('function');
      expect(typeof result.current.refreshCart).toBe('function');
    });

    it('debe exponer los flags de estado', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      expect(typeof result.current.loadError).toBe('boolean');
      expect(typeof result.current.isHydrated).toBe('boolean');
      expect(Array.isArray(result.current.removedItems)).toBe(true);
    });
  });

  // ============================================================
  // OPERACIONES DEL CARRITO VÍA HOOK
  // ============================================================
  describe('operaciones del carrito', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    it('debe agregar un item al carrito usando addToCart', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      act(() => {
        result.current.addToCart(
          {
            productId: 'p1',
            nombre: 'Galleta de Chocolate',
            precio: 5000,
          },
          2,
        );
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].nombre).toBe('Galleta de Chocolate');
      expect(result.current.items[0].cantidad).toBe(2);
      expect(result.current.totalItems).toBe(2);
    });

    it('debe actualizar la cantidad de un item existente', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      act(() => {
        result.current.addToCart(
          { productId: 'p1', nombre: 'Galleta', precio: 5000 },
          1,
        );
      });

      act(() => {
        result.current.updateQuantity('p1', 5);
      });

      expect(result.current.items[0].cantidad).toBe(5);
      expect(result.current.totalItems).toBe(5);
    });

    it('debe eliminar un item del carrito con removeFromCart', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      act(() => {
        result.current.addToCart(
          { productId: 'p1', nombre: 'Galleta', precio: 5000 },
          1,
        );
      });

      act(() => {
        result.current.removeFromCart('p1');
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);
    });

    it('debe limpiar todo el carrito con clearCart', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      act(() => {
        result.current.addToCart(
          { productId: 'p1', nombre: 'Galleta', precio: 5000 },
          2,
        );
        result.current.addToCart(
          { productId: 'p2', nombre: 'Macaron', precio: 3000 },
          3,
        );
      });

      expect(result.current.items).toHaveLength(2);

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);
    });
  });
});
