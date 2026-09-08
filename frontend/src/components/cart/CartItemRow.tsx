'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';

import QuantitySelector from '@/components/products/QuantitySelector';
import type { CartItem } from '@/context/CartContext';

import styles from './cart-item-row.module.css';

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (productId: CartItem['productId'], value: number) => void;
  onRemove: (productId: CartItem['productId']) => void;
}

function formatPrice(price: number | string): string {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return 'COP $ 0';
  }

  const formatted = numericPrice.toLocaleString('es-CO', {
    maximumFractionDigits: 0,
  });
  
  return `COP $ ${formatted}`;
}

export default function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
}: CartItemRowProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const subtotal = Number(item.precio) * item.cantidad;

  const handleRemoveClick = () => {
    setIsModalOpen(true);
  };

  const confirmRemove = () => {
    setIsModalOpen(false);
    onRemove(item.productId);
  };

  const cancelRemove = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <article className={styles.row}>
        <div className={styles.imageContainer}>
          <Image
            src={item.imagenUrl ?? '/images/catalogo/producto-placeholder.jpg'}
            alt={item.nombre}
            fill
            sizes="100px"
            unoptimized
          />
        </div>

        <div className={styles.info}>
          <h3>{item.nombre}</h3>
          <p className={styles.unitPrice}>{formatPrice(item.precio)}</p>
        </div>

        <div className={styles.quantityColumn}>
          <QuantitySelector
            value={item.cantidad}
            onChange={(value) => onQuantityChange(item.productId, value)}
          />
        </div>

        <div className={styles.subtotalColumn}>
          <p>{formatPrice(subtotal)}</p>
        </div>

        <button
          type="button"
          className={styles.removeButton}
          onClick={handleRemoveClick}
          aria-label={`Quitar ${item.nombre} del carrito`}
          title="Quitar del carrito"
        >
          <Trash2 aria-hidden="true" />
        </button>
      </article>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>¿Quitar del carrito?</h2>
            <p>
              ¿Estás seguro de que deseas quitar <strong>{item.nombre}</strong> del carrito?
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={cancelRemove}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                onClick={confirmRemove}
              >
                Sí, quitar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}