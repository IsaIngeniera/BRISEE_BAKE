import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
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
      const newProduct = await this.prisma.producto.create({
        data: {
          idCategoria: createProductDto.idCategoria,
          nombre: createProductDto.nombre,
          descripcion: createProductDto.descripcion,
          precio: createProductDto.precio,
          presentacion: createProductDto.presentacion,
          existencias: createProductDto.existencias,
          estado: createProductDto.estado,
          etiquetas: createProductDto.etiquetas || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return { message: 'Producto creado exitosamente', product: newProduct };
    } catch {
      throw new BadRequestException(
        'Error al crear el producto. Verifique los datos enviados.',
      );
    }
  }

  findAll() {
    return this.prisma.producto.findMany({
      include: {
        categoria: true,
        imagenes: true,
      },
    });
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

  async update(id: string, updateProductDto: UpdateProductDto, file?: any) {
    const existingProduct = await this.prisma.producto.findUnique({
      where: { id },
      include: { imagenes: true },
    });

    if (!existingProduct) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (updateProductDto.nombre) {
      const normalizedNewName = this.normalizeString(updateProductDto.nombre);
      const allProducts = await this.prisma.producto.findMany({
        select: { id: true, nombre: true },
      });
      const duplicate = allProducts.find(
        (p) =>
          p.id !== id && this.normalizeString(p.nombre) === normalizedNewName,
      );
      if (duplicate) {
        throw new BadRequestException('Ya existe un producto con este nombre');
      }
    }

    // Verificar si hay cambios
    let hasChanges = false;
    if (file) hasChanges = true;

    const fieldsToCompare = [
      'idCategoria',
      'nombre',
      'descripcion',
      'precio',
      'presentacion',
      'existencias',
      'estado',
    ];
    for (const field of fieldsToCompare) {
      if (
        updateProductDto[field] !== undefined &&
        updateProductDto[field] !== existingProduct[field]
      ) {
        // En los números como precio puede haber problema de tipo si no se parcea bien, pero @Type(() => Number) ya lo hace
        hasChanges = true;
        break;
      }
    }

    if (!hasChanges && updateProductDto.etiquetas) {
      const currentTags = existingProduct.etiquetas
        .map((e) => e.toString())
        .sort();
      const newTags = [...updateProductDto.etiquetas].sort();
      if (
        currentTags.length !== newTags.length ||
        !currentTags.every((val, index) => val === newTags[index])
      ) {
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      return {
        message: 'Producto actualizado exitosamente',
        product: existingProduct,
      };
    }

    try {
      // Usar transaction si guardamos imagen para asegurar consistencia, pero aqui con update directo basta.
      const updatedProduct = await this.prisma.producto.update({
        where: { id },
        data: {
          ...(updateProductDto.idCategoria !== undefined && {
            idCategoria: updateProductDto.idCategoria,
          }),
          ...(updateProductDto.nombre !== undefined && {
            nombre: updateProductDto.nombre,
          }),
          ...(updateProductDto.descripcion !== undefined && {
            descripcion: updateProductDto.descripcion,
          }),
          ...(updateProductDto.precio !== undefined && {
            precio: updateProductDto.precio,
          }),
          ...(updateProductDto.presentacion !== undefined && {
            presentacion: updateProductDto.presentacion,
          }),
          ...(updateProductDto.existencias !== undefined && {
            existencias: updateProductDto.existencias,
          }),
          ...(updateProductDto.estado !== undefined && {
            estado: updateProductDto.estado,
          }),
          ...(updateProductDto.etiquetas !== undefined && {
            etiquetas: updateProductDto.etiquetas,
          }),
        },
      });

      if (file) {
        // Simulacion de guardar imagen
        await this.prisma.imagenProducto.deleteMany({
          where: { idProducto: id },
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const originalName = file.originalname as string;
        await this.prisma.imagenProducto.create({
          data: {
            idProducto: id,
            urlImagen: `/uploads/${originalName}`,

            nombre: originalName.substring(0, 30),
          },
        });
      }

      return {
        message: 'Producto actualizado exitosamente',
        product: updatedProduct,
      };
    } catch {
      throw new BadRequestException(
        'Error al actualizar el producto. Verifique los datos enviados.',
      );
    }
  }

  remove(id: string) {
    return `This action removes a #${id} product`;
  }
}
