/* eslint-disable */
/**
 * PRUEBAS UNITARIAS QA - CartContext
 *
 * Verifica el manejo del estado del carrito:
 * - Carga desde localStorage
 * - Validación con el catálogo del backend
 * - Agregar, actualizar, eliminar items
 * - Limpiar carrito
 * - Sincronización por userId (sesión)
 */

import { useContext } from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { CartContext, CartProvider } from '@/context/CartContext';

// Mock del servicio de autenticación
jest.mock('@/services/auth', () => ({
  AUTH_CHANGE_EVENT: 'brisee:auth-changed',
  getSessionUser: jest.fn(),
}));

import { getSessionUser } from '@/services/auth';

const mockGetSessionUser = getSessionUser as jest.Mock;

// Helper: componente de prueba que expone el contexto
let capturedContext: ReturnType<
  typeof useContext<typeof CartContext extends React.Context<infer T> ? T : never>
> = null;

function TestConsumer() {
  capturedContext = useContext(CartContext);
  return null;
}

function renderCart() {
  return render(
    <CartProvider>
      <TestConsumer />
    </CartProvider>,
  );
}

describe('CartContext [QA]', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    localStorage.clear();
    mockFetch = jest.fn();
    (global as any).fetch = mockFetch;
    mockGetSessionUser.mockReturnValue(null); // Guest por defecto
    capturedContext = null;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  // ============================================================
  // INICIALIZACIÓN
  // ============================================================
  describe('inicialización', () => {
    it('debe iniciar con carrito vacío si no hay items guardados', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      renderCart();

      await waitFor(() => {
        expect(capturedContext?.isHydrated).toBe(true);
      });

      expect(capturedContext?.items).toEqual([]);
      expect(capturedContext?.totalItems).toBe(0);
    });

    it('debe cargar items desde localStorage', async () => {
      const savedItems = [
        {
          productId: 'p1',
          nombre: 'Galleta',
          precio: 10000,
          cantidad: 2,
        },
      ];
      localStorage.setItem('brisee_cart_guest', JSON.stringify(savedItems));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [{ id: 'p1', estado: 'ACTIVO' }],
      });

      renderCart();

      await waitFor(() => {
        expect(capturedContext?.isHydrated).toBe(true);
      });

      expect(capturedContext?.items).toHaveLength(1);
      expect(capturedContext?.items[0].productId).toBe('p1');
    });

    it('debe eliminar items de productos INACTIVOS y reportarlos', async () => {
      const savedItems = [
        { productId: 'p1', nombre: 'Activo', precio: 10000, cantidad: 1 },
        {
          productId: 'p2',
          nombre: 'Descontinuado',
          precio: 5000,
          cantidad: 1,
        },
      ];
      localStorage.setItem('brisee_cart_guest', JSON.stringify(savedItems));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [
          { id: 'p1', estado: 'ACTIVO' },
          { id: 'p2', estado: 'INACTIVO' },
        ],
      });

      renderCart();

      await waitFor(() => {
        expect(capturedContext?.isHydrated).toBe(true);
      });

      expect(capturedContext?.items).toHaveLength(1);
      expect(capturedContext?.items[0].nombre).toBe('Activo');
      expect(capturedContext?.removedItems).toContain('Descontinuado');
    });

    it('debe marcar loadError si falla el fetch del catálogo', async () => {
      localStorage.setItem(
        'brisee_cart_guest',
        JSON.stringify([
          { productId: 'p1', nombre: 'Galleta', precio: 10000, cantidad: 1 },
        ]),
      );

      mockFetch.mockRejectedValue(new Error('Network error'));

      renderCart();

      await waitFor(() => {
        expect(capturedContext?.loadError).toBe(true);
      });
    });

    it('debe usar key diferente si hay usuario autenticado', async () => {
      mockGetSessionUser.mockReturnValue({
        sub: 'user-abc',
        correo: 'juan@example.com',
        rol: 'CLIENTE',
      });

      const userItems = [
        {
          productId: 'p1',
          nombre: 'Del usuario',
          precio: 15000,
          cantidad: 3,
        },
      ];
      localStorage.setItem(
        'brisee_cart_user-abc',
        JSON.stringify(userItems),
      );

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [{ id: 'p1', estado: 'ACTIVO' }],
      });

      renderCart();

      await waitFor(() => {
        expect(capturedContext?.isHydrated).toBe(true);
      });

      expect(capturedContext?.items[0].nombre).toBe('Del usuario');
    });
  });

  // ============================================================
  // ADD TO CART
  // ============================================================
  describe('addToCart', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => [] });
      renderCart();
      await waitFor(() => expect(capturedContext?.isHydrated).toBe(true));
    });

    it('debe agregar un producto nuevo al carrito', () => {
      act(() => {
        capturedContext?.addToCart(
          {
            productId: 'p1',
            nombre: 'Galleta',
            precio: 10000,
          },
          2,
        );
      });

      expect(capturedContext?.items).toHaveLength(1);
      expect(capturedContext?.items[0].cantidad).toBe(2);
      expect(capturedContext?.totalItems).toBe(2);
    });

    it('debe sumar cantidad si el producto ya está en el carrito (HU-7)', () => {
      act(() => {
        capturedContext?.addToCart(
          { productId: 'p1', nombre: 'Galleta', precio: 10000 },
          2,
        );
      });

      act(() => {
        capturedContext?.addToCart(
          { productId: 'p1', nombre: 'Galleta', precio: 10000 },
          3,
        );
      });

      expect(capturedContext?.items).toHaveLength(1);
      expect(capturedContext?.items[0].cantidad).toBe(5);
    });

    it('debe persistir los items en localStorage', () => {
      act(() => {
        capturedContext?.addToCart(
          { productId: 'p1', nombre: 'Galleta', precio: 10000 },
          1,
        );
      });

      const stored = JSON.parse(
        localStorage.getItem('brisee_cart_guest') || '[]',
      );

      expect(stored).toHaveLength(1);
      expect(stored[0].productId).toBe('p1');
    });

    it('debe calcular totalItems correctamente', () => {
      act(() => {
        capturedContext?.addToCart(
          { productId: 'p1', nombre: 'A', precio: 1000 },
          2,
        );
        capturedContext?.addToCart(
          { productId: 'p2', nombre: 'B', precio: 2000 },
          3,
        );
      });

      expect(capturedContext?.totalItems).toBe(5);
    });
  });

  // ============================================================
  // UPDATE QUANTITY
  // ============================================================
  describe('updateQuantity', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => [] });
      renderCart();
      await waitFor(() => expect(capturedContext?.isHydrated).toBe(true));

      act(() => {
        capturedContext?.addToCart(
          { productId: 'p1', nombre: 'Galleta', precio: 10000 },
          2,
        );
      });
    });

    it('debe actualizar la cantidad de un item', () => {
      act(() => {
        capturedContext?.updateQuantity('p1', 10);
      });

      expect(capturedContext?.items[0].cantidad).toBe(10);
    });

    it('no debe fallar si el productId no existe', () => {
      act(() => {
        capturedContext?.updateQuantity('no-existe', 5);
      });

      expect(capturedContext?.items[0].cantidad).toBe(2);
    });

    it('debe persistir el cambio en localStorage', () => {
      act(() => {
        capturedContext?.updateQuantity('p1', 7);
      });

      const stored = JSON.parse(
        localStorage.getItem('brisee_cart_guest') || '[]',
      );

      expect(stored[0].cantidad).toBe(7);
    });
  });

  // ============================================================
  // REMOVE FROM CART
  // ============================================================
  describe('removeFromCart', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => [] });
      renderCart();
      await waitFor(() => expect(capturedContext?.isHydrated).toBe(true));

      act(() => {
        capturedContext?.addToCart(
          { productId: 'p1', nombre: 'A', precio: 1000 },
          1,
        );
        capturedContext?.addToCart(
          { productId: 'p2', nombre: 'B', precio: 2000 },
          1,
        );
      });
    });

    it('debe eliminar un item del carrito', () => {
      act(() => {
        capturedContext?.removeFromCart('p1');
      });

      expect(capturedContext?.items).toHaveLength(1);
      expect(capturedContext?.items[0].productId).toBe('p2');
    });

    it('no debe fallar si el productId no existe', () => {
      act(() => {
        capturedContext?.removeFromCart('no-existe');
      });

      expect(capturedContext?.items).toHaveLength(2);
    });

    it('debe actualizar el totalItems tras eliminar', () => {
      act(() => {
        capturedContext?.removeFromCart('p1');
      });

      expect(capturedContext?.totalItems).toBe(1);
    });

    it('debe persistir el cambio en localStorage', () => {
      act(() => {
        capturedContext?.removeFromCart('p1');
      });

      const stored = JSON.parse(
        localStorage.getItem('brisee_cart_guest') || '[]',
      );

      expect(stored).toHaveLength(1);
      expect(stored[0].productId).toBe('p2');
    });
  });

  // ============================================================
  // CLEAR CART
  // ============================================================
  describe('clearCart', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => [] });
      renderCart();
      await waitFor(() => expect(capturedContext?.isHydrated).toBe(true));

      act(() => {
        capturedContext?.addToCart(
          { productId: 'p1', nombre: 'A', precio: 1000 },
          3,
        );
      });
    });

    it('debe vaciar el carrito', () => {
      act(() => {
        capturedContext?.clearCart();
      });

      expect(capturedContext?.items).toEqual([]);
      expect(capturedContext?.totalItems).toBe(0);
    });

    it('debe eliminar el carrito de localStorage', () => {
      act(() => {
        capturedContext?.clearCart();
      });

      expect(localStorage.getItem('brisee_cart_guest')).toBeNull();
    });

    it('debe limpiar removedItems', () => {
      act(() => {
        capturedContext?.clearCart();
      });

      expect(capturedContext?.removedItems).toEqual([]);
    });
  });
});
