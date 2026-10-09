/*
  Warnings:

  - You are about to drop the `Carrito` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Categoria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ImagenProducto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ItemCarrito` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pago` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pedido` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PedidoProducto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Producto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EtiquetaDietetica" AS ENUM ('SIN_AZUCAR', 'SIN_GLUTEN', 'KETO', 'VEGANO', 'LIBRE_DE_LACTEOS');

-- DropForeignKey
ALTER TABLE "Carrito" DROP CONSTRAINT "Carrito_idUsuario_fkey";

-- DropForeignKey
ALTER TABLE "ImagenProducto" DROP CONSTRAINT "ImagenProducto_idProducto_fkey";

-- DropForeignKey
ALTER TABLE "ItemCarrito" DROP CONSTRAINT "ItemCarrito_idCarrito_fkey";

-- DropForeignKey
ALTER TABLE "ItemCarrito" DROP CONSTRAINT "ItemCarrito_idProducto_fkey";

-- DropForeignKey
ALTER TABLE "Pago" DROP CONSTRAINT "Pago_idPedido_fkey";

-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_idCliente_fkey";

-- DropForeignKey
ALTER TABLE "PedidoProducto" DROP CONSTRAINT "PedidoProducto_idPedido_fkey";

-- DropForeignKey
ALTER TABLE "PedidoProducto" DROP CONSTRAINT "PedidoProducto_idProducto_fkey";

-- DropForeignKey
ALTER TABLE "Producto" DROP CONSTRAINT "Producto_idCategoria_fkey";

-- DropTable
DROP TABLE "Carrito";

-- DropTable
DROP TABLE "Categoria";

-- DropTable
DROP TABLE "ImagenProducto";

-- DropTable
DROP TABLE "ItemCarrito";

-- DropTable
DROP TABLE "Pago";

-- DropTable
DROP TABLE "Pedido";

-- DropTable
DROP TABLE "PedidoProducto";

-- DropTable
DROP TABLE "Producto";

-- DropTable
DROP TABLE "Usuario";

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "apellido" VARCHAR(50) NOT NULL,
    "fechaNacimiento" DATE NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "rol" "Rol" NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "celular" VARCHAR(20) NOT NULL,
    "estado" "EstadoUsuario" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "idCategoria" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL,
    "presentacion" VARCHAR(50) NOT NULL,
    "existencias" INTEGER NOT NULL,
    "estado" "EstadoProducto" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "etiquetas" "EtiquetaDietetica"[],

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "idCliente" TEXT NOT NULL,
    "estadoEntrega" "EstadoEntrega" NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "direccionEntrega" TEXT NOT NULL,
    "ciudad" VARCHAR(80) NOT NULL,
    "tipoEntrega" "TipoEntrega" NOT NULL,
    "observacionesEntrega" VARCHAR(100) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "idPedido" TEXT NOT NULL,
    "estado" "EstadoPago" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "referenciaWompi" VARCHAR(150),
    "transaccionId" VARCHAR(150),

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carritos" (
    "id" TEXT NOT NULL,
    "idUsuario" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoCarrito" NOT NULL,

    CONSTRAINT "carritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_carrito" (
    "id" TEXT NOT NULL,
    "idCarrito" TEXT NOT NULL,
    "idProducto" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "items_carrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_producto" (
    "id" TEXT NOT NULL,
    "idProducto" TEXT NOT NULL,
    "idPedido" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "pedidos_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagenes_producto" (
    "id" TEXT NOT NULL,
    "idProducto" TEXT NOT NULL,
    "urlImagen" VARCHAR(300) NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,

    CONSTRAINT "imagenes_producto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_idPedido_key" ON "pagos"("idPedido");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_idCategoria_fkey" FOREIGN KEY ("idCategoria") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_idCliente_fkey" FOREIGN KEY ("idCliente") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_idPedido_fkey" FOREIGN KEY ("idPedido") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carritos" ADD CONSTRAINT "carritos_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_carrito" ADD CONSTRAINT "items_carrito_idCarrito_fkey" FOREIGN KEY ("idCarrito") REFERENCES "carritos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_carrito" ADD CONSTRAINT "items_carrito_idProducto_fkey" FOREIGN KEY ("idProducto") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_producto" ADD CONSTRAINT "pedidos_producto_idPedido_fkey" FOREIGN KEY ("idPedido") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_producto" ADD CONSTRAINT "pedidos_producto_idProducto_fkey" FOREIGN KEY ("idProducto") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagenes_producto" ADD CONSTRAINT "imagenes_producto_idProducto_fkey" FOREIGN KEY ("idProducto") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
