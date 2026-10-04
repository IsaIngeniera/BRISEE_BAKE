/**
 * PRUEBAS UNITARIAS QA - useProductFilters hook
 *
 * Verifica el hook que combina búsqueda por texto + filtros dietéticos:
 * - Estado inicial
 * - Filtrado por texto (normalizado)
 * - Toggle de etiquetas (agregar / quitar)
 * - Lógica AND con múltiples etiquetas activas
 * - Combinación de búsqueda + filtros
 * - Limpieza de etiquetas (clearTags)
 * - Flags isSearching y hasActiveFilters
 * - Búsqueda por nombre de etiqueta
 */

import { renderHook, act } from '@testing-library/react';
import { useProductFilters } from '@/hooks/useProductFilters';

interface Product {
  id: number;
  nombre: string;
  tags: string[];
}

const PRODUCTOS: Product[] = [
  { id: 1, nombre: 'Galleta de Chocolate', tags: ['SIN_GLUTEN'] },
  { id: 2, nombre: 'Macaron de Vainilla', tags: ['SIN_GLUTEN', 'VEGANO'] },
  { id: 3, nombre: 'Granola de Almendras', tags: ['VEGANO'] },
  { id: 4, nombre: 'Cookie Dough de Nueces', tags: [] },
  { id: 5, nombre: 'Brownie Clásico', tags: ['SIN_LACTOSA'] },
];

const options = {
  getSearchableText: (p: Product) => p.nombre,
  getTags: (p: Product) => p.tags,
};

