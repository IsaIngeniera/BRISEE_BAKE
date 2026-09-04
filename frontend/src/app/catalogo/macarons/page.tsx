import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowLeft,
  Pencil,
  Plus,
} from 'lucide-react';
import ExpandableDescription from '@/components/products/ExpandableDescription';
import ProductCatalogGrid from '@/components/products/ProductCatalogGrid';
import { normalizeText } from '@/utils/normalize-text';

import styles from './macarons.module.css';
import ProductCardActions from '@/components/products/ProductCardActions';

interface ProductImage {
  id: string;
  urlImagen: string;
  nombre: string;
}

interface ProductCategory {
  id: string;
  nombre: string;
}

interface Product {
  id: string;
  idCategoria: string;
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

function isMacaronProduct(product: Product): boolean {
  const productName = normalizeText(product.nombre);
  const categoryName = normalizeText(
    product.categoria?.nombre ?? '',
  );

  return (
    productName.includes('macaron') ||
    categoryName.includes('macaron')
  );
}

async function getMacaronProducts(): Promise<Product[]> {
  try {
    const apiUrl =
      process.env.INTERNAL_API_URL ?? 'http://backend:3001';

    const response = await fetch(`${apiUrl}/products`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(
        `Error fetching macaron products. Status: ${response.status}`,
      );

      return [];
    }

    const products: Product[] = await response.json();

    return products.filter(
      (product) =>
        product.estado !== 'INACTIVO' &&
        isMacaronProduct(product),
    );
  } catch (error) {
    console.error('Error fetching macaron products:', error);

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

export default async function MacaronsPage() {
  const products = await getMacaronProducts();

  const items = products.map((product) => {
    const productImageUrl =
      product.imagenes?.[0]?.urlImagen ??
      '/images/catalogo/macarons-placeholder.jpg';

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
              className={styles.productImage}
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

            <ProductCardActions
              productId={product.id}
              nombre={product.nombre}
              precio={product.precio}
              imagenUrl={productImageUrl}
              existencias={product.existencias}
              formattedPrice={formatPrice(product.precio)}
            />
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

          <h1>Macarons</h1>

          <p className={styles.subtitle}>
            Delicados, coloridos y elaborados artesanalmente para
            hacer especial cada momento.
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
        searchPlaceholder="Buscar macaron..."
        gridClassName={styles.productGrid}
        gridAriaLabel="Productos de macarons"
        emptyCategoryClassName={styles.emptyMessage}
        emptyCategoryMessage={
          <p>
            Aún no hay macarons registrados. Utiliza la tarjeta
            &quot;Añadir producto&quot; para crear el primero.
          </p>
        }
        renderExtra={
          <article key="add-product-extra" className={`${styles.addProductCard} admin-only`}>
            <Link
              href="/admin/productos/crear?categoria=macarons"
              className={styles.addProductLink}
              aria-label="Crear un macaron nuevo"
            >
              <span className={styles.addIcon}>
                <Plus aria-hidden="true" />
              </span>

              <span className={styles.addTitle}>
                Añadir producto
              </span>

              <span className={styles.addDescription}>
                Crea un macaron nuevo y agrégalo al catálogo.
              </span>
            </Link>
          </article>
        }
      />
    </div>
  );
}