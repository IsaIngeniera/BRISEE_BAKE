import type { ReactElement } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import styles from './admin-productos.module.css';

interface ProductImage {
  readonly id: string;
  readonly urlImagen: string;
  readonly nombre: string;
}

interface ProductCategory {
  readonly id: string;
  readonly nombre: string;
}

interface Product {
  readonly id: string;
  readonly idCategoria: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly precio: number | string;
  readonly presentacion: string;
  readonly existencias: number;
  readonly estado: 'ACTIVO' | 'INACTIVO';
  readonly categoria?: ProductCategory;
  readonly imagenes?: ProductImage[];
}

const PRICE_FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

async function getProducts(): Promise<Product[]> {
  const apiUrl =
    process.env.INTERNAL_API_URL ??
    'http://backend:3001';

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

function formatPrice(price: number | string): string {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return PRICE_FORMATTER.format(0);
  }

  return PRICE_FORMATTER.format(numericPrice);
}

function shortenDescription(
  description: string,
): string {
  const maximumLength = 80;

  if (description.length <= maximumLength) {
    return description;
  }

  return `${description.substring(0, maximumLength)}...`;
}

export default async function AdminProductsPage(): Promise<ReactElement> {
  let products: Product[] = [];
  let errorOccurred = false;

  try {
    products = await getProducts();
  } catch (caughtError: unknown) {
    errorOccurred = true;

    console.error(
      'Error fetching products:',
      caughtError,
    );
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
          <section
            className={styles.productGrid}
            aria-label="Productos registrados"
          >
            {products.map((product) => {
              const imageUrl =
                product.imagenes?.[0]?.urlImagen;

              return (
                <article
                  key={product.id}
                  className={styles.productCard}
                >
                  <div className={styles.imageContainer}>
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={`Imagen de ${product.nombre}`}
                        fill
                        sizes="(max-width: 680px) 100vw, (max-width: 1050px) 50vw, 33vw"
                        className={styles.productImage}
                        unoptimized
                      />
                    ) : (
                      <span className={styles.noImage}>
                        Sin imagen
                      </span>
                    )}
                  </div>

                  <div
                    className={styles.productInformation}
                  >
                    {product.categoria && (
                      <p
                        className={
                          styles.productCategory
                        }
                      >
                        {product.categoria.nombre}
                      </p>
                    )}

                    <h2 className={styles.productName}>
                      {product.nombre}
                    </h2>

                    <p className={styles.productPrice}>
                      {formatPrice(product.precio)}
                    </p>

                    <p
                      className={
                        styles.productPresentation
                      }
                    >
                      {product.presentacion}
                    </p>

                    <p
                      className={
                        styles.productDescription
                      }
                    >
                      {shortenDescription(
                        product.descripcion,
                      )}
                    </p>

                    <p className={styles.productStock}>
                      {product.existencias} existencias
                    </p>

                    <div
                      className={styles.productActions}
                    >
                      <Link
                        href={`/admin/productos/${product.id}/editar`}
                        className={styles.editButton}
                        aria-label={`Editar ${product.nombre}`}
                      >
                        Editar
                      </Link>

                      <button
                        type="button"
                        className={styles.deleteButton}
                        title="La eliminación se conectará posteriormente"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}