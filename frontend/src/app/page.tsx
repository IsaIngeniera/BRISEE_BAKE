import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function Home() {
  let products: any[] = [];
  try {
    const res = await fetch('http://localhost:3001/products', { cache: 'no-store' });
    if (res.ok) {
      products = await res.json();
    }
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  // Colores alternados para las tarjetas
  const bgColors = ["bg-[#fdebf0]", "bg-[#e2f0ea]", "bg-[#fcf1df]", "bg-[#f8e9e6]"];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section (Carrusel) */}
      <div className="relative w-full h-[400px] md:h-[500px] rounded-[40px] overflow-hidden bg-pink-50 mb-16 flex items-center justify-center shadow-sm">
        <div className="absolute inset-0 bg-[#f9e0e3] opacity-50"></div>
        {/* Círculo central */}
        <div className="relative z-10 w-64 h-64 md:w-80 md:h-80 bg-white/80 rounded-full flex flex-col items-center justify-center shadow-lg backdrop-blur-sm border-4 border-white/40">
          <h2 className="text-3xl font-serif text-[#d46a8d] tracking-wider">BRISÉE</h2>
          <span className="text-sm italic font-serif text-[#d46a8d]">Handmade with love</span>
        </div>
        
        {/* Flechas del carrusel */}
        <button className="absolute left-4 z-20 bg-white p-2 rounded-full shadow-md text-pink-400 hover:bg-pink-50 transition">
          <ChevronLeft size={24} />
        </button>
        <button className="absolute right-4 z-20 bg-white p-2 rounded-full shadow-md text-pink-400 hover:bg-pink-50 transition">
          <ChevronRight size={24} />
        </button>
        
        {/* Dots de navegación */}
        <div className="absolute bottom-6 flex gap-2 z-20">
          <div className="w-3 h-3 rounded-full bg-[#d46a8d]"></div>
          <div className="w-3 h-3 rounded-full bg-white/70"></div>
          <div className="w-3 h-3 rounded-full bg-white/70"></div>
          <div className="w-3 h-3 rounded-full bg-white/70"></div>
        </div>
      </div>

      {/* Título de Productos */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-serif text-[#d46a8d] mb-2">Nuestro Catálogo</h2>
        <div className="flex justify-center">
          <span className="text-[#d46a8d]">🌿🌸🌿</span>
        </div>
      </div>

      {/* Grid de Productos reales (conectado a BD) */}
      {products.length === 0 ? (
        <p className="text-center text-gray-500 my-10">Cargando productos o no hay productos disponibles...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => {
            const bg = bgColors[index % bgColors.length];
            return (
              <div key={product.id} className={`${bg} rounded-3xl p-6 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-lg`}>
                
                {/* Contenedor de la imagen (Placeholder por ahora) */}
                <div className="w-40 h-40 relative mb-4 flex items-center justify-center">
                  <div className="w-32 h-32 bg-black/5 rounded-full flex items-center justify-center text-xs text-gray-400">
                    Img: {product.nombre}
                  </div>
                </div>
                
                {/* Nombre y Precio */}
                <h3 className="text-xl font-serif text-[#d46a8d] mb-1">{product.nombre}</h3>
                <p className="text-pink-900 font-bold mb-2">${product.precio.toLocaleString('es-CO')}</p>
                
                {/* Descripción Corta */}
                <p className="text-gray-600 text-xs mb-4 flex-grow line-clamp-3">
                  {product.descripcion}
                </p>
                
                {/* Etiquetas */}
                {product.etiquetas && product.etiquetas.length > 0 && (
                  <div className="flex gap-1 mb-4 flex-wrap justify-center">
                    {product.etiquetas.map((etiq: string) => (
                      <span key={etiq} className="bg-white/50 text-[#d46a8d] text-[10px] px-2 py-1 rounded-full border border-pink-200">
                        {etiq.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}

                <button className="bg-[#f0859a] hover:bg-[#d9677e] text-white py-2 px-8 rounded-full shadow-md transition-colors w-full mt-auto">
                  Ver detalles
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
