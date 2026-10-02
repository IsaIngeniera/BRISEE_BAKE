'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  AUTH_TOKEN_KEY,
  getSessionUser,
  type SessionUser,
} from '@/services/auth';

import styles from './pedidos.module.css';

type BackendOrder = {
  id: string;
  estadoEntrega: string;
  total: number | string;
  createdAt: string;
  fechaEsperada: string;
  tipoEntrega: 'ENVIO' | 'RETIRO';
  productos: Array<{
    cantidad: number;
    precioUnitario: number | string;
    producto: {
      id: string;
      nombre: string;
    };
  }>;
};

function formatOrderPrice(price: number | string): string {
  return `COP $ ${Number(price).toLocaleString('es-CO', {
    maximumFractionDigits: 0,
  })}`;
}

export default function CuentaPedidosPage() {
  const [user, setUser] = useState<
    SessionUser | null | undefined
  >(undefined);
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const sessionUser = getSessionUser();
    setUser(sessionUser);

    if (sessionUser) {
      const token =
        sessionStorage.getItem(AUTH_TOKEN_KEY) ||
        localStorage.getItem(AUTH_TOKEN_KEY);
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      fetch(`${apiUrl}/pedidos/mis-pedidos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (response) => {
          const data: unknown = await response.json();
          if (!response.ok) {
            throw new Error('No fue posible cargar tus pedidos.');
          }
          return data;
        })
        .then((data) => {
          setOrders(Array.isArray(data) ? data as BackendOrder[] : []);
        })
        .catch(() => {
          setLoadError('No fue posible cargar tus pedidos.');
        });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <Link href="/cuenta" className={styles.backLink}>
          <ArrowLeft size={18} aria-hidden="true" />
          Volver a mi cuenta
        </Link>

        {user === undefined ? (
          <div className={styles.state} role="status">
            Cargando tus pedidos...
          </div>
        ) : !user ? (
          <div className={styles.state}>
            <h1>Mis pedidos</h1>
            <p>Inicia sesión para consultar tus pedidos.</p>
            <Link href="/login" className={styles.actionLink}>
              Iniciar sesión
            </Link>
          </div>
        ) : user.rol === 'ADMIN' ? (
          <div className={styles.state}>
            <h1>Mis pedidos</h1>
            <p>Esta sección está disponible para clientes.</p>
          </div>
        ) : (
          <main className={styles.content}>
            <header className={styles.heading}>
              <p className={styles.eyebrow}>HISTORIAL</p>
              <h1>Mis pedidos</h1>
              <p>Consulta el estado y el resumen de tus compras.</p>
            </header>

            {loadError ? (
              <p className={styles.emptyOrders} role="alert">
                {loadError}
              </p>
            ) : orders.length === 0 ? (
              <p className={styles.emptyOrders}>
                Aún no tienes pedidos
              </p>
            ) : (
              <div className={styles.ordersList}>
                {orders.map((order) => (
                  <article
                    key={order.id}
                    className={styles.orderCard}
                  >
                    <div className={styles.orderHeader}>
                      <strong>
                        Pedido #{order.id.split('-')[0].toUpperCase()}
                      </strong>
                      <span className={styles.orderStatus}>
                        {order.estadoEntrega}
                      </span>
                    </div>

                    <p className={styles.orderDate}>
                      Fecha solicitada: {order.fechaEsperada}
                    </p>

                    <ul className={styles.orderItems}>
                      {order.productos.map((item) => (
                        <li
                          key={`${order.id}-${item.producto.id}`}
                        >
                          <span>
                            {item.producto.nombre} × {item.cantidad}
                          </span>
                          <strong>
                            {formatOrderPrice(
                              Number(item.precioUnitario) * item.cantidad,
                            )}
                          </strong>
                        </li>
                      ))}
                    </ul>

                    <div className={styles.orderTotal}>
                      <span>
                        {order.tipoEntrega === 'ENVIO'
                          ? 'Envío a domicilio'
                          : 'Recogida en tienda'}
                      </span>
                      <strong>
                        {formatOrderPrice(Number(order.total))}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        )}
      </div>
    </section>
  );
}
