'use client';

import { Search } from 'lucide-react';

import styles from './product-search-bar.module.css';

interface ProductSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function ProductSearchBar({
  value,
  onChange,
  placeholder = 'Buscar producto...',
}: ProductSearchBarProps) {
  return (
    <div className={styles.searchBar}>
      <Search aria-hidden="true" className={styles.searchIcon} />

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Buscar producto en el catálogo"
        className={styles.searchInput}
      />
    </div>
  );
}