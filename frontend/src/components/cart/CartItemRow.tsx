'use client';

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
    return '$ 0';
  }

  return numericPrice.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

export default function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
}: CartItemRowProps) {
  const subtotal = Number(item.precio) * item.cantidad;

  return (
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
        onClick={() => onRemove(item.productId)}
        aria-label={`Quitar ${item.nombre} del carrito`}
        title="Quitar del carrito"
      >
        <Trash2 aria-hidden="true" />
      </button>
    </article>
  );
}