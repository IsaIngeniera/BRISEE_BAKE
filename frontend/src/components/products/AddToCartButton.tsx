'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import styles from './add-to-cart-button.module.css';

interface AddToCartButtonProps {
  productId: string | number;
  nombre: string;
  precio: number | string;
  imagenUrl?: string;
  tematica?: string;
  quantity?: number;
  maxQuantity?: number;
  disabled?: boolean;
  disabledLabel?: string;
}

export default function AddToCartButton({
  productId,
  nombre,
  precio,
  imagenUrl,
  tematica,
  quantity = 1,
  disabled = false,
  disabledLabel = 'Agotado',
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  const handleAddToCart = () => {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return;
    }

    addToCart({ productId, nombre, precio, imagenUrl, tematica }, quantity);

    setConfirmationVisible(true);
    window.setTimeout(() => setConfirmationVisible(false), 2500);
  };

  if (disabled) {
    return (
      <button type="button" className={styles.disabledButton} disabled>
        {disabledLabel}
      </button>
    );
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.addButton}
        onClick={handleAddToCart}
      >
        <ShoppingCart aria-hidden="true" />
        Añadir al carrito
      </button>

      {confirmationVisible && (
        <p className={styles.confirmationMessage} role="status">
          Producto agregado al carrito
        </p>
      )}
    </div>
  );
}