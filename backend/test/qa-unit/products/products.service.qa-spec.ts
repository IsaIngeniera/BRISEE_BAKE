/* eslint-disable */
/**
 * PRUEBAS UNITARIAS QA - ProductsService
 *
 * Verifica el comportamiento del servicio de productos:
 * - Creación con validación de duplicados
 * - Listado con filtros (búsqueda y etiquetas)
 * - Búsqueda por ID
 * - Actualización
 * - Eliminación (soft delete)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../../../src/products/products.service';
import { PrismaService } from '../../../src/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EstadoProducto, EtiquetaDietetica } from '@prisma/client';

describe('ProductsService [QA]', () => {
  let service: ProductsService;
  let prismaService: {
    producto: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockProduct = {
    id: 'prod-123',
    idCategoria: 'cat-123',
    nombre: 'Granola Almendras y Nueces 500g',
    descripcion: 'Snack saludable con almendras',
    precio: 58000,
    presentacion: '500g',
    existencias: 50,
    estado: EstadoProducto.ACTIVO,
    etiquetas: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    categoria: { id: 'cat-123', nombre: 'Granolas' },
    imagenes: [],
  };

  beforeEach(async () => {
    prismaService = {
      producto: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);

    // Silenciar console.log y console.error del service
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('debe estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // CREATE
  // ============================================================
  describe('create', () => {
    const createDto = {
      idCategoria: 'cat-123',
      nombre: 'Nueva Granola',
      descripcion: 'Descripción de prueba',
      precio: 50000,
      presentacion: '500g',
      existencias: 30,
      estado: EstadoProducto.ACTIVO,
      etiquetas: [],
    };

    it('debe crear un producto correctamente', async () => {
      prismaService.producto.findMany.mockResolvedValue([]);
      prismaService.producto.create.mockResolvedValue(mockProduct);

      const result = await service.create(createDto);

      expect(result).toHaveProperty('message', 'Producto creado exitosamente');
      expect(result).toHaveProperty('product');
      expect(prismaService.producto.create).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el nombre ya existe (sin distinción de mayúsculas)', async () => {
      prismaService.producto.findMany.mockResolvedValue([
        { id: 'existing-1', nombre: 'NUEVA granola' },
      ]);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Ya existe un producto con este nombre',
      );
      expect(prismaService.producto.create).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el nombre ya existe (sin distinción de tildes)', async () => {
      const dtoConTilde = { ...createDto, nombre: 'Galleta Choço Chïps' };
      prismaService.producto.findMany.mockResolvedValue([
        { id: 'existing-1', nombre: 'Galleta Choco Chips' },
      ]);

      await expect(service.create(dtoConTilde)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe asignar array vacío si no se envían etiquetas', async () => {
      const dtoSinEtiquetas = { ...createDto, etiquetas: undefined };
      prismaService.producto.findMany.mockResolvedValue([]);
      prismaService.producto.create.mockResolvedValue(mockProduct);

      await service.create(dtoSinEtiquetas);

      const createCall = prismaService.producto.create.mock.calls[0][0];
      expect(createCall.data.etiquetas).toEqual([]);
    });

    it('debe crear producto con imagen si imagenUrl se proporciona', async () => {
      const dtoConImagen = {
        ...createDto,
        imagenUrl: 'https://example.com/image.jpg',
      };
      prismaService.producto.findMany.mockResolvedValue([]);
      prismaService.producto.create.mockResolvedValue(mockProduct);

      await service.create(dtoConImagen);

      const createCall = prismaService.producto.create.mock.calls[0][0];
      expect(createCall.data.imagenes).toBeDefined();
      expect(createCall.data.imagenes.create[0].urlImagen).toBe(
        'https://example.com/image.jpg',
      );
    });

    it('no debe crear imagen si no se proporciona imagenUrl', async () => {
      prismaService.producto.findMany.mockResolvedValue([]);
      prismaService.producto.create.mockResolvedValue(mockProduct);

      await service.create(createDto);

      const createCall = prismaService.producto.create.mock.calls[0][0];
      expect(createCall.data.imagenes).toBeUndefined();
    });

    it('debe manejar errores de base de datos lanzando BadRequestException', async () => {
      prismaService.producto.findMany.mockResolvedValue([]);
      prismaService.producto.create.mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Error al crear el producto. Verifique los datos enviados.',
      );
    });

    it('debe guardar etiquetas dietéticas si se proporcionan', async () => {
      const dtoConEtiquetas = {
        ...createDto,
        etiquetas: [EtiquetaDietetica.SIN_AZUCAR, EtiquetaDietetica.SIN_GLUTEN],
      };
      prismaService.producto.findMany.mockResolvedValue([]);
      prismaService.producto.create.mockResolvedValue(mockProduct);

      await service.create(dtoConEtiquetas);

      const createCall = prismaService.producto.create.mock.calls[0][0];
      expect(createCall.data.etiquetas).toEqual([
        EtiquetaDietetica.SIN_AZUCAR,
        EtiquetaDietetica.SIN_GLUTEN,
      ]);
    });
  });

  // ============================================================
  // FIND ALL
  // ============================================================
  describe('findAll', () => {
    const products = [
      {
        ...mockProduct,
        id: 'p1',
        nombre: 'Granola Almendras',
        etiquetas: [EtiquetaDietetica.SIN_AZUCAR],
      },
      {
        ...mockProduct,
        id: 'p2',
        nombre: 'Galleta Chocolate',
        etiquetas: [EtiquetaDietetica.SIN_GLUTEN],
      },
      {
        ...mockProduct,
        id: 'p3',
        nombre: 'Macaron Fresa',
        etiquetas: [EtiquetaDietetica.SIN_AZUCAR, EtiquetaDietetica.SIN_GLUTEN],
      },
    ];

    it('debe retornar todos los productos cuando no hay filtros', async () => {
      prismaService.producto.findMany.mockResolvedValue(products);

      const result = await service.findAll();

      expect(result).toHaveLength(3);
      expect(prismaService.producto.findMany).toHaveBeenCalledWith({
        include: {
          categoria: true,
          imagenes: true,
        },
      });
    });

    it('debe filtrar productos por término de búsqueda', async () => {
      prismaService.producto.findMany.mockResolvedValue(products);

      const result = await service.findAll('granola');

      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('Granola Almendras');
    });

    it('la búsqueda debe ser insensible a mayúsculas y tildes', async () => {
      prismaService.producto.findMany.mockResolvedValue(products);

      const result1 = await service.findAll('GRANOLA');
      const result2 = await service.findAll('GrAnOlA');
      const result3 = await service.findAll('granolã');

      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(result3).toHaveLength(1);
    });

    it('debe filtrar productos por una etiqueta', async () => {
      prismaService.producto.findMany.mockResolvedValue(products);

      const result = await service.findAll(undefined, 'SIN_AZUCAR');

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toEqual(['p1', 'p3']);
    });

    it('debe filtrar productos por múltiples etiquetas (AND)', async () => {
      prismaService.producto.findMany.mockResolvedValue(products);

      const result = await service.findAll(undefined, 'SIN_AZUCAR,SIN_GLUTEN');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p3');
    });

    it('debe combinar filtros de búsqueda y etiquetas', async () => {
      prismaService.producto.findMany.mockResolvedValue(products);

      const result = await service.findAll('macaron', 'SIN_AZUCAR');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p3');
    });

    it('debe retornar array vacío si no hay coincidencias', async () => {
      prismaService.producto.findMany.mockResolvedValue(products);

      const result = await service.findAll('xyznoexiste');

      expect(result).toHaveLength(0);
    });

    it('debe ignorar etiquetas vacías o con solo espacios', async () => {
      prismaService.producto.findMany.mockResolvedValue(products);

      const result = await service.findAll(undefined, ' , , ');

      expect(result).toHaveLength(3);
    });
  });

  // ============================================================
  // FIND ONE
  // ============================================================
  describe('findOne', () => {
    it('debe retornar un producto por ID', async () => {
      prismaService.producto.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('prod-123');

      expect(result).toEqual(mockProduct);
      expect(prismaService.producto.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-123' },
        include: {
          categoria: true,
          imagenes: true,
        },
      });
    });

    it('debe lanzar NotFoundException si el producto no existe', async () => {
      prismaService.producto.findUnique.mockResolvedValue(null);

      await expect(service.findOne('no-existe')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('no-existe')).rejects.toThrow(
        'Producto con ID no-existe no encontrado',
      );
    });

    it('debe incluir las relaciones categoria e imagenes', async () => {
      prismaService.producto.findUnique.mockResolvedValue(mockProduct);

      await service.findOne('prod-123');

      expect(prismaService.producto.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            categoria: true,
            imagenes: true,
          },
        }),
      );
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================
  describe('update', () => {
    const updateDto = {
      nombre: 'Granola Actualizada',
      precio: 65000,
    };

    it('debe actualizar un producto existente', async () => {
      prismaService.producto.findUnique.mockResolvedValue(mockProduct);
      prismaService.producto.update.mockResolvedValue({
        ...mockProduct,
        ...updateDto,
      });

      const result = await service.update('prod-123', updateDto);

      expect(result).toHaveProperty(
        'message',
        'Producto actualizado exitosamente',
      );
      expect(result).toHaveProperty('product');
      expect(prismaService.producto.update).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el producto no existe', async () => {
      prismaService.producto.findUnique.mockResolvedValue(null);

      await expect(service.update('no-existe', updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.producto.update).not.toHaveBeenCalled();
    });

    it('debe actualizar las etiquetas si se proporcionan', async () => {
      prismaService.producto.findUnique.mockResolvedValue(mockProduct);
      prismaService.producto.update.mockResolvedValue(mockProduct);

      await service.update('prod-123', {
        ...updateDto,
        etiquetas: [EtiquetaDietetica.SIN_AZUCAR],
      });

      const updateCall = prismaService.producto.update.mock.calls[0][0];
      expect(updateCall.data.etiquetas).toEqual({
        set: [EtiquetaDietetica.SIN_AZUCAR],
      });
    });

    it('debe actualizar idCategoria si se proporciona', async () => {
      prismaService.producto.findUnique.mockResolvedValue(mockProduct);
      prismaService.producto.update.mockResolvedValue(mockProduct);

      await service.update('prod-123', {
        ...updateDto,
        idCategoria: 'new-cat-id',
      });

      const updateCall = prismaService.producto.update.mock.calls[0][0];
      expect(updateCall.data.idCategoria).toBe('new-cat-id');
    });

    it('debe reemplazar la imagen si imagenUrl se proporciona', async () => {
      prismaService.producto.findUnique.mockResolvedValue(mockProduct);
      prismaService.producto.update.mockResolvedValue(mockProduct);

      await service.update('prod-123', {
        ...updateDto,
        imagenUrl: 'https://new-image.jpg',
      });

      const updateCall = prismaService.producto.update.mock.calls[0][0];
      expect(updateCall.data.imagenes).toEqual({
        deleteMany: {},
        create: [
          {
            urlImagen: 'https://new-image.jpg',
            nombre: 'Principal',
          },
        ],
      });
    });

    it('debe manejar errores de BD lanzando BadRequestException', async () => {
      prismaService.producto.findUnique.mockResolvedValue(mockProduct);
      prismaService.producto.update.mockRejectedValue(new Error('DB Error'));

      await expect(service.update('prod-123', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('prod-123', updateDto)).rejects.toThrow(
        'Error al actualizar el producto',
      );
    });
  });

  // ============================================================
  // REMOVE (SOFT DELETE)
  // ============================================================
  describe('remove', () => {
    it('debe hacer soft delete del producto (estado INACTIVO)', async () => {
      prismaService.producto.findUnique.mockResolvedValue(mockProduct);
      prismaService.producto.update.mockResolvedValue({
        ...mockProduct,
        estado: EstadoProducto.INACTIVO,
      });

      const result = await service.remove('prod-123');

      expect(result).toHaveProperty(
        'message',
        'Producto eliminado correctamente',
      );
      expect(prismaService.producto.update).toHaveBeenCalledWith({
        where: { id: 'prod-123' },
        data: { estado: 'INACTIVO' },
      });
    });

    it('no debe hacer hard delete (siempre soft delete)', async () => {
      prismaService.producto.findUnique.mockResolvedValue(mockProduct);
      prismaService.producto.update.mockResolvedValue(mockProduct);

      await service.remove('prod-123');

      // Solo se llama a update, nunca a delete (soft delete)
      expect(prismaService.producto.update).toHaveBeenCalled();
    });

    it('debe retornar error si el producto no existe', async () => {
      prismaService.producto.findUnique.mockResolvedValue(null);

      await expect(service.remove('no-existe')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe manejar errores de BD', async () => {
      prismaService.producto.findUnique.mockResolvedValue(mockProduct);
      prismaService.producto.update.mockRejectedValue(new Error('DB Error'));

      await expect(service.remove('prod-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
