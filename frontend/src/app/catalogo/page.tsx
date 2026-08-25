"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { catalogCategories } from "../../data/catalogo";

import styles from "./Catalogo.module.css";

const heroSlides = [
  {
    id: 1,
    image: "/images/catalogo/banner-1.jpg",
    alt: "Productos artesanales de Brisée Bake",
  },
  {
    id: 2,
    image: "/images/catalogo/banner-2.jpg",
    alt: "Galletas y granolas artesanales",
  },
  {
    id: 3,
    image: "/images/catalogo/banner-3.jpg",
    alt: "Macarrones y productos de Brisée Bake",
  },
];

export default function CatalogoPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  function showPreviousSlide() {
    setCurrentSlide((current) =>
      current === 0 ? heroSlides.length - 1 : current - 1,
    );
  }

  function showNextSlide() {
    setCurrentSlide((current) =>
      current === heroSlides.length - 1 ? 0 : current + 1,
    );
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentSlide((current) =>
        current === heroSlides.length - 1 ? 0 : current + 1,
      );
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

  const activeSlide = heroSlides[currentSlide];

  return (
    <div className={styles.catalogPage}>
      {/* Hero carousel */}
      <section
        className={styles.hero}
        aria-label="Presentación de Brisée Bake"
      >
        <Image
          key={activeSlide.id}
          src={activeSlide.image}
          alt={activeSlide.alt}
          fill
          priority
          className={styles.heroImage}
          sizes="100vw"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />

        <div className={styles.heroOverlay} />

        <button
          type="button"
          className={`${styles.carouselButton} ${styles.previousButton}`}
          onClick={showPreviousSlide}
          aria-label="Mostrar imagen anterior"
        >
          <ChevronLeft aria-hidden="true" />
        </button>

        <div className={styles.heroLogo}>
          <Image
            src="/images/logo-brisee-transparent.png"
            alt="Brisée Bake - Handmade with love"
            width={360}
            height={360}
            priority
            className={styles.heroLogoImage}
          />
        </div>

        <button
          type="button"
          className={`${styles.carouselButton} ${styles.nextButton}`}
          onClick={showNextSlide}
          aria-label="Mostrar imagen siguiente"
        >
          <ChevronRight aria-hidden="true" />
        </button>

        <div
          className={styles.carouselDots}
          aria-label="Seleccionar imagen"
        >
          {heroSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={`${styles.carouselDot} ${
                index === currentSlide
                  ? styles.activeDot
                  : ""
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Mostrar imagen ${index + 1}`}
              aria-current={
                index === currentSlide ? "true" : undefined
              }
            />
          ))}
        </div>
      </section>

      {/* Catalog heading */}
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

      {/* Categories */}
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
            <div className={styles.leafDecoration}>
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
                  event.currentTarget.style.display = "none";
                }}
              />

              <div className={styles.imagePlaceholder}>
                <span>Imagen de</span>
                <strong>{category.name}</strong>
              </div>
            </div>

            <div className={styles.cardContent}>
              <h2 style={{ color: category.titleColor }}>
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
  );
}