'use client';

import { useState } from 'react';
import QuantitySelector from '@/components/products/QuantitySelector';
import AddToCartButton from '@/components/products/AddToCartButton';
import styles from './product-card-actions.module.css';

interface ProductCardActionsProps {
  productId: string | number;
  nombre: string;
  precio: number | string;
  imagenUrl: string;
  existencias: number;
  formattedPrice: string;
}

export default function ProductCardActions({
  productId,
  nombre,
  precio,
  imagenUrl,
  existencias,
  formattedPrice,
}: ProductCardActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isQuantityValid, setIsQuantityValid] = useState(true);
  const isSoldOut = existencias <= 0;

  return (
    <div className={styles.actionsWrapper}>
      {/* Contenedor Flex para alinear precio a la izquierda y selector de cantidad a la derecha */}
      <div className={styles.priceRow}>
        <p className={styles.price}>{formattedPrice}</p>
        {!isSoldOut && (
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            onValidityChange={setIsQuantityValid}
            max={existencias}
            disabled={isSoldOut}
          />
        )}
      </div>

      <p className={styles.stock}>
        {existencias > 0
          ? `${existencias} disponibles`
          : 'Producto agotado'}
      </p>

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

