import Image from 'next/image';
import Link from 'next/link';

import type { ReactElement } from 'react';

import {
  Heart,
  Leaf,
  Plus,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import HomeCarousel, {
  type CarouselSlide,
} from '@/components/home/HomeCarousel';

import styles from './page.module.css';

interface Benefit {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  backgroundColor: string;
  iconBackground: string;
  color: string;
  editPath: string;
}

const homeSlides: CarouselSlide[] = [
  {
    id: 1,
    image: '/images/carousel/home/home-1.jpg',
    alt: 'Macarons, cupcakes y tortas de Brisée Bake',
  },
  {
    id: 2,
    image: '/images/carousel/home/home-2.jpg',
    alt: 'Productos artesanales de Brisée Bake',
  },
  {
    id: 3,
    image: '/images/carousel/home/home-3.jpg',
    alt: 'Repostería artesanal de Brisée Bake',
  },
];

const benefits: Benefit[] = [
  {
    id: 1,
    title: 'Excelente sabor',
    description:
      'Combinamos ingredientes de calidad con recetas cuidadosamente elaboradas para ofrecer un sabor delicioso.',
    icon: Heart,
    backgroundColor: '#fbe3f1',
    iconBackground: '#f3b7d4',
    color: '#d66098',
    editPath: '/admin/inicio/beneficios/1',
  },
  {
    id: 2,
    title: 'Ingredientes frescos',
    description:
      'Combinamos ingredientes de calidad con recetas cuidadosamente elaboradas para ofrecer un sabor delicioso.',
    icon: Leaf,
    backgroundColor: '#e5f1eb',
    iconBackground: '#cce5bc',
    color: '#6eaa61',
    editPath: '/admin/inicio/beneficios/2',
  },
  {
    id: 3,
    title: 'Calidad artesanal',
    description:
      'Elaboramos cada producto con dedicación y atención al detalle, cuidando desde la preparación hasta la presentación.',
    icon: Sparkles,
    backgroundColor: '#f9f2d2',
    iconBackground: '#f5df9a',
    color: '#d7a81f',
    editPath: '/admin/inicio/beneficios/3',
  },
];

export default function HomePage(): ReactElement {
  return (
    <div className={styles.homePage}>
      {/* Functional carousel */}
      <HomeCarousel
        slides={homeSlides}
        editHref="/admin/inicio/carrusel"
      />

      {/* About us */}
      <section className={styles.aboutSection}>
        <Link
          href="/admin/inicio/quienes-somos"
          className={styles.sectionEditButton}
          aria-label="Editar la sección Quiénes somos"
          title="Editar esta sección"
        >
          <Plus aria-hidden="true" />
        </Link>

        <div className={styles.aboutContent}>
          <h1>¿Quiénes somos?</h1>

          <div
            className={styles.titleDecoration}
            aria-hidden="true"
          >
            <span />
            <span>❀</span>
            <span />
          </div>

          <p>
            Diseñamos y ofrecemos productos de repostería fina y
            saludable que generan experiencias memorables,
            elaborados con ingredientes naturales y funcionales
            que aportan bienestar al consumidor; mientras
            construimos una empresa rentable, sostenible y
            coherente.
          </p>
        </div>

        <div className={styles.aboutImageContainer}>
          <Image
            src="/images/home/quienes-somos.png"
            alt="Macarons artesanales de Brisée Bake"
            fill
            className={styles.aboutImage}
            sizes="(max-width: 800px) 100vw, 50vw"
          />

          <div
            className={styles.imagePlaceholder}
            aria-hidden="true"
          >
            <span>Imagen para la sección</span>
            <strong>¿Quiénes somos?</strong>
          </div>
        </div>
      </section>

      {/* Brand phrase */}
      <section className={styles.brandPhrase}>
        <Link
          href="/admin/inicio/frase"
          className={styles.phraseEditButton}
          aria-label="Editar frase principal"
          title="Editar frase"
        >
          <Plus aria-hidden="true" />
        </Link>

        <p>
          “Creamos momentos dulces que nutren el cuerpo, elevan
          los sentidos y se convierten en recuerdos.”
        </p>
      </section>

      {/* Benefits */}
      <section className={styles.benefitsSection}>
        <div className={styles.benefitsHeading}>
          <p className={styles.eyebrow}>
            Nuestra esencia
          </p>

          <h2>Lo que hace especial a Brisée Bake</h2>
        </div>

        <div className={styles.benefitsGrid}>
          {benefits.map((benefit) => {
            const BenefitIcon = benefit.icon;

            return (
              <article
                key={benefit.id}
                className={styles.benefitCard}
                style={{
                  backgroundColor: benefit.backgroundColor,
                }}
              >
                <Link
                  href={benefit.editPath}
                  className={styles.cardEditButton}
                  aria-label={`Editar ${benefit.title}`}
                  title={`Editar ${benefit.title}`}
                >
                  <Plus aria-hidden="true" />
                </Link>

                <div
                  className={styles.benefitIcon}
                  style={{
                    color: benefit.color,
                    backgroundColor: benefit.iconBackground,
                  }}
                >
                  <BenefitIcon aria-hidden="true" />
                </div>

                <h3
                  style={{
                    color: benefit.color,
                  }}
                >
                  {benefit.title}
                </h3>

                <p>{benefit.description}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}