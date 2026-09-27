'use client';

import Link from 'next/link';
import { useSyncExternalStore, type ReactNode } from 'react';

import { AUTH_CHANGE_EVENT, getSessionUser } from '@/services/auth';

function subscribe(onChange: () => void): () => void {
  window.addEventListener(AUTH_CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getRole(): 'ADMIN' | 'CLIENTE' | 'VISITANTE' {
  return getSessionUser()?.rol ?? 'VISITANTE';
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const role = useSyncExternalStore(subscribe, getRole, () => 'CARGANDO');

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