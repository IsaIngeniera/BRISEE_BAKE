import Link from 'next/link';

import styles from './cuenta.module.css';

export default function CuentaPage() {
  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>BRISÉE BAKE</p>
        <h1>Mi cuenta</h1>
        <p>Crea una cuenta para continuar con tus compras.</p>
        <Link href="/registro" className={styles.primaryButton}>
          Crear cuenta
        </Link>
        <div className={styles.login}>
          <h2>¿Ya tienes una cuenta?</h2>
          <p>Pronto podrás iniciar sesión con tu correo y contraseña.</p>
        </div>
        <Link href="/catalogo" className={styles.backLink}>
          Seguir navegando
        </Link>
      </div>
    </section>
  );
}
