'use client';

import Link from 'next/link';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { AUTH_TOKEN_KEY } from '@/services/auth';

import styles from './pedidos.module.css';

type EstadoEntrega =
  | 'PENDIENTE'
  | 'PREPARANDO'
  | 'DESPACHADO'
  | 'ENTREGADO';

type FiltroPedidos = 'ACTIVOS' | 'ENTREGADOS';

type Pedido = {
  id: string;
  createdAt: string;
  estadoEntrega: EstadoEntrega;
  total: number | string;
  cliente?: {
    nombre: string;
    apellido: string;
    correo: string;
  };
  productos: {
    id: string;
    cantidad: number;
    producto?: {
      nombre: string;
    };
  }[];
};

const estados: Record<EstadoEntrega, string> = {
  PENDIENTE: 'Pendiente',
  PREPARANDO: 'Preparando',
  DESPACHADO: 'Despachado',
  ENTREGADO: 'Entregado',
};

const opcionesEstado = Object.keys(estados) as EstadoEntrega[];

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  return (
    sessionStorage.getItem(AUTH_TOKEN_KEY) ||
    localStorage.getItem(AUTH_TOKEN_KEY)
  );
}

function formatPrice(value: number | string): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 'COP $ 0';
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

async function readError(response: Response): Promise<string> {
  try {
    const data: { message?: string | string[] } = await response.json();

    if (Array.isArray(data.message)) {
      return data.message.join('. ');
    }

    if (data.message) {
      return data.message;
    }
  } catch {
    // El servidor no devolvió un mensaje JSON.
  }

  return `No se pudo completar la solicitud (${response.status}).`;
}

