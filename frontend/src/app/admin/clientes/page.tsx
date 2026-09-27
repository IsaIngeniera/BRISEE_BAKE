import Link from 'next/link';
import { ArrowLeft, UsersRound } from 'lucide-react';

import styles from './clientes.module.css';

export default function ClientesAdminPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/admin/productos" className={styles.backLink}>
          <ArrowLeft size={20} aria-hidden="true" /> Volver a administración
        </Link>
        <p className={styles.eyebrow}>BRISÉE BAKE ADMIN</p>
        <h1>Administrar clientes</h1>
        <p className={styles.intro}>Consulta las cuentas registradas de tu tienda.</p>
        <section className={styles.empty} role="status">
          <UsersRound size={48} strokeWidth={1.5} aria-hidden="true" />
          <h2>Clientes aún no disponibles</h2>
        </section>
      </div>
    </main>
  );
}
