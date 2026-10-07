/* eslint-disable */
/**
 * PRUEBAS UNITARIAS QA - useProductSearch hook
 *
 * Verifica el hook de búsqueda por texto sobre un arreglo de items:
 * - Estado inicial (sin búsqueda, retorna todos los items)
 * - Filtrado por texto (coincidencia parcial)
 * - Normalización (insensible a mayúsculas y tildes)
 * - Flag isSearching
 * - Comportamiento con items vacíos
 */

import { renderHook, act } from '@testing-library/react';
import { useProductSearch } from '@/hooks/useProductSearch';

interface Product {
  id: number;
  nombre: string;
}

const PRODUCTOS: Product[] = [
  { id: 1, nombre: 'Galleta de Chocolate' },
  { id: 2, nombre: 'Macaron de Vainilla' },
  { id: 3, nombre: 'Granola de Almendras' },
  { id: 4, nombre: 'Cookie Dough de Nueces' },
  { id: 5, nombre: 'Café Latte' },
];

const getNombre = (p: Product) => p.nombre;

describe('useProductSearch [QA]', () => {
  // ============================================================
  // ESTADO INICIAL
  // ============================================================
  describe('estado inicial', () => {
    it('debe iniciar con searchTerm vacío', () => {
      const { result } = renderHook(() => useProductSearch(PRODUCTOS, getNombre));

      expect(result.current.searchTerm).toBe('');
    });

    it('debe retornar todos los items cuando no hay búsqueda', () => {
      const { result } = renderHook(() => useProductSearch(PRODUCTOS, getNombre));

      expect(result.current.filteredItems).toHaveLength(5);
      expect(result.current.filteredItems).toEqual(PRODUCTOS);
    });

    it('debe tener isSearching en false cuando el término está vacío', () => {
      const { result } = renderHook(() => useProductSearch(PRODUCTOS, getNombre));

      expect(result.current.isSearching).toBe(false);
    });
  });

  // ============================================================
  // BÚSQUEDA POR TEXTO
  // ============================================================
  describe('búsqueda por texto', () => {
    it('debe filtrar items que coincidan parcialmente', () => {
      const { result } = renderHook(() => useProductSearch(PRODUCTOS, getNombre));

      act(() => {
        result.current.setSearchTerm('Galleta');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].nombre).toBe('Galleta de Chocolate');
    });

    it('debe retornar múltiples items si todos coinciden', () => {
      const { result } = renderHook(() => useProductSearch(PRODUCTOS, getNombre));

      act(() => {
        result.current.setSearchTerm('de');
      });

      // Todos excepto "Café Latte" contienen "de"
      expect(result.current.filteredItems).toHaveLength(4);
    });

    it('debe retornar array vacío si no hay coincidencias', () => {
      const { result } = renderHook(() => useProductSearch(PRODUCTOS, getNombre));

      act(() => {
        result.current.setSearchTerm('pizza');
      });

      expect(result.current.filteredItems).toHaveLength(0);
    });

    it('debe actualizar searchTerm con setSearchTerm', () => {
      const { result } = renderHook(() => useProductSearch(PRODUCTOS, getNombre));

      act(() => {
        result.current.setSearchTerm('chocolate');
      });

      expect(result.current.searchTerm).toBe('chocolate');
    });
  });

  // ============================================================
  // NORMALIZACIÓN
  // ============================================================
  describe('normalización de búsqueda', () => {
    it('debe ser insensible a mayúsculas y minúsculas', () => {
      const { result } = renderHook(() => useProductSearch(PRODUCTOS, getNombre));

      act(() => {
        result.current.setSearchTerm('GALLETA');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].nombre).toBe('Galleta de Chocolate');
    });

    it('debe ser insensible a tildes y acentos', () => {
      const { result } = renderHook(() => useProductSearch(PRODUCTOS, getNombre));

      act(() => {
        result.current.setSearchTerm('cafe');
      });

      // Debe encontrar "Café Latte" sin la tilde
      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].nombre).toBe('Café Latte');
    });

    it('debe funcionar al buscar con tilde un nombre sin tilde', () => {
      const { result } = renderHook(() => useProductSearch(PRODUCTOS, getNombre));

      act(() => {
        result.current.setSearchTerm('mácaron');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].nombre).toBe('Macaron de Vainilla');
    });

    it('debe ignorar espacios al inicio y al final', () => {
      const { result } = renderHook(() => useProductSearch(PRODUCTOS, getNombre));

      act(() => {
        result.current.setSearchTerm('  granola  ');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].nombre).toBe('Granola de Almendras');
    });
  });

  // ============================================================
  // FLAG isSearching
  // ============================================================
  describe('flag isSearching', () => {
    it('debe ser true cuando hay un término de búsqueda', () => {
      const { result } = renderHook(() => useProductSearch(PRODUCTOS, getNombre));

      act(() => {
        result.current.setSearchTerm('galleta');
      });

      expect(result.current.isSearching).toBe(true);
    });

    it('debe ser false si solo contiene espacios en blanco', () => {
      const { result } = renderHook(() => useProductSearch(PRODUCTOS, getNombre));

      act(() => {
        result.current.setSearchTerm('   ');
      });

      expect(result.current.isSearching).toBe(false);
    });

    it('debe volver a false al limpiar la búsqueda', () => {
      const { result } = renderHook(() => useProductSearch(PRODUCTOS, getNombre));

      act(() => {
        result.current.setSearchTerm('galleta');
      });
      expect(result.current.isSearching).toBe(true);

      act(() => {
        result.current.setSearchTerm('');
      });
      expect(result.current.isSearching).toBe(false);
    });
  });

  // ============================================================
  // CASOS LÍMITE
  // ============================================================
  describe('casos límite', () => {
    it('debe manejar un arreglo vacío de items', () => {
      const { result } = renderHook(() => useProductSearch([], getNombre));

      expect(result.current.filteredItems).toEqual([]);

      act(() => {
        result.current.setSearchTerm('cualquier cosa');
      });

      expect(result.current.filteredItems).toEqual([]);
    });

    it('debe retornar todos los items si el término es solo espacios', () => {
      const { result } = renderHook(() => useProductSearch(PRODUCTOS, getNombre));

      act(() => {
        result.current.setSearchTerm('     ');
      });

      expect(result.current.filteredItems).toHaveLength(5);
    });

    it('debe funcionar con wrappers { product, node }', () => {
      interface Wrapper {
        product: Product;
        node: unknown;
      }

      const wrapped: Wrapper[] = PRODUCTOS.map((p) => ({
        product: p,
        node: null,
      }));

      const { result } = renderHook(() =>
        useProductSearch(wrapped, (w) => w.product.nombre),
      );

      act(() => {
        result.current.setSearchTerm('macaron');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].product.nombre).toBe(
        'Macaron de Vainilla',
      );
    });
  });
});
