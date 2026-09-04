'use client';

import styles from './dietary-filter-chips.module.css';

interface DietaryFilterOption {
  value: string;
  label: string;
}

interface DietaryFilterChipsProps {
  options: DietaryFilterOption[];
  activeTags: Set<string>;
  onToggle: (tag: string) => void;
  onClear: () => void;
}

export default function DietaryFilterChips({
  options,
  activeTags,
  onToggle,
  onClear,
}: DietaryFilterChipsProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.chipsContainer}
      role="group"
      aria-label="Filtros dietéticos"
    >
      {options.map((option) => {
        const isActive = activeTags.has(option.value);

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
            aria-pressed={isActive}
            className={`${styles.chip} ${
              isActive ? styles.chipActive : ''
            }`}
          >
            {option.label}
          </button>
        );
      })}

      {activeTags.size > 0 && (
        <button
          type="button"
          onClick={onClear}
          className={styles.clearButton}
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}