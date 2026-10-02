'use client';

import Link from 'next/link';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getSessionUser, type SessionUser } from '@/services/auth';
import { useCart } from '@/hooks/useCart';
import {
  updateOrderStatus,
  type CustomerOrder,
} from '@/utils/order-history';

import styles from './finalizar-compra.module.css';

export default function SuccessfulPaymentPage() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
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
    const wompiStatus = searchParams.get('status')?.toUpperCase();
    const approved = wompiStatus === 'APPROVED';
    setIsApproved(approved);

    if (sessionUser && approved) {
      clearCart();

      const reference = searchParams.get('reference');
      if (reference) {
        setOrder(
          updateOrderStatus(
            sessionUser.sub,
            reference,
            'PAGO EXITOSO',
          ),
        );
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [clearCart, searchParams]);

  if (user === undefined) {
    return (
      <main className={styles.page}>
        <p className={styles.loading} role="status">
          Confirmando tu pago...
        </p>
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
