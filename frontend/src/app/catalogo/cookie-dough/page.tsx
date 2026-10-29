import CookieCategoryPage from '@/components/products/CookieCategoryPage';

import styles from './cookie-dough.module.css';

export const dynamic = 'force-dynamic';

export default function CookieDoughPage() {
  return (
    <CookieCategoryPage
      title="Cookie Dough"
      subtitle="Descubre nuestras preparaciones Cookie Dough y elige tu favorita."
      categoryNames={[
        'Cookie Dough',
        ' Cookie Dough',
        'Galletas Cookie Dough',
      ]}
      searchPlaceholder="Buscar Cookie Dough..."
      createCategory="cookie-dough"
      placeholderImage="/images/catalogo/cookie-dough.jpg"
      styles={styles}
    />
  );
}