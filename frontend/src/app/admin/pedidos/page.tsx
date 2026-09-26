'use client';

import Link from 'next/link';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { useState } from 'react';

import styles from './pedidos.module.css';

type EstadoPedido = 'PAGADO' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO';

type Pedido = {
  id: string;
  cliente: { nombre: string; correo: string };
  productos: { id: string; nombre: string; cantidad: number }[];
  total: number;
  estado: EstadoPedido;
};

const nombresEstado: Record<EstadoPedido, string> = {
  PAGADO: 'Pagado',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo para entregar',
  ENTREGADO: 'Entregado',
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PedidosAdminPage() {
  // Al conectar el backend, sustituir este estado por la respuesta del listado de pedidos pagados.
  const [pedidos] = useState<Pedido[]>([]);
  const isConnected = false;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/admin/productos" className={styles.backLink}>
          <ArrowLeft size={20} aria-hidden="true" /> Volver a administración
        </Link>

        <header className={styles.heading}>
          <p className={styles.eyebrow}>BRISÉE BAKE ADMIN</p>
          <h1>Administrar pedidos</h1>
          <p>Consulta las compras recibidas y su estado de preparación y entrega.</p>
        </header>

        {!isConnected ? (
          <section className={styles.empty} role="status">
            <ClipboardList size={48} strokeWidth={1.5} aria-hidden="true" />
            <h2>Pedidos aún no disponibles</h2>
            <p>El listado estará disponible al conectar esta vista con el backend de pedidos.</p>
          </section>
        ) : pedidos.length === 0 ? (
          <section className={styles.empty} role="status">
            <ClipboardList size={48} strokeWidth={1.5} aria-hidden="true" />
            <h2>Aún no hay pedidos</h2>
            <p>Cuando recibas compras pagadas, aparecerán aquí.</p>
          </section>
        ) : (
          <div className={styles.list}>
            {pedidos.map((pedido) => (
              <article key={pedido.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div>
                    <span className={styles.caption}>Pedido</span>
                    <h2>#{pedido.id}</h2>
                  </div>
                  <span className={styles.badge}>{nombresEstado[pedido.estado]}</span>
                </div>
                <div className={styles.details}>
                  <div>
                    <h3>Cliente</h3>
                    <p>{pedido.cliente.nombre}</p>
                    <p className={styles.secondary}>{pedido.cliente.correo}</p>
                  </div>
                  <div>
                    <h3>Productos</h3>
                    <ul>
                      {pedido.productos.map((producto) => (
                        <li key={producto.id}>{producto.nombre} × {producto.cantidad}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>Total pagado</h3>
                    <strong className={styles.total}>{formatPrice(pedido.total)}</strong>
                  </div>
                </div>
                <div className={styles.cardBottom}>
                  <label htmlFor={`estado-${pedido.id}`}>Estado del pedido</label>
                  <select id={`estado-${pedido.id}`} value={pedido.estado} disabled title="Disponible al conectar el backend de pedidos">
                    {Object.entries(nombresEstado).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
