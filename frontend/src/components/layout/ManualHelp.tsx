'use client';

import Link from 'next/link';
import {
  useEffect,
  useRef,
  type ReactElement,
} from 'react';
import {
  BookOpen,
  CircleHelp,
  ShieldCheck,
} from 'lucide-react';

import styles from './header.module.css';

interface ManualHelpProps {
  isAdmin: boolean;
  onNavigate?: () => void;
}

export default function ManualHelp({
  isAdmin,
  onNavigate,
}: ManualHelpProps): ReactElement {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function handleOutside(event: PointerEvent): void {
      const details = detailsRef.current;

      if (
        details &&
        event.target instanceof Node &&
        !details.contains(event.target)
      ) {
        details.open = false;
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      const details = detailsRef.current;

      if (event.key === 'Escape' && details?.open) {
        details.open = false;

        const summary =
          details.querySelector<HTMLElement>('summary');

        summary?.focus();
      }
    }

    document.addEventListener(
      'pointerdown',
      handleOutside,
    );

    document.addEventListener(
      'keydown',
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleOutside,
      );

      document.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, []);

  function handleNavigate(): void {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }

    onNavigate?.();
  }

  if (!isAdmin) {
    return (
      <Link
        href="/guia-cliente"
        className={styles.iconButton}
        aria-label="Abrir guía del cliente"
        title="Guía del cliente"
        onClick={handleNavigate}
      >
        <CircleHelp aria-hidden="true" />
      </Link>
    );
  }

  return (
    <details
      ref={detailsRef}
      className={styles.helpDropdown}
    >
      <summary
        className={`${styles.iconButton} ${styles.helpSummary}`}
        aria-label="Ayuda y manuales"
        title="Ayuda y manuales"
      >
        <CircleHelp aria-hidden="true" />
      </summary>

      <nav
        className={styles.helpMenu}
        aria-label="Manuales de Brisée Bake"
      >
        <div className={styles.helpMenuHeader}>
          <span className={styles.helpEyebrow}>
            BRISÉE BAKE
          </span>

          <p className={styles.helpHeading}>
            ¿Qué guía quieres consultar?
          </p>
        </div>

        <Link
          href="/guia-cliente"
          className={styles.helpItem}
          onClick={handleNavigate}
        >
          <span className={styles.helpItemIcon}>
            <BookOpen
              size={22}
              aria-hidden="true"
            />
          </span>

          <span>
            <strong>Guía del cliente</strong>

            <small>
              Aprende a registrarte, comprar y consultar
              tus pedidos.
            </small>
          </span>
        </Link>

        <Link
          href="/admin/guia"
          className={styles.helpItem}
          onClick={handleNavigate}
        >
          <span className={styles.helpItemIcon}>
            <ShieldCheck
              size={22}
              aria-hidden="true"
            />
          </span>

          <span>
            <strong>Guía del administrador</strong>

            <small>
              Consulta cómo gestionar los productos,
              pedidos y clientes de la tienda.
            </small>
          </span>
        </Link>
      </nav>
    </details>
  );
}