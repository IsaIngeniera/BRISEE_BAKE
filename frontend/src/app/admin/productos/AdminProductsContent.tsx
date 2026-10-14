'use client';

import type { ReactElement } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import DeleteProductButton from '@/components/products/DeleteProductButton';
import ProductSearchBar from '@/components/products/ProductSearchBar';
import { useProductFilters } from '@/hooks/useProductFilters';
import styles from './admin-productos.module.css';

export interface ProductImage {
  readonly id: string;
  readonly urlImagen: string;
  readonly nombre: string;
}

export interface ProductCategory {
  readonly id: string;
  readonly nombre: string;
}

export interface Product {
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
  readonly etiquetas?: string[];
}

interface AdminProductsContentProps {
  products: Product[];
}

function formatPrice(price: number | string): string {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return 'COP $ 0';
  }

  const formatted = numericPrice.toLocaleString('es-CO', {
    maximumFractionDigits: 0,
  });

  return `COP $ ${formatted}`;
}

function shortenDescription(description: string): string {
  const maximumLength = 80;

  if (description.length <= maximumLength) {
    return description;
  }

  return `${description.substring(0, maximumLength)}...`;
}

export default function AdminProductsContent({
  products,
}: AdminProductsContentProps): ReactElement {
  const {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching,
    hasActiveFilters,
    activeTags,
    toggleTag,
    clearTags,
  } = useProductFilters(products, {
    getSearchableText: (product) =>
      `${product.nombre} ${product.categoria?.nombre ?? ''}`,
    getTags: (product) => product.etiquetas ?? [],
  });

  const isFiltering = isSearching || hasActiveFilters;

  return (
    <>
      <div className={styles.searchWrapper}>
        <ProductSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar producto por nombre o categoría..."
          activeTags={activeTags}
          toggleTag={toggleTag}
          clearTags={clearTags}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {isFiltering && filteredItems.length === 0 ? (
        <section className={styles.noResults} role="status">
          <p>No se encontraron productos para tu búsqueda.</p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              clearTags?.();
            }}
            className={styles.clearSearchButton}
          >
            Limpiar búsqueda
          </button>
        </section>
      ) : (
        <section
          className={styles.productGrid}
          aria-label="Productos registrados"
        >
          {filteredItems.map((product) => {
            const imageUrl = product.imagenes?.[0]?.urlImagen;

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

                <div className={styles.productInformation}>
                  {product.categoria && (
                    <p className={styles.productCategory}>
                      {product.categoria.nombre}
                    </p>
                  )}

                  <h2 className={styles.productName}>
                    {product.nombre}
                  </h2>

                  <p className={styles.productPrice}>
                    {formatPrice(product.precio)}
                  </p>

                  <p className={styles.productPresentation}>
                    {product.presentacion}
                  </p>

                  <p className={styles.productDescription}>
                    {shortenDescription(product.descripcion)}
                  </p>

                  <p className={styles.productStock}>
                    {product.existencias} existencias
                  </p>

                  <div className={styles.productActions}>
                    <Link
                      href={`/admin/productos/${product.id}/editar`}
                      className={styles.editButton}
                      aria-label={`Editar ${product.nombre}`}
                    >
                      Editar
                    </Link>

                    <DeleteProductButton
                      id={product.id}
                      nombre={product.nombre}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}
