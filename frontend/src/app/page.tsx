import Image from "next/image";
import Link from "next/link";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImage {
  id: number;
  urlImagen: string;
  nombre: string;
}

interface Product {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number | string;
  presentacion: string;
  existencias: number;
  etiquetas: string[];
  imagenes?: ProductImage[];
}

async function getProducts(): Promise<Product[]> {
  try {
    /*
     * When Next.js runs inside Docker, it connects to the backend
     * using the Docker service name "backend".
     */
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

    return await response.json();
  } catch (error) {
    console.error("Error fetching products:", error);

    return [];
  }
}

export default async function Home() {
  const products = await getProducts();

  const backgroundColors = [
    "bg-[#fdebf0]",
    "bg-[#e2f0ea]",
    "bg-[#fcf1df]",
    "bg-[#f8e9e6]",
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Hero section */}
      <section className="relative w-full h-[400px] md:h-[500px] rounded-[40px] overflow-hidden bg-pink-50 mb-16 flex items-center justify-center shadow-sm">
        {/* Hero background image */}
        <Image
          src="/images/hero/hero-1.jpg"
          alt="Productos artesanales de Brisée Bake"
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1280px"
        />

        {/* Pink overlay */}
        <div className="absolute inset-0 bg-[#f9e0e3]/40" />

        {/* Central logo */}
        <div className="relative z-10 w-64 h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center shadow-lg">
          <Image
            src="/images/logo-brisee-transparent.png"
            alt="Logo de Brisée Bake"
            width={320}
            height={320}
            priority
            className="w-full h-full object-contain"
          />
        </div>

        {/* Previous button */}
        <button
          type="button"
          aria-label="Mostrar imagen anterior"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white p-3 rounded-full shadow-md text-pink-400 hover:bg-pink-50 transition"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Next button */}
        <button
          type="button"
          aria-label="Mostrar imagen siguiente"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white p-3 rounded-full shadow-md text-pink-400 hover:bg-pink-50 transition"
        >
          <ChevronRight size={24} />
        </button>

        {/* Carousel navigation dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          <span className="w-3 h-3 rounded-full bg-[#d46a8d]" />
          <span className="w-3 h-3 rounded-full bg-white/70" />
          <span className="w-3 h-3 rounded-full bg-white/70" />
          <span className="w-3 h-3 rounded-full bg-white/70" />
        </div>
      </section>

      {/* Catalog title */}
      <section className="text-center mb-10">
        <h1 className="text-3xl font-serif text-[#d46a8d] mb-2">
          Nuestro Catálogo
        </h1>

        <div className="flex justify-center">
          <span className="text-[#d46a8d]" aria-hidden="true">
            🌿🌸🌿
          </span>
        </div>
      </section>

      {/* Product grid */}
      {products.length === 0 ? (
        <section className="text-center bg-[#fdebf0] rounded-3xl px-6 py-14">
          <p className="text-lg font-medium text-[#d46a8d]">
            No hay productos disponibles
          </p>

          <p className="text-sm text-gray-600 mt-2">
            Muy pronto encontrarás aquí nuestros productos artesanales.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => {
            const backgroundColor =
              backgroundColors[index % backgroundColors.length];

            /*
             * Use the first image returned by the database.
             * If the product has no image, use the placeholder.
             */
            const productImage =
              product.imagenes?.[0]?.urlImagen ||
              "/images/productos/placeholder.jpg";

            const formattedPrice = Number(product.precio).toLocaleString(
              "es-CO",
              {
                style: "currency",
                currency: "COP",
                maximumFractionDigits: 0,
              },
            );

            return (
              <article
                key={product.id}
                className={`${backgroundColor} rounded-3xl p-6 flex flex-col items-center text-center transition duration-300 hover:-translate-y-2 hover:shadow-lg`}
              >
                {/* Product image */}
                <div className="relative w-44 h-44 mb-5 overflow-hidden rounded-full bg-white/60">
                  <Image
                    src={productImage}
                    alt={
                      product.imagenes?.[0]?.nombre ||
                      `Imagen de ${product.nombre}`
                    }
                    fill
                    className="object-cover"
                    sizes="176px"
                  />
                </div>

                {/* Product name */}
                <h2 className="text-xl font-serif text-[#d46a8d] mb-1">
                  {product.nombre}
                </h2>

                {/* Product price */}
                <p className="text-pink-900 font-bold mb-2">
                  {formattedPrice}
                </p>

                {/* Product presentation */}
                {product.presentacion && (
                  <p className="text-xs font-medium text-[#d46a8d] mb-2">
                    {product.presentacion}
                  </p>
                )}

                {/* Product description */}
                <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
                  {product.descripcion}
                </p>

                {/* Dietary labels */}
                {product.etiquetas?.length > 0 && (
                  <div className="flex gap-1 mb-4 flex-wrap justify-center">
                    {product.etiquetas.map((etiqueta) => (
                      <span
                        key={etiqueta}
                        className="bg-white/60 text-[#d46a8d] text-[10px] px-2 py-1 rounded-full border border-pink-200"
                      >
                        {etiqueta.replaceAll("_", " ")}
                      </span>
                    ))}
                  </div>
                )}

                {/* Product details */}
                <Link
                  href={`/productos/${product.id}`}
                  className="bg-[#f0859a] hover:bg-[#d9677e] text-white py-2 px-8 rounded-full shadow-md transition-colors w-full mt-auto"
                >
                  Ver detalles
                </Link>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}