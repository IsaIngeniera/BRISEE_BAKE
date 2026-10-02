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
import {
  AUTH_TOKEN_KEY,
  getSessionUser,
} from '@/services/auth';

import styles from './carrito.module.css';

type OrderResponse = {
  pedidoId?: string;
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

type DeliveryMethod = 'DOMICILIO' | 'RETIRO';
type CheckoutStep = 'METHOD' | 'DATE';

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

  const id = data.pedidoId || data.id;

  if (id) {
    return id.split('-')[0].toUpperCase();
  }

  if (data.whatsappUrl) {
    try {
      const url = new URL(data.whatsappUrl);
      const message = url.searchParams.get('text') || '';
      const match = message.match(/#([A-Za-z0-9-]+)/);

      if (match) return match[1];
    } catch {
      // La confirmación puede mostrarse sin número.
    }
  }

  return '';
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

function getMinimumDeliveryDate(): string {
  const minimumDate = new Date();
  minimumDate.setHours(0, 0, 0, 0);
  minimumDate.setDate(minimumDate.getDate() + 3);

  const year = minimumDate.getFullYear();
  const month = String(minimumDate.getMonth() + 1).padStart(2, '0');
  const day = String(minimumDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function buildWhatsAppUrl(
  originalUrl: string | null,
  order: ConfirmedOrder,
): string | null {
  if (!originalUrl) return null;

  try {
    const url = new URL(originalUrl);

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
      order.number
        ? `Mi número de pedido es #${order.number}.`
        : '',
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
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] =
    useState<CheckoutStep>('METHOD');
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod | null>(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [agreedToDeliveryNotice, setAgreedToDeliveryNotice] =
    useState(false);
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

  function openDeliveryMethodSelection() {
    if (isCheckingOut || confirmedOrder) return;

    setCheckoutError('');
    setCheckoutStep('METHOD');
    setDeliveryMethod(null);
    setDeliveryDate('');
    setAgreedToDeliveryNotice(false);
    setIsDeliveryModalOpen(true);
  }

  function continueWithDeliveryMethod() {
    if (!deliveryMethod) {
      setCheckoutError('Selecciona un método de entrega para continuar.');
      return;
    }

    if (
      deliveryMethod === 'DOMICILIO' &&
      !agreedToDeliveryNotice
    ) {
      setCheckoutError(
        'Confirma que estás de acuerdo con el pago del domicilio por WhatsApp.',
      );
      return;
    }

    setCheckoutError('');
    setCheckoutStep('DATE');
  }

  async function handleCheckout() {
    if (isCheckingOut || confirmedOrder) return;

    if (!deliveryMethod || !deliveryDate) {
      setIsDeliveryModalOpen(true);
      return;
    }

    setCheckoutError('');
    setIsCheckingOut(true);

    const purchasedItems = items.map((item) => ({ ...item }));
    const purchasedTotal = total;

    try {
      const user = getSessionUser();
      const token =
        sessionStorage.getItem(AUTH_TOKEN_KEY) ||
        localStorage.getItem(AUTH_TOKEN_KEY);

      if (!user || !token) {
        throw new Error(
          'Tu sesión terminó. Inicia sesión nuevamente.',
        );
      }

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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          direccionEntrega: 'Por definir',
          ciudad: 'Por definir',
          tipoEntrega:
            deliveryMethod === 'DOMICILIO' ? 'ENVIO' : 'RETIRO',
          fechaEsperada: deliveryDate,
          observacionesEntrega:
            deliveryMethod === 'DOMICILIO'
              ? `Domicilio por WhatsApp. Fecha: ${deliveryDate}`
              : `Recogida en tienda. Fecha: ${deliveryDate}`,
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

      setIsDeliveryModalOpen(false);
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
              <p
                role="alert"
                className={styles.checkoutError}
              >
                {checkoutError}
              </p>
            )}

            {hasSession === null ? null : hasSession ? (
              <button
                type="button"
                className={styles.checkoutButton}
                onClick={openDeliveryMethodSelection}
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

      {isDeliveryModalOpen && (
        <div
          className={styles.deliveryModalOverlay}
          role="presentation"
        >
          <section
            className={styles.deliveryModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delivery-modal-title"
          >
            <div className={styles.deliveryModalHeader}>
              <p className={styles.deliveryEyebrow}>Antes de pagar</p>
              <h2 id="delivery-modal-title">
                {checkoutStep === 'METHOD'
                  ? '¿Cómo quieres recibir tu pedido?'
                  : '¿Cuándo deseas recibirlo?'}
              </h2>
              <button
                type="button"
                className={styles.closeModalButton}
                onClick={() => setIsDeliveryModalOpen(false)}
                aria-label="Cerrar selección de entrega"
              >
                ×
              </button>
            </div>

            {checkoutStep === 'METHOD' ? (
              <div className={styles.deliveryForm}>
                <fieldset className={styles.deliveryOptions}>
                  <legend>Método de entrega</legend>
                  <label
                    className={
                      deliveryMethod === 'RETIRO'
                        ? styles.deliveryOptionSelected
                        : styles.deliveryOption
                    }
                  >
                    <input
                      type="radio"
                      name="delivery-method"
                      value="RETIRO"
                      checked={deliveryMethod === 'RETIRO'}
                      onChange={() => {
                        setDeliveryMethod('RETIRO');
                        setAgreedToDeliveryNotice(false);
                        setCheckoutError('');
                      }}
                    />
                    <span>
                      <strong>Recogida en tienda</strong>
                      <small>Retira tu pedido en Brisée Bake.</small>
                    </span>
                  </label>

                  <label
                    className={
                      deliveryMethod === 'DOMICILIO'
                        ? styles.deliveryOptionSelected
                        : styles.deliveryOption
                    }
                  >
                    <input
                      type="radio"
                      name="delivery-method"
                      value="DOMICILIO"
                      checked={deliveryMethod === 'DOMICILIO'}
                      onChange={() => {
                        setDeliveryMethod('DOMICILIO');
                        setCheckoutError('');
                      }}
                    />
                    <span>
                      <strong>Envío a domicilio</strong>
                      <small>El costo del domicilio se coordina aparte.</small>
                    </span>
                  </label>
                </fieldset>

                {deliveryMethod === 'DOMICILIO' && (
                  <label className={styles.deliveryNotice}>
                    <input
                      type="checkbox"
                      checked={agreedToDeliveryNotice}
                      onChange={(event) =>
                        setAgreedToDeliveryNotice(event.target.checked)
                      }
                    />
                    <span>
                      Entiendo que el pago del domicilio se realiza por
                      WhatsApp de Brisée Bake después de pagar el producto.
                    </span>
                  </label>
                )}

                {checkoutError && (
                  <p className={styles.checkoutError} role="alert">
                    {checkoutError}
                  </p>
                )}

                <button
                  type="button"
                  className={styles.checkoutButton}
                  onClick={continueWithDeliveryMethod}
                >
                  Continuar
                </button>
              </div>
            ) : (
              <div className={styles.deliveryForm}>
                <p className={styles.dateDescription}>
                  Selecciona la fecha en la que deseas tu producto.
                </p>
                <label className={styles.dateField}>
                  Fecha solicitada
                  <input
                    type="date"
                    value={deliveryDate}
                    min={getMinimumDeliveryDate()}
                    onChange={(event) => setDeliveryDate(event.target.value)}
                    required
                  />
                </label>

                {checkoutError && (
                  <p className={styles.checkoutError} role="alert">
                    {checkoutError}
                  </p>
                )}

                <button
                  type="button"
                  className={styles.checkoutButton}
                  onClick={() => {
                    if (!deliveryDate) {
                      setCheckoutError('Selecciona una fecha para continuar.');
                      return;
                    }

                    setCheckoutError('');
                    void handleCheckout();
                  }}
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? 'Procesando...' : 'Confirmar y pagar'}
                </button>
              </div>
            )}
          </section>
        </div>
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