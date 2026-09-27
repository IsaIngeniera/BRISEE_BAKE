'use client';

import Link from 'next/link';
import { ArrowLeft, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  AUTH_TOKEN_KEY,
  getSessionUser,
} from '@/services/auth';

import styles from './clientes.module.css';

type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
type RolUsuario = 'CLIENTE' | 'ADMIN';

type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  celular: string;
  estado: EstadoUsuario;
  rol: RolUsuario;
  createdAt: string;
};

type ApiError = {
  message?: string | string[];
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  return (
    sessionStorage.getItem(AUTH_TOKEN_KEY) ||
    localStorage.getItem(AUTH_TOKEN_KEY)
  );
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

async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await response.json()) as ApiError;

    if (Array.isArray(data.message)) {
      return data.message.join(' ');
    }

    return data.message || fallback;
  } catch {
    return fallback;
  }
}

export default function ClientesAdminPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadClientes = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const user = getSessionUser();
      const token = getToken();

      if (!user || user.rol !== 'ADMIN' || !token) {
        throw new Error(
          'Inicia sesión como administrador para ver las cuentas.',
        );
      }

      const response = await fetch(`${API_URL}/usuarios/clientes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'No se pudieron cargar las cuentas.',
          ),
        );
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          'El servidor no devolvió una lista válida de usuarios.',
        );
      }

      setClientes(data as Cliente[]);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar las cuentas.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClientes();
  }, [loadClientes]);

  async function handleChangeRol(
    cliente: Cliente,
    nuevoRol: RolUsuario,
  ) {
    if (nuevoRol === cliente.rol || savingId) return;

    setActionError('');
    setSuccessMessage('');

    const currentUser = getSessionUser();

    if (currentUser?.sub === cliente.id) {
      setActionError('No puedes cambiar tus propios permisos.');
      return;
    }

    const action =
      nuevoRol === 'ADMIN'
        ? 'darle permisos de administrador'
        : 'quitarle los permisos de administrador';

    const confirmed = window.confirm(
      `¿Quieres ${action} a ${cliente.nombre} ${cliente.apellido}?`,
    );

    if (!confirmed) return;

    setSavingId(cliente.id);

    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          'Tu sesión terminó. Inicia sesión nuevamente.',
        );
      }

      const response = await fetch(
        `${API_URL}/usuarios/${cliente.id}/rol`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rol: nuevoRol }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'No se pudo actualizar el rol.',
          ),
        );
      }

      setClientes((current) =>
        current.map((item) =>
          item.id === cliente.id
            ? { ...item, rol: nuevoRol }
            : item,
        ),
      );

      setSuccessMessage(
        `Los permisos de ${cliente.nombre} se actualizaron correctamente.`,
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el rol.',
      );
    } finally {
      setSavingId(null);
    }
  }

  const totalClientes = clientes.filter(
    (cliente) => cliente.rol === 'CLIENTE',
  ).length;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link
          href="/admin/productos"
          className={styles.backLink}
        >
          <ArrowLeft size={20} aria-hidden="true" />
          Volver a administración
        </Link>

        <header className={styles.heading}>
          <p className={styles.eyebrow}>
            BRISÉE BAKE ADMIN
          </p>
          <h1>Administrar clientes</h1>
          <p className={styles.intro}>
            Consulta las cuentas registradas y administra sus
            permisos.
          </p>
        </header>

        {actionError && (
          <p className={styles.errorMessage} role="alert">
            {actionError}
          </p>
        )}

        {successMessage && (
          <p className={styles.successMessage} role="status">
            {successMessage}
          </p>
        )}

        {isLoading ? (
          <section className={styles.empty} role="status">
            <p>Cargando cuentas...</p>
          </section>
        ) : loadError ? (
          <section className={styles.empty} role="alert">
            <UsersRound
              size={48}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <h2>No se pudieron cargar las cuentas</h2>
            <p>{loadError}</p>
            <button
              type="button"
              className={styles.retryButton}
              onClick={() => void loadClientes()}
            >
              Reintentar
            </button>
          </section>
        ) : clientes.length === 0 ? (
          <section className={styles.empty} role="status">
            <UsersRound
              size={48}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <h2>Aún no hay clientes</h2>
            <p>
              Cuando se registren cuentas, aparecerán aquí.
            </p>
          </section>
        ) : (
          <>
            <p className={styles.count}>
              {totalClientes}{' '}
              {totalClientes === 1
                ? 'cliente registrado'
                : 'clientes registrados'}
            </p>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Correo</th>
                    <th scope="col">Celular</th>
                    <th scope="col">Registro</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Rol</th>
                  </tr>
                </thead>

                <tbody>
                  {clientes.map((cliente) => {
                    const isOwnAccount =
                      getSessionUser()?.sub === cliente.id;

                    return (
                      <tr key={cliente.id}>
                        <td>
                          {cliente.nombre}{' '}
                          {cliente.apellido}
                        </td>
                        <td className={styles.email}>
                          {cliente.correo}
                        </td>
                        <td>{cliente.celular || '—'}</td>
                        <td>
                          {formatDate(cliente.createdAt)}
                        </td>
                        <td>
                          <span
                            className={
                              cliente.estado === 'ACTIVO'
                                ? styles.activeBadge
                                : styles.inactiveBadge
                            }
                          >
                            {cliente.estado}
                          </span>
                        </td>
                        <td>
                          <label
                            className={styles.visuallyHidden}
                            htmlFor={`rol-${cliente.id}`}
                          >
                            Rol de {cliente.nombre}{' '}
                            {cliente.apellido}
                          </label>

                          <select
                            id={`rol-${cliente.id}`}
                            value={cliente.rol}
                            onChange={(event) =>
                              void handleChangeRol(
                                cliente,
                                event.target
                                  .value as RolUsuario,
                              )
                            }
                            disabled={
                              savingId !== null ||
                              isOwnAccount
                            }
                            title={
                              isOwnAccount
                                ? 'No puedes cambiar tus propios permisos'
                                : undefined
                            }
                            className={styles.roleSelect}
                          >
                            <option value="CLIENTE">
                              Cliente
                            </option>
                            <option value="ADMIN">
                              Administrador
                            </option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}