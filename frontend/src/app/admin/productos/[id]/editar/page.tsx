import type { ReactElement } from 'react';

import EditProductForm from '../../../../../components/products/EditProductForm';

import styles from './edit-product.module.css';

interface EditProductPageProps {
  readonly params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps): Promise<ReactElement> {
  const { id } = await params;

  return (
    <main className={styles.page}>
      <section className={styles.formCard}>
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

        <EditProductForm productId={id} />
      </section>
    </main>
  );
}