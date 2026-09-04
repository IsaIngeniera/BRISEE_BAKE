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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: string, _updateProductDto: any) {
    return `This action updates a #${id} product`;
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
