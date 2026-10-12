import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeString(str: string) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  async create(createProductDto: CreateProductDto) {
    // Verificación de duplicados (sin distinguir mayúsculas ni tildes)
    const normalizedNewName = this.normalizeString(createProductDto.nombre);

    const allProducts = await this.prisma.producto.findMany({
      select: { id: true, nombre: true },
    });

    const duplicate = allProducts.find(
      (p) => this.normalizeString(p.nombre) === normalizedNewName,
    );

    if (duplicate) {
      throw new BadRequestException('Ya existe un producto con este nombre');
    }

    try {
      console.log('Incoming payload:', createProductDto);
      let targetCategoriaId = createProductDto.idCategoria;

      if (this.prisma.categoria) {
        const existingCategory = await this.prisma.categoria.findUnique({
          where: { id: targetCategoriaId },
        });

        if (!existingCategory) {
          const knownCategoryNames: Record<string, string> = {
            'd4f60d9c-9d35-47d4-9441-9c8d2308ffcf': 'Macarons',
            'e5f8dc69-0540-4a9f-a70e-17cfc1659f15': 'Galletas',
            '4ab9066a-35e7-4f74-b80d-724de7116472': 'Galletas congeladas',
            'c1853103-46a8-410d-97b4-73f9cf62afc9': 'Granolas',
            '11111111-1111-1111-1111-111111111111': 'Granolas',
            '22222222-2222-2222-2222-222222222222': 'Galletas',
            '33333333-3333-3333-3333-333333333333': 'Galletas congeladas',
            '44444444-4444-4444-4444-444444444444': 'Macarons',
            '55555555-5555-5555-5555-555555555555': 'Cookie Dough',
          };

          const targetName = knownCategoryNames[targetCategoriaId];
          let matchedCategory = targetName
            ? await this.prisma.categoria.findFirst({
                where: { nombre: { equals: targetName, mode: 'insensitive' } },
              })
            : null;

          if (!matchedCategory) {
            matchedCategory = await this.prisma.categoria.findFirst();
          }

          if (matchedCategory) {
            targetCategoriaId = matchedCategory.id;
          } else {
            const newCat = await this.prisma.categoria.create({
              data: {
                id: targetCategoriaId,
                nombre: targetName || 'General',
              },
            });
            targetCategoriaId = newCat.id;
          }
        }
      }

      const newProduct = await this.prisma.producto.create({
        data: {
          idCategoria: targetCategoriaId,
          nombre: createProductDto.nombre,
          descripcion: createProductDto.descripcion,
          precio: createProductDto.precio,
          presentacion: createProductDto.presentacion,
          existencias: createProductDto.existencias,
          estado: createProductDto.estado,
          etiquetas: createProductDto.etiquetas || [],
          imagenes:
            createProductDto.imagenUrl && createProductDto.imagenUrl.trim()
              ? {
                  create: [
                    {
                      urlImagen: createProductDto.imagenUrl.trim(),
                      nombre: 'Principal',
                    },
                  ],
                }
              : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return { message: 'Producto creado exitosamente', product: newProduct };
    } catch (error) {
      console.error('Error in createProduct:', error);
      throw new BadRequestException(
        'Error al crear el producto. Verifique los datos enviados.',
      );
    }
  }

  async findAll(search?: string, tags?: string) {
    const products = await this.prisma.producto.findMany({
      include: {
        categoria: true,
        imagenes: true,
      },
    });

    let filtered = products;

    if (search) {
      const normalizedSearch = this.normalizeString(search);
      filtered = filtered.filter((product) =>
        this.normalizeString(product.nombre).includes(normalizedSearch),
      );
    }

    if (tags) {
      const activeTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (activeTags.length > 0) {
        filtered = filtered.filter((product) =>
          activeTags.every((tag) =>
            (product.etiquetas as unknown as string[]).includes(tag),
          ),
        );
      }
    }

    return filtered;
  }

  async findOne(id: string) {
    const product = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        imagenes: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const existingProduct = await this.prisma.producto.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    try {
      const dataToUpdate: Prisma.ProductoUncheckedUpdateInput = {
        nombre: updateProductDto.nombre,
        descripcion: updateProductDto.descripcion,
        precio: updateProductDto.precio,
        presentacion: updateProductDto.presentacion,
        existencias: updateProductDto.existencias,
        estado: updateProductDto.estado,
      };

      if (updateProductDto.etiquetas) {
        dataToUpdate.etiquetas = {
          set: updateProductDto.etiquetas,
        };
      }

      if (updateProductDto.idCategoria) {
        dataToUpdate.idCategoria = updateProductDto.idCategoria;
      }

      if (updateProductDto.imagenUrl) {
        // En una implementación real se podría actualizar o crear, por simplicidad:
        dataToUpdate.imagenes = {
          deleteMany: {},
          create: [
            {
              urlImagen: updateProductDto.imagenUrl,
              nombre: 'Principal',
            },
          ],
        };
      }

      const updatedProduct = await this.prisma.producto.update({
        where: { id },
        data: dataToUpdate,
      });

      return {
        message: 'Producto actualizado exitosamente',
        product: updatedProduct,
      };
    } catch {
      throw new BadRequestException('Error al actualizar el producto');
    }
  }

  async remove(id: string) {
    try {
      const existingProduct = await this.prisma.producto.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new BadRequestException('Producto no encontrado');
      }

      const deletedProduct = await this.prisma.producto.update({
        where: { id },
        data: {
          estado: 'INACTIVO',
        },
      });

      return {
        message: 'Producto eliminado correctamente',
        product: deletedProduct,
      };
    } catch {
      throw new BadRequestException(
        'Error al eliminar el producto. Intente nuevamente.',
      );
    }
  }
}
