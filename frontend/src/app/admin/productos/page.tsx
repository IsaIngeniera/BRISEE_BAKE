import type { ReactElement } from 'react';
import Link from 'next/link';

import AdminProductsContent, {
  type Product,
} from './AdminProductsContent';
import styles from './admin-productos.module.css';

export const dynamic = 'force-dynamic';

async function getProducts(): Promise<Product[]> {
  const apiUrl =
    process.env.INTERNAL_API_URL ?? 'http://backend:3001';

  const response = await fetch(`${apiUrl}/products`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch products. Status: ${response.status}`,
    );
  }

  const products: Product[] = await response.json();

  return products;
}

export default async function AdminProductsPage(): Promise<ReactElement> {
  let products: Product[] = [];
  let errorOccurred = false;

  try {
    products = await getProducts();
  } catch (caughtError: unknown) {
    errorOccurred = true;
    console.error('Error fetching products:', caughtError);
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            Catálogo de productos
          </h1>

          <Link
            href="/admin/productos/crear"
            className={styles.createButton}
          >
            <span aria-hidden="true">+</span>
            Crear producto
          </Link>
        </header>

        {errorOccurred ? (
          <section
            className={styles.errorState}
            aria-live="polite"
          >
            <p>
              No se pudieron cargar los productos. Intenta
              nuevamente.
            </p>

            <Link
              href="/admin/productos"
              className={styles.retryButton}
            >
              Reintentar
            </Link>
          </section>
        ) : products.length === 0 ? (
          <section
            className={styles.emptyState}
            aria-live="polite"
          >
            <p>Aún no hay productos creados.</p>

            <Link
              href="/admin/productos/crear"
              className={styles.emptyCreateButton}
            >
              Crear el primer producto
            </Link>
          </section>
        ) : (
          <AdminProductsContent products={products} />
        )}
      </div>
    </main>
  );
}