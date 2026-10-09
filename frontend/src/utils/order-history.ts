import type { CartItem } from '@/context/CartContext';

export type OrderStatus =
  | 'PENDIENTE DE PAGO'
  | 'PAGO EXITOSO'
  | 'PAGO NO APROBADO';

export interface CustomerOrder {
  number: string;
  reference?: string;
  createdAt: string;
  items: CartItem[];
  total: number;
  deliveryMethod: 'DOMICILIO' | 'RETIRO';
  deliveryDate: string;
  status: OrderStatus;
}

function getOrderHistoryKey(userId: string): string {
  return `brisee_orders_${userId}`;
}

export function readOrderHistory(userId: string): CustomerOrder[] {
  try {
    const storedOrders = localStorage.getItem(getOrderHistoryKey(userId));

    if (!storedOrders) {
      return [];
    }

    const parsedOrders: unknown = JSON.parse(storedOrders);

    return Array.isArray(parsedOrders)
      ? (parsedOrders as CustomerOrder[])
      : [];
  } catch (error) {
    console.error('No fue posible cargar el historial de pedidos:', error);
    return [];
  }
}

export function saveOrderToHistory(
  userId: string,
  order: CustomerOrder,
): void {
  const currentOrders = readOrderHistory(userId);
  const nextOrders = [
    order,
    ...currentOrders.filter((item) => item.number !== order.number),
  ];

  localStorage.setItem(
    getOrderHistoryKey(userId),
    JSON.stringify(nextOrders),
  );
}

export function updateOrderStatus(
  userId: string,
  orderNumber: string,
  status: OrderStatus,
): CustomerOrder | null {
  const currentOrders = readOrderHistory(userId);
  const order = currentOrders.find(
    (item) =>
      item.number === orderNumber ||
      item.reference === orderNumber ||
      item.reference?.startsWith(orderNumber),
  );

  if (!order) {
    return null;
  }

  const updatedOrder = { ...order, status };
  saveOrderToHistory(userId, updatedOrder);
  return updatedOrder;
}
