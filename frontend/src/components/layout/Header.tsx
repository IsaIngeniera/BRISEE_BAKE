'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from 'react';

import {
  ChevronDown,
  Menu,
  Plus,
  ShoppingCart,
  UserRound,
  X,
} from 'lucide-react';

import styles from './header.module.css';

interface NavigationItem {
  readonly label: string;
  readonly href: string;
}

type ViewMode = 'CLIENT' | 'ADMIN';

const VIEW_MODE_STORAGE_KEY = 'brisee_view_mode';
const VIEW_MODE_CHANGE_EVENT =
  'brisee:view-mode-change';

const NAVIGATION_LINKS: readonly NavigationItem[] = [
  {
    label: 'Bienvenido',
    href: '/',
  },
  {
    label: 'Catálogo',
    href: '/catalogo',
  },
  {
    label: 'Contactos',
    href: '/contacto',
  },
];

const ANALYTICS_LINKS: readonly NavigationItem[] = [
  {
    label: 'Resumen',
    href: '/analitica',
  },
  {
    label: 'Administrar productos',
    href: '/admin/productos',
  },
  {
    label: 'Crear producto',
    href: '/admin/productos/crear',
  },
];

function getViewModeSnapshot(): ViewMode {
  const savedViewMode = localStorage.getItem(
    VIEW_MODE_STORAGE_KEY,
  );

  return savedViewMode === 'ADMIN'
    ? 'ADMIN'
    : 'CLIENT';
}

function getServerViewModeSnapshot(): ViewMode {
  return 'CLIENT';
}

function subscribeToViewMode(
  notifyViewModeChange: () => void,
): () => void {
  window.addEventListener(
    'storage',
    notifyViewModeChange,
  );

  window.addEventListener(
    VIEW_MODE_CHANGE_EVENT,
    notifyViewModeChange,
  );

  return () => {
    window.removeEventListener(
      'storage',
      notifyViewModeChange,
    );

    window.removeEventListener(
      VIEW_MODE_CHANGE_EVENT,
      notifyViewModeChange,
    );
  };
}

