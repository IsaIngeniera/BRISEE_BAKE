'use client';

import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import styles from './product-search-bar.module.css';

interface ProductSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  activeTags?: Set<string>;
  toggleTag?: (tag: string) => void;
  clearTags?: () => void;
  hasActiveFilters?: boolean;
}

const DIETARY_LABELS = [
  'SIN_AZUCAR',
  'SIN_GLUTEN',
  'KETO',
  'VEGANO',
  'LIBRE_DE_LACTEOS',
];

export default function ProductSearchBar({
  value,
  onChange,
  placeholder = 'Buscar producto...',
  activeTags = new Set(),
  toggleTag,
  clearTags,
  hasActiveFilters = false,
}: ProductSearchBarProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.searchBar} ref={containerRef}>
      <Search aria-hidden="true" className={styles.searchIcon} />

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsPopoverOpen(true)}
        placeholder={placeholder}
        aria-label="Buscar producto en el catálogo"
        className={styles.searchInput}
      />

      {isPopoverOpen && toggleTag && (
        <div className={styles.filtersPopover}>
          <div className={styles.filtersHeader}>
            Filtros dietéticos
            {hasActiveFilters && clearTags && (
              <button
                type="button"
                onClick={clearTags}
                className={styles.clearButton}
              >
                Limpiar filtros
              </button>
            )}
          </div>
          <div className={styles.filtersList}>
            {DIETARY_LABELS.map((label) => {
              const isActive = activeTags.has(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleTag(label)}
                  className={`${styles.filterTag} ${isActive ? styles.filterTagActive : ''}`}
                >
                  {label.replaceAll('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}