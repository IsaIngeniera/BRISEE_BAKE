import CookieCategoryPage from '@/components/products/CookieCategoryPage';

import styles from './cookies-congeladas.module.css';

export default function CookiesCongeladasPage() {
  return (
    <CookieCategoryPage
      title="Cookies congeladas"
      subtitle="Listas para conservar, hornear y disfrutar cuando quieras."
      categoryNames={[
        'Galletas congeladas',
        'Cookies congeladas',
      ]}
      searchPlaceholder="Buscar cookie congelada..."
      createCategory="cookies-congeladas"
      placeholderImage="/images/catalogo/cookies-congeladas.jpg"
      styles={styles}
      containImages
    />
  );
}