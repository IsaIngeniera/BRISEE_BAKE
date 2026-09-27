'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  ShoppingCart,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import CartItemRow from '@/components/cart/CartItemRow';
import type { CartItem } from '@/context/CartContext';
import { useCart } from '@/hooks/useCart';
import { getSessionUser } from '@/services/auth';

import styles from './carrito.module.css';

type OrderResponse = {
  id?: string;
  numeroPedido?: string;
  codigo?: string;
  whatsappUrl?: string;
  message?: string | string[];
};

type ConfirmedOrder = {
  number: string;
  items: CartItem[];
  total: number;
  whatsappUrl: string | null;
};

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

function getOrderNumber(data: OrderResponse): string {
  if (data.numeroPedido) return data.numeroPedido;
  if (data.codigo) return data.codigo;

  // Si el backend solamente incluye el número en el mensaje
  // generado para WhatsApp, lo recuperamos de allí.
  if (data.whatsappUrl) {
    try {
      const url = new URL(data.whatsappUrl);
      const previousMessage = url.searchParams.get('text') || '';
      const match = previousMessage.match(/#([A-Za-z0-9-]+)/);

      if (match) return match[1];
    } catch {
      // La ausencia de una URL válida se maneja en la confirmación.
    }
  }

  return data.id || '';
}

function getCustomerName(): string {
  const user = getSessionUser();

  if (!user) return '';

  try {
    const saved = JSON.parse(
      localStorage.getItem(`brisee_profile_${user.sub}`) || '{}',
    ) as { nombre?: unknown; apellido?: unknown };

    const nombre =
      typeof saved.nombre === 'string'
        ? saved.nombre.trim()
        : '';
    const apellido =
      typeof saved.apellido === 'string'
        ? saved.apellido.trim()
        : '';

    return [nombre, apellido].filter(Boolean).join(' ');
  } catch {
    return '';
  }
}

function buildWhatsAppUrl(
  originalUrl: string | null,
  order: ConfirmedOrder,
): string | null {
  if (!originalUrl) return null;

  try {
    const url = new URL(originalUrl);

    // Se conserva el número de WhatsApp enviado por el backend.
    if (
      url.protocol !== 'https:' ||
      !['wa.me', 'api.whatsapp.com'].includes(url.hostname)
    ) {
      return null;
    }

    const customerName = getCustomerName();
    const products = order.items
      .map((item) => `• ${item.nombre} × ${item.cantidad}`)
      .join('\n');

    const message = [
      '¡Hola, Brisée Bake!',
      customerName
        ? `Soy ${customerName} y acabo de realizar un pedido.`
        : 'Acabo de realizar un pedido.',
      order.number ? `Mi número de pedido es #${order.number}.` : '',
      '',
      'Estos son los productos que elegí:',
      products,
      '',
      `Total del pedido: ${formatPrice(order.total)}`,
      '',
      '¿Podemos coordinar los detalles de la entrega? ¡Muchas gracias!',
    ]
      .filter((line) => line !== undefined)
      .join('\n');

    url.searchParams.set('text', message);

    return url.toString();
  } catch {
    return null;
  }
}

export default function CarritoPage() {
  const [hasSession, setHasSession] = useState<boolean | null>(
    null,
  );
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [confirmedOrder, setConfirmedOrder] =
    useState<ConfirmedOrder | null>(null);

  const {
    items,
    loadError,
    removedItems,
    isHydrated,
    updateQuantity,
    removeFromCart,
    refreshCart,
  } = useCart();

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasSession(Boolean(getSessionUser()));
  }, []);

  const total = items.reduce(
    (sum, item) => sum + Number(item.precio) * item.cantidad,
    0,
  );

  async function handleCheckout() {
    if (isCheckingOut || confirmedOrder) return;

    setCheckoutError('');
    setIsCheckingOut(true);

    // Conservamos el resumen antes de actualizar el carrito.
    const purchasedItems = items.map((item) => ({ ...item }));
    const purchasedTotal = total;

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:3001';

      const payloadItems = purchasedItems.map((item) => ({
        idProducto: item.productId,
        cantidad: item.cantidad,
      }));

      const response = await fetch(`${apiUrl}/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          direccionEntrega: 'Por definir',
          ciudad: 'Por definir',
          tipoEntrega: 'RETIRO',
          observacionesEntrega: 'Generado desde el carrito',
          items: payloadItems,
        }),
      });

      const data: OrderResponse = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message[0]
          : data.message;

        throw new Error(
          message || 'No fue posible registrar el pedido.',
        );
      }

      setConfirmedOrder({
        number: getOrderNumber(data),
        items: purchasedItems,
        total: purchasedTotal,
        whatsappUrl: data.whatsappUrl || null,
      });

      void refreshCart();
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : 'Hubo un problema al registrar el pedido.',
      );

    } finally {
      setIsCheckingOut(false);
    }
  }

  function openWhatsApp() {
    if (!confirmedOrder) return;

    const url = buildWhatsAppUrl(
      confirmedOrder.whatsappUrl,
      confirmedOrder,
    );

    if (url) {
      window.location.href = url;
    }
  }

  if (!isHydrated && !confirmedOrder) {
    return (
      <div className={styles.page}>
        <section className={styles.stateMessage}>
          <p>Cargando tu carrito...</p>
        </section>
      </div>
    );
  }

  if (loadError && !confirmedOrder) {
    return (
      <div className={styles.page}>
        <section
          className={styles.stateMessage}
          role="alert"
        >
          <p>
            No se pudo cargar tu carrito, intenta nuevamente.
          </p>
        </section>
      </div>
    );
  }

  if (items.length === 0 && !confirmedOrder) {
    return (
      <div className={styles.page}>
        <section className={styles.stateMessage}>
          <ShoppingCart
            aria-hidden="true"
            className={styles.emptyIcon}
          />
          <p>Tu carrito está vacío</p>

          <p className={styles.emptyTotal}>
            Total: {formatPrice(total)}
          </p>

          <Link
            href="/catalogo"
            className={styles.goToCatalogButton}
          >
            Ir al catálogo
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link
        href="/catalogo"
        className={styles.backButton}
      >
        <ArrowLeft aria-hidden="true" />
        Volver al catálogo
      </Link>

      <section className={styles.heading}>
        <h1>Mi carrito</h1>

        <div
          className={styles.decorativeLine}
          aria-hidden="true"
        >
          <span />
          <span>❀</span>
          <span />
        </div>

        <p>
          Revisa los productos que has seleccionado y continúa
          con tu compra.
        </p>
      </section>

      {removedItems && removedItems.length > 0 && (
        <section
          className={styles.warningBanner}
          role="alert"
        >
          <p>
            {removedItems.length === 1
              ? `"${removedItems[0]}" ya no está disponible y fue retirado de tu carrito.`
              : `Los siguientes productos ya no están disponibles y fueron retirados de tu carrito: ${removedItems.join(', ')}.`}
          </p>
        </section>
      )}

      {!confirmedOrder && (
        <>
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

            {checkoutError && (
              <p role="alert" className={styles.checkoutError}>
                {checkoutError}
              </p>
            )}

            {hasSession === null ? null : hasSession ? (
              <button
                type="button"
                className={styles.checkoutButton}
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut
                  ? 'Procesando...'
                  : 'Continuar con la compra'}
              </button>
            ) : (
              <Link
                href="/registro?from=carrito"
                className={styles.checkoutButton}
              >
                Continuar con la compra
              </Link>
            )}
          </section>
        </>
      )}

      {confirmedOrder && (
        <section
          className={styles.confirmationCard}
          aria-labelledby="order-confirmation-title"
          role="status"
        >
          <CheckCircle2
            className={styles.confirmationIcon}
            aria-hidden="true"
          />

          <p className={styles.confirmationEyebrow}>
            BRISÉE BAKE
          </p>

          <h2 id="order-confirmation-title">
            ¡Pedido registrado!
          </h2>

          <p className={styles.confirmationIntro}>
            Preparamos este resumen para que puedas coordinar
            los detalles de tu entrega por WhatsApp.
          </p>

          {confirmedOrder.number && (
            <p className={styles.orderNumber}>
              Pedido <strong>#{confirmedOrder.number}</strong>
            </p>
          )}

          <ul className={styles.confirmationItems}>
            {confirmedOrder.items.map((item) => (
              <li key={item.productId}>
                <span>
                  {item.nombre} × {item.cantidad}
                </span>
                <strong>
                  {formatPrice(
                    Number(item.precio) * item.cantidad,
                  )}
                </strong>
              </li>
            ))}
          </ul>

          <p className={styles.confirmationTotal}>
            <span>Total del pedido</span>
            <strong>
              {formatPrice(confirmedOrder.total)}
            </strong>
          </p>

          {confirmedOrder.whatsappUrl ? (
            <button
              type="button"
              className={styles.whatsappButton}
              onClick={openWhatsApp}
            >
              <MessageCircle aria-hidden="true" />
              Abrir WhatsApp
            </button>
          ) : (
            <p className={styles.checkoutError}>
              El pedido quedó registrado, pero no recibimos
              el enlace de WhatsApp. Conserva tu número de
              pedido para comunicarte con la tienda.
            </p>
          )}

          <p className={styles.confirmationNote}>
            Podrás revisar el mensaje antes de enviarlo.
          </p>
        </section>
      )}
    </div>
  );
}