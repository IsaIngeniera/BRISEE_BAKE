/* eslint-disable */
/**
 * PRUEBAS UNITARIAS QA - PedidosService
 *
 * Verifica el comportamiento del servicio de pedidos:
 * - Creación de pedidos con validación de fechas y productos
 * - Integración con Wompi (generación de URL)
 * - Verificación de pagos con Wompi
 * - Notificaciones por email al admin (HU-24)
 * - Gestión de estados de pedido
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PedidosService } from '../../../src/pedidos/pedidos.service';
import { PrismaService } from '../../../src/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, EstadoEntrega, TipoEntrega } from '@prisma/client';
import { Resend } from 'resend';

// Mock resend
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: jest.fn().mockResolvedValue({ data: {}, error: null }),
        },
      };
    }),
  };
});

// Mock global fetch for Wompi
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

describe('PedidosService [QA]', () => {
  let service: PedidosService;
  let prismaService: {
    producto: { findMany: jest.Mock };
    pedido: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    pedidoProducto: { createMany: jest.Mock };
    pago: { create: jest.Mock; update: jest.Mock; findUnique: jest.Mock };
    $transaction: jest.Mock;
  };

  const userId = 'user-123';
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 10);
  const futureDateString = futureDate.toISOString().split('T')[0];

  const mockProducto = {
    id: 'prod-123',
    nombre: 'Producto Test',
    precio: new Prisma.Decimal(25000),
    estado: 'ACTIVO',
  };

  const mockPedido = {
    id: 'pedido-abc-123',
    idCliente: userId,
    estadoEntrega: EstadoEntrega.PENDIENTE,
    total: new Prisma.Decimal(50000),
    fechaEsperada: new Date(futureDateString),
    direccionEntrega: 'Calle 123',
    ciudad: 'Bogotá',
    tipoEntrega: TipoEntrega.ENVIO,
    observacionesEntrega: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createPedidoDto = {
    direccionEntrega: 'Calle 123',
    ciudad: 'Bogotá',
    tipoEntrega: TipoEntrega.ENVIO,
    observacionesEntrega: 'Dejar con el portero',
    fechaEsperada: futureDateString,
    items: [{ idProducto: 'prod-123', cantidad: 2 }],
  };

  beforeEach(async () => {
    prismaService = {
      producto: { findMany: jest.fn() },
      pedido: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      pedidoProducto: { createMany: jest.fn() },
      pago: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidosService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<PedidosService>(PedidosService);

    // Silenciar logs
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
  // CREATE PEDIDO
  // ============================================================
  describe('createPedido', () => {
    it('debe crear un pedido correctamente', async () => {
      prismaService.producto.findMany.mockResolvedValue([mockProducto]);
      prismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          pedido: { create: jest.fn().mockResolvedValue(mockPedido) },
          pedidoProducto: { createMany: jest.fn() },
          pago: { create: jest.fn() },
        };
        return cb(tx);
      });

      const result = await service.createPedido(userId, createPedidoDto);

      expect(result).toHaveProperty('message', 'Pedido creado exitosamente');
      expect(result).toHaveProperty('pedidoId', mockPedido.id);
      expect(result).toHaveProperty('whatsappUrl');
      expect(result).toHaveProperty('wompiUrl');
    });

    it('debe lanzar BadRequestException si el carrito está vacío', async () => {
      const emptyDto = { ...createPedidoDto, items: [] };

      await expect(service.createPedido(userId, emptyDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createPedido(userId, emptyDto)).rejects.toThrow(
        'El carrito está vacío o no existe.',
      );
    });

    it('debe lanzar BadRequestException si items es undefined', async () => {
      const dtoSinItems = { ...createPedidoDto, items: undefined } as any;

      await expect(service.createPedido(userId, dtoSinItems)).rejects.toThrow(
        'El carrito está vacío o no existe.',
      );
    });

    it('debe lanzar BadRequestException si no hay productos ACTIVOS', async () => {
      prismaService.producto.findMany.mockResolvedValue([]);

      await expect(
        service.createPedido(userId, createPedidoDto),
      ).rejects.toThrow('No hay productos disponibles en el carrito.');
    });

    it('debe rechazar fechas de entrega menores a 3 días desde hoy', async () => {
      prismaService.producto.findMany.mockResolvedValue([mockProducto]);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dtoConFechaInvalida = {
        ...createPedidoDto,
        fechaEsperada: tomorrow.toISOString().split('T')[0],
      };

      await expect(
        service.createPedido(userId, dtoConFechaInvalida),
      ).rejects.toThrow('La fecha de entrega debe ser al menos 3 días');
    });

    it('debe rechazar fechas de entrega en el pasado', async () => {
      prismaService.producto.findMany.mockResolvedValue([mockProducto]);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const dtoFechaPasada = {
        ...createPedidoDto,
        fechaEsperada: pastDate.toISOString().split('T')[0],
      };

      await expect(
        service.createPedido(userId, dtoFechaPasada),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe aceptar fecha de entrega exactamente 3 días después', async () => {
      prismaService.producto.findMany.mockResolvedValue([mockProducto]);
      prismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          pedido: { create: jest.fn().mockResolvedValue(mockPedido) },
          pedidoProducto: { createMany: jest.fn() },
          pago: { create: jest.fn() },
        };
        return cb(tx);
      });

      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      const dto = {
        ...createPedidoDto,
        fechaEsperada: threeDaysLater.toISOString().split('T')[0],
      };

      await expect(service.createPedido(userId, dto)).resolves.toHaveProperty(
        'pedidoId',
      );
    });

    it('debe calcular el total correctamente', async () => {
      prismaService.producto.findMany.mockResolvedValue([mockProducto]);
      let capturedTotal: any;
      prismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          pedido: {
            create: jest.fn().mockImplementation(({ data }) => {
              capturedTotal = data.total;
              return mockPedido;
            }),
          },
          pedidoProducto: { createMany: jest.fn() },
          pago: { create: jest.fn() },
        };
        return cb(tx);
      });

      await service.createPedido(userId, createPedidoDto);

      // 25000 * 2 = 50000
      expect(capturedTotal.toString()).toBe('50000');
    });

    it('debe filtrar items cuyos productos no existan', async () => {
      prismaService.producto.findMany.mockResolvedValue([mockProducto]);
      let capturedItems: any;
      prismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          pedido: { create: jest.fn().mockResolvedValue(mockPedido) },
          pedidoProducto: {
            createMany: jest.fn().mockImplementation(({ data }) => {
              capturedItems = data;
            }),
          },
          pago: { create: jest.fn() },
        };
        return cb(tx);
      });

      const dtoConProductoFantasma = {
        ...createPedidoDto,
        items: [
          { idProducto: 'prod-123', cantidad: 2 },
          { idProducto: 'prod-no-existe', cantidad: 1 },
        ],
      };

      await service.createPedido(userId, dtoConProductoFantasma);

      expect(capturedItems).toHaveLength(1);
      expect(capturedItems[0].idProducto).toBe('prod-123');
    });

    it('debe crear un pago inicial con estado PENDIENTE', async () => {
      prismaService.producto.findMany.mockResolvedValue([mockProducto]);
      let pagoCreated: any;
      prismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          pedido: { create: jest.fn().mockResolvedValue(mockPedido) },
          pedidoProducto: { createMany: jest.fn() },
          pago: {
            create: jest.fn().mockImplementation(({ data }) => {
              pagoCreated = data;
            }),
          },
        };
        return cb(tx);
      });

      await service.createPedido(userId, createPedidoDto);

      expect(pagoCreated.estado).toBe('PENDIENTE');
      expect(pagoCreated.metodo).toBe('WOMPI');
    });

    it('debe generar WhatsApp URL con número de pedido', async () => {
      prismaService.producto.findMany.mockResolvedValue([mockProducto]);
      prismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          pedido: { create: jest.fn().mockResolvedValue(mockPedido) },
          pedidoProducto: { createMany: jest.fn() },
          pago: { create: jest.fn() },
        };
        return cb(tx);
      });

      const result = await service.createPedido(userId, createPedidoDto);

      expect(result.whatsappUrl).toContain('wa.me');
      expect(result.whatsappUrl).toContain('573003685556');
    });

    it('[HU-20 Happy Path] debe generar Wompi URL con los parámetros correctos', async () => {
      prismaService.producto.findMany.mockResolvedValue([mockProducto]);
      prismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          pedido: { create: jest.fn().mockResolvedValue(mockPedido) },
          pedidoProducto: { createMany: jest.fn() },
          pago: { create: jest.fn() },
        };
        return cb(tx);
      });

      const result = await service.createPedido(userId, createPedidoDto);

      expect(result.wompiUrl).toContain('checkout.wompi.co');
      expect(result.wompiUrl).toContain('currency=COP');
      expect(result.wompiUrl).toContain('amount-in-cents=5000000'); // 50000 * 100
      expect(result.wompiUrl).toContain(`reference=${mockPedido.id}`);
    });

    // ============================================================
    // HU-20: FLUJOS ALTERNATIVOS - Redirección a Wompi
    // ============================================================
    it('[HU-20 Flujo Alternativo] debe generar Wompi URL sin signature si no hay integrity secret', async () => {
      const originalSecret = process.env.WOMPI_INTEGRITY_SECRET;
      delete process.env.WOMPI_INTEGRITY_SECRET;

      prismaService.producto.findMany.mockResolvedValue([mockProducto]);
      prismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          pedido: { create: jest.fn().mockResolvedValue(mockPedido) },
          pedidoProducto: { createMany: jest.fn() },
          pago: { create: jest.fn() },
        };
        return cb(tx);
      });

      const result = await service.createPedido(userId, createPedidoDto);

      expect(result.wompiUrl).not.toContain('signature');

      // Restaurar
      if (originalSecret) process.env.WOMPI_INTEGRITY_SECRET = originalSecret;
    });

    it('[HU-20 Flujo Alternativo] debe reemplazar localhost en redirect-url (para pruebas con Wompi)', async () => {
      process.env.FRONTEND_URL = 'http://localhost:3000';
      prismaService.producto.findMany.mockResolvedValue([mockProducto]);
      prismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          pedido: { create: jest.fn().mockResolvedValue(mockPedido) },
          pedidoProducto: { createMany: jest.fn() },
          pago: { create: jest.fn() },
        };
        return cb(tx);
      });

      const result = await service.createPedido(userId, createPedidoDto);

      // Wompi no acepta localhost, debe reemplazar por localtest.me
      expect(result.wompiUrl).toContain('localtest.me');
      expect(result.wompiUrl).not.toContain('localhost');
    });

    it('[HU-20 Flujo Alternativo] el monto en Wompi URL debe convertirse a centavos correctamente', async () => {
      // Precio Decimal diferente para verificar la conversión
      prismaService.producto.findMany.mockResolvedValue([
        { ...mockProducto, precio: new Prisma.Decimal(37500) }, // $37.500 COP
      ]);
      prismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          pedido: {
            create: jest.fn().mockResolvedValue({
              ...mockPedido,
              total: new Prisma.Decimal(75000),
            }),
          },
          pedidoProducto: { createMany: jest.fn() },
          pago: { create: jest.fn() },
        };
        return cb(tx);
      });

      const result = await service.createPedido(userId, createPedidoDto);

      // 37500 * 2 = 75000 pesos = 7500000 centavos
      expect(result.wompiUrl).toContain('amount-in-cents=7500000');
    });

    // ============================================================
    // HU-23: FLUJOS ALTERNATIVOS - WhatsApp post-compra
    // ============================================================
    it('[HU-23 Flujo Alternativo] el mensaje de WhatsApp debe estar URL-encoded', async () => {
      prismaService.producto.findMany.mockResolvedValue([mockProducto]);
      prismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          pedido: { create: jest.fn().mockResolvedValue(mockPedido) },
          pedidoProducto: { createMany: jest.fn() },
          pago: { create: jest.fn() },
        };
        return cb(tx);
      });

      const result = await service.createPedido(userId, createPedidoDto);

      // El texto en el URL debe estar codificado (los espacios deben ser %20 o similar)
      expect(result.whatsappUrl).toMatch(/\?text=/);
      // No debe contener espacios sin codificar
      const textPart = result.whatsappUrl.split('?text=')[1];
      expect(textPart).not.toContain(' ');
    });

    it('[HU-23 Flujo Alternativo] el mensaje debe incluir un ID corto del pedido en mayúsculas', async () => {
      prismaService.producto.findMany.mockResolvedValue([mockProducto]);
      const customPedido = { ...mockPedido, id: 'abc12345-xxxx-yyyy-zzzz' };
      prismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          pedido: { create: jest.fn().mockResolvedValue(customPedido) },
          pedidoProducto: { createMany: jest.fn() },
          pago: { create: jest.fn() },
        };
        return cb(tx);
      });

      const result = await service.createPedido(userId, createPedidoDto);

      // Decodificar el texto del WhatsApp URL para verificar
      const textPart = result.whatsappUrl.split('?text=')[1];
      const decoded = decodeURIComponent(textPart);

      // Debe incluir el primer segmento del UUID en mayúsculas
      expect(decoded).toContain('ABC12345');
      // No debe contener el ID completo
      expect(decoded).not.toContain('xxxx-yyyy-zzzz');
    });
  });

  // ============================================================
  // FIND BY USER
  // ============================================================
  describe('findByUser', () => {
    it('debe retornar pedidos del usuario ordenados por fecha', async () => {
      const pedidos = [mockPedido];
      prismaService.pedido.findMany.mockResolvedValue(pedidos);

      const result = await service.findByUser(userId);

      expect(result).toEqual(pedidos);
      expect(prismaService.pedido.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idCliente: userId },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('debe incluir productos con su información', async () => {
      prismaService.pedido.findMany.mockResolvedValue([]);

      await service.findByUser(userId);

      expect(prismaService.pedido.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            productos: expect.anything(),
          }),
        }),
      );
    });

    it('debe retornar array vacío si no hay pedidos', async () => {
      prismaService.pedido.findMany.mockResolvedValue([]);

      const result = await service.findByUser(userId);

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // FIND ALL
  // ============================================================
  describe('findAll', () => {
    it('debe retornar todos los pedidos (admin)', async () => {
      prismaService.pedido.findMany.mockResolvedValue([mockPedido]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(prismaService.pedido.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            cliente: expect.anything(),
            productos: expect.anything(),
          }),
        }),
      );
    });

    it('debe incluir información del cliente', async () => {
      prismaService.pedido.findMany.mockResolvedValue([]);

      await service.findAll();

      const callArgs = prismaService.pedido.findMany.mock.calls[0][0];
      expect(callArgs.include.cliente.select).toHaveProperty('correo');
      expect(callArgs.include.cliente.select).toHaveProperty('nombre');
    });

    it('debe ordenar por fecha de creación descendente', async () => {
      prismaService.pedido.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prismaService.pedido.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  // ============================================================
  // UPDATE ESTADO
  // ============================================================
  describe('updateEstado', () => {
    it('debe actualizar el estado del pedido', async () => {
      prismaService.pedido.findUnique.mockResolvedValue(mockPedido);
      prismaService.pedido.update.mockResolvedValue({
        ...mockPedido,
        estadoEntrega: EstadoEntrega.PREPARANDO,
      });

      const result = await service.updateEstado(
        'pedido-123',
        EstadoEntrega.PREPARANDO,
      );

      expect(result.estadoEntrega).toBe(EstadoEntrega.PREPARANDO);
      expect(prismaService.pedido.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pedido-123' },
          data: { estadoEntrega: EstadoEntrega.PREPARANDO },
        }),
      );
    });

    it('debe lanzar NotFoundException si el pedido no existe', async () => {
      prismaService.pedido.findUnique.mockResolvedValue(null);

      await expect(
        service.updateEstado('no-existe', EstadoEntrega.PREPARANDO),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateEstado('no-existe', EstadoEntrega.PREPARANDO),
      ).rejects.toThrow('Pedido no encontrado');
    });

    it('debe permitir todos los estados válidos', async () => {
      prismaService.pedido.findUnique.mockResolvedValue(mockPedido);
      prismaService.pedido.update.mockResolvedValue(mockPedido);

      const estados: EstadoEntrega[] = [
        EstadoEntrega.PENDIENTE,
        EstadoEntrega.PREPARANDO,
        EstadoEntrega.DESPACHADO,
        EstadoEntrega.ENTREGADO,
      ];

      for (const estado of estados) {
        await expect(
          service.updateEstado('pedido-123', estado),
        ).resolves.toBeDefined();
      }
    });
  });

  // ============================================================
  // VERIFICAR PAGO WOMPI
  // ============================================================
  describe('verificarPagoWompi', () => {
    const transactionId = 'tx-123';
    const mockWompiResponse = {
      data: {
        status: 'APPROVED',
        reference: 'pedido-abc-123',
        amount_in_cents: 5000000,
      },
    };

    beforeEach(() => {
      prismaService.pago.findUnique.mockResolvedValue({ estado: 'PENDIENTE' });
    });

    it('debe retornar estado APPROVED correctamente', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockWompiResponse,
      });
      prismaService.pago.update.mockResolvedValue({});
      // Mock sendAdminNotification para que no haga nada
      prismaService.pedido.findUnique.mockResolvedValue(null);

      const result = await service.verificarPagoWompi(transactionId);

      expect(result).toEqual({
        status: 'APPROVED',
        reference: 'pedido-abc-123',
        amount: 50000,
      });
    });

    it('debe actualizar el pago a APROBADO cuando status es APPROVED', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockWompiResponse,
      });
      prismaService.pago.update.mockResolvedValue({});
      prismaService.pedido.findUnique.mockResolvedValue(null);

      await service.verificarPagoWompi(transactionId);

      expect(prismaService.pago.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idPedido: 'pedido-abc-123' },
          data: expect.objectContaining({
            estado: 'APROBADO',
            transaccionId: transactionId,
          }),
        }),
      );
    });

    it('debe mapear DECLINED a RECHAZADO', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            status: 'DECLINED',
            reference: 'pedido-abc-123',
            amount_in_cents: 5000000,
          },
        }),
      });
      prismaService.pago.update.mockResolvedValue({});

      await service.verificarPagoWompi(transactionId);

      expect(prismaService.pago.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estado: 'RECHAZADO' }),
        }),
      );
    });

    it('debe mapear ERROR a RECHAZADO', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            status: 'ERROR',
            reference: 'pedido-abc-123',
            amount_in_cents: 5000000,
          },
        }),
      });
      prismaService.pago.update.mockResolvedValue({});

      await service.verificarPagoWompi(transactionId);

      expect(prismaService.pago.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estado: 'RECHAZADO' }),
        }),
      );
    });

    it('debe mapear VOIDED a CANCELADO', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            status: 'VOIDED',
            reference: 'pedido-abc-123',
            amount_in_cents: 5000000,
          },
        }),
      });
      prismaService.pago.update.mockResolvedValue({});

      await service.verificarPagoWompi(transactionId);

      expect(prismaService.pago.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estado: 'CANCELADO' }),
        }),
      );
    });

    it('debe lanzar error si la respuesta de Wompi no es ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(service.verificarPagoWompi(transactionId)).rejects.toThrow(
        'Error de conexión con Wompi al verificar el pago',
      );
    });

    it('debe lanzar error si fetch falla', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(service.verificarPagoWompi(transactionId)).rejects.toThrow(
        'Error de conexión con Wompi al verificar el pago',
      );
    });

    it('debe llamar a la URL sandbox de Wompi', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockWompiResponse,
      });
      prismaService.pago.update.mockResolvedValue({});
      prismaService.pedido.findUnique.mockResolvedValue(null);

      await service.verificarPagoWompi(transactionId);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://sandbox.wompi.co/v1/transactions/${transactionId}`,
      );
    });

    it('debe convertir cents a pesos correctamente (amount_in_cents / 100)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            status: 'APPROVED',
            reference: 'pedido-abc-123',
            amount_in_cents: 7500000, // $75,000 COP
          },
        }),
      });
      prismaService.pago.update.mockResolvedValue({});
      prismaService.pedido.findUnique.mockResolvedValue(null);

      const result = await service.verificarPagoWompi(transactionId);

      expect(result.amount).toBe(75000);
    });

    // ============================================================
    // HU-24: NOTIFICACIÓN POR EMAIL AL ADMIN
    // ============================================================
    it('debe enviar notificación al admin cuando el pago es APROBADO (HU-24)', async () => {
      // Clean up mock calls before test
      (Resend as jest.Mock).mockClear();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockWompiResponse,
      });
      prismaService.pago.update.mockResolvedValue({});
      prismaService.pedido.findUnique.mockResolvedValue({
        ...mockPedido,
        cliente: {
          nombre: 'Juan',
          apellido: 'Pérez',
          correo: 'juan@example.com',
        },
        productos: [
          {
            cantidad: 2,
            precioUnitario: new Prisma.Decimal(25000),
            producto: { nombre: 'Granola' },
          },
        ],
      });

      await service.verificarPagoWompi(transactionId);

      // Esperar un poco para que la notificación async se procese
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(Resend).toHaveBeenCalled();
    });

    it('NO debe enviar notificación al admin si el pago es RECHAZADO', async () => {
      (Resend as jest.Mock).mockClear();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            status: 'DECLINED',
            reference: 'pedido-abc-123',
            amount_in_cents: 5000000,
          },
        }),
      });
      prismaService.pago.update.mockResolvedValue({});

      await service.verificarPagoWompi(transactionId);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(Resend).not.toHaveBeenCalled();
    });
  });
});
