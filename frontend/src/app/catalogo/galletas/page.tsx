import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowLeft,
  Pencil,
  Plus,
  ShoppingCart,
} from 'lucide-react';
import ExpandableDescription from '@/components/products/ExpandableDescription';
import ProductCatalogGrid from '@/components/products/ProductCatalogGrid';
import { normalizeText } from '@/utils/normalize-text';

import styles from './galletas.module.css';

interface ProductImage {
  id: number;
  urlImagen: string;
  nombre: string;
}

interface ProductCategory {
  id: number;
  nombre: string;
}

interface Product {
  id: number;
  idCategoria: number;
  nombre: string;
  descripcion: string;
  precio: number | string;
  presentacion: string;
  existencias: number;
  estado: 'ACTIVO' | 'INACTIVO';
  etiquetas: string[];
  categoria?: ProductCategory;
  imagenes?: ProductImage[];
}

function isCookieProduct(product: Product): boolean {
  const productName = normalizeText(product.nombre);
  const categoryName = normalizeText(product.categoria?.nombre ?? '');

  return (
    productName.includes('galleta') ||
    categoryName.includes('galleta')
  );
}

async function getCookieProducts(): Promise<Product[]> {
  try {
    const apiUrl =
      process.env.INTERNAL_API_URL ?? 'http://backend:3001';

    const response = await fetch(`${apiUrl}/products`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(
        `Error fetching cookie products. Status: ${response.status}`,
      );

      return [];
    }

    const products: Product[] = await response.json();

    return products.filter(
      (product) =>
        product.estado !== 'INACTIVO' &&
        isCookieProduct(product),
    );
  } catch (error) {
    console.error('Error fetching cookie products:', error);

    return [];
  }
}

function formatPrice(price: number | string): string {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return '$ 0';
  }

  return numericPrice.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

export default async function CookiesPage() {
  const products = await getCookieProducts();

  const items = products.map((product) => {
    const productImageUrl =
      product.imagenes?.[0]?.urlImagen ??
      '/images/catalogo/galletas-placeholder.jpg';

    const productImageAlt =
      product.imagenes?.[0]?.nombre ??
      `Imagen de ${product.nombre}`;

    return {
      product,
      node: (
        <article key={product.id} className={styles.productCard}>
          {/* Admin edit button */}
          <Link
            href={`/admin/productos/${product.id}/editar`}
            className={`${styles.editButton} admin-only`}
            aria-label={`Editar ${product.nombre}`}
            title={`Editar ${product.nombre}`}
          >
            <Pencil aria-hidden="true" />
          </Link>

          {/* Product image */}
          <Link
            href={`/producto/${product.id}`}
            className={styles.productImageContainer}
          >
            <Image
              src={productImageUrl}
              alt={productImageAlt}
              className={
                product.categoria?.nombre === 'Galletas congeladas'
                  ? styles.productImageContain
                  : styles.productImage
              }
              fill
              sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
              unoptimized
            />
          </Link>

          {/* Product information */}
          <div className={styles.productInformation}>
            <Link
              href={`/producto/${product.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <h2>{product.nombre}</h2>
            </Link>

            {product.presentacion && (
              <p className={styles.presentation}>
                {product.presentacion}
              </p>
            )}

            <ExpandableDescription
              text={product.descripcion}
              className={styles.description}
              maxLength={100}
            />

            {product.etiquetas.length > 0 && (
              <div
                className={styles.labels}
                aria-label="Etiquetas dietéticas"
              >
                {product.etiquetas.map((label) => (
                  <span key={label}>
                    {label.replaceAll('_', ' ')}
                  </span>
                ))}
              </div>
            )}

            <p className={styles.price}>
              {formatPrice(product.precio)}
            </p>

            <p className={styles.stock}>
              {product.existencias > 0
                ? `${product.existencias} disponibles`
                : 'Producto agotado'}
            </p>

            <Link
              href={`/carrito?producto=${product.id}`}
              className={`${styles.cartButton} ${
                product.existencias <= 0
                  ? styles.disabledButton
                  : ''
              }`}
              aria-disabled={product.existencias <= 0}
            >
              <ShoppingCart aria-hidden="true" />

              {product.existencias > 0
                ? 'Añadir al carrito'
                : 'Agotado'}
            </Link>
          </div>
        </article>
      ),
    };
  });

  return (
    <div className={styles.page}>
      {/* Page header */}
      <section className={styles.pageHeading}>
        <Link href="/catalogo" className={styles.backButton}>
          <ArrowLeft aria-hidden="true" />
          Volver al catálogo
        </Link>

        <div className={styles.titleContainer}>
          <p className={styles.eyebrow}>Catálogo Brisée Bake</p>
          <h1>Galletas</h1>
          <p className={styles.subtitle}>
            Crujientes, suaves y llenas de sabor artesanal para
            disfrutar en cualquier momento.
          </p>
          <div className={styles.decoration} aria-hidden="true">
            <span />
            <span>❀</span>
            <span />
          </div>
        </div>
      </section>

      {/* Búsqueda + grid de productos */}
      <ProductCatalogGrid
        items={items}
        searchPlaceholder="Buscar galleta..."
        gridClassName={styles.productGrid}
        gridAriaLabel="Productos de galletas"
        emptyCategoryClassName={styles.emptyMessage}
        emptyCategoryMessage={
          <p>
            Aún no hay galletas registradas. Utiliza la tarjeta
            &quot;Añadir producto&quot; para crear la primera.
          </p>
        }
        renderExtra={
          <article key="add-product-extra" className={`${styles.addProductCard} admin-only`}>
            <Link
              href="/admin/productos/crear?categoria=galletas"
              className={styles.addProductLink}
              aria-label="Crear galleta"
            >
              <span className={styles.addIcon}>
                <Plus aria-hidden="true" />
              </span>
              <span className={styles.addTitle}>Añadir producto</span>
              <span className={styles.addDescription}>
                Crea una galleta nueva y agrégala al catálogo.
              </span>
            </Link>
          </article>
        }
      />
    </div>
  );
}