describe('useProductFilters [QA]', () => {
  // ============================================================
  // ESTADO INICIAL
  // ============================================================
  describe('estado inicial', () => {
    it('debe iniciar con searchTerm vacío', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      expect(result.current.searchTerm).toBe('');
    });

    it('debe iniciar con un Set vacío de etiquetas activas', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      expect(result.current.activeTags).toBeInstanceOf(Set);
      expect(result.current.activeTags.size).toBe(0);
    });

    it('debe retornar todos los items sin filtros aplicados', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      expect(result.current.filteredItems).toHaveLength(5);
    });

    it('debe tener los flags en false inicialmente', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      expect(result.current.isSearching).toBe(false);
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  // ============================================================
  // BÚSQUEDA POR TEXTO
  // ============================================================
  describe('búsqueda por texto', () => {
    it('debe filtrar por coincidencia parcial del nombre', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.setSearchTerm('galleta');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].nombre).toBe('Galleta de Chocolate');
    });

    it('debe ser insensible a mayúsculas y tildes', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.setSearchTerm('MACARÓN');
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].nombre).toBe('Macaron de Vainilla');
    });

    it('debe activar isSearching cuando hay texto', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.setSearchTerm('cookie');
      });

      expect(result.current.isSearching).toBe(true);
    });

    it('debe retornar array vacío si no hay coincidencias', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.setSearchTerm('pizza');
      });

      expect(result.current.filteredItems).toHaveLength(0);
    });

    it('debe permitir buscar por nombre de etiqueta (sin guion bajo)', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.setSearchTerm('vegano');
      });

      // Macaron y Granola tienen tag VEGANO
      expect(result.current.filteredItems).toHaveLength(2);
      const nombres = result.current.filteredItems.map((p) => p.nombre);
      expect(nombres).toContain('Macaron de Vainilla');
      expect(nombres).toContain('Granola de Almendras');
    });

    it('debe reemplazar guion bajo por espacio al buscar en tags', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.setSearchTerm('sin gluten');
      });

      // Galleta y Macaron tienen tag SIN_GLUTEN
      expect(result.current.filteredItems).toHaveLength(2);
    });
  });

  // ============================================================
  // TOGGLE DE ETIQUETAS
  // ============================================================
  describe('toggleTag', () => {
    it('debe agregar una etiqueta al Set cuando no está activa', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.toggleTag('VEGANO');
      });

      expect(result.current.activeTags.has('VEGANO')).toBe(true);
      expect(result.current.activeTags.size).toBe(1);
    });

    it('debe quitar una etiqueta del Set cuando ya está activa', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.toggleTag('VEGANO');
      });
      expect(result.current.activeTags.has('VEGANO')).toBe(true);

      act(() => {
        result.current.toggleTag('VEGANO');
      });
      expect(result.current.activeTags.has('VEGANO')).toBe(false);
    });

    it('debe filtrar items con la etiqueta activa', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.toggleTag('VEGANO');
      });

      expect(result.current.filteredItems).toHaveLength(2);
      const ids = result.current.filteredItems.map((p) => p.id);
      expect(ids).toEqual([2, 3]);
    });

    it('debe aplicar lógica AND con múltiples etiquetas', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.toggleTag('VEGANO');
        result.current.toggleTag('SIN_GLUTEN');
      });

      // Solo "Macaron" tiene ambas etiquetas
      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].nombre).toBe('Macaron de Vainilla');
    });

    it('debe activar hasActiveFilters cuando hay etiquetas', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.toggleTag('VEGANO');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  // ============================================================
  // clearTags
  // ============================================================
  describe('clearTags', () => {
    it('debe limpiar todas las etiquetas activas', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.toggleTag('VEGANO');
        result.current.toggleTag('SIN_GLUTEN');
      });
      expect(result.current.activeTags.size).toBe(2);

      act(() => {
        result.current.clearTags();
      });

      expect(result.current.activeTags.size).toBe(0);
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('debe retornar todos los items después de limpiar etiquetas', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.toggleTag('VEGANO');
      });
      expect(result.current.filteredItems).toHaveLength(2);

      act(() => {
        result.current.clearTags();
      });

      expect(result.current.filteredItems).toHaveLength(5);
    });
  });

  // ============================================================
  // COMBINACIÓN: BÚSQUEDA + FILTROS
  // ============================================================
  describe('combinación búsqueda + filtros', () => {
    it('debe aplicar búsqueda y filtros dietéticos simultáneamente', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.toggleTag('VEGANO');
      });

      act(() => {
        result.current.setSearchTerm('granola');
      });

      // De los veganos (Macaron y Granola), solo "Granola" coincide con "granola"
      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].nombre).toBe('Granola de Almendras');
    });

    it('debe retornar vacío si la búsqueda no coincide con los filtrados por tag', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.toggleTag('VEGANO');
      });

      act(() => {
        result.current.setSearchTerm('brownie');
      });

      // Brownie no es VEGANO, aunque exista en el catálogo
      expect(result.current.filteredItems).toHaveLength(0);
    });

    it('debe tener ambos flags activos simultáneamente', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.toggleTag('VEGANO');
        result.current.setSearchTerm('granola');
      });

      expect(result.current.isSearching).toBe(true);
      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  // ============================================================
  // CASOS LÍMITE
  // ============================================================
  describe('casos límite', () => {
    it('debe manejar un arreglo vacío', () => {
      const { result } = renderHook(() => useProductFilters([], options));

      expect(result.current.filteredItems).toEqual([]);

      act(() => {
        result.current.setSearchTerm('cualquier cosa');
      });

      expect(result.current.filteredItems).toEqual([]);
    });

    it('debe tratar un término solo con espacios como sin búsqueda', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.setSearchTerm('   ');
      });

      expect(result.current.filteredItems).toHaveLength(5);
      expect(result.current.isSearching).toBe(false);
    });

    it('debe mantener los items originales si el toggle agrega una tag inexistente', () => {
      const { result } = renderHook(() => useProductFilters(PRODUCTOS, options));

      act(() => {
        result.current.toggleTag('ETIQUETA_INEXISTENTE');
      });

      // Ningún item tiene esa etiqueta → arreglo vacío
      expect(result.current.filteredItems).toHaveLength(0);
    });
  });
});
