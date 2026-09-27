'use client';

import Link from 'next/link';
import { ArrowLeft, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AUTH_TOKEN_KEY } from '@/services/auth';

import styles from './clientes.module.css';

type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  celular: string;
  estado: EstadoUsuario;
  rol?: string;
  createdAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  return (
    sessionStorage.getItem(AUTH_TOKEN_KEY) ||
    localStorage.getItem(AUTH_TOKEN_KEY)
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function ClientesAdminPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadClientes = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const token = getToken();
      if (!token) throw new Error('Inicia sesión como administrador para ver los clientes.');

      const response = await fetch(`${API_URL}/usuarios/clientes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Error al cargar los clientes.');
      }

      const data = await response.json() as Cliente[];
      setClientes(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los clientes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChangeRol = async (id: string, nuevoRol: string) => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/usuarios/${id}/rol`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rol: nuevoRol }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Error al actualizar permisos.');
      }

      alert('Permisos actualizados correctamente.');
      void loadClientes();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadClientes();
  }, [loadClientes]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/admin/productos" className={styles.backLink}>
          <ArrowLeft size={20} aria-hidden="true" /> Volver a administración
        </Link>
        <p className={styles.eyebrow}>BRISÉE BAKE ADMIN</p>
        <h1>Administrar clientes</h1>

        {isLoading ? (
          <section className={styles.empty} role="status">
            <p>Cargando clientes...</p>
          </section>
        ) : loadError ? (
          <section className={styles.empty} role="alert">
            <h2>No se pudieron cargar los clientes</h2>
            <p>{loadError}</p>
            <button type="button" onClick={() => void loadClientes()}>Reintentar</button>
          </section>
        ) : clientes.length === 0 ? (
          <section className={styles.empty} role="status">
            <UsersRound size={48} strokeWidth={1.5} aria-hidden="true" />
            <h2>Clientes aún no disponibles</h2>
            <p>Cuando los clientes se registren en la plataforma, aparecerán aquí.</p>
          </section>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Celular</th>
                  <th>Fecha de registro</th>
                  <th>Estado</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.nombre} {cliente.apellido}</td>
                    <td>{cliente.correo}</td>
                    <td>{cliente.celular}</td>
                    <td>{formatDate(cliente.createdAt)}</td>
                    <td>{cliente.estado}</td>
                    <td>
                      <select
                        value={cliente.rol}
                        onChange={(e) => void handleChangeRol(cliente.id, e.target.value)}
                        className={styles.roleSelect}
                      >
                        <option value="CLIENTE">Cliente</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
