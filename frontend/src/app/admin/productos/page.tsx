import Link from 'next/link';
import Image from 'next/image';
import styles from './admin-productos.module.css';

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
  categoria?: ProductCategory;
  imagenes?: ProductImage[];
}

async function getProducts(): Promise<Product[]> {
  try {
    const apiUrl = process.env.INTERNAL_API_URL ?? 'http://backend:3001';
    
    // We add cache: 'no-store' to ensure the admin always sees the latest data
    const res = await fetch(`${apiUrl}/products`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export default async function AdminProductosPage() {
  let products: Product[] = [];
  let errorOccurred = false;

  try {
    products = await getProducts();
  } catch (error) {
    errorOccurred = true;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Catálogo de Productos</h1>
        <Link href="/admin/productos/crear" className={styles.createButton}>
          + Crear Producto
        </Link>
      </header>

      {errorOccurred ? (
        <div className={styles.errorState}>
          <p>No se pudieron cargar los productos, intenta nuevamente</p>
          <Link href="/admin/productos" className={styles.retryButton}>
            Reintentar
          </Link>
        </div>
      ) : products.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Aún no hay productos creados</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => {
            const formatter = new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0,
            });

            const price =
              typeof product.precio === 'string'
                ? parseFloat(product.precio)
                : product.precio;
                
            const imageUrl = product.imagenes && product.imagenes.length > 0
              ? product.imagenes[0].urlImagen
              : null;

            return (
              <article key={product.id} className={styles.card}>
                <div className={styles.imageContainer}>
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={product.nombre}
                      fill
                      className={styles.image}
                    />
                  ) : (
                    <span className={styles.noImage}>Sin imagen</span>
                  )}
                </div>
                <div className={styles.content}>
                  <h2 className={styles.productName}>{product.nombre}</h2>
                  <p className={styles.productPrice}>{formatter.format(price)}</p>
                  <p className={styles.productDescription}>
                    {product.descripcion.length > 80 
                      ? `${product.descripcion.substring(0, 80)}...` 
                      : product.descripcion}
                  </p>
                  <div className={styles.actions}>
                    <button className={styles.editBtn}>Editar</button>
                    <button className={styles.deleteBtn}>Eliminar</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