export default function PedidosAdminPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<FiltroPedidos>('ACTIVOS');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadPedidos = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          'Inicia sesión como administrador para ver los pedidos.',
        );
      }

      const response = await fetch(`${API_URL}/pedidos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('El servidor no devolvió un listado de pedidos.');
      }

      setPedidos(data as Pedido[]);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los pedidos.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPedidos();
  }, [loadPedidos]);

  async function updateEstado(
    pedidoId: string,
    estadoEntrega: EstadoEntrega,
  ) {
    setUpdatingId(pedidoId);
    setActionError('');

    try {
      const token = getToken();

      if (!token) {
        throw new Error('Tu sesión terminó. Inicia sesión nuevamente.');
      }

      const response = await fetch(
        `${API_URL}/pedidos/${encodeURIComponent(pedidoId)}/estado`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ estadoEntrega }),
        },
      );

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const updated: Pedido = await response.json();

      setPedidos((current) =>
        current.map((pedido) =>
          pedido.id === pedidoId
            ? { ...pedido, estadoEntrega: updated.estadoEntrega }
            : pedido,
        ),
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar el pedido.',
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const pedidosActivos = pedidos.filter(
    (pedido) => pedido.estadoEntrega !== 'ENTREGADO',
  );

  const pedidosEntregados = pedidos.filter(
    (pedido) => pedido.estadoEntrega === 'ENTREGADO',
  );

  const pedidosVisibles =
    filtro === 'ACTIVOS' ? pedidosActivos : pedidosEntregados;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/admin/productos" className={styles.backLink}>
          <ArrowLeft size={20} aria-hidden="true" />
          Volver a administración
        </Link>

        <header className={styles.heading}>
          <p className={styles.eyebrow}>BRISÉE BAKE ADMIN</p>
          <h1>Administrar pedidos</h1>
          <p>
            Consulta los pedidos recibidos y organiza su preparación
            y entrega.
          </p>
        </header>

        {actionError && (
          <p className={styles.error} role="alert">
            {actionError}
          </p>
        )}

        {isLoading ? (
          <section className={styles.empty} role="status">
            <p>Cargando pedidos...</p>
          </section>
        ) : loadError ? (
          <section className={styles.empty} role="alert">
            <h2>No se pudieron cargar los pedidos</h2>
            <p>{loadError}</p>
            <button
              type="button"
              className={styles.retryButton}
              onClick={() => void loadPedidos()}
            >
              Reintentar
            </button>
          </section>
        ) : pedidos.length === 0 ? (
          <section className={styles.empty} role="status">
            <ClipboardList
              size={48}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <h2>Aún no hay pedidos</h2>
            <p>Cuando recibas pedidos, aparecerán aquí.</p>
          </section>
        ) : (
          <>
            <div
              className={styles.filters}
              role="group"
              aria-label="Filtrar pedidos por estado"
            >
              <button
                type="button"
                className={`${styles.filterButton} ${
                  filtro === 'ACTIVOS' ? styles.filterActive : ''
                }`}
                aria-pressed={filtro === 'ACTIVOS'}
                onClick={() => setFiltro('ACTIVOS')}
              >
                Activos ({pedidosActivos.length})
              </button>

              <button
                type="button"
                className={`${styles.filterButton} ${
                  filtro === 'ENTREGADOS' ? styles.filterActive : ''
                }`}
                aria-pressed={filtro === 'ENTREGADOS'}
                onClick={() => setFiltro('ENTREGADOS')}
              >
                Entregados ({pedidosEntregados.length})
              </button>
            </div>

            {pedidosVisibles.length === 0 ? (
              <section className={styles.empty} role="status">
                <ClipboardList
                  size={48}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h2>
                  {filtro === 'ACTIVOS'
                    ? 'No hay pedidos activos'
                    : 'No hay pedidos entregados'}
                </h2>
                <p>
                  {filtro === 'ACTIVOS'
                    ? 'Puedes consultar los pedidos finalizados en Entregados.'
                    : 'Los pedidos aparecerán aquí cuando marques su entrega.'}
                </p>
              </section>
            ) : (
              <section
                className={styles.list}
                aria-label={
                  filtro === 'ACTIVOS'
                    ? 'Pedidos activos'
                    : 'Pedidos entregados'
                }
              >
                {pedidosVisibles.map((pedido) => (
                  <article key={pedido.id} className={styles.card}>
                    <div className={styles.cardTop}>
                      <div>
                        <span className={styles.caption}>
                          Pedido · {formatDate(pedido.createdAt)}
                        </span>
                        <h2>
                          #{pedido.id.split('-')[0].toUpperCase()}
                        </h2>
                      </div>

                      <span className={styles.badge}>
                        {estados[pedido.estadoEntrega] ??
                          pedido.estadoEntrega}
                      </span>
                    </div>

                    <div className={styles.details}>
                      <div>
                        <h3>Cliente</h3>
                        {pedido.cliente ? (
                          <>
                            <p>
                              {pedido.cliente.nombre}{' '}
                              {pedido.cliente.apellido}
                            </p>
                            <p className={styles.secondary}>
                              {pedido.cliente.correo}
                            </p>
                          </>
                        ) : (
                          <p>Cliente no disponible</p>
                        )}
                      </div>

                      <div>
                        <h3>Productos</h3>
                        <ul>
                          {pedido.productos?.map((item) => (
                            <li key={item.id}>
                              {item.producto?.nombre ??
                                'Producto no disponible'}{' '}
                              × {item.cantidad}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3>Total del pedido</h3>
                        <strong className={styles.total}>
                          {formatPrice(pedido.total)}
                        </strong>
                      </div>
                    </div>

                    <div className={styles.cardBottom}>
                      <label htmlFor={`estado-${pedido.id}`}>
                        Estado de entrega
                      </label>
                      <select
                        id={`estado-${pedido.id}`}
                        value={pedido.estadoEntrega}
                        disabled={updatingId === pedido.id}
                        onChange={(event) =>
                          void updateEstado(
                            pedido.id,
                            event.target.value as EstadoEntrega,
                          )
                        }
                      >
                        {opcionesEstado.map((estado) => (
                          <option key={estado} value={estado}>
                            {estados[estado]}
                          </option>
                        ))}
                      </select>

                      {updatingId === pedido.id && (
                        <span role="status">Guardando...</span>
                      )}
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}