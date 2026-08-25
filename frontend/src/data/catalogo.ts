export interface CatalogCategory {
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  image: string;
  backgroundColor: string;
  titleColor: string;
}

export const catalogCategories: CatalogCategory[] = [
  {
    slug: "macarrones",
    name: "Macarrones",
    description: "Delicados, coloridos y artesanales",
    longDescription:
      "Descubre nuestros macarrones artesanales, preparados con delicadeza, sabores especiales y una presentación llena de color.",
    image: "/images/catalogo/mac.jpg",
    backgroundColor: "#fbe3f1",
    titleColor: "#d66098",
  },
  {
    slug: "galletas",
    name: "Galletas",
    description: "Crujientes, suaves y llenas de sabor",
    longDescription:
      "Encuentra galletas artesanales con diferentes sabores, texturas y presentaciones para compartir o disfrutar en cualquier momento.",
    image: "/images/catalogo/galletas.jpg",
    backgroundColor: "#e5f1eb",
    titleColor: "#578878",
  },
  {
    slug: "granolas",
    name: "Granolas",
    description: "Ingredientes naturales para cada día",
    longDescription:
      "Conoce nuestras granolas elaboradas con ingredientes seleccionados, frutos secos y combinaciones deliciosas para comenzar bien el día.",
    image: "/images/catalogo/granolas.jpg",
    backgroundColor: "#fff3df",
    titleColor: "#a87c51",
  },
  {
    slug: "linea-saludable",
    name: "Línea saludable",
    description: "Antojos conscientes y deliciosos",
    longDescription:
      "Opciones deliciosas pensadas para diferentes estilos de alimentación, sin perder el sabor artesanal que caracteriza a Brisée Bake.",
    image: "/images/catalogo/linea-saludable.jpg",
    backgroundColor: "#f8e3df",
    titleColor: "#9b6852",
  },
];