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

import icon from '@/app/icon.png';

import {
  AUTH_CHANGE_EVENT,
  AUTH_TOKEN_KEY,
  getSessionUser,
} from '@/services/auth';

import styles from './header.module.css';

interface NavigationItem {
  readonly label: string;
  readonly href: string;
}

type ViewMode = 'CLIENT' | 'ADMIN';

const NAVIGATION_LINKS: readonly NavigationItem[] = [
  { label: 'Bienvenido', href: '/' },
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'Contactos', href: '/contacto' },
];

const ADMIN_LINKS: readonly NavigationItem[] = [
  { label: 'Administrar productos', href: '/admin/productos' },
  { label: 'Crear producto', href: '/admin/productos/crear' },
  { label: 'Administrar pedidos', href: '/admin/pedidos' },
  { label: 'Administrar clientes', href: '/admin/clientes' },
];

function getViewModeSnapshot(): ViewMode {
  return getSessionUser()?.rol === 'ADMIN' ? 'ADMIN' : 'CLIENT';
}

function getServerViewModeSnapshot(): ViewMode {
  return 'CLIENT';
}

function subscribeToViewMode(
  notifyViewModeChange: () => void,
): () => void {
  window.addEventListener('storage', notifyViewModeChange);
  window.addEventListener(
    AUTH_CHANGE_EVENT,
    notifyViewModeChange,
  );

  return () => {
    window.removeEventListener('storage', notifyViewModeChange);
    window.removeEventListener(
      AUTH_CHANGE_EVENT,
      notifyViewModeChange,
    );
  };
}

export default function Header(): ReactElement {
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] =
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

  // El manejo de cierre de sesión multi-pestaña ahora se realiza a través de BroadcastChannel en auth.ts

  function closeMenus(): void {
    setIsMobileMenuOpen(false);
    setIsAdminMenuOpen(false);
  }

  function handleSaveChanges(): void {
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

  const isAdminSectionActive = ADMIN_LINKS.some(
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
              src={icon}
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
                onClick={closeMenus}
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
                    isAdminSectionActive
                      ? styles.activeLink
                      : ''
                  }`}
                  onClick={() =>
                    setIsAdminMenuOpen((isOpen) => !isOpen)
                  }
                  aria-expanded={isAdminMenuOpen}
                  aria-controls="admin-navigation-menu"
                >
                  Administración

                  <ChevronDown
                    aria-hidden="true"
                    className={
                      isAdminMenuOpen
                        ? styles.rotatedChevron
                        : styles.chevron
                    }
                  />
                </button>

                {isAdminMenuOpen && (
                  <div
                    id="admin-navigation-menu"
                    className={styles.dropdownMenu}
                  >
                    {ADMIN_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={styles.dropdownLink}
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
            {viewMode === 'ADMIN' ? (
              <button
                type="button"
                className={styles.iconButton}
                aria-label="Carrito del administrador"
                title="Carrito del administrador"
              >
                <ShoppingCart aria-hidden="true" />
              </button>
            ) : (
              <Link
                href="/carrito"
                className={styles.iconButton}
                aria-label="Abrir carrito de compras"
                title="Carrito"
              >
                <ShoppingCart aria-hidden="true" />
              </Link>
            )}

            <Link
              href="/cuenta"
              className={styles.iconButton}
              aria-label="Abrir mi cuenta"
              title="Mi cuenta"
              onClick={closeMenus}
            >
              <UserRound aria-hidden="true" />
            </Link>

            <button
              type="button"
              className={styles.mobileMenuButton}
              onClick={() =>
                setIsMobileMenuOpen((isOpen) => !isOpen)
              }
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
                  className={`${styles.mobileLink} ${
                    styles.mobileDropdownButton
                  }`}
                  onClick={() =>
                    setIsAdminMenuOpen((isOpen) => !isOpen)
                  }
                  aria-expanded={isAdminMenuOpen}
                >
                  Administración

                  <ChevronDown
                    aria-hidden="true"
                    className={
                      isAdminMenuOpen
                        ? styles.rotatedChevron
                        : styles.chevron
                    }
                  />
                </button>

                {isAdminMenuOpen && (
                  <div className={styles.mobileDropdown}>
                    {ADMIN_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={styles.mobileDropdownLink}
                        onClick={closeMenus}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {viewMode === 'ADMIN' ? (
              <Link
                href="/cuenta"
                className={styles.mobileLink}
                onClick={closeMenus}
              >
                Mi cuenta
              </Link>
            ) : (
              <>
                <Link
                  href="/carrito"
                  className={styles.mobileLink}
                  onClick={closeMenus}
                >
                  Carrito de compras
                </Link>

                <Link
                  href="/cuenta"
                  className={styles.mobileLink}
                  onClick={closeMenus}
                >
                  Mi cuenta
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}