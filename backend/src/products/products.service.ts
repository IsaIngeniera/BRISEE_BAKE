import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
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
      },
    });
  }

  findOne(id: string) {
    return `This action returns a #${id} product`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: string, _updateProductDto: any) {
    return `This action updates a #${id} product`;
  }

  remove(id: string) {
    return `This action removes a #${id} product`;
  }
}
