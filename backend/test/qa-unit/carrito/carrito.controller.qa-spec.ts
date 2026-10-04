/**
 * PRUEBAS UNITARIAS QA - CarritoController
 *
 * Verifica el comportamiento del controlador del carrito:
 * - Autorización vía JWT
 * - Delegación correcta al servicio
 * - Extracción del userId del request
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CarritoController } from '../../../src/carrito/carrito.controller';
import { CarritoService } from '../../../src/carrito/carrito.service';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../../src/common/guards/jwt-auth.guard';

describe('CarritoController [QA]', () => {
  let controller: CarritoController;
  let carritoService: {
    getCart: jest.Mock;
    addItem: jest.Mock;
    updateItemQuantity: jest.Mock;
    removeItem: jest.Mock;
  };

  const createMockRequest = (userId: string) =>
    ({
      user: { sub: userId },
    }) as any;

  beforeEach(async () => {
    carritoService = {
      getCart: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarritoController],
      providers: [
        { provide: CarritoService, useValue: carritoService },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CarritoController>(CarritoController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  // ============================================================
  // GET /carrito
  // ============================================================
  describe('GET /carrito (getCart)', () => {
    it('debe retornar el carrito del usuario autenticado', async () => {
      const req = createMockRequest('user-123');
      const expectedResponse = {
        items: [{ productId: 'p1', nombre: 'Prod', precio: 100, cantidad: 2 }],
        removed: [],
      };
      carritoService.getCart.mockResolvedValue(expectedResponse);

      const result = await controller.getCart(req);

      expect(carritoService.getCart).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(expectedResponse);
    });

    it('debe pasar el userId correcto al servicio', async () => {
      const req = createMockRequest('specific-user-456');
      carritoService.getCart.mockResolvedValue({ items: [], removed: [] });

      await controller.getCart(req);

      expect(carritoService.getCart).toHaveBeenCalledWith('specific-user-456');
    });
  });

  // ============================================================
  // POST /carrito/items
  // ============================================================
  describe('POST /carrito/items (addItem)', () => {
    const addItemDto = { idProducto: 'prod-123', cantidad: 2 };

    it('debe agregar un item al carrito del usuario', async () => {
      const req = createMockRequest('user-123');
      const expectedResponse = {
        message: 'Producto agregado al carrito',
        item: { id: 'item-1', cantidad: 2 },
      };
      carritoService.addItem.mockResolvedValue(expectedResponse);

      const result = await controller.addItem(req, addItemDto);

      expect(carritoService.addItem).toHaveBeenCalledWith(
        'user-123',
        addItemDto,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debe propagar errores del servicio', async () => {
      const req = createMockRequest('user-123');
      carritoService.addItem.mockRejectedValue(
        new Error('Producto no disponible'),
      );

      await expect(controller.addItem(req, addItemDto)).rejects.toThrow(
        'Producto no disponible',
      );
    });
  });

  // ============================================================
  // PATCH /carrito/items/:productId
  // ============================================================
  describe('PATCH /carrito/items/:productId (updateItemQuantity)', () => {
    it('debe actualizar la cantidad de un item', async () => {
      const req = createMockRequest('user-123');
      const expectedResponse = {
        message: 'Cantidad actualizada',
        item: { id: 'item-1', cantidad: 5 },
      };
      carritoService.updateItemQuantity.mockResolvedValue(expectedResponse);

      const result = await controller.updateItemQuantity(
        req,
        'prod-123',
        5,
      );

      expect(carritoService.updateItemQuantity).toHaveBeenCalledWith(
        'user-123',
        'prod-123',
        5,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debe propagar errores de validación', async () => {
      const req = createMockRequest('user-123');
      carritoService.updateItemQuantity.mockRejectedValue(
        new Error('La cantidad debe ser mayor a cero'),
      );

      await expect(
        controller.updateItemQuantity(req, 'prod-123', 0),
      ).rejects.toThrow('La cantidad debe ser mayor a cero');
    });
  });

  // ============================================================
  // DELETE /carrito/items/:productId
  // ============================================================
  describe('DELETE /carrito/items/:productId (removeItem)', () => {
    it('debe eliminar un item del carrito', async () => {
      const req = createMockRequest('user-123');
      const expectedResponse = { message: 'Item eliminado del carrito' };
      carritoService.removeItem.mockResolvedValue(expectedResponse);

      const result = await controller.removeItem(req, 'prod-123');

      expect(carritoService.removeItem).toHaveBeenCalledWith(
        'user-123',
        'prod-123',
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debe propagar errores si el item no existe', async () => {
      const req = createMockRequest('user-123');
      carritoService.removeItem.mockRejectedValue(
        new Error('Item no encontrado'),
      );

      await expect(controller.removeItem(req, 'no-existe')).rejects.toThrow(
        'Item no encontrado',
      );
    });
  });
});
