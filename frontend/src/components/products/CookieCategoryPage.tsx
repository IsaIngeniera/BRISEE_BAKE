import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';

import ExpandableDescription from '@/components/products/ExpandableDescription';
import ProductCatalogGrid from '@/components/products/ProductCatalogGrid';
import ProductCardActions from '@/components/products/ProductCardActions';
import { normalizeText } from '@/utils/normalize-text';

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

interface CookieCategoryPageProps {
  title: string;
  subtitle: string;
  categoryNames: string[];
  searchPlaceholder: string;
  createCategory: string;
  placeholderImage: string;
  styles: Record<string, string>;
  containImages?: boolean;
}

function formatPrice(price: number | string): string {
  const value = Number(price);

  if (Number.isNaN(value)) {
    return 'COP $ 0';
  }

  return `COP $ ${value.toLocaleString('es-CO', {
    maximumFractionDigits: 0,
  })}`;
}

async function getProducts(
  categoryNames: string[],
): Promise<Product[]> {
  try {
    const apiUrl =
      process.env.INTERNAL_API_URL ?? 'http://backend:3001';

    const response = await fetch(`${apiUrl}/products`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(
        `Error fetching cookie products: ${response.status}`,
      );
      return [];
    }

    const products: Product[] = await response.json();
    const acceptedCategories =
      categoryNames.map(normalizeText);

    return products.filter((product) => {
      const categoryName = normalizeText(
        product.categoria?.nombre ?? '',
      );

      return (
        product.estado !== 'INACTIVO' &&
        acceptedCategories.includes(categoryName)
      );
    });
  } catch (error) {
    console.error('Error fetching cookie products:', error);
    return [];
  }
}

export default async function CookieCategoryPage({
  title,
  subtitle,
  categoryNames,
  searchPlaceholder,
  createCategory,
  placeholderImage,
  styles,
  containImages = false,
}: CookieCategoryPageProps) {
  const products = await getProducts(categoryNames);

  const items = products.map((product) => {
    const imageUrl =
      product.imagenes?.[0]?.urlImagen ??
      placeholderImage;

    const imageAlt =
      product.imagenes?.[0]?.nombre ??
      `Imagen de ${product.nombre}`;

    return {
      product,
      node: (
        <article
          key={product.id}
          className={styles.productCard}
        >
          <Link
            href={`/admin/productos/${product.id}/editar`}
            className={`${styles.editButton} admin-only`}
            aria-label={`Editar ${product.nombre}`}
            title={`Editar ${product.nombre}`}
          >
            <Pencil aria-hidden="true" />
          </Link>

          <Link
            href={`/producto/${product.id}`}
            className={styles.productImageContainer}
          >
            <Image
              src={imageUrl}
              alt={imageAlt}
              className={
                containImages
                  ? styles.productImageContain
                  : styles.productImage
              }
              fill
              sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
              unoptimized
            />
          </Link>

          <div className={styles.productInformation}>
            <Link
              href={`/producto/${product.id}`}
              className={styles.productTitleLink}
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
              imagenUrl={imageUrl}
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
      <section className={styles.pageHeading}>
        <Link
          href="/catalogo"
          className={styles.backButton}
        >
          <ArrowLeft aria-hidden="true" />
          Volver al catálogo
        </Link>

        <div className={styles.titleContainer}>
          <p className={styles.eyebrow}>
            Catálogo Brisée Bake
          </p>

          <h1>{title}</h1>

          <p className={styles.subtitle}>
            {subtitle}
          </p>

          <div
            className={styles.decoration}
            aria-hidden="true"
          >
            <span />
            <span>❀</span>
            <span />
          </div>
        </div>
      </section>

      <ProductCatalogGrid
        items={items}
        searchPlaceholder={searchPlaceholder}
        gridClassName={styles.productGrid}
        gridAriaLabel={`Productos de ${title}`}
        emptyCategoryClassName={styles.emptyMessage}
        emptyCategoryMessage={
          <p>
            Aún no hay productos registrados en esta
            categoría.
          </p>
        }
        renderExtra={
          <article
            key="add-product-extra"
            className={`${styles.addProductCard} admin-only`}
          >
            <Link
              href={`/admin/productos/crear?categoria=${createCategory}`}
              className={styles.addProductLink}
              aria-label={`Añadir producto a ${title}`}
            >
              <span className={styles.addIcon}>
                <Plus aria-hidden="true" />
              </span>

              <span className={styles.addTitle}>
                Añadir producto
              </span>

              <span className={styles.addDescription}>
                Crea un producto nuevo y agrégalo al
                catálogo.
              </span>
            </Link>
          </article>
        }
      />
    </div>
  );
}