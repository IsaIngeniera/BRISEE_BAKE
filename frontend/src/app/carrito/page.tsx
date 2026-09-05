'use client';

import Link from 'next/link';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

import CartItemRow from '@/components/cart/CartItemRow';
import { useCart } from '@/hooks/useCart';
import type { CartItem } from '@/context/CartContext';

import styles from './carrito.module.css';

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

export default function CarritoPage() {
  const {
    items,
    loadError,
    removedItems,
    isHydrated,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const total = items.reduce(
    (sum, item) => sum + Number(item.precio) * item.cantidad,
    0,
  );

  // Evita mostrar "carrito vacío" un instante antes de que llegue la
  // respuesta real del backend.
  if (!isHydrated) {
    return (
      <div className={styles.page}>
        <section className={styles.stateMessage}>
          <p>Cargando tu carrito...</p>
        </section>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <section className={styles.stateMessage} role="alert">
          <p>No se pudo cargar tu carrito, intenta nuevamente</p>
        </section>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <section className={styles.stateMessage}>
          <ShoppingCart aria-hidden="true" className={styles.emptyIcon} />
          <p>Tu carrito está vacío</p>
          <p className={styles.emptyTotal}>Total: {formatPrice(total)}</p>
          <Link href="/catalogo" className={styles.goToCatalogButton}>
            Ir al catálogo
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link href="/catalogo" className={styles.backButton}>
        <ArrowLeft aria-hidden="true" />
        Volver al catálogo
      </Link>

      <section className={styles.heading}>
        <h1>Mi carrito</h1>

        <div className={styles.decorativeLine} aria-hidden="true">
          <span />
          <span>❀</span>
          <span />
        </div>

        <p>
          Revisa los productos que has seleccionado y continúa con tu compra.
        </p>
      </section>

      {removedItems && removedItems.length > 0 && (
        <section className={styles.warningBanner} role="alert">
          <p>
            {removedItems.length === 1
              ? `"${removedItems[0]}" ya no está disponible y fue retirado de tu carrito.`
              : `Los siguientes productos ya no están disponibles y fueron retirados de tu carrito: ${removedItems.join(', ')}.`}
          </p>
        </section>
      )}

      <div className={styles.itemsList}>
        {items.map((item: CartItem) => (
          <CartItemRow
            key={item.productId}
            item={item}
            onQuantityChange={updateQuantity}
            onRemove={removeFromCart}
          />
        ))}
      </div>

      <section className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Total</span>
          <strong>{formatPrice(total)}</strong>
        </div>

        <button type="button" className={styles.checkoutButton}>
          Continuar al pago
        </button>
      </section>
    </div>
  );
}