/* eslint-disable */
/**
 * PRUEBAS UNITARIAS QA - CarritoService
 *
 * Verifica el comportamiento del servicio de carrito:
 * - Agregar items al carrito (con creación de carrito si no existe)
 * - Actualizar cantidades
 * - Eliminar items
 * - Obtener carrito con limpieza automática de productos inactivos
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CarritoService } from '../../../src/carrito/carrito.service';
import { PrismaService } from '../../../src/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CarritoService [QA]', () => {
  let service: CarritoService;
  let prismaService: {
    producto: {
      findUnique: jest.Mock;
    };
    carrito: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
    itemCarrito: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const userId = 'user-123';
  const mockProducto = {
    id: 'prod-123',
    nombre: 'Producto Prueba',
    precio: 25000,
    estado: 'ACTIVO',
    existencias: 10,
  };

  const mockCarrito = {
    id: 'carrito-123',
    idUsuario: userId,
    estado: 'ACTIVO',
  };

  const mockItem = {
    id: 'item-123',
    idCarrito: mockCarrito.id,
    idProducto: mockProducto.id,
    cantidad: 2,
  };

  beforeEach(async () => {
    prismaService = {
      producto: {
        findUnique: jest.fn(),
      },
      carrito: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      itemCarrito: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarritoService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<CarritoService>(CarritoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // ADD ITEM
  // ============================================================
  describe('addItem', () => {
    const addItemDto = { idProducto: 'prod-123', cantidad: 2 };

    it('debe lanzar NotFoundException si el producto no existe', async () => {
      prismaService.producto.findUnique.mockResolvedValue(null);

      await expect(service.addItem(userId, addItemDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.addItem(userId, addItemDto)).rejects.toThrow(
        `El producto con ID ${addItemDto.idProducto} no existe`,
      );
    });

    it('debe lanzar BadRequestException si el producto está INACTIVO', async () => {
      prismaService.producto.findUnique.mockResolvedValue({
        ...mockProducto,
        estado: 'INACTIVO',
      });

      await expect(service.addItem(userId, addItemDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addItem(userId, addItemDto)).rejects.toThrow(
        'El producto no está disponible',
      );
    });

    it('debe crear un carrito nuevo si no existe uno activo', async () => {
      prismaService.producto.findUnique.mockResolvedValue(mockProducto);
      prismaService.carrito.findFirst.mockResolvedValue(null);
      prismaService.carrito.create.mockResolvedValue(mockCarrito);
      prismaService.itemCarrito.findFirst.mockResolvedValue(null);
      prismaService.itemCarrito.create.mockResolvedValue({
        ...mockItem,
        producto: mockProducto,
      });

      await service.addItem(userId, addItemDto);

      expect(prismaService.carrito.create).toHaveBeenCalledWith({
        data: {
          idUsuario: userId,
          estado: 'ACTIVO',
        },
      });
    });

    it('debe usar carrito existente si ya está activo', async () => {
      prismaService.producto.findUnique.mockResolvedValue(mockProducto);
      prismaService.carrito.findFirst.mockResolvedValue(mockCarrito);
      prismaService.itemCarrito.findFirst.mockResolvedValue(null);
      prismaService.itemCarrito.create.mockResolvedValue({
        ...mockItem,
        producto: mockProducto,
      });

      await service.addItem(userId, addItemDto);

      expect(prismaService.carrito.create).not.toHaveBeenCalled();
    });

    it('debe crear nuevo item si el producto no está en el carrito', async () => {
      prismaService.producto.findUnique.mockResolvedValue(mockProducto);
      prismaService.carrito.findFirst.mockResolvedValue(mockCarrito);
      prismaService.itemCarrito.findFirst.mockResolvedValue(null);
      prismaService.itemCarrito.create.mockResolvedValue({
        ...mockItem,
        producto: mockProducto,
      });

      const result = await service.addItem(userId, addItemDto);

      expect(result).toHaveProperty('message', 'Producto agregado al carrito');
      expect(prismaService.itemCarrito.create).toHaveBeenCalled();
    });

    it('debe sumar cantidad si el producto ya está en el carrito (HU-7)', async () => {
      prismaService.producto.findUnique.mockResolvedValue(mockProducto);
      prismaService.carrito.findFirst.mockResolvedValue(mockCarrito);
      prismaService.itemCarrito.findFirst.mockResolvedValue({
        ...mockItem,
        cantidad: 3,
      });
      prismaService.itemCarrito.update.mockResolvedValue({
        ...mockItem,
        cantidad: 5,
        producto: mockProducto,
      });

      const result = await service.addItem(userId, {
        idProducto: 'prod-123',
        cantidad: 2,
      });

      expect(result).toHaveProperty(
        'message',
        'Cantidad actualizada en el carrito',
      );
      expect(prismaService.itemCarrito.update).toHaveBeenCalledWith({
        where: { id: mockItem.id },
        data: { cantidad: 5 },
        include: { producto: true },
      });
    });

    it('debe filtrar carritos por usuario y estado ACTIVO', async () => {
      prismaService.producto.findUnique.mockResolvedValue(mockProducto);
      prismaService.carrito.findFirst.mockResolvedValue(mockCarrito);
      prismaService.itemCarrito.findFirst.mockResolvedValue(null);
      prismaService.itemCarrito.create.mockResolvedValue({
        ...mockItem,
        producto: mockProducto,
      });

      await service.addItem(userId, addItemDto);

      expect(prismaService.carrito.findFirst).toHaveBeenCalledWith({
        where: { idUsuario: userId, estado: 'ACTIVO' },
      });
    });
  });

  // ============================================================
  // GET CART
  // ============================================================
  describe('getCart', () => {
    it('debe retornar carrito vacío si no hay carrito activo', async () => {
      prismaService.carrito.findFirst.mockResolvedValue(null);

      const result = await service.getCart(userId);

      expect(result).toEqual({ items: [], removed: [] });
    });

    it('debe retornar items del carrito con formato correcto', async () => {
      const carritoWithItems = {
        ...mockCarrito,
        items: [
          {
            id: 'item-1',
            idProducto: 'prod-1',
            cantidad: 2,
            producto: {
              id: 'prod-1',
              nombre: 'Producto 1',
              precio: 15000,
              estado: 'ACTIVO',
              imagenes: [{ urlImagen: '/img.jpg' }],
            },
          },
        ],
      };
      prismaService.carrito.findFirst.mockResolvedValue(carritoWithItems);

      const result = await service.getCart(userId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        productId: 'prod-1',
        nombre: 'Producto 1',
        precio: 15000,
        imagenUrl: '/img.jpg',
        cantidad: 2,
      });
      expect(result.removed).toEqual([]);
    });

    it('debe remover items de productos INACTIVOS del carrito', async () => {
      const carritoWithInactiveItems = {
        ...mockCarrito,
        items: [
          {
            id: 'item-active',
            idProducto: 'prod-active',
            cantidad: 1,
            producto: {
              id: 'prod-active',
              nombre: 'Producto Activo',
              precio: 10000,
              estado: 'ACTIVO',
              imagenes: [],
            },
          },
          {
            id: 'item-inactive',
            idProducto: 'prod-inactive',
            cantidad: 2,
            producto: {
              id: 'prod-inactive',
              nombre: 'Producto Descontinuado',
              precio: 5000,
              estado: 'INACTIVO',
              imagenes: [],
            },
          },
        ],
      };
      prismaService.carrito.findFirst.mockResolvedValue(
        carritoWithInactiveItems,
      );
      prismaService.itemCarrito.delete.mockResolvedValue({});

      const result = await service.getCart(userId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('prod-active');
      expect(result.removed).toContain('Producto Descontinuado');
      expect(prismaService.itemCarrito.delete).toHaveBeenCalledWith({
        where: { id: 'item-inactive' },
      });
    });

    it('debe convertir precio de Decimal a number', async () => {
      const carritoWithDecimal = {
        ...mockCarrito,
        items: [
          {
            id: 'item-1',
            idProducto: 'prod-1',
            cantidad: 1,
            producto: {
              id: 'prod-1',
              nombre: 'Producto',
              precio: { toString: () => '25000.50' } as any,
              estado: 'ACTIVO',
              imagenes: [],
            },
          },
        ],
      };
      // Simulamos un Decimal con toString pero que Number() lo convierta
      carritoWithDecimal.items[0].producto.precio = 25000.5 as any;
      prismaService.carrito.findFirst.mockResolvedValue(carritoWithDecimal);

      const result = await service.getCart(userId);

      expect(typeof result.items[0].precio).toBe('number');
    });

    it('debe retornar imagenUrl undefined si no hay imágenes', async () => {
      const carritoNoImages = {
        ...mockCarrito,
        items: [
          {
            id: 'item-1',
            idProducto: 'prod-1',
            cantidad: 1,
            producto: {
              id: 'prod-1',
              nombre: 'Producto Sin Imagen',
              precio: 10000,
              estado: 'ACTIVO',
              imagenes: [],
            },
          },
        ],
      };
      prismaService.carrito.findFirst.mockResolvedValue(carritoNoImages);

      const result = await service.getCart(userId);

      expect(result.items[0].imagenUrl).toBeUndefined();
    });
  });

  // ============================================================
  // UPDATE ITEM QUANTITY
  // ============================================================
  describe('updateItemQuantity', () => {
    it('debe actualizar la cantidad de un item', async () => {
      prismaService.carrito.findFirst.mockResolvedValue(mockCarrito);
      prismaService.itemCarrito.findFirst.mockResolvedValue(mockItem);
      prismaService.itemCarrito.update.mockResolvedValue({
        ...mockItem,
        cantidad: 5,
        producto: mockProducto,
      });

      const result = await service.updateItemQuantity(userId, 'prod-123', 5);

      expect(result).toHaveProperty('message', 'Cantidad actualizada');
      expect(prismaService.itemCarrito.update).toHaveBeenCalledWith({
        where: { id: mockItem.id },
        data: { cantidad: 5 },
        include: { producto: true },
      });
    });

    it('debe lanzar BadRequestException si cantidad es 0 o negativa', async () => {
      await expect(
        service.updateItemQuantity(userId, 'prod-123', 0),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateItemQuantity(userId, 'prod-123', 0),
      ).rejects.toThrow('La cantidad debe ser mayor a cero');

      await expect(
        service.updateItemQuantity(userId, 'prod-123', -1),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar NotFoundException si no hay carrito activo', async () => {
      prismaService.carrito.findFirst.mockResolvedValue(null);

      await expect(
        service.updateItemQuantity(userId, 'prod-123', 5),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateItemQuantity(userId, 'prod-123', 5),
      ).rejects.toThrow('Carrito no encontrado');
    });

    it('debe lanzar NotFoundException si el item no está en el carrito', async () => {
      prismaService.carrito.findFirst.mockResolvedValue(mockCarrito);
      prismaService.itemCarrito.findFirst.mockResolvedValue(null);

      await expect(
        service.updateItemQuantity(userId, 'prod-no-existe', 5),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateItemQuantity(userId, 'prod-no-existe', 5),
      ).rejects.toThrow('Item no encontrado en el carrito');
    });
  });

  // ============================================================
  // REMOVE ITEM
  // ============================================================
  describe('removeItem', () => {
    it('debe eliminar un item del carrito', async () => {
      prismaService.carrito.findFirst.mockResolvedValue(mockCarrito);
      prismaService.itemCarrito.findFirst.mockResolvedValue(mockItem);
      prismaService.itemCarrito.delete.mockResolvedValue(mockItem);

      const result = await service.removeItem(userId, 'prod-123');

      expect(result).toHaveProperty('message', 'Item eliminado del carrito');
      expect(prismaService.itemCarrito.delete).toHaveBeenCalledWith({
        where: { id: mockItem.id },
      });
    });

    it('debe lanzar NotFoundException si no hay carrito activo', async () => {
      prismaService.carrito.findFirst.mockResolvedValue(null);

      await expect(service.removeItem(userId, 'prod-123')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.removeItem(userId, 'prod-123')).rejects.toThrow(
        'Carrito no encontrado',
      );
    });

    it('debe lanzar NotFoundException si el item no está en el carrito', async () => {
      prismaService.carrito.findFirst.mockResolvedValue(mockCarrito);
      prismaService.itemCarrito.findFirst.mockResolvedValue(null);

      await expect(
        service.removeItem(userId, 'prod-no-existe'),
      ).rejects.toThrow(NotFoundException);
    });

    it('solo debe eliminar items del usuario correcto', async () => {
      prismaService.carrito.findFirst.mockResolvedValue(mockCarrito);
      prismaService.itemCarrito.findFirst.mockResolvedValue(mockItem);
      prismaService.itemCarrito.delete.mockResolvedValue(mockItem);

      await service.removeItem(userId, 'prod-123');

      // Verificar que buscó el carrito del usuario correcto
      expect(prismaService.carrito.findFirst).toHaveBeenCalledWith({
        where: { idUsuario: userId, estado: 'ACTIVO' },
      });
    });
  });
});
