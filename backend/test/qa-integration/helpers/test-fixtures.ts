/* eslint-disable */
/**
 * Fixtures reutilizables para pruebas de integración.
 *
 * Objetivo: cada test puede sembrar los datos que necesita con una línea,
 * sin repetir el mismo bloque de .create() en cada archivo.
 */

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Rol, EstadoUsuario, EstadoProducto } from '@prisma/client';
import { PrismaService } from '../../../src/prisma.service';

export interface SeedUserInput {
  correo?: string;
  password?: string;
  nombre?: string;
  apellido?: string;
  rol?: Rol;
  celular?: string;
}

export interface SeedUserResult {
  id: string;
  correo: string;
  password: string; // texto plano, útil para el test de login
  rol: Rol;
  token: string;
}

/**
 * Crea un usuario en la BD con contraseña hasheada y devuelve también
 * un JWT firmado con el mismo secreto que usa la app en runtime.
 */
export async function seedUser(
  prisma: PrismaService,
  jwt: JwtService,
  overrides: SeedUserInput = {},
): Promise<SeedUserResult> {
  const correo =
    overrides.correo ??
    `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
  const passwordPlano = overrides.password ?? 'Password123!';
  const hash = await bcrypt.hash(passwordPlano, 10);

  const user = await prisma.usuario.create({
    data: {
      nombre: overrides.nombre ?? 'Juan',
      apellido: overrides.apellido ?? 'Pérez',
      correo,
      password: hash,
      rol: overrides.rol ?? Rol.CLIENTE,
      celular: overrides.celular ?? '3001234567',
      estado: EstadoUsuario.ACTIVO,
      fechaNacimiento: new Date('1990-01-01'),
    },
  });

  const token = await jwt.signAsync({
    sub: user.id,
    correo: user.correo,
    rol: user.rol,
  });

  return {
    id: user.id,
    correo: user.correo,
    password: passwordPlano,
    rol: user.rol,
    token,
  };
}

export interface SeedCategoryResult {
  id: string;
  nombre: string;
}

export async function seedCategory(
  prisma: PrismaService,
  nombre = 'Galletas',
): Promise<SeedCategoryResult> {
  const cat = await prisma.categoria.create({ data: { nombre } });
  return { id: cat.id, nombre: cat.nombre };
}

export interface SeedProductInput {
  nombre?: string;
  precio?: number;
  idCategoria?: string;
  estado?: EstadoProducto;
}

export interface SeedProductResult {
  id: string;
  nombre: string;
  precio: number;
}

/**
 * Crea un producto. Si no se pasa idCategoria, crea una categoría por defecto.
 */
export async function seedProduct(
  prisma: PrismaService,
  input: SeedProductInput = {},
): Promise<SeedProductResult> {
  let idCategoria = input.idCategoria;

  if (!idCategoria) {
    const cat = await seedCategory(prisma, `Cat-${Date.now()}`);
    idCategoria = cat.id;
  }

  const producto = await prisma.producto.create({
    data: {
      idCategoria,
      nombre: input.nombre ?? 'Galleta de prueba',
      descripcion: 'Producto creado para pruebas de integración.',
      precio: input.precio ?? 5000,
      presentacion: 'Unidad',
      existencias: 100,
      estado: input.estado ?? EstadoProducto.ACTIVO,
    },
  });

  return {
    id: producto.id,
    nombre: producto.nombre,
    precio: Number(producto.precio),
  };
}

/**
 * Devuelve una fecha en formato YYYY-MM-DD a N días en el futuro.
 * Útil para construir fechas de entrega válidas (>= 3 días).
 */
export function fechaEnDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
