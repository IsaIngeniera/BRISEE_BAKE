'use client';

import { useState } from 'react';
import QuantitySelector from '@/components/products/QuantitySelector';
import AddToCartButton from '@/components/products/AddToCartButton';
import styles from './product-detail-actions.module.css';

interface ProductDetailActionsProps {
  productId: string | number;
  nombre: string;
  precio: number | string;
  imagenUrl?: string;
  existencias: number;
}

export default function ProductDetailActions({
  productId,
  nombre,
  precio,
  imagenUrl,
  existencias,
}: ProductDetailActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isQuantityValid, setIsQuantityValid] = useState(true);
  const isSoldOut = existencias <= 0;

  return (
    <div className={styles.detailActionsWrapper}>
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
        nombre={nombre}
        precio={precio}
        imagenUrl={imagenUrl}
        quantity={quantity}
        disabled={isSoldOut || !isQuantityValid}
      />
    </div>
  );
}

