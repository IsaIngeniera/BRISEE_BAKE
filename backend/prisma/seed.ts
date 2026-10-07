import * as bcrypt from 'bcrypt';
import { PrismaClient, EstadoProducto } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Borrando datos existentes para evitar duplicados...');
  await prisma.itemCarrito.deleteMany();
  await prisma.carrito.deleteMany();
  await prisma.pedidoProducto.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.imagenProducto.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.usuario.deleteMany();

  console.log('Creando usuario de prueba...');
  const clientePasswordHash = await bcrypt.hash('cliente123', 10);
  const dummyUser = await prisma.usuario.create({
    data: {
      id: '00000000-0000-0000-0000-000000000000',
      nombre: 'Cliente',
      apellido: 'Prueba',
      fechaNacimiento: new Date('1990-01-01'),
      correo: 'cliente@prueba.com',
      rol: 'CLIENTE',
      password: clientePasswordHash,
      celular: '3000000000',
      estado: 'ACTIVO',
    }
  });

  const adminUser = await prisma.usuario.create({
    data: {
      id: '99999999-9999-9999-9999-999999999999',
      nombre: 'Admin',
      apellido: 'Principal',
      fechaNacimiento: new Date('1990-01-01'),
      correo: 'admin@briseebake.com',
      rol: 'ADMIN',
      password: '$2b$10$14eZEX/ZfRWkC/Ffo5Z0tup/FlKyk0I3RVKlEs/gzmPoLSOs3sGbi', // admin123
      celular: '3000000000',
      estado: 'ACTIVO',
    }
  });

  console.log('Creando categorias...');
  const catGranolas = await prisma.categoria.create({ data: { id: '11111111-1111-1111-1111-111111111111', nombre: 'Granolas' } });
  const catGalletas = await prisma.categoria.create({ data: { id: '22222222-2222-2222-2222-222222222222', nombre: 'Galletas' } });
  const catGalletasCongeladas = await prisma.categoria.create({ data: { id: '33333333-3333-3333-3333-333333333333', nombre: 'Galletas congeladas' } });
  const catMacarons = await prisma.categoria.create({ data: { id: '44444444-4444-4444-4444-444444444444', nombre: 'Macarons' } });
  const catCookieDough = await prisma.categoria.create({ data: { id: '55555555-5555-5555-5555-555555555555', nombre: 'Cookie Dough' } });

  console.log('Creando productos...');

  // Cookie Dough
  const descCookieDough = 'Masa de galleta deliciosa lista para comer o preparar deliciosas galletas.';
  await prisma.producto.createMany({
    data: [
      { idCategoria: catCookieDough.id, nombre: 'Cookie Dough Choco Chips', descripcion: descCookieDough, precio: 22000, presentacion: '350g', existencias: 30, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catCookieDough.id, nombre: 'Cookie Dough Doble Chocolate', descripcion: descCookieDough, precio: 23500, presentacion: '350g', existencias: 30, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
    ]
  });

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
  const descGalletasCongeladas = 'Galleta congelada (Empaque por 8). Mini galletas de harina de almendra, endulzadas con alulosa y chocolate real sin azúcar.';
  await prisma.producto.createMany({
    data: [
      { idCategoria: catGalletasCongeladas.id, nombre: 'Galleta congelada choco blanco y pistachos', descripcion: descGalletasCongeladas, precio: 55000, presentacion: '280g', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catGalletasCongeladas.id, nombre: 'Galleta congelada zanahoria choco blanco y nueces', descripcion: descGalletasCongeladas, precio: 37000, presentacion: '280g', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catGalletasCongeladas.id, nombre: 'Galleta congelada choco chips', descripcion: descGalletasCongeladas, precio: 44000, presentacion: '280g', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
      { idCategoria: catGalletasCongeladas.id, nombre: 'Galleta congelada doble chocolate', descripcion: descGalletasCongeladas, precio: 52000, presentacion: '280g', existencias: 50, estado: EstadoProducto.ACTIVO, updatedAt: new Date(), createdAt: new Date() },
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

  console.log('Agregando imágenes de prueba a los productos...');
  const todosLosProductos = await prisma.producto.findMany();

  const imagenesData = todosLosProductos.map((p) => {
    const nombreLimpio = p.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-');
    const isCookieDough = nombreLimpio.startsWith('cookie-dough');
    
    return {
      idProducto: p.id,
      urlImagen: isCookieDough ? `/images/catalogo/${nombreLimpio}.png` : `/images/productos/${nombreLimpio}.jpg`,
      nombre: 'Principal'
    };
  });

  await prisma.imagenProducto.createMany({
    data: imagenesData
  });

  console.log('Seeder  ejecutado con exito!');
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
