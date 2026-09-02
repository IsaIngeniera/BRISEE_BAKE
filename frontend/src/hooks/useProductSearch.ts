'use client';

import { useMemo, useState } from 'react';
import { normalizeText } from '../utils/normalize-text';

interface UseProductSearchResult<T> {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filteredItems: T[];
  isSearching: boolean;
}

/**
 * Filtra un arreglo de items por texto (coincidencia parcial,
 * sin distinguir mayúsculas/minúsculas ni tildes).
 *
 * `getSearchableText` extrae el texto contra el que se compara
 * (ej. el nombre del producto), para que este hook sirva tanto
 * para productos "planos" como para wrappers como { product, node }.
 */
export function useProductSearch<T>(
  items: T[],
  getSearchableText: (item: T) => string,
): UseProductSearchResult<T> {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);

    if (!normalizedSearch) {
      return items;
    }

    return items.filter((item) =>
      normalizeText(getSearchableText(item)).includes(normalizedSearch),
    );
  }, [items, searchTerm, getSearchableText]);

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching: searchTerm.trim().length > 0,
  };
}