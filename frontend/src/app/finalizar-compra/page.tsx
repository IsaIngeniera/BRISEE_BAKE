'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  ShoppingBag,
  ShoppingCart,
  XCircle,
  MessageCircle,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getSessionUser, type SessionUser } from '@/services/auth';
import { useCart } from '@/hooks/useCart';
import {
  updateOrderStatus,
  type CustomerOrder,
} from '@/utils/order-history';

import styles from './finalizar-compra.module.css';

import { Suspense } from 'react';

function SuccessfulPaymentContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const wompiTransactionId = searchParams.get('id');
  const paymentError = searchParams.get('error');
  const [wompiStatus, setWompiStatus] = useState<string | null>(searchParams.get('status'));
  const orderReference = searchParams.get('reference');
  
  const hasPaymentResult = Boolean(wompiStatus) || paymentError !== null || Boolean(wompiTransactionId);
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [order, setOrder] = useState<CustomerOrder | null>(null);

  function openWhatsApp() {
    if (!order) return;
    const userName = (() => {
      try {
        if (!user) return '';
        const saved = JSON.parse(localStorage.getItem(`brisee_profile_${user.sub}`) || '{}');
        const nombre = typeof saved.nombre === 'string' ? saved.nombre.trim() : '';
        const apellido = typeof saved.apellido === 'string' ? saved.apellido.trim() : '';
        return [nombre, apellido].filter(Boolean).join(' ');
      } catch {
        return '';
      }
    })();
    const products = order.items.map((item) => `• ${item.nombre} × ${item.cantidad}`).join('\n');
    const totalFormat = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.total);
    const message = `¡Hola, Brisée Bake!\n${userName ? `Soy ${userName} y acabo de realizar un pedido.` : 'Acabo de realizar un pedido.'}\nMi número de pedido es #${order.number}.\n\nEstos son los productos que elegí:\n${products}\n\nTotal del pedido: ${totalFormat}\n\n¿Podemos coordinar los detalles de la entrega? ¡Muchas gracias!`;
    window.open(`https://wa.me/573003685556?text=${encodeURIComponent(message)}`, '_blank');
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const sessionUser = getSessionUser();
    setUser(sessionUser);

    const verifyPayment = async () => {
      if (wompiTransactionId) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/pedidos/verificar-pago/${wompiTransactionId}`);
          if (res.ok) {
            const data = await res.json();
            setWompiStatus(data.status);
            if (data.status === 'APPROVED' && sessionUser) {
              setIsApproved(true);
              clearCart();
              if (data.reference || orderReference) {
                setOrder(updateOrderStatus(sessionUser.sub, data.reference || orderReference, 'PAGO EXITOSO'));
              }
            } else {
              setIsApproved(false);
            }
          } else {
            console.error("Backend devolvió error:", await res.text());
            setIsApproved(false);
          }
        } catch (err) {
          console.error("Error verificando pago:", err);
          setIsApproved(false);
        }
      } else if (wompiStatus) {
        // ERROR: El usuario llegó a la página sin un ID de transacción Wompi.
        // No podemos aprobar el pago de mentiras sin ir al backend.
        console.error("Falta el ID de transacción de Wompi en la URL.");
        setIsApproved(false);
      }
    };

    verifyPayment();
  }, [clearCart, orderReference, wompiTransactionId, wompiStatus]);

  if (user === undefined) {
    return (
      <main className={styles.page}>
        <p className={styles.loading} role="status">
          Confirmando tu pago...
        </p>
      </main>
    );
  }

  if (isApproved === false || (!hasPaymentResult && isApproved === null)) {
    return (
      <main className={styles.page}>
        <section className={styles.card} role="alert">
          <XCircle
            className={styles.errorIcon}
            size={56}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className={styles.eyebrow}>BRISÉE BAKE</p>
          <h1>Pago no procesado</h1>
          <p>
            No fue posible procesar tu pago, o faltan datos en la URL. Tus productos siguen
            reservados en el carrito para que puedas intentarlo
            nuevamente.
          </p>

          <div className={styles.actions}>
            <Link href="/carrito" className={styles.primaryLink}>
              <ShoppingCart size={18} aria-hidden="true" />
              Volver al carrito
            </Link>
            <Link href="/cuenta" className={styles.secondaryLink}>
              Ir a mi cuenta
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (isApproved === null) {
    return (
      <main className={styles.page}>
        <p className={styles.loading} role="status">
          Confirmando tu pago...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1>Pago recibido</h1>
          <p>
            Inicia sesión para consultar el resumen de tu pedido.
          </p>
          <Link href="/login" className={styles.primaryLink}>
            Iniciar sesión
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} role="status">
        <CheckCircle2
          className={styles.icon}
          size={56}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <p className={styles.eyebrow}>BRISÉE BAKE</p>
        <h1>¡Pago exitoso!</h1>
        <p>
          Recibimos correctamente tu pago y tu orden fue registrada.
        </p>

        {order && (
          <>
            <div className={styles.orderSummary}>
              <strong>Orden #{order.number}</strong>
              <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>
                {order.items?.map((item) => (
                  <li key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>{item.cantidad}x {item.nombre}</span>
                  </li>
                ))}
              </ul>
              <span>
                Total: COP ${' '}
                {order.total.toLocaleString('es-CO', {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>

            <button
              type="button"
              className={styles.whatsappButton}
              onClick={openWhatsApp}
              style={{ marginBottom: '1rem' }}
            >
              <MessageCircle aria-hidden="true" />
              Continuar por WhatsApp
            </button>

            <p className={styles.confirmationNote} style={{ marginBottom: '1.5rem' }}>
              Podrás revisar el mensaje antes de enviarlo.
            </p>
          </>
        )}

        <div className={styles.actions}>
          <Link href="/cuenta/pedidos" className={styles.primaryLink}>
            <ShoppingBag size={18} aria-hidden="true" />
            Ver mis pedidos
          </Link>
          <Link href="/cuenta" className={styles.secondaryLink}>
            Ir a mi cuenta
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function SuccessfulPaymentPage() {
  return (
    <Suspense fallback={
      <main className={styles.page}>
        <p className={styles.loading} role="status">
          Cargando...
        </p>
      </main>
    }>
      <SuccessfulPaymentContent />
    </Suspense>
  );
}
