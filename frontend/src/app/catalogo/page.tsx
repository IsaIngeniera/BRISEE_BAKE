'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import HomeCarousel, {
  type CarouselSlide,
} from '../../components/home/HomeCarousel';
import ProductSearchBar from '../../components/products/ProductSearchBar';
import { useProductFilters } from '../../hooks/useProductFilters';

import styles from './catalog.module.css';

const catalogSlides: CarouselSlide[] = [
  {
    id: 1,
    image: '/images/carousel/catalogo/catalogo-1.jpg',
    alt: 'Productos artesanales de Brisée Bake',
  },
  {
    id: 2,
    image: '/images/carousel/catalogo/catalogo-2.jpg',
    alt: 'Galletas y granolas artesanales',
  },
  {
    id: 3,
    image: '/images/carousel/catalogo/catalogo-3.jpg',
    alt: 'Macarons y productos de Brisée Bake',
  },
];

const catalogCategories = [
  {
    name: 'Macarons',
    slug: 'macarons',
    description: 'Deliciosos macarons artesanales llenos de sabor y color.',
    image: '/images/catalogo/macarons.jpg',
    backgroundColor: '#fbe3f1',
    titleColor: '#d66098',
    isHealthy: false, 
  },
  {
    name: 'Cookies',
    slug: 'cookies',
    description: 'Galletas saludables, crujientes y perfectas para cuidarte.',
    image: '/images/catalogo/cookies.jpg',
    backgroundColor: '#e5f1eb',
    titleColor: '#6eaa61',
    isHealthy: true,
  },
  {
    name: 'Granolas',
    slug: 'granolas',
    description: 'Granolas horneadas, llenas de fibra y energía natural.',
    image: '/images/catalogo/granolas.jpg',
    backgroundColor: '#f9f2d2',
    titleColor: '#d7a81f',
    isHealthy: true,
  },
  {
    name: 'Cookies congeladas',
    slug: 'cookies-congeladas',
    description: 'Masa lista para hornear y disfrutar galletas frescas en casa.',
    image: '/images/catalogo/cookies-congeladas.jpg',
    backgroundColor: '#e6eaf5',
    titleColor: '#5a73a3',
    isHealthy: true,
  },
  {
    name: 'Cookies cookie Dough',
    slug: 'cookie-dough',
    description: 'Deliciosa masa cruda comestible, un antojo seguro y dulce.',
    image: '/images/catalogo/cookie-dough.jpg',
    backgroundColor: '#f5e6e8',
    titleColor: '#a8616c',
    isHealthy: true,
  },
];

interface ProductImage {
  urlImagen: string;
  nombre: string;
}

interface Product {
  id: number | string;
  nombre: string;
  precio: number | string;
  estado: 'ACTIVO' | 'INACTIVO';
  etiquetas: string[];
  imagenes?: ProductImage[];
}

function formatPrice(price: number | string): string {
  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice)) return 'COP $ 0';
  const formatted = numericPrice.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  return `COP $ ${formatted}`;
}

export default function CatalogoPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    fetch(`${apiUrl}/products`)
      .then((response) => (response.ok ? response.json() : []))
      .then((products: Product[]) => {
        setAllProducts(products.filter((p) => p.estado !== 'INACTIVO'));
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching products for search:', error);
        setIsLoading(false);
      });
  }, []);

  const {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching,
    hasActiveFilters,
    activeTags,
    toggleTag,
    clearTags,
  } = useProductFilters(allProducts, {
    getSearchableText: (product) => product.nombre,
    getTags: (product) => product.etiquetas,
  });

  const isFiltering = isSearching || hasActiveFilters;

  return (
    <div className={styles.catalogLayout}>
      <HomeCarousel slides={catalogSlides} />

      <div className={styles.catalogPage}>
        {!isLoading && allProducts.length === 0 ? (
          <section className={styles.noResults} role="status">
            <p>Aún no hay productos creados</p>
          </section>
        ) : (
          <>
            <section className={styles.heading}>
              <h1>Elige tu favorito</h1>

              <div className={styles.decorativeLine} aria-hidden="true">
                <span />
                <span>❀</span>
                <span />
              </div>

              <p>
                Descubre nuestras categorías y encuentra el producto
                perfecto para cada momento.
              </p>
            </section>

            <ProductSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar producto en todo el catálogo..."
              activeTags={activeTags}
              toggleTag={toggleTag}
              clearTags={clearTags}
              hasActiveFilters={hasActiveFilters}
            />

            {isFiltering ? (
              filteredItems.length === 0 ? (
                <section className={styles.noResults} role="status">
                  <p>No se encontraron productos para tu búsqueda</p>
                </section>
              ) : (
                <section
                  className={styles.searchResultsGrid}
                  aria-label="Resultados de búsqueda"
                >
                  {filteredItems.map((product) => (
                    <Link
                      key={product.id}
                      href={`/producto/${product.id}`}
                      className={styles.searchResultCard}
                    >
                      <div className={styles.searchResultImageContainer}>
                        <Image
                          src={
                            product.imagenes?.[0]?.urlImagen ??
                            '/images/catalogo/producto-placeholder.jpg'
                          }
                          alt={product.imagenes?.[0]?.nombre ?? product.nombre}
                          fill
                          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw"
                          unoptimized
                        />
                      </div>

                      <div className={styles.searchResultInfo}>
                        <h3>{product.nombre}</h3>
                        <p>{formatPrice(product.precio)}</p>
                      </div>
                    </Link>
                  ))}
                </section>
              )
            ) : (
              <section
                className={styles.categoryGrid}
                aria-label="Categorías del catálogo"
              >
                {catalogCategories.map((category) => (
                  <article
                    key={category.slug}
                    className={styles.categoryCard}
                    style={{
                      backgroundColor: category.backgroundColor,
                    }}
                  >
                    <div className={styles.leafDecoration} aria-hidden="true">
                      <span>❧</span>
                    </div>

                    {/* Contenedor de la Imagen */}
                    <div className={styles.imageContainer}>
                      {/* ETIQUETA SALUDABLE FLOTANTE */}
                      {category.isHealthy && (
                        <span className={styles.healthyBadge}>
                          🍃 Saludable
                        </span>
                      )}

                      <Image
                        src={category.image}
                        alt={`Categoría de ${category.name}`}
                        fill
                        className={styles.categoryImage}
                        sizes="(max-width: 700px) 100vw, (max-width: 1100px) 20vw, 20vw"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />

                      <div
                        className={styles.imagePlaceholder}
                        aria-hidden="true"
                      >
                        <span>Imagen de</span>
                        <strong>{category.name}</strong>
                      </div>
                    </div>

                    <div className={styles.cardContent}>
                      {/* Contenedor del texto centrado perfectamente */}
                      <div className={styles.textContent}>
                        <h2
                          style={{
                            color: category.titleColor,
                          }}
                        >
                          {category.name}
                        </h2>

                        <p>{category.description}</p>
                      </div>

                      <Link
                        href={`/catalogo/${category.slug}`}
                        className={styles.discoverButton}
                        aria-label={`Descubrir ${category.name}`}
                      >
                        Descubrir
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}