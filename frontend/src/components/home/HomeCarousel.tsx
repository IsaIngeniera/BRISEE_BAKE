"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

import styles from "./HomeCarousel.module.css";

export interface CarouselSlide {
  id: number;
  image: string;
  alt: string;
}

interface HomeCarouselProps {
  slides: CarouselSlide[];
  editHref?: string;
}

export default function HomeCarousel({
  slides,
  editHref,
}: HomeCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  function previousSlide() {
    setCurrentSlide((current) =>
      current === 0 ? slides.length - 1 : current - 1,
    );
  }

  function nextSlide() {
    setCurrentSlide((current) =>
      current === slides.length - 1 ? 0 : current + 1,
    );
  }

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentSlide((current) =>
        current === slides.length - 1 ? 0 : current + 1,
      );
    }, 6000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) {
    return null;
  }

  return (
    <section
      className={styles.carousel}
      aria-label="Presentación de Brisée Bake"
    >
      {slides.map((slide, index) => (
        <Image
          key={slide.id}
          src={slide.image}
          alt={slide.alt}
          fill
          priority={index === 0}
          className={`${styles.slideImage} ${
            index === currentSlide
              ? styles.activeSlide
              : styles.hiddenSlide
          }`}
          sizes="100vw"
        />
      ))}

      <div className={styles.overlay} />

      {editHref && (
        <Link
          href={editHref}
          className={styles.adminEditButton}
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
            onClick={previousSlide}
            aria-label="Mostrar imagen anterior"
          >
            <ChevronLeft aria-hidden="true" />
          </button>

          <button
            type="button"
            className={`${styles.arrowButton} ${styles.rightArrow}`}
            onClick={nextSlide}
            aria-label="Mostrar imagen siguiente"
          >
            <ChevronRight aria-hidden="true" />
          </button>

          <div
            className={styles.dots}
            aria-label="Seleccionar imagen"
          >
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={`${styles.dot} ${
                  index === currentSlide ? styles.activeDot : ""
                }`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Mostrar imagen ${index + 1}`}
                aria-current={
                  index === currentSlide ? "true" : undefined
                }
              />
            ))}
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