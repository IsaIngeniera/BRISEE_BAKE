/* eslint-disable */
/**
 * PRUEBAS UNITARIAS QA - ProductsController
 *
 * Verifica el comportamiento del controlador de productos:
 * - Delegación correcta al servicio
 * - Manejo de parámetros de query
 * - Validaciones de entrada
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from '../../../src/products/products.controller';
import { ProductsService } from '../../../src/products/products.service';
import { EstadoProducto } from '@prisma/client';

describe('ProductsController [QA]', () => {
  let controller: ProductsController;
  let productsService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    productsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsService }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  // ============================================================
  // POST /products
  // ============================================================
  describe('POST /products (create)', () => {
    const createDto = {
      idCategoria: 'cat-123',
      nombre: 'Producto Nuevo',
      descripcion: 'Descripción',
      precio: 10000,
      presentacion: '100g',
      existencias: 50,
      estado: EstadoProducto.ACTIVO,
    };

    it('debe llamar a productsService.create con el DTO correcto', async () => {
      const expectedResponse = {
        message: 'Producto creado exitosamente',
        product: { id: 'new-id', ...createDto },
      };
      productsService.create.mockResolvedValue(expectedResponse);

      const result = await controller.create(createDto);

      expect(productsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResponse);
    });

    it('debe propagar errores del servicio', async () => {
      productsService.create.mockRejectedValue(
        new Error('Error de validación'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        'Error de validación',
      );
    });
  });

  // ============================================================
  // GET /products
  // ============================================================
  describe('GET /products (findAll)', () => {
    it('debe retornar todos los productos sin filtros', async () => {
      const products = [{ id: 'p1', nombre: 'Prod 1' }];
      productsService.findAll.mockResolvedValue(products);

      const result = await controller.findAll();

      expect(productsService.findAll).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
      expect(result).toEqual(products);
    });

    it('debe filtrar por término de búsqueda', async () => {
      productsService.findAll.mockResolvedValue([]);

      await controller.findAll('granola');

      expect(productsService.findAll).toHaveBeenCalledWith(
        'granola',
        undefined,
      );
    });

    it('debe filtrar por etiquetas', async () => {
      productsService.findAll.mockResolvedValue([]);

      await controller.findAll(undefined, 'SIN_AZUCAR,SIN_GLUTEN');

      expect(productsService.findAll).toHaveBeenCalledWith(
        undefined,
        'SIN_AZUCAR,SIN_GLUTEN',
      );
    });

    it('debe combinar filtros de búsqueda y etiquetas', async () => {
      productsService.findAll.mockResolvedValue([]);

      await controller.findAll('galleta', 'KETO');

      expect(productsService.findAll).toHaveBeenCalledWith('galleta', 'KETO');
    });
  });

  // ============================================================
  // GET /products/:id
  // ============================================================
  describe('GET /products/:id (findOne)', () => {
    it('debe retornar un producto por ID', async () => {
      const product = { id: 'prod-123', nombre: 'Producto' };
      productsService.findOne.mockResolvedValue(product);

      const result = await controller.findOne('prod-123');

      expect(productsService.findOne).toHaveBeenCalledWith('prod-123');
      expect(result).toEqual(product);
    });

    it('debe propagar NotFoundException', async () => {
      productsService.findOne.mockRejectedValue(
        new Error('Producto no encontrado'),
      );

      await expect(controller.findOne('no-existe')).rejects.toThrow(
        'Producto no encontrado',
      );
    });
  });

  // ============================================================
  // PATCH /products/:id
  // ============================================================
  describe('PATCH /products/:id (update)', () => {
    it('debe actualizar un producto correctamente', async () => {
      const updateDto = { precio: 15000 };
      const expectedResponse = {
        message: 'Producto actualizado exitosamente',
        product: { id: 'prod-123', precio: 15000 },
      };
      productsService.update.mockResolvedValue(expectedResponse);

      const result = await controller.update('prod-123', updateDto);

      expect(productsService.update).toHaveBeenCalledWith(
        'prod-123',
        updateDto,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debe permitir updates parciales', async () => {
      productsService.update.mockResolvedValue({ message: 'ok' });

      await controller.update('prod-123', { nombre: 'Nuevo nombre' });

      expect(productsService.update).toHaveBeenCalledWith('prod-123', {
        nombre: 'Nuevo nombre',
      });
    });
  });

  // ============================================================
  // DELETE /products/:id
  // ============================================================
  describe('DELETE /products/:id (remove)', () => {
    it('debe eliminar (soft delete) un producto', async () => {
      const expectedResponse = {
        message: 'Producto eliminado correctamente',
        product: { id: 'prod-123', estado: 'INACTIVO' },
      };
      productsService.remove.mockResolvedValue(expectedResponse);

      const result = await controller.remove('prod-123');

      expect(productsService.remove).toHaveBeenCalledWith('prod-123');
      expect(result).toEqual(expectedResponse);
    });

    it('debe propagar errores si el producto no existe', async () => {
      productsService.remove.mockRejectedValue(
        new Error('Producto no encontrado'),
      );

      await expect(controller.remove('no-existe')).rejects.toThrow(
        'Producto no encontrado',
      );
    });
  });
});
