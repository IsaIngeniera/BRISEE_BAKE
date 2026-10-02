'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  ShoppingBag,
  ShoppingCart,
  XCircle,
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
  const wompiStatus = searchParams.get('status')?.toUpperCase();
  const orderReference = searchParams.get('reference');
  const paymentError = searchParams.get('error');
  const hasPaymentResult =
    Boolean(wompiStatus) || paymentError !== null;
  const [user, setUser] = useState<SessionUser | null | undefined>(
    undefined,
  );
  const [isApproved, setIsApproved] = useState<boolean | null>(
    null,
  );
  const [order, setOrder] = useState<CustomerOrder | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const sessionUser = getSessionUser();
    setUser(sessionUser);
    const approved = wompiStatus === 'APPROVED';
    setIsApproved(approved);

    if (sessionUser && approved) {
      clearCart();

      if (orderReference) {
        setOrder(
          updateOrderStatus(
            sessionUser.sub,
            orderReference,
            'PAGO EXITOSO',
          ),
        );
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [clearCart, orderReference, wompiStatus]);

  if (user === undefined) {
    return (
      <main className={styles.page}>
        <p className={styles.loading} role="status">
          Confirmando tu pago...
        </p>
      </main>
    );
  }

  if (isApproved !== true && hasPaymentResult) {
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
            No fue posible procesar tu pago. Tus productos siguen
            reservados en el carrito para que puedas intentarlo
            nuevamente con otro método.
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

  if (isApproved !== true) {
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
          <div className={styles.orderSummary}>
            <strong>Orden #{order.number}</strong>
            <span>
              Total: COP ${' '}
              {order.total.toLocaleString('es-CO', {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
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
