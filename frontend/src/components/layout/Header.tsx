'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  useState,
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

const navigationLinks: readonly NavigationItem[] = [
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

const analyticsLinks: readonly NavigationItem[] = [
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

export default function Header(): ReactElement {
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const [isAnalyticsMenuOpen, setIsAnalyticsMenuOpen] =
    useState(false);

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

  const isAnalyticsActive = analyticsLinks.some((item) =>
    isActiveLink(item.href),
  );

  return (
    <header className={styles.header}>
      {/* Admin bar */}
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

      {/* Main navigation */}
      <div className={styles.navigation}>
        <div className={styles.navigationContent}>
          {/* Logo */}
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

          {/* Desktop navigation */}
          <nav
            className={styles.desktopNavigation}
            aria-label="Navegación principal"
          >
            {navigationLinks.map((item) => (
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

            {/* Analytics dropdown */}
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
                onClick={() =>
                  setIsAnalyticsMenuOpen(
                    (isOpen) => !isOpen,
                  )
                }
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
                  {analyticsLinks.map((item) => (
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
          </nav>

          {/* User actions */}
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
              onClick={() =>
                setIsMobileMenuOpen(
                  (isOpen) => !isOpen,
                )
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

        {/* Mobile navigation */}
        {isMobileMenuOpen && (
          <nav
            className={styles.mobileNavigation}
            aria-label="Navegación móvil"
          >
            {navigationLinks.map((item) => (
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

            <button
              type="button"
              className={`${styles.mobileLink} ${styles.mobileDropdownButton}`}
              onClick={() =>
                setIsAnalyticsMenuOpen(
                  (isOpen) => !isOpen,
                )
              }
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
              <div className={styles.mobileDropdown}>
                {analyticsLinks.map((item) => (
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
    </header>
  );
}