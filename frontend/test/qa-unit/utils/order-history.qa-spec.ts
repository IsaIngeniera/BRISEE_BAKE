/**
 * PRUEBAS UNITARIAS QA - order-history.ts
 *
 * Verifica el manejo del historial de pedidos usando localStorage.
 */

import {
  readOrderHistory,
  saveOrderToHistory,
  updateOrderStatus,
  type CustomerOrder,
} from '@/utils/order-history';

const userId = 'user-123';

const mockOrder: CustomerOrder = {
  number: 'ORDER-001',
  reference: 'ref-xyz-abc-123',
  createdAt: '2026-10-03T12:00:00.000Z',
  items: [
    {
      productId: 'prod-1',
      nombre: 'Galleta',
      precio: 10000,
      cantidad: 2,
    },
  ],
  total: 20000,
  deliveryMethod: 'DOMICILIO',
  deliveryDate: '2026-10-10',
  status: 'PENDIENTE DE PAGO',
};

describe('order-history [QA]', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================
  // readOrderHistory
  // ============================================================
  describe('readOrderHistory', () => {
    it('debe retornar array vacío si no hay pedidos', () => {
      expect(readOrderHistory(userId)).toEqual([]);
    });

    it('debe leer pedidos guardados en localStorage', () => {
      localStorage.setItem(
        `brisee_orders_${userId}`,
        JSON.stringify([mockOrder]),
      );

      const orders = readOrderHistory(userId);

      expect(orders).toHaveLength(1);
      expect(orders[0].number).toBe('ORDER-001');
    });

    it('debe retornar array vacío si el JSON es inválido', () => {
      localStorage.setItem(`brisee_orders_${userId}`, '{invalid json');

      expect(readOrderHistory(userId)).toEqual([]);
    });

    it('debe retornar array vacío si no es un array', () => {
      localStorage.setItem(
        `brisee_orders_${userId}`,
        JSON.stringify({ not: 'array' }),
      );

      expect(readOrderHistory(userId)).toEqual([]);
    });

    it('cada usuario debe tener su propio historial (aislamiento)', () => {
      localStorage.setItem(
        'brisee_orders_user-A',
        JSON.stringify([{ ...mockOrder, number: 'A-001' }]),
      );
      localStorage.setItem(
        'brisee_orders_user-B',
        JSON.stringify([{ ...mockOrder, number: 'B-001' }]),
      );

      expect(readOrderHistory('user-A')[0].number).toBe('A-001');
      expect(readOrderHistory('user-B')[0].number).toBe('B-001');
    });
  });

  // ============================================================
  // saveOrderToHistory
  // ============================================================
  describe('saveOrderToHistory', () => {
    it('debe guardar un pedido en el historial', () => {
      saveOrderToHistory(userId, mockOrder);

      const stored = JSON.parse(
        localStorage.getItem(`brisee_orders_${userId}`) || '[]',
      );

      expect(stored).toHaveLength(1);
      expect(stored[0].number).toBe(mockOrder.number);
    });

    it('debe agregar nuevos pedidos al inicio (más recientes primero)', () => {
      const order1 = { ...mockOrder, number: 'ORDER-001' };
      const order2 = { ...mockOrder, number: 'ORDER-002' };

      saveOrderToHistory(userId, order1);
      saveOrderToHistory(userId, order2);

      const stored = readOrderHistory(userId);
      expect(stored[0].number).toBe('ORDER-002');
      expect(stored[1].number).toBe('ORDER-001');
    });

    it('debe reemplazar un pedido existente con el mismo número', () => {
      const order1 = { ...mockOrder, number: 'ORDER-001', total: 10000 };
      const orderUpdated = { ...mockOrder, number: 'ORDER-001', total: 50000 };

      saveOrderToHistory(userId, order1);
      saveOrderToHistory(userId, orderUpdated);

      const stored = readOrderHistory(userId);
      expect(stored).toHaveLength(1);
      expect(stored[0].total).toBe(50000);
    });
  });

  // ============================================================
  // updateOrderStatus
  // ============================================================
  describe('updateOrderStatus', () => {
    it('debe actualizar el estado de un pedido por number', () => {
      saveOrderToHistory(userId, mockOrder);

      const result = updateOrderStatus(userId, 'ORDER-001', 'PAGO EXITOSO');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('PAGO EXITOSO');
    });

    it('debe retornar null si el pedido no existe', () => {
      const result = updateOrderStatus(userId, 'NO-EXISTE', 'PAGO EXITOSO');
      expect(result).toBeNull();
    });

    it('debe poder actualizar a cualquier estado válido', () => {
      saveOrderToHistory(userId, mockOrder);

      updateOrderStatus(userId, 'ORDER-001', 'PAGO EXITOSO');
      expect(readOrderHistory(userId)[0].status).toBe('PAGO EXITOSO');

      updateOrderStatus(userId, 'ORDER-001', 'PAGO NO APROBADO');
      expect(readOrderHistory(userId)[0].status).toBe('PAGO NO APROBADO');
    });

    it('debe encontrar el pedido por reference completa', () => {
      saveOrderToHistory(userId, mockOrder);

      const result = updateOrderStatus(
        userId,
        'ref-xyz-abc-123',
        'PAGO EXITOSO',
      );

      expect(result).not.toBeNull();
      expect(result?.status).toBe('PAGO EXITOSO');
    });

    it('debe encontrar el pedido por prefijo de reference', () => {
      saveOrderToHistory(userId, mockOrder);

      const result = updateOrderStatus(userId, 'ref-xyz', 'PAGO EXITOSO');

      expect(result).not.toBeNull();
    });

    it('debe persistir el cambio en localStorage', () => {
      saveOrderToHistory(userId, mockOrder);
      updateOrderStatus(userId, 'ORDER-001', 'PAGO EXITOSO');

      // Simular reload (otra lectura)
      const reloaded = readOrderHistory(userId);
      expect(reloaded[0].status).toBe('PAGO EXITOSO');
    });
  });
});
