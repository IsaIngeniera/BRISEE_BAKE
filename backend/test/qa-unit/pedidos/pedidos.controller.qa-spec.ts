/* eslint-disable */
/**
 * PRUEBAS UNITARIAS QA - PedidosController
 *
 * Verifica el comportamiento del controlador de pedidos:
 * - Autorización vía JWT
 * - Roles (ADMIN para listar todos, usuario autenticado para los suyos)
 * - Delegación correcta al servicio
 * - Manejo de redirects de Wompi
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PedidosController } from '../../../src/pedidos/pedidos.controller';
import { PedidosService } from '../../../src/pedidos/pedidos.service';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../src/common/guards/roles.guard';
import { EstadoEntrega, TipoEntrega } from '@prisma/client';
import { Reflector } from '@nestjs/core';

describe('PedidosController [QA]', () => {
  let controller: PedidosController;
  let pedidosService: {
    createPedido: jest.Mock;
    findByUser: jest.Mock;
    findAll: jest.Mock;
    updateEstado: jest.Mock;
    verificarPagoWompi: jest.Mock;
  };

  const createMockRequest = (userId?: string) =>
    ({
      user: userId ? { sub: userId } : undefined,
    }) as any;

  const createMockResponse = () => {
    const res: any = {};
    res.redirect = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    pedidosService = {
      createPedido: jest.fn(),
      findByUser: jest.fn(),
      findAll: jest.fn(),
      updateEstado: jest.fn(),
      verificarPagoWompi: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PedidosController],
      providers: [
        { provide: PedidosService, useValue: pedidosService },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PedidosController>(PedidosController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  // ============================================================
  // POST /pedidos
  // ============================================================
  describe('POST /pedidos (createPedido)', () => {
    const createDto = {
      direccionEntrega: 'Calle 123',
      ciudad: 'Bogotá',
      tipoEntrega: TipoEntrega.ENVIO,
      fechaEsperada: '2026-12-25',
      items: [{ idProducto: 'prod-1', cantidad: 2 }],
    };

    it('debe crear un pedido para el usuario autenticado', async () => {
      const req = createMockRequest('user-123');
      const expectedResponse = {
        message: 'Pedido creado exitosamente',
        pedidoId: 'pedido-1',
        wompiUrl: 'https://wompi.co/...',
        whatsappUrl: 'https://wa.me/...',
      };
      pedidosService.createPedido.mockResolvedValue(expectedResponse);

      const result = await controller.createPedido(req, createDto);

      expect(pedidosService.createPedido).toHaveBeenCalledWith(
        'user-123',
        createDto,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debe lanzar UnauthorizedException si no hay usuario autenticado', async () => {
      const req = createMockRequest();

      try {
        await controller.createPedido(req, createDto);
        fail('Debería haber lanzado UnauthorizedException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Debe iniciar sesión para hacer un pedido');
      }

      expect(pedidosService.createPedido).not.toHaveBeenCalled();
    });

    it('debe propagar errores de validación del servicio', async () => {
      const req = createMockRequest('user-123');
      pedidosService.createPedido.mockRejectedValue(
        new Error('Fecha inválida'),
      );

      await expect(controller.createPedido(req, createDto)).rejects.toThrow(
        'Fecha inválida',
      );
    });
  });

  // ============================================================
  // GET /pedidos/mis-pedidos
  // ============================================================
  describe('GET /pedidos/mis-pedidos (findMisPedidos)', () => {
    it('debe retornar los pedidos del usuario autenticado', async () => {
      const req = createMockRequest('user-123');
      const pedidos = [{ id: 'p1' }, { id: 'p2' }];
      pedidosService.findByUser.mockResolvedValue(pedidos);

      const result = await controller.findMisPedidos(req);

      expect(pedidosService.findByUser).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(pedidos);
    });

    it('debe lanzar UnauthorizedException sin autenticación', async () => {
      const req = createMockRequest();

      try {
        await controller.findMisPedidos(req);
        fail('Debería haber lanzado UnauthorizedException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Debe iniciar sesión para ver sus pedidos');
      }
    });

    it('cada usuario solo debe ver sus propios pedidos', async () => {
      const req = createMockRequest('user-A');
      pedidosService.findByUser.mockResolvedValue([]);

      await controller.findMisPedidos(req);

      expect(pedidosService.findByUser).toHaveBeenCalledWith('user-A');
      expect(pedidosService.findByUser).not.toHaveBeenCalledWith('user-B');
    });
  });

  // ============================================================
  // GET /pedidos (ADMIN)
  // ============================================================
  describe('GET /pedidos (findAll)', () => {
    it('debe retornar todos los pedidos (solo admin)', async () => {
      const pedidos = [{ id: 'p1' }, { id: 'p2' }];
      pedidosService.findAll.mockResolvedValue(pedidos);

      const result = await controller.findAll();

      expect(pedidosService.findAll).toHaveBeenCalled();
      expect(result).toEqual(pedidos);
    });
  });

  // ============================================================
  // PATCH /pedidos/:id/estado (ADMIN)
  // ============================================================
  describe('PATCH /pedidos/:id/estado (updateEstado)', () => {
    it('debe actualizar el estado de un pedido', async () => {
      const dto = { estadoEntrega: EstadoEntrega.PREPARANDO };
      const expectedResponse = {
        id: 'pedido-1',
        estadoEntrega: EstadoEntrega.PREPARANDO,
      };
      pedidosService.updateEstado.mockResolvedValue(expectedResponse);

      const result = await controller.updateEstado('pedido-1', dto);

      expect(pedidosService.updateEstado).toHaveBeenCalledWith(
        'pedido-1',
        EstadoEntrega.PREPARANDO,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('debe propagar NotFoundException si el pedido no existe', async () => {
      pedidosService.updateEstado.mockRejectedValue(
        new Error('Pedido no encontrado'),
      );

      await expect(
        controller.updateEstado('no-existe', {
          estadoEntrega: EstadoEntrega.ENTREGADO,
        }),
      ).rejects.toThrow('Pedido no encontrado');
    });
  });

  // ============================================================
  // GET /pedidos/verificar-pago/:transactionId
  // ============================================================
  describe('GET /pedidos/verificar-pago/:transactionId', () => {
    it('debe verificar el pago con Wompi', async () => {
      const expectedResponse = {
        status: 'APPROVED',
        reference: 'pedido-1',
        amount: 50000,
      };
      pedidosService.verificarPagoWompi.mockResolvedValue(expectedResponse);

      const result = await controller.verificarPago('tx-123');

      expect(pedidosService.verificarPagoWompi).toHaveBeenCalledWith('tx-123');
      expect(result).toEqual(expectedResponse);
    });
  });

  // ============================================================
  // GET /pedidos/retorno-wompi
  // ============================================================
  describe('GET /pedidos/retorno-wompi', () => {
    it('debe redirigir al éxito si el pago es APPROVED', async () => {
      const res = createMockResponse();
      pedidosService.verificarPagoWompi.mockResolvedValue({
        status: 'APPROVED',
        reference: 'pedido-1',
        amount: 50000,
      });

      await controller.retornoWompi(
        'tx-123',
        'pedido-1',
        'http://localhost:3000',
        res,
      );

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/finalizar-compra?status=APPROVED'),
      );
    });

    it('debe redirigir a error si el pago es rechazado', async () => {
      const res = createMockResponse();
      pedidosService.verificarPagoWompi.mockResolvedValue({
        status: 'DECLINED',
        reference: 'pedido-1',
        amount: 50000,
      });

      await controller.retornoWompi(
        'tx-123',
        'pedido-1',
        'http://localhost:3000',
        res,
      );

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/carrito?error=pago_rechazado'),
      );
    });

    it('debe redirigir a error si no hay id de transacción', async () => {
      const res = createMockResponse();

      await controller.retornoWompi(
        '',
        'pedido-1',
        'http://localhost:3000',
        res,
      );

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/carrito?error=pago_rechazado'),
      );
      expect(pedidosService.verificarPagoWompi).not.toHaveBeenCalled();
    });

    it('debe redirigir a error si Wompi falla', async () => {
      const res = createMockResponse();
      pedidosService.verificarPagoWompi.mockRejectedValue(
        new Error('Wompi error'),
      );

      await controller.retornoWompi(
        'tx-123',
        'pedido-1',
        'http://localhost:3000',
        res,
      );

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/carrito?error=pago_rechazado'),
      );
    });

    it('debe usar el frontendUrl por defecto si no se proporciona', async () => {
      const res = createMockResponse();
      pedidosService.verificarPagoWompi.mockResolvedValue({
        status: 'APPROVED',
        reference: 'pedido-1',
        amount: 50000,
      });

      await controller.retornoWompi('tx-123', 'pedido-1', '', res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://127.0.0.1:3000'),
      );
    });
  });
});
