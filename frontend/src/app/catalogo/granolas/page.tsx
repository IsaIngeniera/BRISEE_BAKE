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
import {
  getProductDisplayName,
  formatProductPriceRange,
  getProductVariantGroupKey,
  requiresProductOptions,
  sortProductVariants,
} from '@/utils/product-variants';

import styles from './granolas.module.css';
import ProductCardActions from '@/components/products/ProductCardActions';

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

function isGranolaProduct(product: Product): boolean {
  const productName = normalizeText(product.nombre);
  const categoryName = normalizeText(
    product.categoria?.nombre ?? '',
  );

  return (
    productName.includes('granola') ||
    categoryName.includes('granola')
  );
}

async function getGranolaProducts(): Promise<Product[]> {
  try {
    const apiUrl =
      process.env.INTERNAL_API_URL ?? 'http://backend:3001';

    const response = await fetch(`${apiUrl}/products`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(
        `Error fetching granola products. Status: ${response.status}`,
      );

      return [];
    }

    const products: Product[] = await response.json();

    return products.filter(
      (product) =>
        product.estado !== 'INACTIVO' &&
        isGranolaProduct(product),
    );
  } catch (error) {
    console.error('Error fetching granola products:', error);

    return [];
  }
}

export default async function GranolasPage() {
  const products = await getGranolaProducts();
  const groupedProducts = Array.from(
    products.reduce((groups, product) => {
      const key = getProductVariantGroupKey(product.nombre) ?? `${product.id}`;
      const group = groups.get(key) ?? [];
      group.push(product);
      groups.set(key, group);
      return groups;
    }, new Map<string, Product[]>()),
  ).map(([, group]) => sortProductVariants(group)[0]);

  const items = groupedProducts.map((product) => {
    const groupKey = getProductVariantGroupKey(product.nombre);
    const productVariants = products.filter(
      (variant) =>
        (getProductVariantGroupKey(variant.nombre) ?? `${variant.id}`) ===
        (groupKey ?? `${product.id}`),
    );
    const productImageUrl =
      product.imagenes?.[0]?.urlImagen ??
      '/images/catalogo/granolas-placeholder.jpg';

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
              <h2>{getProductDisplayName(product.nombre)}</h2>
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
              nombre={getProductVariantGroupKey(product.nombre)?.replace(
                /\b\w/g,
                (letter) => letter.toUpperCase(),
              ) ?? product.nombre}
              precio={product.precio}
              imagenUrl={productImageUrl}
              existencias={product.existencias}
              formattedPrice={formatProductPriceRange(productVariants)}
              requiresOptions={requiresProductOptions(product.nombre)}
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

          <h1>Granolas</h1>

          <p className={styles.subtitle}>
            Ingredientes naturales seleccionados, frutos secos y
            combinaciones deliciosas para comenzar bien el día.
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
        searchPlaceholder="Buscar granola..."
        gridClassName={styles.productGrid}
        gridAriaLabel="Productos de granola"
        emptyCategoryClassName={styles.emptyMessage}
        emptyCategoryMessage={
          <p>
            Aún no hay granolas registradas. Utiliza la tarjeta
            &quot;Añadir producto&quot; para crear la primera.
          </p>
        }
        renderExtra={
          <article key="add-product-extra" className={`${styles.addProductCard} admin-only`}>
            <Link
              href="/admin/productos/crear?categoria=granolas"
              className={styles.addProductLink}
              aria-label="Crear granola"
            >
              <span className={styles.addIcon}>
                <Plus aria-hidden="true" />
              </span>

              <span className={styles.addTitle}>
                Añadir producto
              </span>

              <span className={styles.addDescription}>
                Crea una granola nueva y agrégala al catálogo.
              </span>
            </Link>
          </article>
        }
      />
    </div>
  );
}