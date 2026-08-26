'use client';

import Image from 'next/image';
import Link from 'next/link';

import HomeCarousel, {
  type CarouselSlide,
} from '../../components/home/HomeCarousel';

import { catalogCategories } from '../../data/catalogo';

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

export default function CatalogoPage() {
  return (
    <div className={styles.catalogLayout}>
      <HomeCarousel slides={catalogSlides} />

      <div className={styles.catalogPage}>
        <section className={styles.heading}>
          <h1>Elige tu favorito</h1>

          <div
            className={styles.decorativeLine}
            aria-hidden="true"
          >
            <span />
            <span>❀</span>
            <span />
          </div>

          <p>
            Descubre nuestras categorías y encuentra el producto
            perfecto para cada momento.
          </p>
        </section>

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
              <div
                className={styles.leafDecoration}
                aria-hidden="true"
              >
                <span>❧</span>
              </div>

              <div className={styles.imageContainer}>
                <Image
                  src={category.image}
                  alt={`Categoría de ${category.name}`}
                  fill
                  className={styles.categoryImage}
                  sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw"
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
                <h2
                  style={{
                    color: category.titleColor,
                  }}
                >
                  {category.name}
                </h2>

                <p>{category.description}</p>

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
      </div>
    </div>
  );
}