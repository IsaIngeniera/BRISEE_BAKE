'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, UserRound, UsersRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { clearSession } from '@/services/auth';

import styles from './admin-account-menu.module.css';

export default function AdminAccountMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  function handleLogout() {
    clearSession();
    setIsOpen(false);
    router.replace('/');
  }

  return (
    <div ref={menuRef} className={styles.menu}>
      <button
        type="button"
        className={styles.iconButton}
        aria-label="Opciones de administrador"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((current) => !current)}
      >
        <UserRound aria-hidden="true" />
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="menu">
          <Link
            href="/admin/clientes"
            className={styles.option}
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <UsersRound size={18} aria-hidden="true" />
            <span>Administrar clientes</span>
          </Link>

          <button
            type="button"
            className={`${styles.option} ${styles.logout}`}
            role="menuitem"
            onClick={handleLogout}
          >
            <LogOut size={18} aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}