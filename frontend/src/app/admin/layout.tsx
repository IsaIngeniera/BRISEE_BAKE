'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';

import {
  AUTH_CHANGE_EVENT,
  getSessionUser,
  validateSession,
} from '@/services/auth';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<
    'ADMIN' | 'CLIENTE' | 'VISITANTE' | 'CARGANDO'
  >('CARGANDO');

  useEffect(() => {
    let active = true;

    const refreshRole = async () => {
      const localUser = getSessionUser();
      if (!localUser) {
        if (active) setRole('VISITANTE');
        return;
      }

      const currentUser = await validateSession();
      if (active) {
        setRole(currentUser?.rol ?? 'VISITANTE');
      }
    };

    void refreshRole();
    window.addEventListener(AUTH_CHANGE_EVENT, refreshRole);
    window.addEventListener('storage', refreshRole);

    return () => {
      active = false;
      window.removeEventListener(AUTH_CHANGE_EVENT, refreshRole);
      window.removeEventListener('storage', refreshRole);
    };
  }, []);

  if (role === 'CARGANDO') return <p role="status">Cargando administración...</p>;
  if (role !== 'ADMIN') {
    return (
      <section style={{ maxWidth: 620, margin: '60px auto', padding: 28, textAlign: 'center' }}>
        <h1>Acceso para administradores</h1>
        <p>Inicia sesión con una cuenta administradora para entrar a esta sección.</p>
        <Link href="/login" style={{ color: '#d66098', fontWeight: 700 }}>Ir a iniciar sesión</Link>
      </section>
    );
  }
  return <>{children}</>;
}