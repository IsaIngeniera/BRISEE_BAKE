'use client';

import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { useProductFilters } from '@/hooks/useProductFilters';
import ProductSearchBar from './ProductSearchBar';
import styles from './product-catalog-grid.module.css';

interface FilterableProduct {
  nombre: string;
  etiquetas: string[];
}

interface CatalogItem<T extends FilterableProduct> {
  product: T;
  node: ReactNode;
}

interface ProductCatalogGridProps<T extends FilterableProduct> {
  items: CatalogItem<T>[];
  renderExtra?: ReactNode;
  gridClassName: string;
  gridAriaLabel: string;
  emptyCategoryMessage: ReactNode;
  emptyCategoryClassName: string;
  searchPlaceholder?: string;
}

function formatDietaryLabel(tag: string): string {
  return tag
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export default function ProductCatalogGrid<T extends FilterableProduct>({
  items,
  renderExtra,
  gridClassName,
  gridAriaLabel,
  emptyCategoryMessage,
  emptyCategoryClassName,
  searchPlaceholder,
}: ProductCatalogGridProps<T>) {
  const {
    searchTerm,
    setSearchTerm,
    activeTags,
    toggleTag,
    clearTags,
    filteredItems,
    isSearching,
    hasActiveFilters,
  } = useProductFilters(items, {
    getSearchableText: (item) => item.product.nombre,
    getTags: (item) => item.product.etiquetas,
  });

  const hasNoProductsAtAll = items.length === 0;
  const hasNoMatches =
    (isSearching || hasActiveFilters) && filteredItems.length === 0;

  return (
    <>
      {!hasNoProductsAtAll && (
        <>
          <ProductSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={searchPlaceholder}
          />
        </>
      )}

      {hasNoProductsAtAll ? (
        <section className={emptyCategoryClassName}>
          {emptyCategoryMessage}
        </section>
      ) : hasNoMatches ? (
        <section className={styles.noResults} role="status">
          <p>No se encontraron productos para tu búsqueda</p>
        </section>
      ) : (
        <section className={gridClassName} aria-label={gridAriaLabel}>
          {filteredItems.map((item) => item.node)}
          {!isSearching && !hasActiveFilters && renderExtra}
        </section>
      )}
    </>
  );
}