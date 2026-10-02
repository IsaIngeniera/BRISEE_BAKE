'use client';

import { useState } from 'react';
import QuantitySelector from '@/components/products/QuantitySelector';
import AddToCartButton from '@/components/products/AddToCartButton';
import styles from './product-detail-actions.module.css';
import {
  getProductOptionLabel,
  type ProductVariant,
} from '@/utils/product-variants';

interface ProductDetailActionsProps {
  productId: string | number;
  nombre: string;
  precio: number | string;
  imagenUrl?: string;
  existencias: number;
  variants?: ProductVariant[];
  requiresTheme?: boolean;
}

export default function ProductDetailActions({
  productId,
  nombre,
  precio,
  imagenUrl,
  existencias,
  variants = [],
  requiresTheme = false,
}: ProductDetailActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isQuantityValid, setIsQuantityValid] = useState(true);
  const [theme, setTheme] = useState('');
  const selectedVariant =
    variants.find((variant) => variant.id === productId) ?? variants[0];
  const selectedProduct = selectedVariant ?? {
    id: productId,
    nombre,
    precio,
    imagenUrl,
    existencias,
  };
  const isSoldOut = selectedProduct.existencias <= 0;
  const normalizedTheme = theme.trim();

  return (
    <div className={styles.detailActionsWrapper}>
      {variants.length > 1 && (
        <fieldset className={styles.optionsFieldset}>
          <legend>Tamaño</legend>
          <div className={styles.options}>
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                className={
                  variant.id === selectedProduct.id
                    ? styles.selectedOption
                    : styles.option
                }
                onClick={() => {
                  window.history.replaceState(
                    null,
                    '',
                    `/producto/${variant.id}`,
                  );
                  window.location.reload();
                }}
              >
                {getProductOptionLabel(variant)}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {requiresTheme && (
        <div className={styles.themeField}>
          <label htmlFor="macaron-theme">Temática del macaron</label>
          <input
            id="macaron-theme"
            type="text"
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
            placeholder="Ej. cumpleaños, flores o temática infantil"
            maxLength={120}
            required
          />
          {!normalizedTheme && (
            <p className={styles.themeHint}>
              Escribe una temática para continuar.
            </p>
          )}
        </div>
      )}

      {variants.length > 1 && (
        <p className={styles.selectedPrice}>
          {Number(selectedProduct.precio).toLocaleString('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
          })}
        </p>
      )}

      {!isSoldOut && (
        <div className={styles.quantityRow}>
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            onValidityChange={setIsQuantityValid}
            max={existencias}
            disabled={isSoldOut}
          />
        </div>
      )}

      <AddToCartButton
        productId={productId}
        nombre={selectedProduct.nombre}
        precio={selectedProduct.precio}
        imagenUrl={selectedProduct.imagenUrl}
        tematica={normalizedTheme || undefined}
        quantity={quantity}
        disabled={
          isSoldOut ||
          !isQuantityValid ||
          (requiresTheme && !normalizedTheme)
        }
        disabledLabel={
          isSoldOut
            ? 'Agotado'
            : !normalizedTheme && requiresTheme
              ? 'Completa la temática'
              : 'Agotado'
        }
      />
    </div>
  );
}
