"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  ChevronDown,
  Menu,
  Plus,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";

import styles from "./Header.module.css";

const navigationLinks = [
  {
    label: "Bienvenido",
    href: "/",
  },
  {
    label: "Catálogo",
    href: "/catalogo",
  },
  {
    label: "Contactos",
    href: "/contacto",
  },
];

const analyticsLinks = [
  {
    label: "Resumen",
    href: "/analitica",
  },
  {
    label: "Administrar productos",
    href: "/admin/productos",
  },
  {
    label: "Crear producto",
    href: "/admin/productos/crear",
  },
];

export default function Header() {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  function closeMenus() {
    setMobileMenuOpen(false);
    setAnalyticsOpen(false);
  }

  function handleSaveChanges() {
    /*
     * This action will be connected later to the active admin form.
     */
    window.dispatchEvent(new CustomEvent("brisee:save-changes"));

    alert(
      "El botón está preparado. Se conectará al formulario de la página administrativa.",
    );
  }

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  const analyticsIsActive = analyticsLinks.some((item) =>
    pathname.startsWith(item.href),
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

          <p className={styles.adminTitle}>BRISÉE BAKE ADMIN</p>

          <div className={styles.adminActions}>
            <Link href="/" className={styles.previewButton}>
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
                  isActive(item.href) ? styles.activeLink : ""
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
                } ${analyticsIsActive ? styles.activeLink : ""}`}
                onClick={() => setAnalyticsOpen((current) => !current)}
                aria-expanded={analyticsOpen}
                aria-controls="analytics-menu"
              >
                Analítica

                <ChevronDown
                  aria-hidden="true"
                  className={
                    analyticsOpen ? styles.rotatedChevron : styles.chevron
                  }
                />
              </button>

              {analyticsOpen && (
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
              onClick={() => setMobileMenuOpen((current) => !current)}
              aria-label={
                mobileMenuOpen
                  ? "Cerrar menú de navegación"
                  : "Abrir menú de navegación"
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X aria-hidden="true" />
              ) : (
                <Menu aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <nav
            className={styles.mobileNavigation}
            aria-label="Navegación móvil"
          >
            {navigationLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.mobileLink} ${
                  isActive(item.href) ? styles.mobileActiveLink : ""
                }`}
                onClick={closeMenus}
              >
                {item.label}
              </Link>
            ))}

            <button
              type="button"
              className={`${styles.mobileLink} ${styles.mobileDropdownButton}`}
              onClick={() => setAnalyticsOpen((current) => !current)}
              aria-expanded={analyticsOpen}
            >
              Analítica

              <ChevronDown
                aria-hidden="true"
                className={
                  analyticsOpen ? styles.rotatedChevron : styles.chevron
                }
              />
            </button>

            {analyticsOpen && (
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