export default function Header(): ReactElement {
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const [isAnalyticsMenuOpen, setIsAnalyticsMenuOpen] =
    useState(false);

  const viewMode = useSyncExternalStore(
    subscribeToViewMode,
    getViewModeSnapshot,
    getServerViewModeSnapshot,
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-view-mode',
      viewMode,
    );
  }, [viewMode]);

  function toggleViewMode(): void {
    const newViewMode: ViewMode =
      viewMode === 'CLIENT' ? 'ADMIN' : 'CLIENT';

    localStorage.setItem(
      VIEW_MODE_STORAGE_KEY,
      newViewMode,
    );

    window.dispatchEvent(
      new Event(VIEW_MODE_CHANGE_EVENT),
    );
  }

  function closeMenus(): void {
    setIsMobileMenuOpen(false);
    setIsAnalyticsMenuOpen(false);
  }

  function handleSaveChanges(): void {
    /*
     * This action will be connected later to the active
     * administration form.
     */
    window.dispatchEvent(
      new CustomEvent('brisee:save-changes'),
    );

    window.alert(
      'El botón está preparado. Se conectará al formulario de la página administrativa.',
    );
  }

  function isActiveLink(href: string): boolean {
    if (href === '/') {
      return pathname === '/';
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  const isAnalyticsActive = ANALYTICS_LINKS.some(
    (item) => isActiveLink(item.href),
  );

  return (
    <header className={styles.header}>
      {viewMode === 'ADMIN' && (
        <div className={styles.adminBar}>
          <div className={styles.adminBarContent}>
            <Link
              href="/admin/productos/crear"
              className={styles.addButton}
              aria-label="Crear un producto nuevo"
              title="Crear producto"
            >
              <Plus aria-hidden="true" />
            </Link>

            <p className={styles.adminTitle}>
              BRISÉE BAKE ADMIN
            </p>

            <div className={styles.adminActions}>
              <Link
                href="/"
                className={styles.previewButton}
              >
                Vista previa
              </Link>

              <button
                type="button"
                className={styles.saveButton}
                onClick={handleSaveChanges}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.navigation}>
        <div className={styles.navigationContent}>
          <Link
            href="/"
            className={styles.logoLink}
            onClick={closeMenus}
            aria-label="Ir al inicio de Brisée Bake"
          >
            <Image
              src="/images/logo-header-transparent.png"
              alt="Brisée Bake - Handmade with love"
              width={330}
              height={115}
              priority
              className={styles.logo}
            />
          </Link>

          <nav
            className={styles.desktopNavigation}
            aria-label="Navegación principal"
          >
            {NAVIGATION_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navigationLink} ${
                  isActiveLink(item.href)
                    ? styles.activeLink
                    : ''
                }`}
              >
                {item.label}
              </Link>
            ))}

            {viewMode === 'ADMIN' && (
              <div className={styles.dropdown}>
                <button
                  type="button"
                  className={`${styles.navigationLink} ${
                    styles.dropdownButton
                  } ${
                    isAnalyticsActive
                      ? styles.activeLink
                      : ''
                  }`}
                  onClick={() => {
                    setIsAnalyticsMenuOpen(
                      (isOpen) => !isOpen,
                    );
                  }}
                  aria-expanded={isAnalyticsMenuOpen}
                  aria-controls="analytics-menu"
                >
                  Analítica

                  <ChevronDown
                    aria-hidden="true"
                    className={
                      isAnalyticsMenuOpen
                        ? styles.rotatedChevron
                        : styles.chevron
                    }
                  />
                </button>

                {isAnalyticsMenuOpen && (
                  <div
                    id="analytics-menu"
                    className={styles.dropdownMenu}
                  >
                    {ANALYTICS_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={
                          styles.dropdownLink
                        }
                        onClick={closeMenus}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>

          <div className={styles.userActions}>
            <Link
              href="/carrito"
              className={styles.iconButton}
              aria-label="Abrir carrito de compras"
              title="Carrito"
            >
              <ShoppingCart aria-hidden="true" />
            </Link>

            <Link
              href="/login"
              className={styles.iconButton}
              aria-label="Iniciar sesión o abrir perfil"
              title="Mi cuenta"
            >
              <UserRound aria-hidden="true" />
            </Link>

            <button
              type="button"
              className={styles.mobileMenuButton}
              onClick={() => {
                setIsMobileMenuOpen(
                  (isOpen) => !isOpen,
                );
              }}
              aria-label={
                isMobileMenuOpen
                  ? 'Cerrar menú de navegación'
                  : 'Abrir menú de navegación'
              }
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X aria-hidden="true" />
              ) : (
                <Menu aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav
            className={styles.mobileNavigation}
            aria-label="Navegación móvil"
          >
            {NAVIGATION_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.mobileLink} ${
                  isActiveLink(item.href)
                    ? styles.mobileActiveLink
                    : ''
                }`}
                onClick={closeMenus}
              >
                {item.label}
              </Link>
            ))}

            {viewMode === 'ADMIN' && (
              <>
                <button
                  type="button"
                  className={`${styles.mobileLink} ${styles.mobileDropdownButton}`}
                  onClick={() => {
                    setIsAnalyticsMenuOpen(
                      (isOpen) => !isOpen,
                    );
                  }}
                  aria-expanded={isAnalyticsMenuOpen}
                >
                  Analítica

                  <ChevronDown
                    aria-hidden="true"
                    className={
                      isAnalyticsMenuOpen
                        ? styles.rotatedChevron
                        : styles.chevron
                    }
                  />
                </button>

                {isAnalyticsMenuOpen && (
                  <div
                    className={
                      styles.mobileDropdown
                    }
                  >
                    {ANALYTICS_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={
                          styles.mobileDropdownLink
                        }
                        onClick={closeMenus}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            <Link
              href="/carrito"
              className={styles.mobileLink}
              onClick={closeMenus}
            >
              Carrito de compras
            </Link>

            <Link
              href="/login"
              className={styles.mobileLink}
              onClick={closeMenus}
            >
              Iniciar sesión
            </Link>
          </nav>
        )}
      </div>

      <button
        type="button"
        onClick={toggleViewMode}
        aria-label={
          viewMode === 'ADMIN'
            ? 'Cambiar a vista de cliente'
            : 'Cambiar a vista de administrador'
        }
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          zIndex: 9999,
          padding: '10px 20px',
          color: '#ffffff',
          backgroundColor:
            viewMode === 'ADMIN'
              ? '#d66098'
              : '#f26f71',
          border: 'none',
          borderRadius: '30px',
          boxShadow:
            '0 4px 12px rgb(0 0 0 / 15%)',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        Vista:{' '}
        {viewMode === 'ADMIN'
          ? 'Administrador'
          : 'Cliente'}
      </button>
    </header>
  );
}