'use client';

import { useMemo, useState } from 'react';
import { normalizeText } from '../utils/normalize-text';

interface UseProductFiltersOptions<T> {
  getSearchableText: (item: T) => string;
  getTags: (item: T) => string[];
}

interface UseProductFiltersResult<T> {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  activeTags: Set<string>;
  toggleTag: (tag: string) => void;
  clearTags: () => void;
  filteredItems: T[];
  isSearching: boolean;
  hasActiveFilters: boolean;
}

/**
 * Combina búsqueda por texto + filtros dietéticos sobre un arreglo de items.
 *
 * - Búsqueda: coincidencia parcial, sin tildes/mayúsculas.
 * - Filtros dietéticos: un producto debe tener TODAS las etiquetas activas
 *   (lógica AND). Sin filtros activos, no se excluye nada por tags.
 * - Ambos criterios se aplican en simultáneo: se filtra primero por tags y
 *   sobre ese resultado se busca por texto.
 */
export function useProductFilters<T>(
  items: T[],
  { getSearchableText, getTags }: UseProductFiltersOptions<T>,
): UseProductFiltersResult<T> {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);

      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }

      return next;
    });
  };

  const clearTags = () => setActiveTags(new Set());

  const filteredItems = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);

    const dietaryFiltered =
      activeTags.size === 0
        ? items
        : items.filter((item) => {
            const itemTags = getTags(item);
            return Array.from(activeTags).every((tag) =>
              itemTags.includes(tag),
            );
          });

    if (!normalizedSearch) {
      return dietaryFiltered;
    }

    return dietaryFiltered.filter((item) => {
      const nameMatch = normalizeText(getSearchableText(item)).includes(normalizedSearch);
      
      const tagMatch = getTags(item).some((tag) => 
        normalizeText(tag.replaceAll('_', ' ')).includes(normalizedSearch)
      );
      
      return nameMatch || tagMatch;
    });
  }, [items, searchTerm, activeTags, getSearchableText, getTags]);

  return {
    searchTerm,
    setSearchTerm,
    activeTags,
    toggleTag,
    clearTags,
    filteredItems,
    isSearching: searchTerm.trim().length > 0,
    hasActiveFilters: activeTags.size > 0,
  };
}