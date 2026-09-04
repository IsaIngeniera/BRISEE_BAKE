import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import styles from './product-detail.module.css';
import ProductDetailActions from '@/components/products/ProductDetailActions';

interface ProductImage {
  id: string;
  urlImagen: string;
  nombre: string;
}

interface ProductCategory {
  id: string;
  nombre: string;
}

interface Product {
  id: string;
  idCategoria: string;
  nombre: string;
  descripcion: string;
  precio: number | string;
  presentacion: string;
  existencias: number;
  estado: 'ACTIVO' | 'INACTIVO';
  etiquetas: string[];
  categoria?: ProductCategory;
  imagenes?: ProductImage[];
}

const PRICE_FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatPrice(price: number | string): string {
  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice)) {
    return PRICE_FORMATTER.format(0);
  }
  return PRICE_FORMATTER.format(numericPrice);
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const apiUrl =
      process.env.INTERNAL_API_URL ?? 'http://backend:3001';

    const response = await fetch(`${apiUrl}/products/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch product ${id}`);
    }

    const product: Product = await response.json();
    
    if (product.estado === 'INACTIVO') {
      return null;
    }

    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductDetailPage({
  params,
}: ProductPageProps) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.id);

  if (!product) {
    notFound();
  }

  const productImageUrl =
    product.imagenes?.[0]?.urlImagen ??
    '/images/catalogo/macarons-placeholder.jpg';

  const productImageAlt =
    product.imagenes?.[0]?.nombre ?? `Imagen de ${product.nombre}`;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/catalogo" className={styles.backButton}>
          <ArrowLeft aria-hidden="true" />
          Volver al catálogo
        </Link>

        <article className={styles.productLayout}>
          <div className={styles.imageSection}>
            <Image
              src={productImageUrl}
              alt={productImageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={styles.productImage}
              unoptimized
            />
          </div>

          <div className={styles.infoSection}>
            {product.categoria && (
              <p className={styles.category}>{product.categoria.nombre}</p>
            )}
            
            <h1 className={styles.title}>{product.nombre}</h1>
            
            <p className={styles.price}>{formatPrice(product.precio)}</p>
            
            <hr className={styles.divider} />
            
            <p className={styles.description}>{product.descripcion}</p>
            
            {product.presentacion && (
              <p className={styles.presentation}>
                <span>Presentación:</span> {product.presentacion}
              </p>
            )}

            {product.etiquetas.length > 0 && (
              <div className={styles.labels} aria-label="Etiquetas dietéticas">
                {product.etiquetas.map((label) => (
                  <span key={label}>{label.replaceAll('_', ' ')}</span>
                ))}
              </div>
            )}

            <div className={styles.actions}>  
              <p className={styles.stock}>
                {product.existencias > 0
                  ? `${product.existencias} disponibles`
                  : 'Sin existencias'}
              </p>

              <ProductDetailActions
                productId={product.id}
                nombre={product.nombre}
                precio={product.precio}
                imagenUrl={productImageUrl}
                existencias={product.existencias}
              />
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
