'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import EditProductForm from '../../../../../components/products/EditProductForm';

import styles from './edit-product.module.css';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  return (
    <main className={styles.page}>
      <section className={styles.formCard}>
        <button
          type="button"
          className={styles.backLink}
          onClick={() => router.back()}
        >
          <ArrowLeft aria-hidden="true" />
          Volver
        </button>

        <header className={styles.heading}>
          <p className={styles.eyebrow}>
            Administración del catálogo
          </p>

          <h1>Actualizar producto</h1>

          <p className={styles.description}>
            Modifica la información que necesites y confirma los
            cambios del producto.
          </p>
        </header>

        <EditProductForm productId={params.id} />
      </section>
    </main>
  );
}