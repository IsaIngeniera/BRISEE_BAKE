import Link from "next/link";

import {
  ArrowLeft,
  Pencil,
  Plus,
  ShoppingCart,
} from "lucide-react";

import styles from "./Macarrones.module.css";

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
  estado: "ACTIVO" | "INACTIVO";
  etiquetas: string[];
  categoria?: ProductCategory;
  imagenes?: ProductImage[];
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isMacaronProduct(product: Product): boolean {
  const productName = normalizeText(product.nombre);
  const categoryName = normalizeText(
    product.categoria?.nombre ?? "",
  );

  return (
    productName.includes("macaron") ||
    categoryName.includes("macaron")
  );
}

async function getMacaronProducts(): Promise<Product[]> {
  try {
    const apiUrl =
      process.env.INTERNAL_API_URL || "http://backend:3001";

    const response = await fetch(`${apiUrl}/products`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Error fetching products. Status: ${response.status}`,
      );

      return [];
    }

    const products: Product[] = await response.json();

    return products.filter(
      (product) =>
        product.estado !== "INACTIVO" &&
        isMacaronProduct(product),
    );
  } catch (error) {
    console.error("Error fetching macaron products:", error);

    return [];
  }
}

function formatPrice(price: number | string): string {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return "$ 0";
  }

  return numericPrice.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export default async function MacarronesPage() {
  const products = await getMacaronProducts();

  return (
    <div className={styles.page}>
      {/* Page header */}
      <section className={styles.pageHeading}>
        <Link
          href="/catalogo"
          className={styles.backButton}
        >
          <ArrowLeft aria-hidden="true" />
          Volver al catálogo
        </Link>

        <div className={styles.titleContainer}>
          <p className={styles.eyebrow}>
            Catálogo Brisée Bake
          </p>

          <h1>Macarrones</h1>

          <p className={styles.subtitle}>
            Delicados, coloridos y elaborados artesanalmente
            para hacer especial cada momento.
          </p>

          <div
            className={styles.decoration}
            aria-hidden="true"
          >
            <span />
            <span>❀</span>
            <span />
          </div>
        </div>
      </section>

      {/* Products and add-product card */}
      <section
        className={styles.productGrid}
        aria-label="Productos de macarrones"
      >
        {products.map((product) => {
          const productImage =
            product.imagenes?.[0]?.urlImagen ||
            "/images/catalogo/macarrones-placeholder.jpg";

          return (
            <article
              key={product.id}
              className={styles.productCard}
            >
              {/* Admin edit button */}
              <Link
                href={`/admin/productos/${product.id}/editar`}
                className={styles.editButton}
                aria-label={`Editar ${product.nombre}`}
                title={`Editar ${product.nombre}`}
              >
                <Pencil aria-hidden="true" />
              </Link>

              {/* Product image */}
              <div className={styles.productImageContainer}>
                <img
                  src={productImage}
                  alt={
                    product.imagenes?.[0]?.nombre ||
                    `Imagen de ${product.nombre}`
                  }
                  className={styles.productImage}
                />
              </div>

              {/* Product information */}
              <div className={styles.productInformation}>
                <h2>{product.nombre}</h2>

                {product.presentacion && (
                  <p className={styles.presentation}>
                    {product.presentacion}
                  </p>
                )}

                <p className={styles.description}>
                  {product.descripcion}
                </p>

                {product.etiquetas?.length > 0 && (
                  <div
                    className={styles.labels}
                    aria-label="Etiquetas dietéticas"
                  >
                    {product.etiquetas.map((label) => (
                      <span key={label}>
                        {label.replaceAll("_", " ")}
                      </span>
                    ))}
                  </div>
                )}

                <p className={styles.price}>
                  {formatPrice(product.precio)}
                </p>

                <p className={styles.stock}>
                  {product.existencias > 0
                    ? `${product.existencias} disponibles`
                    : "Producto agotado"}
                </p>

                <Link
                  href={`/carrito?producto=${product.id}`}
                  className={`${styles.cartButton} ${
                    product.existencias <= 0
                      ? styles.disabledButton
                      : ""
                  }`}
                  aria-disabled={product.existencias <= 0}
                >
                  <ShoppingCart aria-hidden="true" />

                  {product.existencias > 0
                    ? "Añadir al carrito"
                    : "Agotado"}
                </Link>
              </div>
            </article>
          );
        })}

        {/* Add-product card */}
        <article className={styles.addProductCard}>
          <Link
            href="/admin/productos/crear?categoria=macarrones"
            className={styles.addProductLink}
            aria-label="Crear un macarrón nuevo"
          >
            <span className={styles.addIcon}>
              <Plus aria-hidden="true" />
            </span>

            <span className={styles.addTitle}>
              Añadir producto
            </span>

            <span className={styles.addDescription}>
              Crea un macarrón nuevo y agrégalo al catálogo.
            </span>
          </Link>
        </article>
      </section>

      {products.length === 0 && (
        <section className={styles.emptyMessage}>
          <p>
            Aún no hay macarrones registrados. Utiliza la
            tarjeta “Añadir producto” para crear el primero.
          </p>
        </section>
      )}
    </div>
  );
}