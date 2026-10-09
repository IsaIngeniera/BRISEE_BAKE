import CookieCategoryPage from '@/components/products/CookieCategoryPage';

import styles from './cookie-dough.module.css';

export default function CookieDoughPage() {
  return (
    <CookieCategoryPage
      title="Cookies Cookie Dough"
      subtitle="Descubre nuestras preparaciones Cookie Dough y elige tu favorita."
      categoryNames={[
        'Cookie Dough',
        'Cookies Cookie Dough',
        'Galletas Cookie Dough',
      ]}
      searchPlaceholder="Buscar Cookie Dough..."
      createCategory="cookie-dough"
      placeholderImage="/images/catalogo/cookie-dough.jpg"
      styles={styles}
    />
  );
}