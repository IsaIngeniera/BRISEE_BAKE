'use client';

import Image from 'next/image';
import Link from 'next/link';

import {
  useEffect,
  useState,
  type ReactElement,
} from 'react';

import {
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

import styles from './home-carousel.module.css';

export interface CarouselSlide {
  readonly id: number;
  readonly image: string;
  readonly alt: string;
}

interface HomeCarouselProps {
  readonly slides: readonly CarouselSlide[];
  readonly editHref?: string;
}

export default function HomeCarousel({
  slides,
  editHref,
}: HomeCarouselProps): ReactElement | null {
  const [currentSlide, setCurrentSlide] = useState(0);

  function showPreviousSlide(): void {
    setCurrentSlide((currentIndex) =>
      currentIndex === 0
        ? slides.length - 1
        : currentIndex - 1,
    );
  }

  function showNextSlide(): void {
    setCurrentSlide((currentIndex) =>
      currentIndex === slides.length - 1
        ? 0
        : currentIndex + 1,
    );
  }

  useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCurrentSlide((currentIndex) =>
        currentIndex === slides.length - 1
          ? 0
          : currentIndex + 1,
      );
    }, 6000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [slides.length]);

  if (slides.length === 0) {
    return null;
  }

  return (
    <section
      className={styles.carousel}
      aria-label="Presentación de Brisée Bake"
    >
      {slides.map((slide, index) => {
        const isActiveSlide = index === currentSlide;

        return (
          <Image
            key={slide.id}
            src={slide.image}
            alt={slide.alt}
            fill
            priority={index === 0}
            className={`${styles.slideImage} ${
              isActiveSlide
                ? styles.activeSlide
                : styles.hiddenSlide
            }`}
            sizes="100vw"
            aria-hidden={!isActiveSlide}
          />
        );
      })}

      <div
        className={styles.overlay}
        aria-hidden="true"
      />

      {editHref && (
        <Link
          href={editHref}
          className={`${styles.adminEditButton} admin-only`}
          aria-label="Editar carrusel"
          title="Editar carrusel"
        >
          <Plus aria-hidden="true" />
        </Link>
      )}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className={`${styles.arrowButton} ${styles.leftArrow}`}
            onClick={showPreviousSlide}
            aria-label="Mostrar imagen anterior"
          >
            <ChevronLeft aria-hidden="true" />
          </button>

          <button
            type="button"
            className={`${styles.arrowButton} ${styles.rightArrow}`}
            onClick={showNextSlide}
            aria-label="Mostrar imagen siguiente"
          >
            <ChevronRight aria-hidden="true" />
          </button>

          <div
            className={styles.dots}
            role="group"
            aria-label="Seleccionar imagen"
          >
            {slides.map((slide, index) => {
              const isActiveDot = index === currentSlide;

              return (
                <button
                  key={slide.id}
                  type="button"
                  className={`${styles.dot} ${
                    isActiveDot ? styles.activeDot : ''
                  }`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Mostrar imagen ${index + 1}`}
                  aria-current={
                    isActiveDot ? 'true' : undefined
                  }
                />
              );
            })}
          </div>
        </>
      )}

      <div className={styles.logoContainer}>
        <Image
          src="/images/logo-brisee-transparent.png"
          alt="Brisée Bake - Handmade with love"
          width={400}
          height={400}
          priority
          className={styles.logo}
        />
      </div>
    </section>
  );
}