import { PrismaClient, EstadoProducto } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Borrando datos existentes para evitar duplicados...');
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();

  console.log('Creando categorias...');
  const catGranolas = await prisma.categoria.create({ data: { nombre: 'Granolas' } });
  const catGalletas = await prisma.categoria.create({ data: { nombre: 'Galletas' } });
  const catGalletasCongeladas = await prisma.categoria.create({ data: { nombre: 'Galletas congeladas' } });
  const catMacarons = await prisma.categoria.create({ data: { nombre: 'Macarons' } });

  console.log('Creando productos...');

  // Granolas
  const descGranolaAlmendras = 'Snack saludable con almendras, nueces, coco, avena sin gluten y miel de abeja, libre de azúcares añadidos';
  const descGranolaCacao = 'Avena sin gluten, almendras, nueces, miel de caña orgánica, aceite de coco, cacao natural, especias y vainilla.';

  await prisma.producto.createMany({
    data: [
      { idCategoria: catGranolas.id, nombre: 'Granola Almendras y Nueces 500g', descripcion: descGranolaAlmendras, precio: 58000, presentacion: '500g', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catGranolas.id, nombre: 'Granola Almendras y Nueces 300g', descripcion: descGranolaAlmendras, precio: 38500, presentacion: '300g', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catGranolas.id, nombre: 'Granola Almendras y Nueces 60g', descripcion: descGranolaAlmendras, precio: 7400, presentacion: '60g', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      
      { idCategoria: catGranolas.id, nombre: 'Granola Nueces y Cacao 500g', descripcion: descGranolaCacao, precio: 60000, presentacion: '500g', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catGranolas.id, nombre: 'Granola Nueces y Cacao 300g', descripcion: descGranolaCacao, precio: 41500, presentacion: '300g', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catGranolas.id, nombre: 'Granola Nueces y Cacao 60g', descripcion: descGranolaCacao, precio: 8100, presentacion: '60g', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
    ]
  });

  // Galletas Fit (70g)
  const descGalletasFit = 'Mini galletas de harina de almendra, endulzadas con alulosa y chocolate real sin azúcar.';
  await prisma.producto.createMany({
    data: [
      { idCategoria: catGalletas.id, nombre: 'Galleta choco blanco y pistachos', descripcion: descGalletasFit, precio: 14500, presentacion: '70g (Empaque por 2)', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catGalletas.id, nombre: 'Galleta zanahoria choco blanco y nueces', descripcion: descGalletasFit, precio: 13500, presentacion: '70g (Empaque por 2)', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catGalletas.id, nombre: 'Galleta choco chips', descripcion: descGalletasFit, precio: 13500, presentacion: '70g (Empaque por 2)', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catGalletas.id, nombre: 'Galleta doble chocolate', descripcion: descGalletasFit, precio: 14500, presentacion: '70g (Empaque por 2)', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
    ]
  });

  // Galletas Congeladas (280g)
  const descGalletasCongeladas = 'Masa congelada (Empaque por 8). Mini galletas de harina de almendra, endulzadas con alulosa y chocolate real sin azúcar.';
  await prisma.producto.createMany({
    data: [
      { idCategoria: catGalletasCongeladas.id, nombre: 'Masa choco blanco y pistachos', descripcion: descGalletasCongeladas, precio: 55000, presentacion: '280g', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catGalletasCongeladas.id, nombre: 'Masa zanahoria choco blanco y nueces', descripcion: descGalletasCongeladas, precio: 37000, presentacion: '280g', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catGalletasCongeladas.id, nombre: 'Masa choco chips', descripcion: descGalletasCongeladas, precio: 44000, presentacion: '280g', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catGalletasCongeladas.id, nombre: 'Masa doble chocolate', descripcion: descGalletasCongeladas, precio: 52000, presentacion: '280g', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
    ]
  });

  // Macarons
  const descMacarons = 'Galletas elaboradas de harina de almendras y rellena de ganache de chocolate real y confituras naturales.';
  await prisma.producto.createMany({
    data: [
      { idCategoria: catMacarons.id, nombre: 'Macarons decorado', descripcion: descMacarons, precio: 8500, presentacion: '1 unidad', existencias: 100, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catMacarons.id, nombre: 'Caja de Macarons * 3', descripcion: descMacarons, precio: 25000, presentacion: 'Caja 3 uni', existencias: 100, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catMacarons.id, nombre: 'Caja de Macarons * 6', descripcion: descMacarons, precio: 45000, presentacion: 'Caja 6 uni', existencias: 100, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catMacarons.id, nombre: 'Caja de Macarons * 15', descripcion: descMacarons, precio: 120000, presentacion: 'Caja 15 uni', existencias: 100, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catMacarons.id, nombre: 'Corona de Macarons', descripcion: descMacarons, precio: 105000, presentacion: '1 unidad', existencias: 20, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
    ]
  });

  console.log('Seeder ejecutado con exito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
