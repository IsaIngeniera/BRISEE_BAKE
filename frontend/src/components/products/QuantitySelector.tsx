'use client';

import { useState } from 'react';
import styles from './quantity-selector.module.css';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  onValidityChange?: (isValid: boolean) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

function isPositiveInteger(rawValue: string): boolean {
  return /^[1-9]\d*$/.test(rawValue.trim());
}
export default function QuantitySelector({
  value,
  onChange,
  onValidityChange,
  min = 1,
  max,
  disabled = false,
}: QuantitySelectorProps) {
  const [inputValue, setInputValue] = useState(String(value));
  const [error, setError] = useState<string | null>(null);

  const commitValue = (nextValue: number) => {
    const clamped =
      max !== undefined ? Math.min(nextValue, max) : nextValue;

    setInputValue(String(clamped));
    setError(null);
    onValidityChange?.(true);
    onChange(clamped);
  };

  const handleInputChange = (rawValue: string) => {
    setInputValue(rawValue);

    if (!isPositiveInteger(rawValue)) {
      setError(
        'Solo se aceptan números enteros positivos mayores a 0.',
      );
      onValidityChange?.(false);
      return;
    }

    const parsed = Number(rawValue);

    if (max !== undefined && parsed > max) {
      setError(`Solo hay ${max} unidades disponibles.`);
      onValidityChange?.(false);
      return;
    }

    setError(null);
    onValidityChange?.(true);
    onChange(parsed);
  };

  const handleBlur = () => {
    if (!isPositiveInteger(inputValue)) {
      // Al perder el foco con un valor inválido, se restaura el último válido
      commitValue(value);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepButton}
          onClick={() => commitValue(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
          aria-label="Disminuir cantidad"
        >
          -
        </button>

        <input
          type="text"
          inputMode="numeric"
          className={styles.input}
          value={inputValue}
          onChange={(event) => handleInputChange(event.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          aria-label="Cantidad"
          aria-invalid={Boolean(error)}
        />

        <button
          type="button"
          className={styles.stepButton}
          onClick={() => commitValue(value + 1)}
          disabled={disabled || (max !== undefined && value >= max)}
          aria-label="Aumentar cantidad"
        >
          +
        </button>
      </div>

      {error && (
        <p className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}