import { Suspense, type ReactElement } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import ProductForm from '@/components/products/ProductForm';

import styles from './crear-producto.module.css';

export default function CreateProductPage(): ReactElement {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/admin/productos" className={styles.backLink}>
          <ArrowLeft size={20} aria-hidden="true" />
          Volver a productos
        </Link>

        <section className={styles.card}>
          <header className={styles.heading}>
            <p className={styles.eyebrow}>BRISÉE BAKE ADMIN</p>
            <h1>Crear nuevo producto</h1>
            <p>Completa la información del postre que quieres agregar al catálogo.</p>
          </header>

          <Suspense
            fallback={
              <p className={styles.loading} role="status">
                Cargando formulario...
              </p>
            }
          >
            <ProductForm />
          </Suspense>
        </section>
      </div>
    </main>
  );
}