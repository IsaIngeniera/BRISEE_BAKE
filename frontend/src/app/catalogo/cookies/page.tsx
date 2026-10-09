import CookieCategoryPage from '@/components/products/CookieCategoryPage';

import styles from './cookies.module.css';

export default function CookiesPage() {
  return (
    <CookieCategoryPage
      title="Cookies"
      subtitle="Crujientes, suaves y llenas de sabor artesanal para disfrutar en cualquier momento."
      categoryNames={['Galletas', 'Cookies']}
      searchPlaceholder="Buscar cookie..."
      createCategory="cookies"
      placeholderImage="/images/catalogo/cookies.jpg"
      styles={styles}
    />
  );
}